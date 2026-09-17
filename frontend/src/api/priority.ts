export const priorityApi = {
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
