export const plannerApi = {
  getEligibility: async () => {
    const res = await fetch('/api/v1/block-plans/eligibility');
    if (!res.ok) throw new Error('Failed to load eligibility');
    return res.json();
  },

  plan: async (payload: any) => {
    const res = await fetch('/api/v1/block-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate plan');
    }
    return res.json();
  }
};
