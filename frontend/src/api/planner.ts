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
      let msg = 'Failed to generate plan';
      if (Array.isArray(err.detail)) {
        msg = err.detail.map((e: any) => `${e.loc ? e.loc.filter((x: any) => x !== 'body').join('.') : 'error'}: ${e.msg}`).join('; ');
      } else if (typeof err.detail === 'string') {
        msg = err.detail;
      } else if (err.detail) {
        msg = JSON.stringify(err.detail);
      }
      throw new Error(msg);
    }
    return res.json();
  }
};
