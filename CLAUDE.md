# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start both Express backend (port 3001) and Vite frontend (port 5176) concurrently
npm run server    # Backend only
npm run client    # Frontend only
npm run build     # Production build (Vite)
npm run preview   # Preview production build
```

No test or lint scripts are configured.

## Architecture

**Full-stack app:** React 18 + Vite frontend talking to an Express backend backed by SQLite (`tasks.db`).

### Backend (`server.js`)
Single-file Express server. Two SQLite tables:
- `tasks` — id, title, description, category (`work|home|relationships|learning`), priority (`high|medium|low`), status (`todo|inprogress|done`), due_date, created_at
- `stats` — key/value store for XP, level, streaks, badges, completion counts

REST API: `GET|POST /api/tasks`, `PUT|DELETE /api/tasks/:id`, `POST /api/tasks/:id/complete`, `GET /api/stats`

Completing a task triggers server-side gamification: XP awards (high=30, medium=20, low=10), level computation (`Math.floor(xp/100)+1`, cap 50), daily streak tracking, and 7 badge checks.

### Frontend (`src/`)
- **`App.jsx`** — root; owns all state (tasks, stats, activeCategory, modal state, celebration), makes all fetch calls to `http://localhost:3001/api`
- **`KanbanBoard.jsx` / `Column.jsx`** — 3-column kanban (todo / inprogress / done) using native HTML5 drag-and-drop
- **`Sidebar.jsx`** — category filter + add-task button + badges modal trigger + XP bar
- **`TaskCard.jsx`** — per-task display with complete/edit/delete actions
- **`AddTaskModal.jsx`** — create/edit modal (all task fields)
- **`XPBar.jsx` / `CelebrationToast.jsx` / `BadgesModal.jsx`** — gamification UI
- **`Dashboard.jsx` / `Setup.jsx`** — alternative Jira-sync UI (separate from local task flow); uses `src/utils/jiraApi.js` and `src/utils/storage.js` (localStorage for Jira credentials)

### UI Notes
- RTL layout (`dir="rtl"`) with Hebrew strings throughout
- Dates formatted with `toLocaleDateString('he-IL')`
- CORS on server allows ports 5173–5176
