import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { plannerApi } from '@/api/planner';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, CheckCircle } from 'lucide-react';

export default function PlannerPage() {
  const { data: eligibility, isLoading: eligibilityLoading } = useQuery({
    queryKey: ['planner-eligibility'],
    queryFn: plannerApi.getEligibility,
  });

  const [formData, setFormData] = useState({
    horizon: 'WEEKLY',
    horizon_start: '',
    horizon_end: '',
    coa_windows: ''
  });

  const mutation = useMutation({
    mutationFn: plannerApi.plan
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedCoa = [];
    try {
      parsedCoa = JSON.parse(formData.coa_windows);
      if (!Array.isArray(parsedCoa)) throw new Error();
    } catch {
      alert("Invalid JSON Array for COA Windows");
      return;
    }

    mutation.mutate({
      horizon: formData.horizon,
      horizon_start: formData.horizon_start,
      horizon_end: formData.horizon_end,
      coa_windows: parsedCoa
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Block Planner</h1>
          <p className="text-sm text-slate-500 mt-1">Weekly and monthly coordinated block optimizer.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-100 shrink-0">
            <h2 className="font-bold text-slate-900 text-sm">Eligibility Pool</h2>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-slate-50">
            {eligibilityLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : eligibility?.length === 0 ? (
              <div className="text-sm text-slate-500 text-center mt-10">No eligible tasks.</div>
            ) : (
              <div id="candidate-body" className="space-y-3">
                {eligibility?.map((t: any) => (
                  <div key={t.task_id} className="bg-white border border-slate-200 p-3 rounded shadow-sm text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-xs">{t.task_id}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${t.eligibility === 'ELIGIBLE' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {t.eligibility}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-1">{t.department} - {t.section}</div>
                    {t.priority_score && <div className="text-xs font-semibold text-indigo-700">Priority: {t.priority_score}</div>}
                    {t.missing_requirements?.length > 0 && (
                      <div className="text-[10px] text-red-600 mt-1 bg-red-50 p-1 rounded">
                        Missing: {t.missing_requirements.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Run Optimization</h2>
            <form id="plan-form" onSubmit={handleSubmit} className="space-y-4">
              {mutation.isError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {mutation.error.message}
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Horizon</label>
                  <select 
                    className="w-full border-slate-300 rounded text-sm p-2 border"
                    value={formData.horizon}
                    onChange={e => setFormData(p => ({ ...p, horizon: e.target.value }))}
                  >
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Start Time</label>
                  <input required type="datetime-local" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.horizon_start} onChange={e => setFormData(p => ({ ...p, horizon_start: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">End Time</label>
                  <input required type="datetime-local" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.horizon_end} onChange={e => setFormData(p => ({ ...p, horizon_end: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex flex-col">
                  COA Windows (JSON Array)
                  <span className="text-xs text-slate-500 font-normal mt-1">Example: [{`{"corridor_id":"C1","section_id":"S1","start_time":"...","end_time":"..."...}`}]</span>
                </label>
                <textarea 
                  required 
                  className="w-full border-slate-300 rounded text-sm p-2 border font-mono min-h-[120px]" 
                  placeholder="[]"
                  value={formData.coa_windows} 
                  onChange={e => setFormData(p => ({ ...p, coa_windows: e.target.value }))} 
                />
              </div>

              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="px-6 py-2 bg-primary text-white rounded font-medium hover:bg-primary/90 disabled:opacity-50 text-sm"
              >
                {mutation.isPending ? 'Optimizing...' : 'Generate Plan'}
              </button>
            </form>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 min-h-[300px]">
            <div id="plan-caption" className="border-b border-slate-200 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Optimization Result</h2>
            </div>
            
            <div id="plan-result">
              {!mutation.isSuccess && !mutation.isError && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                  <Calendar className="w-8 h-8 mb-2 opacity-50" />
                  <p>Awaiting COA input</p>
                </div>
              )}

              {mutation.isSuccess && (
                <div className="space-y-6">
                  <div className="bg-white border rounded p-4 flex gap-6 shadow-sm">
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold">Status</div>
                      <div className="text-lg font-bold text-indigo-700 flex items-center gap-2"><CheckCircle className="w-5 h-5"/> {mutation.data.status}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold">Scheduled Tasks</div>
                      <div className="text-lg font-bold">{mutation.data.scheduled_task_count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold">Block Hours</div>
                      <div className="text-lg font-bold">{mutation.data.block_hours_used}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold">Priority Pts</div>
                      <div className="text-lg font-bold">{mutation.data.total_priority_points_scheduled}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                      <h3 className="font-bold text-sm">Proposed Blocks</h3>
                      <div id="block-list" className="space-y-3">
                        {mutation.data.scheduled_blocks?.map((b: any, i: number) => (
                          <div key={i} className="bg-white border border-slate-200 rounded p-4 shadow-sm text-sm">
                            <div className="flex justify-between border-b pb-2 mb-2">
                              <div>
                                <span className="font-bold font-mono">{b.section_id}</span>
                                <span className="text-xs text-slate-500 ml-2">[{b.corridor_id}]</span>
                              </div>
                              <div className="text-xs font-semibold">{b.window_start} - {b.window_end}</div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <div><span className="font-semibold">{b.assigned_tasks?.length || 0}</span> Tasks</div>
                              <div className="text-slate-500">{b.departments?.join(', ')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-sm text-red-800">Deferred Tasks ({mutation.data.unscheduled_task_count})</h3>
                      <div id="deferred-list" className="space-y-3">
                        {mutation.data.deferred_tasks?.map((d: any, i: number) => (
                          <div key={i} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                            <div className="font-mono font-bold text-xs">{d.task_id}</div>
                            <div className="text-xs text-red-700 mt-1">{d.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
