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

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Default to selecting all eligible tickets when eligibility data loads
  React.useEffect(() => {
    if (eligibility) {
      const eligibleIds = eligibility
        .filter((t: any) => t.eligibility === 'ELIGIBLE' || t.eligible)
        .map((t: any) => t.task_id);
      setSelectedTaskIds(eligibleIds);
    }
  }, [eligibility]);

  const [formData, setFormData] = useState({
    horizon: 'WEEKLY',
    horizon_start: '',
    horizon_end: '',
    coa_windows: ''
  });

  const mutation = useMutation({
    mutationFn: plannerApi.plan
  });

  const eligibleTasks = eligibility?.filter((t: any) => t.eligibility === 'ELIGIBLE' || t.eligible) || [];
  const allEligibleSelected = eligibleTasks.length > 0 && eligibleTasks.every((t: any) => selectedTaskIds.includes(t.task_id));

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleToggleAll = () => {
    if (allEligibleSelected) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(eligibleTasks.map((t: any) => t.task_id));
    }
  };

  const handleLoadSample = () => {
    setFormData({
      horizon: 'WEEKLY',
      horizon_start: '2026-09-06T00:00',
      horizon_end: '2026-09-13T00:00',
      coa_windows: JSON.stringify([
        {
          corridor_id: "COA-HWH-BDC-2026-09-07-02",
          section_id: "HWH-BDC-UP-MAIN",
          start_time: "2026-09-07T02:00:00Z",
          end_time: "2026-09-07T04:00:00Z",
          max_simultaneous_crews: 4,
          traffic_block_available: true,
          traction_disconnection_available: false,
          timetable_reference: "TT-HWH-BDC-2026-09-07-02",
          goods_forecast_reference: "GF-HWH-BDC-2026-09-07-02",
          passenger_trains_affected: 0,
          goods_trains_affected: 0
        },
        {
          corridor_id: "COA-HWH-BWN-2026-09-12-07",
          section_id: "HWH-BWN-SEC-04",
          start_time: "2026-09-12T07:30:00Z",
          end_time: "2026-09-12T10:00:00Z",
          max_simultaneous_crews: 4,
          traffic_block_available: true,
          traction_disconnection_available: true,
          timetable_reference: "TT-HWH-BWN-2026-09-12-07",
          goods_forecast_reference: "GF-HWH-BWN-2026-09-12-07",
          passenger_trains_affected: 1,
          goods_trains_affected: 0
        }
      ], null, 2)
    });
  };

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

    if (eligibleTasks.length > 0 && selectedTaskIds.length === 0) {
      alert("Please select at least one eligible ticket from the eligibility pool.");
      return;
    }

    mutation.mutate({
      horizon: formData.horizon,
      horizon_start: formData.horizon_start,
      horizon_end: formData.horizon_end,
      coa_windows: parsedCoa,
      selected_task_ids: selectedTaskIds
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
          <div className="p-4 border-b border-slate-100 shrink-0 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Eligibility Pool</h2>
              <span className="text-[11px] text-slate-500">
                {selectedTaskIds.length} of {eligibleTasks.length} selected
              </span>
            </div>
            {eligibleTasks.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {allEligibleSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
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
                {eligibility?.map((t: any) => {
                  const isEligible = t.eligibility === 'ELIGIBLE' || t.eligible;
                  const isSelected = selectedTaskIds.includes(t.task_id);
                  return (
                    <div
                      key={t.task_id}
                      onClick={() => isEligible && handleToggleTask(t.task_id)}
                      className={`border p-3 rounded shadow-sm text-sm transition-colors ${
                        isEligible
                          ? isSelected ? 'bg-indigo-50/50 border-indigo-300 cursor-pointer' : 'bg-white border-slate-200 cursor-pointer hover:bg-slate-50'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isEligible ? isSelected : false}
                            disabled={!isEligible}
                            onChange={() => isEligible && handleToggleTask(t.task_id)}
                            onClick={e => e.stopPropagation()}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                            title={isEligible ? `Include ${t.task_id}` : 'Ineligible: complete F-02 and F-03 first'}
                          />
                          <span className="font-mono font-bold text-xs">{t.task_id}</span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isEligible ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {isEligible ? 'ELIGIBLE' : 'NOT READY'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-1 ml-6">{t.department} - {t.section_id || t.section}</div>
                      {t.priority_score && <div className="text-xs font-semibold text-indigo-700 ml-6">Priority: {t.priority_score}</div>}
                      {t.missing_requirements?.length > 0 && (
                        <div className="text-[10px] text-red-600 mt-1 bg-red-50 p-1 rounded ml-6">
                          Missing: {t.missing_requirements.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">
                    COA Windows (JSON Array)
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded cursor-pointer transition-colors hover:bg-indigo-100"
                  >
                    Insert Sample Windows
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-normal">
                  Each window requires: <code>corridor_id</code>, <code>section_id</code>, <code>start_time</code>, <code>end_time</code>, <code>max_simultaneous_crews</code>, <code>traffic_block_available</code>, <code>traction_disconnection_available</code>, <code>timetable_reference</code>, <code>goods_forecast_reference</code>, <code>passenger_trains_affected</code>, <code>goods_trains_affected</code>.
                </p>
                <textarea 
                  required 
                  rows={8}
                  className="w-full border-slate-300 rounded text-xs p-2 border font-mono min-h-[140px]" 
                  placeholder="[{ ... }]"
                  value={formData.coa_windows} 
                  onChange={e => setFormData(p => ({ ...p, coa_windows: e.target.value }))} 
                />
              </div>

              <div className="flex items-center justify-between">
                <button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="px-6 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 disabled:opacity-50 text-sm cursor-pointer"
                >
                  {mutation.isPending ? 'Optimizing...' : 'Generate Plan'}
                </button>
                <span className="text-xs text-slate-500">
                  {formData.horizon === 'WEEKLY' ? 'Weekly horizon must be between 6 and 8 days.' : 'Monthly horizon must be between 28 and 31 days.'}
                </span>
              </div>
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
                      <div className="text-lg font-bold">{mutation.data.metrics?.scheduled_task_count ?? mutation.data.scheduled_task_count ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold">Block Hours</div>
                      <div className="text-lg font-bold">{mutation.data.metrics?.total_block_hours_used ?? mutation.data.block_hours_used ?? 0} h</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold">Priority Pts</div>
                      <div className="text-lg font-bold">{mutation.data.metrics?.total_priority_score_scheduled ?? mutation.data.total_priority_points_scheduled ?? 0}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                      <h3 className="font-bold text-sm">Proposed Blocks ({mutation.data.scheduled_blocks?.length || 0})</h3>
                      <div id="block-list" className="space-y-3">
                        {mutation.data.scheduled_blocks?.length === 0 ? (
                          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded p-4">No eligible task could be placed in the submitted COA windows.</div>
                        ) : (
                          mutation.data.scheduled_blocks?.map((b: any, i: number) => (
                            <div key={i} className="bg-white border border-slate-200 rounded p-4 shadow-sm text-sm space-y-2">
                              <div className="flex justify-between border-b pb-2">
                                <div>
                                  <span className="font-bold font-mono">{b.section_id}</span>
                                  <span className="text-xs text-slate-500 ml-2">[{b.corridor_id}]</span>
                                </div>
                                <div className="text-xs font-semibold text-slate-600">
                                  {new Date(b.window_start).toLocaleString()} – {new Date(b.window_end).toLocaleString()}
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <div><span className="font-semibold">{b.assigned_tasks?.length || 0}</span> Tasks assigned</div>
                                <div className="text-slate-500">{(b.consolidated_departments || b.departments)?.join(', ')}</div>
                              </div>
                              {b.assigned_tasks?.length > 0 && (
                                <div className="pt-2 border-t border-slate-100 space-y-1">
                                  {b.assigned_tasks.map((at: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-xs bg-slate-50 p-1.5 rounded">
                                      <span className="font-mono font-bold text-indigo-700">{at.task_id} ({at.department})</span>
                                      <span className="text-slate-600">Priority: {at.priority_score} | {new Date(at.scheduled_start).toLocaleTimeString()} – {new Date(at.scheduled_end).toLocaleTimeString()}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-sm text-red-800">
                        Deferred Tasks ({mutation.data.metrics?.unscheduled_task_count ?? (mutation.data.unscheduled_tasks || mutation.data.deferred_tasks)?.length ?? 0})
                      </h3>
                      <div id="deferred-list" className="space-y-3">
                        {(mutation.data.unscheduled_tasks || mutation.data.deferred_tasks)?.length === 0 ? (
                          <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded p-3">No tasks were deferred.</div>
                        ) : (
                          (mutation.data.unscheduled_tasks || mutation.data.deferred_tasks)?.map((d: any, i: number) => (
                            <div key={i} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                              <div className="font-mono font-bold text-xs">{d.task_id}</div>
                              <div className="text-xs text-red-700 mt-1">{d.reason}</div>
                            </div>
                          ))
                        )}
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
