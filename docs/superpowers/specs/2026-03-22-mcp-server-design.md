# MCP Server for Task Manager v2

**Date:** 2026-03-22
**Status:** Approved

## Context

The task manager app (Hebrew RTL kanban, React 18 + Express + SQLite) needs an MCP server so the user can interact with tasks directly from Claude Desktop and Claude Code — listing tasks, updating them, adding URL/file links, and marking them complete (with full XP/badge logic).

---

## Architecture

### Approach: stdio MCP server calling Express HTTP API

`mcp-server.js` (new file, project root) runs as a subprocess via stdio transport.
All operations call `http://localhost:3001/api` — the existing Express server.
This reuses all business logic (XP, badges, streaks) without duplication.

**Dependency:** `@modelcontextprotocol/sdk` added to `package.json`.

**ESM note:** The project has `"type": "module"` in `package.json`, so `mcp-server.js` is automatically treated as ESM. Use `import` syntax throughout. Required imports:
```js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
```

---

## Files Modified / Created

| File | Change |
|------|--------|
| `mcp-server.js` | **New** — MCP server with 5 tools |
| `server.js` | Add `links` column migration + update GET/PUT to handle links |
| `.mcp.json` | **New** — Claude Code project-level MCP config (project root) |
| `package.json` | Add `@modelcontextprotocol/sdk` dependency |

Claude Desktop config (external, user manages):
`~/Library/Application Support/Claude/claude_desktop_config.json`

---

## Database Change

Add column to `tasks` table at server startup:

```js
try {
  db.prepare("ALTER TABLE tasks ADD COLUMN links TEXT DEFAULT '[]'").run();
} catch {}  // column already exists — safe to ignore
```

**Important:** SQLite's `DEFAULT '[]'` only applies to rows inserted *after* the migration. Pre-existing rows will have `NULL` for `links`. The GET handler (and MCP fetch logic) must normalize nulls:

```js
links: JSON.parse(task.links ?? '[]')
```

Links are stored as a JSON array:
```json
[{ "type": "url", "value": "https://...", "label": "optional label" }]
```

`type` is `"url"` (value starts with `http://` or `https://`) or `"file"` (all other values).

---

## server.js Changes

### 1. Migration (add at startup, after table creation)
```js
try { db.prepare("ALTER TABLE tasks ADD COLUMN links TEXT DEFAULT '[]'").run(); } catch {}
```

### 2. GET /api/tasks — parse links in response
```js
// In the row mapping:
links: JSON.parse(row.links ?? '[]')
```

### 3. PUT /api/tasks/:id — add links to the update
```js
const { title, description, category, priority, status, due_date, links } = req.body;
const linksStr = JSON.stringify(links ?? []);
db.prepare('UPDATE tasks SET title=?, description=?, category=?, priority=?, status=?, due_date=?, links=? WHERE id=?')
  .run(title, description, category, priority, status, due_date, linksStr, id);
```

### 4. POST /api/tasks/:id/links (new endpoint — atomic link append)
Dedicated endpoint to avoid race conditions in `add_link`:
```js
app.post('/api/tasks/:id/links', (req, res) => {
  const { value, label } = req.body;
  const type = (value.startsWith('http://') || value.startsWith('https://')) ? 'url' : 'file';
  // Read current links and append atomically (synchronous better-sqlite3)
  const task = db.prepare('SELECT links FROM tasks WHERE id = ?').get(req.params.id);
  const links = JSON.parse(task.links ?? '[]');
  links.push({ type, value, label: label ?? null });
  db.prepare('UPDATE tasks SET links = ? WHERE id = ?').run(JSON.stringify(links), req.params.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});
```

---

## MCP Tools

All tools use JSON Schema for input validation. Example schema pattern:
```js
{
  type: 'object',
  properties: { id: { type: 'number', description: 'Task ID' } },
  required: ['id']
}
```

### `list_tasks`
Lists all tasks.

**Input schema:**
```js
{
  type: 'object',
  properties: {
    status:   { type: 'string', enum: ['todo', 'inprogress', 'done'] },
    category: { type: 'string', enum: ['work', 'home', 'relationships', 'learning'] }
  }
}
```
**Output:** Array of task objects with all fields including parsed `links`.

---

### `get_task`
Gets a single task by ID.

**Input schema:** `{ type: 'object', properties: { id: { type: 'number' } }, required: ['id'] }`

**Output:** Full task object including parsed `links`.

---

### `update_task`
Updates any task field.

**Input schema:**
```js
{
  type: 'object',
  properties: {
    id:          { type: 'number' },
    title:       { type: 'string' },
    description: { type: 'string' },
    category:    { type: 'string', enum: ['work', 'home', 'relationships', 'learning'] },
    priority:    { type: 'string', enum: ['high', 'medium', 'low'] },
    status:      { type: 'string', enum: ['todo', 'inprogress', 'done'] },
    due_date:    { type: 'string' }
  },
  required: ['id']
}
```
**Calls:** `PUT /api/tasks/:id`

**Output:** Updated task object.

---

### `add_link`
Adds a URL or file path link to a task atomically.

**Input schema:**
```js
{
  type: 'object',
  properties: {
    task_id: { type: 'number' },
    value:   { type: 'string', description: 'URL (https://...) or file path' },
    label:   { type: 'string', description: 'Optional display label' }
  },
  required: ['task_id', 'value']
}
```

**Calls:** `POST /api/tasks/:id/links` (atomic — no race condition)

**Output:** Updated task object.

---

### `complete_task`
Marks a task as done, awarding XP and checking badges.

**Input schema:** `{ type: 'object', properties: { id: { type: 'number' } }, required: ['id'] }`

**Calls:** `POST /api/tasks/:id/complete`

**Output:** `{ task, xp_earned, new_badges, motivational_msg, stats }`

---

## Error Handling

All tool handlers wrap in `try/catch`. If the Express server is unreachable:
```
Error: Cannot connect to task manager server (localhost:3001). Make sure npm run dev is running.
```

HTTP error responses propagate the status + message from the Express API.

---

## Claude Desktop Config

```json
{
  "mcpServers": {
    "task-manager": {
      "command": "node",
      "args": ["/Users/benjaminbodner/Documents/claude_code/demos/task-manager-v2/mcp-server.js"]
    }
  }
}
```

File location: `~/Library/Application Support/Claude/claude_desktop_config.json`
Requires Claude Desktop restart after editing.

---

## Claude Code Config

`.mcp.json` (project root — checked into version control):

```json
{
  "mcpServers": {
    "task-manager": {
      "command": "node",
      "args": ["./mcp-server.js"]
    }
  }
}
```

Claude Code will prompt for approval on first use of project-scoped MCP servers.

---

## Verification

1. `npm install` — confirms `@modelcontextprotocol/sdk` installed
2. `npm run dev` — confirms Express starts cleanly, migration runs silently
3. `curl http://localhost:3001/api/tasks` — confirm `links` field is `[]` array (not null)
4. `node mcp-server.js` — confirms process starts and waits on stdin (no crash)
5. In Claude Code: `/mcp` → confirm `task-manager` server listed with 5 tools
6. Test `list_tasks` → returns current tasks with `links: []`
7. Test `add_link` with a URL → re-fetch task, confirm link appears with `type: "url"`
8. Test `add_link` with a file path → confirm `type: "file"`
9. Test `complete_task` → XP increases, task moves to done
10. Add config to Claude Desktop, restart → confirm 5 tools appear
