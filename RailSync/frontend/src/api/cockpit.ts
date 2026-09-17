// src/api/cockpit.ts

export const cockpitApi = {
  getSummary: async () => {
    const res = await fetch('/api/v1/cockpit/summary');
    if (!res.ok) throw new Error('Failed to load cockpit summary');
    return res.json();
  },
  
  getIdentity: async () => {
    const res = await fetch('/api/v1/cockpit/identity');
    if (!res.ok) throw new Error('Failed to load cockpit identity');
    return res.json();
  },

  blockAction: async (blockId: string, payload: any) => {
    const res = await fetch(`/api/v1/blocks/${blockId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit block action');
    return res.json();
  },

  getAuditLogs: async (limit = 50) => {
    const res = await fetch(`/api/v1/audit/logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  },

  getBlockAuditLogs: async (blockId: string) => {
    const res = await fetch(`/api/v1/blocks/${blockId}/audit-logs`);
    if (!res.ok) throw new Error('Failed to load block audit logs');
    return res.json();
  }
};
