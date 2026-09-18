import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { intakeApi } from '@/api/intake';
import { priorityApi } from '@/api/priority';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calculator } from 'lucide-react';

export default function PriorityPage() {
  const location = useLocation();
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['ingestion-tasks'],
    queryFn: intakeApi.getTasks,
  });

  const [context, setContext] = useState({
    task_id: ''
  });

  const mutation = useMutation({
    mutationFn: priorityApi.evaluate
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!context.task_id) return;

    mutation.mutate({ context: { task_id: context.task_id } });
  };

  const completeTasks = tasks?.filter((t: any) => t.data_quality_status === 'COMPLETE' && t.normalized_task) || [];
  const trafficContext = useQuery({
    queryKey: ['priority-task-context', context.task_id],
    queryFn: () => priorityApi.getTaskContext(context.task_id),
    enabled: Boolean(context.task_id),
  });
  const selectedTime = trafficContext.data?.proposed_block_datetime;
  const slot = trafficContext.data?.slot_key;
  const slotPassenger = trafficContext.data?.active_passenger_count;
  const slotGoods = trafficContext.data?.active_goods_count;

  useEffect(() => {
    const taskId = (location.state as { taskId?: string } | null)?.taskId;
    if (taskId && completeTasks.some((task: any) => task.normalized_task.id === taskId)) setContext({ task_id: taskId });
  }, [location.state, tasks]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Explainable Priority</h1>
          <p className="text-sm text-slate-500 mt-1">Cross-department priority weighting based on policy thresholds.</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <form id="priority-form" onSubmit={handleSubmit} className="space-y-6">
            {mutation.isError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {mutation.error.message}
              </div>
            )}

            <section>
              <h3 className="text-sm font-bold border-b pb-2 mb-4">Operational Context</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Eligible Task</label>
                  {tasksLoading ? <Skeleton className="h-10 w-full" /> : (
                    <select id="priority-task" required className="w-full border-slate-300 rounded text-sm p-2 border" value={context.task_id} onChange={e => setContext(p => ({ ...p, task_id: e.target.value }))}>
                      <option value="">-- Select a complete task --</option>
                      {completeTasks.map((t: any) => (
                        <option key={t.normalized_task.id} value={t.normalized_task.id}>{t.normalized_task.id} - {t.normalized_task.department}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="col-span-2 rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Traffic and weather inputs are drawn automatically from F-01/F-02. Approved F-07/F-08 cockpit policy supplies the weights and thresholds; only the explainable result is shown here.
                </div>
                <div className="col-span-2 grid grid-cols-3 gap-3 rounded border border-indigo-100 bg-indigo-50 p-4 text-sm">
                  <div>
                    <span className="block text-xs font-semibold uppercase text-indigo-700">Active Traffic Slot</span>
                    <span id="slot-timeframe">{trafficContext.data?.slot_timeframe ?? (trafficContext.isFetching ? 'Loading…' : 'Select a task')}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase text-indigo-700">Active Passenger Count</span>
                    <span id="active-passenger-count">{trafficContext.data?.active_passenger_count ?? '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase text-indigo-700">Active Goods Count</span>
                    <span id="active-goods-count">{trafficContext.data?.active_goods_count ?? '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase text-indigo-700">Weather Risk (F-02)</span>
                    <span id="dyn-weather">{trafficContext.data?.weather_risk ?? '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase text-indigo-700">Route Criticality</span>
                    <span id="dyn-criticality">{trafficContext.data?.route_criticality ?? '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase text-indigo-700">TSR Penalty</span>
                    <span id="dyn-tsr">{trafficContext.data?.tsr_penalty ?? '--'}</span>
                  </div>
                </div>
                {selectedTime && slot && (
                  <div className="col-span-2 grid grid-cols-3 gap-3 rounded border border-indigo-100 bg-indigo-50 p-4 text-sm">
                    <div><span className="block text-xs font-semibold uppercase text-indigo-700">Proposed time (UTC)</span>{selectedTime.replace('T', ' ').slice(0, 16)}</div>
                    <div><span className="block text-xs font-semibold uppercase text-indigo-700">Passenger setting · {slot}</span>{slotPassenger ?? 'No approved policy'}</div>
                    <div><span className="block text-xs font-semibold uppercase text-indigo-700">Goods setting · {slot}</span>{slotGoods ?? 'No approved policy'}</div>
                  </div>
                )}
              </div>
            </section>

            <button 
              type="submit" 
              disabled={mutation.isPending || completeTasks.length === 0}
              className="w-full py-2 bg-primary text-white rounded font-medium hover:bg-primary/90 disabled:opacity-50 text-sm"
            >
              {mutation.isPending ? 'Calculating...' : 'Evaluate Priority'}
            </button>
          </form>
        </div>

        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col text-white">
          <div className="result-heading border-b border-slate-700 pb-4 mb-4">
            <h2 className="text-lg font-bold">Priority Result</h2>
            <p id="priority-caption" className="text-xs text-slate-400 mt-1">Explainable multi-factor scoring output.</p>
          </div>
          
          <div id="priority-result" className="flex-1">
            {!mutation.isSuccess && !mutation.isError && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Calculator className="w-8 h-8 mb-2 opacity-30" />
                <p>Awaiting operational context</p>
              </div>
            )}

            {mutation.isSuccess && (
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest">Calculated Score</div>
                    <div className="text-5xl font-bold text-amber-400 mt-1">{mutation.data.score.toFixed(1)}<span className="text-lg text-slate-500">/100</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-widest">Tier</div>
                    <div className={`text-xl font-bold ${
                      mutation.data.tier === 'CRITICAL' ? 'text-red-400' :
                      mutation.data.tier === 'HIGH' ? 'text-orange-400' :
                      mutation.data.tier === 'MEDIUM' ? 'text-amber-400' : 'text-green-400'
                    }`}>{mutation.data.tier}</div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded p-4 text-sm font-mono space-y-3 border border-slate-700">
                  <div className="text-xs text-slate-400 uppercase font-sans font-bold border-b border-slate-700 pb-2 mb-2">Contribution Breakdown</div>
                  {mutation.data.top_contributing_factors.map((data: any) => (
                    <div key={data.factor} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">{data.factor}</span>
                      <div className="flex items-center gap-4 text-slate-500">
                        <span className="w-20 text-right">Raw: {data.input_score.toFixed(1)}</span>
                        <span className="w-16 text-right">W: {data.weight}</span>
                        <span className="w-16 text-right font-bold text-white">+{data.score_contribution.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-400">
                  <span>Data: {mutation.data.operational_data_source === 'INGESTED_RECORDS' ? 'Ingested records' : 'Policy fallback'}</span>
                  <span>Passenger: {mutation.data.passenger_traffic}</span>
                  <span>Goods: {mutation.data.goods_traffic}</span>
                </div>

                <div className="text-xs text-slate-500 font-mono text-center">
                  Policy Version: {mutation.data.policy_version}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

