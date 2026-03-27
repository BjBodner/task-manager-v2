import { useState } from 'react';
import TaskCard from './TaskCard.jsx';

export default function Column({ column, tasks, onMove, onComplete, onEdit, onDelete }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    if (taskId) onMove(taskId, column.id);
  };

  return (
    <div
      className={`flex flex-col w-72 min-w-[288px] rounded-2xl p-4 transition-all ${
        isDragOver ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-gray-100'
      }`}
      style={{ height: 'calc(100vh - 96px)' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
        <h2 className={`font-semibold text-sm ${column.color}`}>{column.label}</h2>
        <span className="mr-auto text-xs text-gray-400 bg-white rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-0.5">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-gray-300 text-sm py-10 border-2 border-dashed border-gray-200 rounded-xl">
            {isDragOver ? 'שחרור כאן' : 'גרור לכאן'}
          </div>
        )}
      </div>
    </div>
  );
}
