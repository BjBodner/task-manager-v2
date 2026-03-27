import Column from './Column.jsx';

const COLUMNS = [
  { id: 'todo',       label: 'לביצוע',  color: 'text-gray-600',  dot: 'bg-gray-400'  },
  { id: 'inprogress', label: 'בתהליך',  color: 'text-blue-600',  dot: 'bg-blue-500'  },
  { id: 'done',       label: 'הושלם',   color: 'text-green-600', dot: 'bg-green-500' },
];

export default function KanbanBoard({ tasks, onMove, onComplete, onEdit, onDelete }) {
  return (
    <div className="flex gap-5 p-6 h-full overflow-x-auto">
      {COLUMNS.map(col => (
        <Column
          key={col.id}
          column={col}
          tasks={tasks.filter(t => t.status === col.id)}
          onMove={onMove}
          onComplete={onComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
