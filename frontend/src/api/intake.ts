export const intakeApi = {
  registerReference: async (payload: any) => {
    try {
      const res = await fetch('/api/v1/network-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 502 || res.status === 504) throw new Error('Cannot connect to backend server. Please ensure start_server.bat is running.');
        const err = await res.json().catch(() => ({}));
        let detail = err.detail || 'Failed to register reference';
        if (Array.isArray(detail)) detail = detail.map((d: any) => d.msg).join('; ');
        throw new Error(`[HTTP ${res.status}] ${detail}`);
      }
      return await res.json();
    } catch (e: any) {
      if (e.message.includes('fetch')) throw new Error('Network error: Is the backend server running?');
      throw e;
    }
  },

  ingestTask: async (payload: any) => {
    const res = await fetch('/api/v1/ingestion/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok && res.status !== 409) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to ingest task');
    }
    return res.json();
  },

  getTasks: async () => {
    try {
      const res = await fetch('/api/v1/ingestion/tasks');
      if (!res.ok) {
        if (res.status === 502 || res.status === 504) throw new Error('Cannot connect to backend server. Please ensure start_server.bat is running.');
        throw new Error(`[HTTP ${res.status}] Failed to load tasks`);
      }
      return await res.json();
    } catch (e: any) {
      if (e.message.includes('fetch')) throw new Error('Network error: Is the backend server running?');
      throw e;
    }
  }
};
