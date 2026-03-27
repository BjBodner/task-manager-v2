const KEYS = {
  credentials: 'jira_credentials',
  tasks: 'jira_tasks',
  totalPoints: 'jira_total_points',
  todayPoints: 'jira_today_points',
  todayDate: 'jira_today_date',
  lastSync: 'jira_last_sync',
};

export function saveCredentials(creds) {
  localStorage.setItem(KEYS.credentials, JSON.stringify(creds));
}

export function getCredentials() {
  const stored = localStorage.getItem(KEYS.credentials);
  return stored ? JSON.parse(stored) : null;
}

export function clearCredentials() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

export function saveTasks(tasks) {
  localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
}

export function getTasks() {
  const stored = localStorage.getItem(KEYS.tasks);
  return stored ? JSON.parse(stored) : [];
}

export function getPoints() {
  return parseInt(localStorage.getItem(KEYS.totalPoints) || '0');
}

export function getTodayPoints() {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem(KEYS.todayDate);
  if (savedDate !== today) {
    localStorage.setItem(KEYS.todayDate, today);
    localStorage.setItem(KEYS.todayPoints, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(KEYS.todayPoints) || '0');
}

export function addPoints(amount) {
  const total = getPoints() + amount;
  localStorage.setItem(KEYS.totalPoints, String(total));

  const today = new Date().toDateString();
  const savedDate = localStorage.getItem(KEYS.todayDate);
  let todayPts = savedDate === today
    ? parseInt(localStorage.getItem(KEYS.todayPoints) || '0')
    : 0;
  todayPts += amount;
  localStorage.setItem(KEYS.todayDate, today);
  localStorage.setItem(KEYS.todayPoints, String(todayPts));

  return { total, today: todayPts };
}

export function saveLastSync(date) {
  localStorage.setItem(KEYS.lastSync, date.toISOString());
}

export function getLastSync() {
  const stored = localStorage.getItem(KEYS.lastSync);
  return stored ? new Date(stored) : null;
}
