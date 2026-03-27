const ALL_BADGES = [
  { id: 'first_task', label: 'ראשית',     emoji: '🎯', desc: 'משימה ראשונה הושלמה' },
  { id: 'streak_3',   label: 'על הגל',    emoji: '🔥', desc: '3 ימים ברצף'         },
  { id: 'streak_7',   label: 'שבוע שלם',  emoji: '⚡', desc: '7 ימים ברצף'         },
  { id: 'tasks_10',   label: 'מכונה',     emoji: '💪', desc: '10 משימות הושלמו'    },
  { id: 'tasks_50',   label: 'אלוף',      emoji: '🏆', desc: '50 משימות הושלמו'    },
  { id: 'level_5',    label: 'עולה רמות', emoji: '⭐', desc: 'הגעת לרמה 5'          },
  { id: 'work_5',     label: 'עובד קשה',  emoji: '💼', desc: '5 משימות עבודה'      },
];

export default function BadgesModal({ earned, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4"
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">🏅 הישגים</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {ALL_BADGES.map(badge => {
            const isEarned = earned.includes(badge.id);
            return (
              <div
                key={badge.id}
                title={badge.desc}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  isEarned
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200 opacity-40'
                }`}
              >
                <span className="text-2xl">{isEarned ? badge.emoji : '🔒'}</span>
                <span className={`text-xs font-medium text-center leading-tight ${
                  isEarned ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          {earned.length} / {ALL_BADGES.length} הישגים
        </p>
      </div>
    </div>
  );
}
