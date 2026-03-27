# MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stdio MCP server so Claude Desktop and Claude Code can list, update, link, and complete tasks via the existing Express API.

**Architecture:** `mcp-server.js` runs as a subprocess over stdio transport and delegates all operations to `http://localhost:3001/api`. `server.js` gains a `links` column + atomic link-append endpoint. A `.mcp.json` at the project root registers the server with Claude Code.

**Tech Stack:** `@modelcontextprotocol/sdk` (stdio MCP), Express 4, better-sqlite3, Node.js ESM

---

## File Map

| File | Change |
|------|--------|
| `package.json` | Add `@modelcontextprotocol/sdk` dependency |
| `server.js` | Links column migration + update GET/PUT + new POST /api/tasks/:id/links |
| `mcp-server.js` | **New** — 5 MCP tools over stdio |
| `.mcp.json` | **New** — Claude Code project MCP config |

---

### Task 1: Install SDK dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install `@modelcontextprotocol/sdk`**

```bash
cd /Users/benjaminbodner/Documents/claude_code/demos/task-manager-v2
npm install @modelcontextprotocol/sdk
```

Expected: `package.json` now lists `"@modelcontextprotocol/sdk"` under `dependencies`. No error output.

- [ ] **Step 2: Verify install**

```bash
node -e "import('@modelcontextprotocol/sdk/server/index.js').then(m => console.log('OK', Object.keys(m)))"
```

Expected: Prints `OK` followed by exported names including `Server`.

---

### Task 2: Add links support to server.js

**Files:**
- Modify: `server.js` (lines 11–26 for migration, line 102 for GET, lines 114–122 for PUT, new endpoint after line 127)

- [ ] **Step 1: Add links column migration**

After the `db.exec(...)` block (after line 26), add:

```js
// Links column migration — safe to run on every startup
try { db.prepare("ALTER TABLE tasks ADD COLUMN links TEXT DEFAULT '[]'").run(); } catch {}
```

- [ ] **Step 2: Update GET /api/tasks to parse links**

Replace line 102:
```js
// Before:
res.json(db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all());
// After:
res.json(db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all()
  .map(row => ({ ...row, links: JSON.parse(row.links ?? '[]') })));
```

- [ ] **Step 3: Update PUT /api/tasks/:id to persist links**

Replace the PUT handler (lines 114–122) with:

```js
app.put('/api/tasks/:id', (req, res) => {
  const { title, description, category, priority, status, due_date, links } = req.body;
  const linksStr = JSON.stringify(links ?? []);
  db.prepare(
    'UPDATE tasks SET title = ?, description = ?, category = ?, priority = ?, status = ?, due_date = ?, links = ? WHERE id = ?'
  ).run(title, description || '', category || 'work', priority || 'medium', status || 'todo', due_date || null, linksStr, req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json({ ...task, links: JSON.parse(task.links ?? '[]') });
});
```

- [ ] **Step 4: Add POST /api/tasks/:id/links endpoint**

After the DELETE handler (after line 127), add:

```js
app.post('/api/tasks/:id/links', (req, res) => {
  const { value, label } = req.body;
  if (!value) return res.status(400).json({ error: 'value is required' });
  const type = (value.startsWith('http://') || value.startsWith('https://')) ? 'url' : 'file';
  const task = db.prepare('SELECT links FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  const links = JSON.parse(task.links ?? '[]');
  links.push({ type, value, label: label ?? null });
  db.prepare('UPDATE tasks SET links = ? WHERE id = ?').run(JSON.stringify(links), req.params.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json({ ...updated, links: JSON.parse(updated.links ?? '[]') });
});
```

- [ ] **Step 5: Restart server and verify links field**

```bash
curl -s http://localhost:3001/api/tasks | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const t=JSON.parse(d); console.log('links field:', t[0]?.links, typeof t[0]?.links)"
```

Expected: `links field: [] object` — an array, not null/string.

- [ ] **Step 6: Test the links endpoint**

```bash
# Get a task ID first
TASK_ID=$(curl -s http://localhost:3001/api/tasks | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)[0]?.id))")
# Add a URL link
curl -s -X POST http://localhost:3001/api/tasks/$TASK_ID/links \
  -H 'Content-Type: application/json' \
  -d '{"value":"https://example.com","label":"test"}' | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const t=JSON.parse(d); console.log('links:', JSON.stringify(t.links))"
```

Expected: `links: [{"type":"url","value":"https://example.com","label":"test"}]`

---

### Task 3: Create mcp-server.js

**Files:**
- Create: `mcp-server.js`

- [ ] **Step 1: Write mcp-server.js**

