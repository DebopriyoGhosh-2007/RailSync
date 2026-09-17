import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { intakeApi } from '@/api/intake';
import { feasibilityApi } from '@/api/feasibility';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ShieldAlert, CheckCircle, HelpCircle, TriangleAlert } from 'lucide-react';

export default function FeasibilityPage() {
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['ingestion-tasks'],
    queryFn: intakeApi.getTasks,
  });

  const [formData, setFormData] = useState({
    task_id: '',
    section_latitude: '',
    section_longitude: '',
    proposed_time: '',
    rule_version: '',
    engineering_max_temperature_c: '',
    traction_max_wind_speed_kmh: '',
    traffic_block_min_visibility_m: '',
    caution_risk_multiplier: ''
  });

  const mutation = useMutation({
    mutationFn: feasibilityApi.assess
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task_id) return;
    
    const payload = {
      task_id: formData.task_id,
      section_latitude: Number(formData.section_latitude),
      section_longitude: Number(formData.section_longitude),
      proposed_time: formData.proposed_time,
      rules: {
        version: formData.rule_version,
        engineering_max_temperature_c: formData.engineering_max_temperature_c ? Number(formData.engineering_max_temperature_c) : undefined,
        traction_max_wind_speed_kmh: formData.traction_max_wind_speed_kmh ? Number(formData.traction_max_wind_speed_kmh) : undefined,
        traffic_block_min_visibility_m: formData.traffic_block_min_visibility_m ? Number(formData.traffic_block_min_visibility_m) : undefined,
        caution_risk_multiplier: formData.caution_risk_multiplier ? Number(formData.caution_risk_multiplier) : undefined,
      }
    };
    
    mutation.mutate(payload);
  };

  const completeTasks = tasks?.filter((t: any) => t.status === 'COMPLETE') || [];

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
                  onChange={e => setFormData(p => ({ ...p, task_id: e.target.value }))}
                >
                  <option value="">-- Select a complete task --</option>
                  {completeTasks.map((t: any) => (
                    <option key={t.task_id} value={t.task_id}>
                      {t.task_id} - {t.normalized_data?.section || t.department}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Section Latitude</label>
                <input required type="number" step="any" min="-90" max="90" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.section_latitude} onChange={e => setFormData(p => ({ ...p, section_latitude: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Section Longitude</label>
                <input required type="number" step="any" min="-180" max="180" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.section_longitude} onChange={e => setFormData(p => ({ ...p, section_longitude: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Proposed Block Time</label>
                <input required type="datetime-local" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.proposed_time} onChange={e => setFormData(p => ({ ...p, proposed_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Rule / Circular Version</label>
                <input required type="text" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.rule_version} onChange={e => setFormData(p => ({ ...p, rule_version: e.target.value }))} />
              </div>
            </div>

            <h3 className="text-sm font-bold border-b pb-2 pt-4">Operational Rule Thresholds (Optional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Eng Max Temp (°C)</label>
                <input type="number" step="any" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.engineering_max_temperature_c} onChange={e => setFormData(p => ({ ...p, engineering_max_temperature_c: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Trac Max Wind (km/h)</label>
                <input type="number" step="any" min="0" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.traction_max_wind_speed_kmh} onChange={e => setFormData(p => ({ ...p, traction_max_wind_speed_kmh: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Traf Min Visibility (m)</label>
                <input type="number" step="any" min="0" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.traffic_block_min_visibility_m} onChange={e => setFormData(p => ({ ...p, traffic_block_min_visibility_m: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Caution Risk Multiplier (1-2)</label>
                <input type="number" step="any" min="1" max="2" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.caution_risk_multiplier} onChange={e => setFormData(p => ({ ...p, caution_risk_multiplier: e.target.value }))} />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={mutation.isPending || completeTasks.length === 0}
                className="w-full py-2 bg-primary text-white rounded font-medium hover:bg-primary/90 disabled:opacity-50 text-sm"
              >
                {mutation.isPending ? 'Assessing...' : 'Run Assessment'}
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
                  {mutation.data.forecast_timestamp && <div>Forecast Time: {mutation.data.forecast_timestamp}</div>}
                  {mutation.data.rule_version && <div>Rule Version: {mutation.data.rule_version}</div>}
                  {mutation.data.temperature_c !== undefined && <div>Temperature: {mutation.data.temperature_c} °C</div>}
                  {mutation.data.wind_speed_kmh !== undefined && <div>Wind: {mutation.data.wind_speed_kmh} km/h</div>}
                  {mutation.data.visibility_m !== undefined && <div>Visibility: {mutation.data.visibility_m} m</div>}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
