const PROXY = 'http://localhost:3001/jira';

function headers(creds) {
  const token = btoa(`${creds.email}:${creds.token}`);
  return {
    'Authorization': `Basic ${token}`,
    'X-Jira-Url': creds.jiraUrl,
    'Content-Type': 'application/json',
  };
}

async function request(creds, path, options = {}) {
  const res = await fetch(`${PROXY}${path}`, {
    ...options,
    headers: headers(creds),
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (res.status === 401) {
      msg = `401 Unauthorized — check your email and API token`;
    } else if (res.status === 403) {
      msg = `403 Forbidden — your token may lack permissions`;
    } else if (isJson) {
      try {
        const body = await res.json();
        msg = body.errorMessages?.[0] || body.message || body.error || msg;
      } catch (_) {}
    }
    throw new Error(msg);
  }

  if (res.status === 204) return null;

  if (!isJson) {
    throw new Error(
      `Jira returned HTML instead of JSON. Check your Jira URL — it should be just the base like https://yourcompany.atlassian.net (no /jira suffix)`
    );
  }

  return res.json();
}

export async function getMyself(creds) {
  return request(creds, '/rest/api/3/myself');
}

export async function getMyIssues(creds) {
  const jql = 'assignee = currentUser() AND statusCategory != Done ORDER BY priority ASC, updated DESC';
  const fields = 'summary,status,priority,description,assignee,created,updated,comment';
  const path = `/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=50`;
  return request(creds, path);
}

export async function getTransitions(creds, issueKey) {
  return request(creds, `/rest/api/3/issue/${issueKey}/transitions`);
}

export async function transitionIssue(creds, issueKey, targetCategoryOrName) {
  const { transitions } = await getTransitions(creds, issueKey);

  // Try to match by status category key first (inprogress, done), then by name
  const target = targetCategoryOrName.toLowerCase();
  let transition = transitions.find(t =>
    t.to?.statusCategory?.key?.toLowerCase() === target
  );
  if (!transition) {
    transition = transitions.find(t =>
      t.name.toLowerCase().includes(target)
    );
  }

  if (!transition) {
    const available = transitions.map(t => `"${t.name}"`).join(', ');
    throw new Error(`No transition found for "${targetCategoryOrName}". Available: ${available}`);
  }

  await request(creds, `/rest/api/3/issue/${issueKey}/transitions`, {
    method: 'POST',
    body: JSON.stringify({ transition: { id: transition.id } }),
  });

  return transition;
}
