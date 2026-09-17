import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { liveApi } from '@/api/live';
import { useAuth } from '@/auth/AuthContext';
import { Activity, Radio, AlertCircle, RefreshCw } from 'lucide-react';
import { getBlockStatusConfig } from '@/domain/block-state';

export default function LiveMonitorPage() {
  const { profile } = useAuth();
  
  const [formData, setFormData] = useState({
    block_id: '',
    corridor_id: '',
    actual_progress_pct: '',
    estimated_minutes_remaining: '',
    timestamp: ''
  });

  const [wsStatus, setWsStatus] = useState('Not connected');
  const [feed, setFeed] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const mutation = useMutation({
    mutationFn: liveApi.updateProgress,
    onSuccess: (data) => {
      // Opt: local echo of accepted block state
      setFeed(prev => [data, ...prev].slice(0, 50));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.block_id || !formData.corridor_id) return;
    
    // Connect WS if not connected to this corridor
    connectWs(formData.corridor_id);

    mutation.mutate({
      block_id: formData.block_id,
      corridor_id: formData.corridor_id,
      supervisor_id: profile?.fullName || 'Unknown',
      actual_progress_pct: Number(formData.actual_progress_pct),
      estimated_minutes_remaining: Number(formData.estimated_minutes_remaining),
      timestamp: formData.timestamp || new Date().toISOString()
    });
  };

  const connectWs = (corridorId: string) => {
    if (wsRef.current) {
      if (wsRef.current.url.includes(corridorId)) return; // Already connected
      wsRef.current.close();
    }

    setWsStatus('Connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws/live-blocks/${corridorId}`);
    
    ws.onopen = () => setWsStatus('Connected');
    ws.onclose = () => setWsStatus('Disconnected');
    ws.onerror = () => setWsStatus('Connection error');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setFeed(prev => [data, ...prev].slice(0, 50));
      } catch {
        setFeed(prev => [{ raw: event.data }, ...prev].slice(0, 50));
      }
    };
    
    wsRef.current = ws;
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Live Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">Submit field progress updates and receive advisory execution alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Submit Telemetry</h2>
          <form id="telemetry-form" onSubmit={handleSubmit} className="space-y-4">
            {mutation.isError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                <AlertCircle className="w-4 h-4 inline mr-2 -mt-0.5" />
                {mutation.error.message}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Block ID</label>
              <input required type="text" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.block_id} onChange={e => setFormData(p => ({ ...p, block_id: e.target.value }))} />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Corridor ID</label>
              <input required id="corridor-id-input" type="text" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.corridor_id} onChange={e => setFormData(p => ({ ...p, corridor_id: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Progress (%)</label>
              <input required type="number" min="0" max="100" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.actual_progress_pct} onChange={e => setFormData(p => ({ ...p, actual_progress_pct: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Est. Minutes Remaining</label>
              <input required type="number" min="0" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.estimated_minutes_remaining} onChange={e => setFormData(p => ({ ...p, estimated_minutes_remaining: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Timestamp (Optional)</label>
              <input type="datetime-local" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.timestamp} onChange={e => setFormData(p => ({ ...p, timestamp: e.target.value }))} />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="w-full py-2 bg-primary text-white rounded font-medium hover:bg-primary/90 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {mutation.isPending ? <><RefreshCw className="w-4 h-4 animate-spin"/> Submitting...</> : 'Send Update'}
              </button>
            </div>
          </form>
        </div>

        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg shadow-sm flex flex-col h-[700px] text-slate-300">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
            <div>
              <h2 id="ws-heading" className="font-bold text-white flex items-center gap-2">
                <Radio className={`w-5 h-5 ${wsStatus === 'Connected' ? 'text-green-500' : 'text-slate-500'}`} />
                Live Telemetry Feed
              </h2>
              <p id="ws-caption" className="text-xs text-slate-500 mt-1">Displaying alerts and state updates.</p>
            </div>
            <div id="ws-status" className={`text-xs font-mono font-bold px-2 py-1 rounded ${
              wsStatus === 'Connected' ? 'bg-green-500/20 text-green-400' : 
              wsStatus === 'Connecting' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {wsStatus}
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4 bg-[#0B1121]" aria-live="polite">
            {feed.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <Activity className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Submit telemetry to connect to a corridor feed.</p>
              </div>
            ) : (
              <div id="alerts-feed" className="space-y-4">
                {feed.map((item, index) => {
                  if (item.raw) {
                    return (
                      <div key={index} className="p-3 bg-slate-800 border border-slate-700 rounded font-mono text-xs opacity-70">
                        {item.raw}
                      </div>
                    );
                  }
                  
                  const statusConfig = getBlockStatusConfig(item.state || item.status);
                  
                  return (
                    <div key={index} className={`p-4 rounded border text-sm shadow-sm ${item.alert ? 'bg-amber-950/40 border-amber-800/50' : 'bg-slate-800/50 border-slate-700'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-mono text-xs text-white font-bold">{item.block_id}</div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-slate-500">{new Date(item.telemetry_timestamp || item.timestamp).toLocaleTimeString()}</span>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                      
                      {item.completion_percentage !== undefined && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{item.completion_percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${item.completion_percentage}%` }}></div>
                          </div>
                        </div>
                      )}

                      {item.alert && (
                        <div className="mt-3 p-3 bg-red-950/50 border border-red-900/50 rounded text-xs text-red-200">
                          <div className="font-bold text-red-400 mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Overrun Warning</div>
                          <p>{item.alert.message}</p>
                          {item.alert.revised_handover_time && <div className="mt-1">Revised Handover: {item.alert.revised_handover_time}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
