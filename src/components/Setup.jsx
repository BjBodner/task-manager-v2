import { useState } from 'react';
import { saveCredentials } from '../utils/storage.js';
import { getMyself } from '../utils/jiraApi.js';

export default function Setup({ onSetup }) {
  const [form, setForm] = useState({ jiraUrl: '', email: '', token: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const creds = {
        jiraUrl: form.jiraUrl.replace(/\/+$/, ''),
        email: form.email.trim(),
        token: form.token.trim(),
      };

      // Verify connection
      await getMyself(creds);

      saveCredentials(creds);
      onSetup(creds);
    } catch (err) {
      if (err.message.includes('fetch')) {
        setError('Cannot reach proxy server. Make sure you ran `npm run dev`.');
      } else {
        setError(`Connection failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-gray-500 mt-1">Connect your Jira account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jira URL
            </label>
            <input
              type="url"
              value={form.jiraUrl}
              onChange={set('jiraUrl')}
              placeholder="https://yourcompany.atlassian.net"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@company.com"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Token
            </label>
            <input
              type="password"
              value={form.token}
              onChange={set('token')}
              placeholder="Your Jira API token"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Generate at{' '}
              <span className="text-blue-500">
                id.atlassian.com → Security → API tokens
              </span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Connecting...' : 'Connect to Jira'}
          </button>
        </form>
      </div>
    </div>
  );
}
