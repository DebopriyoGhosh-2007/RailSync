export const operationsApi = {
  getSummary: async () => {
    const res = await fetch('/api/v1/operations/summary');
    if (!res.ok) throw new Error('Failed to load operations summary');
    return res.json();
  },

  importTimetable: async (payload: any) => {
    const res = await fetch('/api/v1/operations/timetable-occupancy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to import timetable');
    }
    return res.json();
  },

  importGoods: async (payload: any) => {
    const res = await fetch('/api/v1/operations/goods-forecasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to import goods forecast');
    }
    return res.json();
  },

  importCoa: async (payload: any) => {
    const res = await fetch('/api/v1/operations/coa-windows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to import COA windows');
    }
    return res.json();
  },

  planFromIntegrated: async (payload: any) => {
    const res = await fetch('/api/v1/block-plans/from-integrated-data', {
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
