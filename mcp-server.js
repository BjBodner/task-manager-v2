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
