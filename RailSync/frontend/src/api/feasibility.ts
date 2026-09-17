export const feasibilityApi = {
  assess: async (payload: any) => {
    const res = await fetch('/api/v1/feasibility/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate assessment');
    }
    return res.json();
  }
};
