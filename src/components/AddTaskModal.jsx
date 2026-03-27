import { useState, useEffect } from 'react';

const CATEGORIES = [
  { id: 'work',          label: 'עבודה' },
  { id: 'home',          label: 'בית / ספורט' },
  { id: 'relationships', label: 'קשרים ומשפחה' },
  { id: 'learning',      label: 'למידה ופיתוח עצמי' },
];

const PRIORITIES = [
  { id: 'high',   label: 'גבוהה' },
  { id: 'medium', label: 'בינונית' },
  { id: 'low',    label: 'נמוכה' },
];

const STATUSES = [
  { id: 'todo',       label: 'לביצוע' },
  { id: 'inprogress', label: 'בתהליך' },
  { id: 'done',       label: 'הושלם' },
];

const EMPTY = { title: '', description: '', category: 'work', priority: 'medium', status: 'todo', due_date: '' };

export default function AddTaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (task) {
      setForm({
        title:       task.title || '',
        description: task.description || '',
        category:    task.category || 'work',
        priority:    task.priority || 'medium',
        status:      task.status || 'todo',
        due_date:    task.due_date || '',
      });
    }
  }, [task]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, due_date: form.due_date || null });
  };

  const inputCls = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4"
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {task ? 'עריכת משימה' : 'משימה חדשה'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">כותרת *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="מה צריך לעשות?"
              className={inputCls}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">תיאור</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              placeholder="פרטים נוספים..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">קטגוריה</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">עדיפות</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputCls}>
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Status + Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">סטטוס</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">תאריך יעד</label>
              <input
                type="date"
                value={form.due_date || ''}
                onChange={e => set('due_date', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!form.title.trim()}
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {task ? 'שמור שינויים' : 'הוסף משימה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
