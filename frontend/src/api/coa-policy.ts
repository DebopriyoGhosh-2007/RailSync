export const coaPolicyApi = {
  get: async () => {
    const response = await fetch('/api/v1/coa-policy');
    if (!response.ok) throw new Error('Failed to load feasibility policy');
    return response.json();
  },
  update: async (policy: Record<string, number | null>) => {
    const response = await fetch('/api/v1/coa-policy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to update feasibility policy');
    }
    return response.json();
  },
};
