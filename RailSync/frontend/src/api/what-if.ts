// src/api/what-if.ts

export const whatIfApi = {
  getHints: async () => {
    const res = await fetch('/api/v1/simulate/what-if/hints');
    if (!res.ok) throw new Error('Failed to load what-if hints');
    return res.json();
  },

  simulate: async (payload: any) => {
    const res = await fetch('/api/v1/simulate/what-if', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to simulate what-if');
    return res.json();
  }
};
