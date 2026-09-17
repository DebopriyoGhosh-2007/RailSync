export const liveApi = {
  updateProgress: async (payload: any) => {
    const res = await fetch('/api/v1/telemetry/progress-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit telemetry');
    }
    return res.json();
  }
};
