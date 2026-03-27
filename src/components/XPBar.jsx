export default function XPBar({ stats }) {
  if (!stats) return null;
  const { level, xp_in_level, streak } = stats;
  const pct = Math.round((xp_in_level / 100) * 100);

  return (
    <div className="px-2 py-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {level}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">רמה {level}</p>
            <p className="text-xs text-gray-400">{xp_in_level}/100 XP</p>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-orange-50 rounded-lg px-2 py-1">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-bold text-orange-600">{streak}</span>
          </div>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
