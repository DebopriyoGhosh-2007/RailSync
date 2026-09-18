export const priorityApi = {
  getPolicies: async () => {
    const res = await fetch('/api/v1/priority/policies');
    if (!res.ok) throw new Error('Failed to load priority policies');
    return res.json();
  },

  registerPolicy: async (payload: any) => {
    const res = await fetch('/api/v1/priority/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update priority policy');
    }
    return res.json();
  },

  getTaskContext: async (taskId: string) => {
    const res = await fetch(`/api/v1/priority/task-context/${encodeURIComponent(taskId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to load active traffic slot');
    }
    return res.json();
  },

  evaluate: async (payload: any) => {
    const res = await fetch('/api/v1/priority/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to calculate priority');
    }
    return res.json();
  }
};
