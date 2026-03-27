import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const db = new Database(path.join(__dirname, 'tasks.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'work',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'todo',
    due_date TEXT DEFAULT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS stats (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Links column migration — safe to run on every startup
try { db.prepare("ALTER TABLE tasks ADD COLUMN links TEXT DEFAULT '[]'").run(); } catch {}

// ─── Stats helpers ────────────────────────────────────────────────────────────

const STAT_DEFAULTS = {
  total_xp: '0',
  total_completed: '0',
  streak: '0',
  last_completed_date: '',
  badges: '[]',
  completed_by_category: '{"work":0,"home":0,"relationships":0,"learning":0}',
};

function getStat(key) {
  const row = db.prepare('SELECT value FROM stats WHERE key = ?').get(key);
  return row ? row.value : (STAT_DEFAULTS[key] ?? '');
}

function setStat(key, value) {
  db.prepare('INSERT OR REPLACE INTO stats (key, value) VALUES (?, ?)').run(key, String(value));
}

const XP_MAP = { high: 30, medium: 20, low: 10 };

const MOTIVATIONAL = [
  'כל הכבוד! 🙌', 'ממשיכים קדימה! 💪', 'אחד אפס! 🎯',
  'כוחי וגבורתי! ⚡', 'מעולה, המשך כך! 🔥',
  'צעד קדימה! 👏', 'השמיים הם הגבול 🚀',
];

const ALL_BADGES = [
  { id: 'first_task', label: 'ראשית',     emoji: '🎯', desc: 'משימה ראשונה הושלמה' },
  { id: 'streak_3',   label: 'על הגל',    emoji: '🔥', desc: '3 ימים ברצף'         },
  { id: 'streak_7',   label: 'שבוע שלם',  emoji: '⚡', desc: '7 ימים ברצף'         },
  { id: 'tasks_10',   label: 'מכונה',     emoji: '💪', desc: '10 משימות הושלמו'    },
  { id: 'tasks_50',   label: 'אלוף',      emoji: '🏆', desc: '50 משימות הושלמו'    },
  { id: 'level_5',    label: 'עולה רמות', emoji: '⭐', desc: 'הגעת לרמה 5'          },
  { id: 'work_5',     label: 'עובד קשה',  emoji: '💼', desc: '5 משימות עבודה'      },
];

function computeLevel(xp) {
  return Math.min(50, Math.floor(xp / 100) + 1);
}

function computeStats() {
  const total_xp        = parseInt(getStat('total_xp'))        || 0;
  const total_completed = parseInt(getStat('total_completed')) || 0;
  const streak          = parseInt(getStat('streak'))          || 0;
  const badges          = JSON.parse(getStat('badges'));
  const level           = computeLevel(total_xp);
  const xp_in_level     = total_xp % 100;
  return { total_xp, level, xp_in_level, xp_for_next: 100, streak, total_completed, badges };
}

function checkNewBadges(earned_ids, total_completed, streak, level, cat_counts) {
  return ALL_BADGES.filter(badge => {
    if (earned_ids.includes(badge.id)) return false;
    if (badge.id === 'first_task') return total_completed >= 1;
    if (badge.id === 'streak_3')   return streak >= 3;
    if (badge.id === 'streak_7')   return streak >= 7;
    if (badge.id === 'tasks_10')   return total_completed >= 10;
    if (badge.id === 'tasks_50')   return total_completed >= 50;
    if (badge.id === 'level_5')    return level >= 5;
    if (badge.id === 'work_5')     return (cat_counts.work || 0) >= 5;
    return false;
  });
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'] }));
app.use(express.json());

// ─── Tasks ────────────────────────────────────────────────────────────────────

app.get('/api/tasks', (req, res) => {
  res.json(db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all()
    .map(row => ({ ...row, links: JSON.parse(row.links ?? '[]') })));
});

app.post('/api/tasks', (req, res) => {
  const { title, description, category, priority, status, due_date } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  const result = db.prepare(
    'INSERT INTO tasks (title, description, category, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title.trim(), description || '', category || 'work', priority || 'medium', status || 'todo', due_date || null);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...row, links: JSON.parse(row.links ?? '[]') });
});

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

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

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

// ─── Complete task (awards XP) ────────────────────────────────────────────────

app.post('/api/tasks/:id/complete', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  if (task.status === 'done') {
    return res.json({ task: { ...task, links: JSON.parse(task.links ?? '[]') }, xp_earned: 0, new_badges: [], stats: computeStats(), motivational_msg: '' });
  }

  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('done', task.id);
  const updatedTask = { ...task, status: 'done' };

  // XP
  const xp_earned = XP_MAP[task.priority] || 20;
  const new_total_xp = (parseInt(getStat('total_xp')) || 0) + xp_earned;
  setStat('total_xp', new_total_xp);

  // Total completed
  const new_total_completed = (parseInt(getStat('total_completed')) || 0) + 1;
  setStat('total_completed', new_total_completed);

  // Streak
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const last_date = getStat('last_completed_date');
  let new_streak = parseInt(getStat('streak')) || 0;
  if (last_date === yesterday) new_streak += 1;
  else if (last_date === today) { /* same day, no change */ }
  else new_streak = 1;
  setStat('streak', new_streak);
  setStat('last_completed_date', today);

  // Category counts
  const cat_counts = JSON.parse(getStat('completed_by_category'));
  cat_counts[task.category] = (cat_counts[task.category] || 0) + 1;
  setStat('completed_by_category', JSON.stringify(cat_counts));

  // Badges
  const earned_ids = JSON.parse(getStat('badges'));
  const level = computeLevel(new_total_xp);
  const new_badges = checkNewBadges(earned_ids, new_total_completed, new_streak, level, cat_counts);
  if (new_badges.length > 0) {
    setStat('badges', JSON.stringify([...earned_ids, ...new_badges.map(b => b.id)]));
  }

  const motivational_msg = MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];
  res.json({ task: { ...updatedTask, links: JSON.parse(updatedTask.links ?? '[]') }, xp_earned, new_badges, stats: computeStats(), motivational_msg });
});

// ─── Stats ────────────────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  res.json(computeStats());
});

app.listen(3001, () => {
  console.log('✓ TaskFlow server running on http://localhost:3001');
});
