export default function CelebrationToast({ celebration }) {
  if (!celebration) return null;
  const { xp_earned, motivational_msg, new_badges } = celebration;

  return (
    <div
      className="fixed bottom-8 z-50"
      style={{
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        animation: 'popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}
    >
      <div
        className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex flex-col items-center gap-2 min-w-[220px]"
        dir="rtl"
      >
        <div className="text-3xl font-black text-yellow-400">+{xp_earned} XP</div>
        <p className="text-sm font-medium text-gray-200">{motivational_msg}</p>

        {new_badges?.length > 0 && (
          <div className="flex flex-col items-center gap-1 pt-2 border-t border-gray-700 w-full">
            {new_badges.map(badge => (
              <div key={badge.id} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{badge.emoji}</span>
                <span className="text-yellow-300 font-medium">הישג חדש: {badge.label}!</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
