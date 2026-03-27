import { useState } from 'react';
import XPBar from './XPBar.jsx';
import BadgesModal from './BadgesModal.jsx';

const CATEGORIES = [
  { id: 'all',           label: 'הכל',              icon: '📋' },
  { id: 'work',          label: 'עבודה',             icon: '💼' },
  { id: 'home',          label: 'בית / ספורט',      icon: '🏠' },
  { id: 'relationships', label: 'קשרים ומשפחה',     icon: '❤️' },
  { id: 'learning',      label: 'למידה ופיתוח עצמי', icon: '📚' },
];

export default function Sidebar({ activeCategory, onCategoryChange, onAddTask, tasks, stats }) {
  const [badgesOpen, setBadgesOpen] = useState(false);

  const countOpen = (catId) =>
    catId === 'all'
      ? tasks.filter(t => t.status !== 'done').length
      : tasks.filter(t => t.category === catId && t.status !== 'done').length;

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const earnedBadges = stats?.badges ?? [];

  return (
    <>
      <aside className="w-56 bg-white border-l border-gray-200 flex flex-col p-4 shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 py-3 mb-3">
          <span className="text-2xl">✅</span>
          <span className="font-bold text-gray-800 text-lg">TaskFlow</span>
        </div>

        {/* Add Task */}
        <button
          onClick={onAddTask}
          className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors mb-5 flex items-center justify-center gap-1.5"
        >
          <span className="text-lg leading-none">+</span>
          <span>משימה חדשה</span>
        </button>

        {/* Categories */}
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-2 mb-2">קטגוריות</p>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map(cat => {
            const count = countOpen(cat.id);
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="flex-1 text-right">{cat.label}</span>
                {count > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${
                    isActive ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Badges button */}
        <button
          onClick={() => setBadgesOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors mb-1"
        >
          <span className="text-base">🏅</span>
          <span className="flex-1 text-right">הישגים</span>
          {earnedBadges.length > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-1.5 py-0.5 font-medium">
              {earnedBadges.length}
            </span>
          )}
        </button>

        {/* XP Bar */}
        {stats && <XPBar stats={stats} />}

        {/* Done count footer */}
        {doneCount > 0 && (
          <div className="pt-2 px-2">
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-green-600">{doneCount}</span> הושלמו
            </p>
          </div>
        )}
      </aside>

      {badgesOpen && (
        <BadgesModal earned={earnedBadges} onClose={() => setBadgesOpen(false)} />
      )}
    </>
  );
}
