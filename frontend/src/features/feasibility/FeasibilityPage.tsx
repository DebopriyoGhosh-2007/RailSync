import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { intakeApi } from '@/api/intake';
import { feasibilityApi } from '@/api/feasibility';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ShieldAlert, CheckCircle, HelpCircle, TriangleAlert } from 'lucide-react';

export default function FeasibilityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['ingestion-tasks'],
    queryFn: intakeApi.getTasks,
  });

  const [formData, setFormData] = useState({
    task_id: '',
    proposed_time: ''
  });

  const mutation = useMutation({
    mutationFn: feasibilityApi.assess
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task_id) return;
    
    const payload = {
      task_id: formData.task_id,
      proposed_time: formData.proposed_time
    };
    
    mutation.mutate(payload);
  };

  const completeTasks = tasks?.filter((t: any) => t.data_quality_status === 'COMPLETE' && t.normalized_task) || [];

  useEffect(() => {
    const taskId = (location.state as { taskId?: string } | null)?.taskId;
    if (!taskId || !completeTasks.length) return;
    const selected = completeTasks.find((task: any) => task.normalized_task.id === taskId)?.normalized_task;
    if (selected) setFormData({ task_id: selected.id, proposed_time: selected.proposed_block_datetime || selected.due_date || '' });
  }, [location.state, tasks]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Feasibility Assessment</h1>
          <p className="text-sm text-slate-500 mt-1">Evaluate tasks against live weather forecasts and operational limits.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <form id="assessment-form" onSubmit={handleSubmit} className="space-y-4">
            {mutation.isError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {mutation.error.message}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Select Normalized Task</label>
              {tasksLoading ? <Skeleton className="h-10 w-full" /> : (
                <select 
                  id="task-select"
                  required
                  className="w-full border-slate-300 rounded text-sm p-2 border"
                  value={formData.task_id}
                  onChange={e => {
                    const selected = completeTasks.find((task: any) => task.normalized_task.id === e.target.value)?.normalized_task;
                    setFormData({
                      task_id: e.target.value,
                      proposed_time: selected?.proposed_block_datetime || selected?.due_date || ''
                    });
                  }}
                >
                  <option value="">-- Select a complete task --</option>
                  {completeTasks.map((t: any) => (
                    <option key={t.normalized_task.id} value={t.normalized_task.id}>
                      {t.normalized_task.id} - {t.normalized_task.section_id || t.normalized_task.department}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Proposed Block Time</label>
              <input required type="datetime-local" readOnly className="w-full border-slate-300 rounded text-sm p-2 border bg-slate-50" value={formData.proposed_time ? formData.proposed_time.slice(0, 16) : ''} />
              <p className="text-xs text-slate-500">Automatically loaded from the selected F-01 task.</p>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={mutation.isPending || completeTasks.length === 0}
                className="w-full py-2 bg-primary text-white rounded font-medium hover:bg-primary/90 disabled:opacity-50 text-sm"
              >
                {mutation.isPending ? 'Assessing...' : 'Assess candidate window'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col">
          <div className="result-heading border-b border-slate-200 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Assessment Result</h2>
            <p id="f02-caption" className="text-xs text-slate-500 mt-1">Live advisory status based on selected thresholds.</p>
          </div>
          
          <div id="f02-result" className="flex-1">
            {!mutation.isSuccess && !mutation.isError && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                <p>Awaiting assessment input</p>
              </div>
            )}

            {mutation.isSuccess && (
              <div className="space-y-6">
                {mutation.data.status === 'SUITABLE' && (
                  <div className="bg-green-100 text-green-900 p-4 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" />
                    <div>
                      <div className="font-bold">SUITABLE</div>
                      <div className="text-xs opacity-90">Conditions meet all provided criteria.</div>
                    </div>
                  </div>
                )}
                {mutation.data.status === 'CAUTION_REQUIRED' && (
                  <div className="bg-amber-100 text-amber-900 p-4 rounded-lg flex items-center gap-3">
                    <TriangleAlert className="w-6 h-6" />
                    <div>
                      <div className="font-bold">CAUTION REQUIRED</div>
                      <div className="text-xs opacity-90">Some thresholds require operational attention.</div>
                    </div>
                  </div>
                )}
                {mutation.data.status === 'NOT_SUITABLE' && (
                  <div className="bg-red-100 text-red-900 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-6 h-6" />
                    <div>
                      <div className="font-bold">NOT SUITABLE</div>
                      <div className="text-xs opacity-90">Conditions violate maximum safety limits.</div>
                    </div>
                  </div>
                )}
                {mutation.data.status === 'NEEDS_REVIEW' && (
                  <div className="bg-slate-200 text-slate-800 p-4 rounded-lg flex items-center gap-3">
                    <HelpCircle className="w-6 h-6" />
                    <div>
                      <div className="font-bold">NEEDS REVIEW</div>
                      <div className="text-xs opacity-90">Missing forecast data or rule applicability.</div>
                    </div>
                  </div>
                )}

                <div className="bg-white border rounded p-4 text-sm font-mono space-y-2">
                  <div className="text-xs text-slate-500 uppercase font-sans font-bold border-b pb-2 mb-2">Conditions</div>
                  {mutation.data.forecast?.forecast_timestamp && <div>Forecast Time: {mutation.data.forecast.forecast_timestamp}</div>}
                  {mutation.data.rule_version && <div>Rule Source: {mutation.data.rule_version}</div>}
                  {mutation.data.forecast?.temperature_c !== undefined && <div>Temperature: {mutation.data.forecast.temperature_c} °C</div>}
                  {mutation.data.forecast?.wind_speed_kmh !== undefined && <div>Wind: {mutation.data.forecast.wind_speed_kmh} km/h</div>}
                  {mutation.data.forecast?.visibility_m !== undefined && <div>Visibility: {mutation.data.forecast.visibility_m} m</div>}
                  {mutation.data.risk_multiplier !== undefined && <div>Risk Multiplier: {mutation.data.risk_multiplier}</div>}
                  
                  {mutation.data.warning_reasons?.length > 0 && (
                    <div className="mt-4 pt-4 border-t text-red-700">
                      <div className="font-bold text-xs font-sans uppercase mb-1">Warnings</div>
                      <ul className="list-disc pl-5 text-xs">
                        {mutation.data.warning_reasons.map((w: string, i: number) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                {(mutation.data.status === 'SUITABLE' || mutation.data.status === 'CAUTION_REQUIRED') && (
                  <button onClick={() => navigate('/priority', { state: { taskId: mutation.data.task_id } })} className="w-full py-2 bg-primary text-white rounded font-medium hover:bg-primary/90 text-sm">
                    Continue to priority
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
