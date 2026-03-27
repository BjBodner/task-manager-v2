import { useState, useEffect, useCallback } from 'react';
import KanbanBoard from './components/KanbanBoard.jsx';
import Sidebar from './components/Sidebar.jsx';
import AddTaskModal from './components/AddTaskModal.jsx';
import CelebrationToast from './components/CelebrationToast.jsx';
import DogLayer from './components/DogLayer.jsx';

const API = 'http://localhost:3001/api';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [celebration, setCelebration] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        fetch(`${API}/tasks`),
        fetch(`${API}/stats`),
      ]);
      setTasks(await tasksRes.json());
      setStats(await statsRes.json());
      setError('');
    } catch {
      setError('לא ניתן להתחבר לשרת');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createTask = async (data) => {
    const res = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const task = await res.json();
    setTasks(prev => [task, ...prev]);
  };

  const updateTask = async (id, data) => {
    const res = await fetch(`${API}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  const deleteTask = async (id) => {
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleComplete = async (taskId) => {
    const res = await fetch(`${API}/tasks/${taskId}/complete`, { method: 'POST' });
    const data = await res.json();
    setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
    setStats(data.stats);
    if (data.xp_earned > 0) {
      setCelebration({ xp_earned: data.xp_earned, new_badges: data.new_badges, motivational_msg: data.motivational_msg });
      setTimeout(() => setCelebration(null), 3000);
    }
  };

  const handleMoveTask = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    if (newStatus === 'done') {
      handleComplete(taskId);
    } else {
      updateTask(taskId, { ...task, status: newStatus });
    }
  };

  const openEdit = (task) => { setEditingTask(task); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTask(null); };

  const handleSave = async (data) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
    closeModal();
  };

  const filteredTasks = activeCategory === 'all'
    ? tasks
    : tasks.filter(t => t.category === activeCategory);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir="rtl">
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onAddTask={() => setModalOpen(true)}
        tasks={tasks}
        stats={stats}
      />
      <main className="flex-1 overflow-hidden">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-6 py-3 border-b border-red-200">
            ⚠ {error} — ודא שהשרת רץ עם <code>npm run dev</code>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            טוען...
          </div>
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            onMove={handleMoveTask}
            onComplete={handleComplete}
            onEdit={openEdit}
            onDelete={deleteTask}
          />
        )}
      </main>
      {modalOpen && (
        <AddTaskModal
          task={editingTask}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
      <CelebrationToast celebration={celebration} />
      <DogLayer level={stats?.level || 1} />
    </div>
  );
}
