# TaskFlow - ניהול משימות ✅

A gamified task manager with a Hebrew RTL interface, kanban board, XP & leveling system, achievement badges, and animated dogs.

## Try It Now

**No installation needed** — just open [`demo.html`](demo.html) in your browser!

The demo is a single self-contained HTML file with zero dependencies. It uses localStorage to persist your tasks and progress.

## Features

- **Kanban board** — drag-and-drop tasks between To Do / In Progress / Done columns
- **Hebrew RTL interface** — fully localized right-to-left UI
- **4 categories** — Work, Home/Sports, Relationships, Learning
- **3 priority levels** — visual color indicators (red/yellow/gray)
- **Gamification system**
  - XP awarded per task (10/20/30 based on priority)
  - 50 levels (100 XP each)
  - Daily streak tracking
  - 7 achievement badges
- **Animated dogs** — 3 dogs roam the screen, breed changes every 5 levels (Golden Retriever, Poodle, Dalmatian, Corgi, Dachshund)
- **Motivational messages** in Hebrew on task completion

## Quick Start

### Standalone Demo

Download or open `demo.html` directly in any modern browser. That's it.

### Full Development Setup

```bash
git clone <repo-url>
cd task-manager-v2
npm install
npm run dev
```

This starts the Express backend on port 3001 and Vite frontend on port 5176. The full version uses SQLite for persistence.

### Available Scripts

| Command           | Description                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Start backend + frontend concurrently    |
| `npm run server`  | Backend only (Express + SQLite)          |
| `npm run client`  | Frontend only (Vite dev server)          |
| `npm run build`   | Production build                         |
| `npm run preview` | Preview production build                 |

## Tech Stack

| Component  | Demo (`demo.html`)     | Full App                  |
|------------|------------------------|---------------------------|
| Frontend   | Vanilla HTML/CSS/JS    | React 18 + Vite           |
| Styling    | Inline CSS             | Tailwind CSS              |
| Backend    | —                      | Express.js                |
| Database   | localStorage           | SQLite (better-sqlite3)   |

## Project Structure

```
├── demo.html          # Self-contained single-file demo
├── server.js          # Express backend + gamification logic
├── src/
│   ├── App.jsx        # Root component
│   └── components/
│       ├── KanbanBoard.jsx
│       ├── Column.jsx
│       ├── TaskCard.jsx
│       ├── Sidebar.jsx
│       ├── AddTaskModal.jsx
│       ├── XPBar.jsx
│       ├── BadgesModal.jsx
│       ├── CelebrationToast.jsx
│       ├── DogLayer.jsx
│       └── Dog.jsx
├── package.json
├── LICENSE
└── README.md
```

## License

[MIT](LICENSE) — Benjy Bodner
