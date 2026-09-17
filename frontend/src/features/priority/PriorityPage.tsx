import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { intakeApi } from '@/api/intake';
import { priorityApi } from '@/api/priority';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calculator } from 'lucide-react';

export default function PriorityPage() {
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['ingestion-tasks'],
    queryFn: intakeApi.getTasks,
  });

  const [context, setContext] = useState({
    task_id: '',
    passenger: '',
    goods: '',
    traffic: '',
    criticality: '',
    restriction: false
  });

  const [policy, setPolicy] = useState({
    version: '2026.Q3.POL',
    sevCritical: '100',
    sevHigh: '75',
    sevMedium: '50',
    sevLow: '25',
    maxOverdue: '90',
    maxPassenger: '100',
    maxGoods: '50',
    maxTraffic: '200',
    restrictionScore: '30',
    maxWeather: '2',
    wSeverity: '0.3',
    wOverdue: '0.1',
    wPassenger: '0.15',
    wGoods: '0.1',
    wTraffic: '0.1',
    wRestriction: '0.1',
    wRoute: '0.1',
    wWeather: '0.05',
    criticalThreshold: '80',
    highThreshold: '60',
    mediumThreshold: '40'
  });

  const mutation = useMutation({
    mutationFn: priorityApi.evaluate
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!context.task_id) return;

    mutation.mutate({
      context: {
        task_id: context.task_id,
        passenger_trains_per_day: Number(context.passenger),
        goods_forecast_per_day: Number(context.goods),
        section_traffic_gmt: Number(context.traffic),
        route_criticality_score: Number(context.criticality),
        active_operational_restriction: context.restriction
      },
      policy: {
        version: policy.version,
        severity_scores: {
          CRITICAL: Number(policy.sevCritical),
          HIGH: Number(policy.sevHigh),
          MEDIUM: Number(policy.sevMedium),
          LOW: Number(policy.sevLow)
        },
        max_overdue_days: Number(policy.maxOverdue),
        max_passenger_trains: Number(policy.maxPassenger),
        max_goods_trains: Number(policy.maxGoods),
        max_section_traffic: Number(policy.maxTraffic),
        active_restriction_score: Number(policy.restrictionScore),
        max_weather_risk: Number(policy.maxWeather),
        factor_weights: {
          severity: Number(policy.wSeverity),
          overdue_age: Number(policy.wOverdue),
          passenger_demand: Number(policy.wPassenger),
          goods_demand: Number(policy.wGoods),
          traffic: Number(policy.wTraffic),
          restriction: Number(policy.wRestriction),
          route_criticality: Number(policy.wRoute),
          weather: Number(policy.wWeather)
        },
        critical_threshold: Number(policy.criticalThreshold),
        high_threshold: Number(policy.highThreshold),
        medium_threshold: Number(policy.mediumThreshold)
      }
    });
  };

  const completeTasks = tasks?.filter((t: any) => t.status === 'COMPLETE') || [];

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
                        <option key={t.task_id} value={t.task_id}>{t.task_id} - {t.department}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Passenger Trains/Day</label>
                  <input required type="number" min="0" className="w-full border-slate-300 rounded text-sm p-2 border" value={context.passenger} onChange={e => setContext(p => ({ ...p, passenger: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Goods Forecast/Day</label>
                  <input required type="number" min="0" className="w-full border-slate-300 rounded text-sm p-2 border" value={context.goods} onChange={e => setContext(p => ({ ...p, goods: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Section Traffic GMT</label>
                  <input required type="number" min="0" className="w-full border-slate-300 rounded text-sm p-2 border" value={context.traffic} onChange={e => setContext(p => ({ ...p, traffic: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Route Criticality (0-100)</label>
                  <input required type="number" min="0" max="100" className="w-full border-slate-300 rounded text-sm p-2 border" value={context.criticality} onChange={e => setContext(p => ({ ...p, criticality: e.target.value }))} />
                </div>
                <div className="col-span-2 space-y-1.5 mt-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={context.restriction} onChange={e => setContext(p => ({ ...p, restriction: e.target.checked }))} />
                    Active Operational Restriction
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold border-b pb-2 mb-4">Policy Configuration</h3>
              <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 border border-slate-200 rounded">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Policy Version</label>
                  <input required type="text" className="w-full border-slate-300 rounded text-xs p-1.5 border" value={policy.version} onChange={e => setPolicy(p => ({ ...p, version: e.target.value }))} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Weight: Severity / Overdue / Passenger / Goods</label>
                  <div className="flex gap-1">
                    <input type="number" step="0.01" className="w-1/4 border-slate-300 rounded text-xs p-1.5 border" value={policy.wSeverity} onChange={e => setPolicy(p => ({ ...p, wSeverity: e.target.value }))} />
                    <input type="number" step="0.01" className="w-1/4 border-slate-300 rounded text-xs p-1.5 border" value={policy.wOverdue} onChange={e => setPolicy(p => ({ ...p, wOverdue: e.target.value }))} />
                    <input type="number" step="0.01" className="w-1/4 border-slate-300 rounded text-xs p-1.5 border" value={policy.wPassenger} onChange={e => setPolicy(p => ({ ...p, wPassenger: e.target.value }))} />
                    <input type="number" step="0.01" className="w-1/4 border-slate-300 rounded text-xs p-1.5 border" value={policy.wGoods} onChange={e => setPolicy(p => ({ ...p, wGoods: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5 col-span-4 text-xs text-slate-500 italic mt-1">
                  Additional configuration exists. Only exposed partial policy UI for space.
                </div>
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
                  {Object.entries(mutation.data.factor_breakdown).map(([factor, data]: [string, any]) => (
                    <div key={factor} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 capitalize">{factor.replace('_', ' ')}</span>
                      <div className="flex items-center gap-4 text-slate-500">
                        <span className="w-20 text-right">Raw: {data.input_score.toFixed(1)}</span>
                        <span className="w-16 text-right">W: {data.weight}</span>
                        <span className="w-16 text-right font-bold text-white">+{data.contribution.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
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
