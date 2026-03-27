import { useState, useEffect, useCallback, useRef } from 'react';
import TaskCard from './TaskCard.jsx';
import {
  getTasks, saveTasks, getPoints, getTodayPoints, addPoints, saveLastSync, getLastSync
} from '../utils/storage.js';
import { getMyIssues, transitionIssue } from '../utils/jiraApi.js';

const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function formatSyncTime(date) {
  if (!date) return 'Never';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard({ credentials, onLogout }) {
  const [tasks, setTasks] = useState(() => getTasks());
  const [points, setPoints] = useState({ total: getPoints(), today: getTodayPoints() });
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(() => getLastSync());
  const [syncError, setSyncError] = useState('');
  const [transitioning, setTransitioning] = useState({}); // { [issueKey]: true }
  const [toast, setToast] = useState(null);
  const syncTimerRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const syncTasks = useCallback(async (silent = false) => {
    if (!silent) setSyncing(true);
    setSyncError('');
    try {
      const data = await getMyIssues(credentials);
      const fetched = (data.issues || []).map(issue => ({
        ...issue,
        _jiraUrl: credentials.jiraUrl,
      }));
      setTasks(fetched);
      saveTasks(fetched);
      const now = new Date();
      saveLastSync(now);
      setLastSync(now);
    } catch (err) {
      const msg = err.message.includes('fetch')
        ? 'Cannot reach proxy server'
        : err.message;
      setSyncError(msg);
    } finally {
      if (!silent) setSyncing(false);
    }
  }, [credentials]);

  // Initial load + auto-sync
  useEffect(() => {
    syncTasks();
    syncTimerRef.current = setInterval(() => syncTasks(true), SYNC_INTERVAL_MS);
    return () => clearInterval(syncTimerRef.current);
  }, [syncTasks]);

  const handleTransition = async (task, targetCategory) => {
    setTransitioning(t => ({ ...t, [task.key]: true }));
    try {
      await transitionIssue(credentials, task.key, targetCategory);

      if (targetCategory === 'done') {
        // Remove from list + award points
        const priority = task.fields.priority?.name || 'Medium';
        const POINTS_MAP = { Highest: 50, Critical: 50, High: 30, Medium: 20, Low: 10, Lowest: 5 };
        const earned = POINTS_MAP[priority] || 20;
        const newPoints = addPoints(earned);
        setPoints(newPoints);

        setTasks(prev => {
          const updated = prev.filter(t => t.key !== task.key);
          saveTasks(updated);
          return updated;
        });
        showToast(`+${earned} points! ${task.key} done 🎉`);
      } else {
        // Update status in list optimistically, then re-sync
        await syncTasks(true);
        showToast(`${task.key} started`);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setTransitioning(t => ({ ...t, [task.key]: false }));
    }
  };

  // Group tasks: In Progress first, then To Do
  const inProgress = tasks.filter(t => t.fields.status?.statusCategory?.key === 'indeterminate');
  const todo = tasks.filter(t => t.fields.status?.statusCategory?.key === 'new');
  const completedToday = Math.max(0, tasks.length === 0 ? 0 : 0); // placeholder — tracked via points

  // Progress: estimate from daily points (20 pts = 1 "average" task)
  const estimatedDone = points.today > 0 ? Math.ceil(points.today / 20) : 0;
  const totalVisible = tasks.length + estimatedDone;
  const progressPct = totalVisible > 0 ? Math.round((estimatedDone / totalVisible) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚡</span>
            <h1 className="font-bold text-gray-900">Task Manager</h1>
          </div>

          {/* Points */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{points.today}</div>
              <div className="text-xs text-gray-400">today</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-700">{points.total}</div>
              <div className="text-xs text-gray-400">total</div>
            </div>
            <button
              onClick={() => syncTasks()}
              disabled={syncing}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              title="Sync with Jira"
            >
              <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onLogout}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {totalVisible > 0 && (
          <div className="max-w-3xl mx-auto px-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{estimatedDone}/{totalVisible} done today</span>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Sync status */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {syncing ? 'Syncing...' : `Last sync: ${formatSyncTime(lastSync)}`}
          </span>
          {syncError && (
            <span className="text-red-500">⚠ {syncError}</span>
          )}
        </div>

        {/* In Progress */}
        {inProgress.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              In Progress ({inProgress.length})
            </h2>
            <div className="space-y-3">
              {inProgress.map(task => (
                <TaskCard
                  key={task.key}
                  task={task}
                  onTransition={handleTransition}
                  transitioning={!!transitioning[task.key]}
                />
              ))}
            </div>
          </section>
        )}

        {/* To Do */}
        {todo.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              To Do ({todo.length})
            </h2>
            <div className="space-y-3">
              {todo.map(task => (
                <TaskCard
                  key={task.key}
                  task={task}
                  onTransition={handleTransition}
                  transitioning={!!transitioning[task.key]}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!syncing && tasks.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🎉</div>
            <p className="font-medium text-gray-600">All caught up!</p>
            <p className="text-sm mt-1">No open tasks assigned to you in Jira.</p>
          </div>
        )}

        {/* Loading skeleton */}
        {syncing && tasks.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="flex gap-2 mb-2">
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                  <div className="h-4 w-12 bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg z-50 transition-all">
          {toast}
        </div>
      )}
    </div>
  );
}