```js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const API = 'http://localhost:3001/api';

async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot connect to task manager server (localhost:3001). Make sure npm run dev is running.');
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

const server = new Server(
  { name: 'task-manager', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_tasks',
      description: 'List all tasks, optionally filtered by status or category',
      inputSchema: {
        type: 'object',
        properties: {
          status:   { type: 'string', enum: ['todo', 'inprogress', 'done'] },
          category: { type: 'string', enum: ['work', 'home', 'relationships', 'learning'] },
        },
      },
    },
    {
      name: 'get_task',
      description: 'Get a single task by ID',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'number', description: 'Task ID' } },
        required: ['id'],
      },
    },
    {
      name: 'update_task',
      description: 'Update task fields (title, description, category, priority, status, due_date)',
      inputSchema: {
        type: 'object',
        properties: {
          id:          { type: 'number' },
          title:       { type: 'string' },
          description: { type: 'string' },
          category:    { type: 'string', enum: ['work', 'home', 'relationships', 'learning'] },
          priority:    { type: 'string', enum: ['high', 'medium', 'low'] },
          status:      { type: 'string', enum: ['todo', 'inprogress', 'done'] },
          due_date:    { type: 'string' },
        },
        required: ['id'],
      },
    },
    {
      name: 'add_link',
      description: 'Add a URL or file path link to a task',
      inputSchema: {
        type: 'object',
        properties: {
          task_id: { type: 'number' },
          value:   { type: 'string', description: 'URL (https://...) or file path' },
          label:   { type: 'string', description: 'Optional display label' },
        },
        required: ['task_id', 'value'],
      },
    },
    {
      name: 'complete_task',
      description: 'Mark a task as done, awarding XP and checking badges',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    if (name === 'list_tasks') {
      const tasks = await apiFetch('/tasks');
      const filtered = tasks
        .filter(t => !args.status   || t.status   === args.status)
        .filter(t => !args.category || t.category === args.category);
      result = filtered;
    }

    else if (name === 'get_task') {
      const tasks = await apiFetch('/tasks');
      const task = tasks.find(t => t.id === args.id);
      if (!task) throw new Error(`Task ${args.id} not found`);
      result = task;
    }

    else if (name === 'update_task') {
      const tasks = await apiFetch('/tasks');
      const existing = tasks.find(t => t.id === args.id);
      if (!existing) throw new Error(`Task ${args.id} not found`);
      const payload = {
        title:       args.title       ?? existing.title,
        description: args.description ?? existing.description,
        category:    args.category    ?? existing.category,
        priority:    args.priority    ?? existing.priority,
        status:      args.status      ?? existing.status,
        due_date:    args.due_date    ?? existing.due_date,
        links:       existing.links,
      };
      result = await apiFetch(`/tasks/${args.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }

    else if (name === 'add_link') {
      result = await apiFetch(`/tasks/${args.task_id}/links`, {
        method: 'POST',
        body: JSON.stringify({ value: args.value, label: args.label }),
      });
    }

    else if (name === 'complete_task') {
      result = await apiFetch(`/tasks/${args.id}/complete`, { method: 'POST' });
    }

    else {
      throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 2: Verify the server starts without crashing**

```bash
cd /Users/benjaminbodner/Documents/claude_code/demos/task-manager-v2
echo '{}' | timeout 3 node mcp-server.js; echo "exit: $?"
```

Expected: Process stays alive (doesn't crash immediately), exits when stdin closes. Exit code 0 or 143 (timeout signal) — not 1.

---

### Task 4: Create .mcp.json for Claude Code

**Files:**
- Create: `.mcp.json`

- [ ] **Step 1: Write .mcp.json**

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

File location: `/Users/benjaminbodner/Documents/claude_code/demos/task-manager-v2/.mcp.json`

- [ ] **Step 2: Verify the file is valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('.mcp.json','utf8')); console.log('valid')"
```

Expected: `valid`

---

### Task 5: End-to-end verification

- [ ] **Step 1: Ensure dev server is running**

```bash
curl -s http://localhost:3001/api/tasks > /dev/null && echo "server OK" || echo "server not running — run npm run dev"
```

- [ ] **Step 2: Smoke-test list_tasks via MCP protocol**

Send a valid MCP `tools/call` message over stdin:

```bash
cd /Users/benjaminbodner/Documents/claude_code/demos/task-manager-v2
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\n' | timeout 5 node mcp-server.js 2>/dev/null
```

Expected: JSON response containing `"list_tasks"`, `"get_task"`, `"update_task"`, `"add_link"`, `"complete_task"`.

- [ ] **Step 3: Confirm Claude Desktop config path**

The user must manually add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

Then restart Claude Desktop.

- [ ] **Step 4: In Claude Code, verify server is registered**

Run `/mcp` in Claude Code — confirm `task-manager` server appears with 5 tools listed.
