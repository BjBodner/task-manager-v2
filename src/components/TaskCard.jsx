const CATEGORY_CONFIG = {
  work:          { label: 'עבודה',           color: 'bg-blue-100 text-blue-700'    },
  home:          { label: 'בית / ספורט',    color: 'bg-green-100 text-green-700'  },
  relationships: { label: 'קשרים',           color: 'bg-pink-100 text-pink-700'    },
  learning:      { label: 'למידה',           color: 'bg-purple-100 text-purple-700'},
};

const PRIORITY_DOT = {
  high:   'bg-red-500',
  medium: 'bg-yellow-400',
  low:    'bg-gray-300',
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isPast = d < today;
  return { label: d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }), isPast };
}

export default function TaskCard({ task, onComplete, onEdit, onDelete }) {
  const cat    = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.work;
  const dot    = PRIORITY_DOT[task.priority]    || PRIORITY_DOT.medium;
  const due    = formatDate(task.due_date);
  const isDone = task.status === 'done';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-white rounded-xl border border-gray-200 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group select-none"
    >
      {/* Top row */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
          {cat.label}
        </span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />

        <div className="mr-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isDone && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
              className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
              title="סמן כהושלם"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="ערוך"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="מחק"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <p className={`font-medium text-sm leading-snug ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Due date */}
      {due && (
        <div className={`mt-2.5 flex items-center gap-1 text-xs font-medium ${due.isPast && !isDone ? 'text-red-500' : 'text-gray-400'}`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {due.label}
        </div>
      )}
    </div>
  );
}
