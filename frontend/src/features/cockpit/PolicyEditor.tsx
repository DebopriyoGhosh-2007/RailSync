import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { priorityApi } from '@/api/priority';
import { coaPolicyApi } from '@/api/coa-policy';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';

const defaultPolicy = {
  policy_version: '2026.Q3.POL',
  severity_scores: { CRITICAL: 100, HIGH: 75, MEDIUM: 50, LOW: 25 },
  max_days_overdue: 90,
  max_passenger_trains_per_day: 100,
  max_goods_trains_per_day: 50,
  max_section_traffic_gmt: 200,
  active_restriction_score: 30,
  max_weather_risk_multiplier: 2,
  severity_weight: 0.3,
  overdue_weight: 0.1,
  passenger_weight: 0.15,
  goods_weight: 0.1,
  traffic_weight: 0.1,
  restriction_weight: 0.1,
  route_criticality_weight: 0.1,
  weather_weight: 0.05,
  critical_threshold: 80,
  high_threshold: 60,
  medium_threshold: 40,
  passenger_00_06: 5,
  passenger_06_12: 22,
  passenger_12_18: 15,
  passenger_18_24: 5,
  goods_00_06: 8,
  goods_06_12: 2,
  goods_12_18: 2,
  goods_18_24: 3,
};

const slotGroups = [
  { label: 'Passenger', prefix: 'passenger' },
  { label: 'Goods', prefix: 'goods' },
];
const slots = ['00_06', '06_12', '12_18', '18_24'];

export function PolicyEditor() {
  const policies = useQuery({ queryKey: ['priority-policies'], queryFn: priorityApi.getPolicies });
  const feasibilityPolicy = useQuery({ queryKey: ['coa-policy'], queryFn: coaPolicyApi.get });
  const [policy, setPolicy] = useState<any>(defaultPolicy);
  const [weatherPolicy, setWeatherPolicy] = useState({ eng_max_temp: 45, trac_max_wind: 60, traf_min_visibility: 1000, caution_risk_multiplier: 1.25, route_criticality: null as number | null, tsr_penalty: null as number | null });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const latest = policies.data?.[0]?.policy;
    if (latest) setPolicy({ ...defaultPolicy, ...latest });
  }, [policies.data]);

  useEffect(() => {
    if (feasibilityPolicy.data) setWeatherPolicy(feasibilityPolicy.data);
  }, [feasibilityPolicy.data]);

  const mutation = useMutation({
    mutationFn: () => priorityApi.registerPolicy({
      policy_id: `coa-${Date.now()}`,
      policy,
      approval_reference: 'COA-Cockpit-Admin',
      approved_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      setMessage('Policy updated successfully. New priority evaluations will use these slots.');
      policies.refetch();
    },
    onError: error => setMessage(error.message),
  });
  const weatherMutation = useMutation({
    mutationFn: () => coaPolicyApi.update(weatherPolicy),
    onSuccess: () => setMessage('Feasibility thresholds updated for automated F-02 assessments.'),
    onError: error => setMessage(error.message),
  });

  return (
    <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Global ML Policy Tuning</h2>
          <p className="text-sm text-slate-500 mt-1">COA-administered traffic parameters used by explainable Priority scoring.</p>
        </div>
        <span className="text-xs font-mono text-slate-500">{policy.policy_version}</span>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded border text-sm flex items-center gap-2 ${mutation.isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'}`}>
          {mutation.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
        {slotGroups.map(group => (
          <div key={group.prefix}>
            <h3 className="font-semibold text-sm text-slate-700 mb-3 uppercase tracking-wider">{group.label} Traffic</h3>
            <div className="grid grid-cols-2 gap-4">
              {slots.map(slot => {
                const key = `${group.prefix}_${slot}`;
                return (
                  <label key={key} className="block text-xs font-medium text-slate-500">
                    {slot.replace('_', ':00 - ')}:00
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={policy[key]}
                      onChange={event => setPolicy((current: any) => ({ ...current, [key]: Number(event.target.value) }))}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
        <label className="text-xs font-medium text-slate-500">Policy Version<input value={policy.policy_version} onChange={event => setPolicy((current: any) => ({ ...current, policy_version: event.target.value }))} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md" /></label>
        <label className="text-xs font-medium text-slate-500">Max Overdue Days<input type="number" min="1" value={policy.max_days_overdue} onChange={event => setPolicy((current: any) => ({ ...current, max_days_overdue: Number(event.target.value) }))} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md" /></label>
        <label className="text-xs font-medium text-slate-500">Passenger Daily Cap<input type="number" min="1" value={policy.max_passenger_trains_per_day} onChange={event => setPolicy((current: any) => ({ ...current, max_passenger_trains_per_day: Number(event.target.value) }))} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md" /></label>
        <label className="text-xs font-medium text-slate-500">Goods Daily Cap<input type="number" min="1" value={policy.max_goods_trains_per_day} onChange={event => setPolicy((current: any) => ({ ...current, max_goods_trains_per_day: Number(event.target.value) }))} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md" /></label>
      </div>

      <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary/90 disabled:opacity-50">
        <Save className="w-4 h-4" />
        {mutation.isPending ? 'Updating...' : 'Update Policy'}
      </button>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Automated F-02 Safety Thresholds</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            ['eng_max_temp', 'Engineering max temp (C)'],
            ['trac_max_wind', 'Traction max wind (km/h)'],
            ['traf_min_visibility', 'Minimum visibility (m)'],
            ['caution_risk_multiplier', 'Caution risk multiplier'],
            ['route_criticality', 'Route criticality (0-100)'],
            ['tsr_penalty', 'TSR penalty (0-100)'],
          ] as const).map(([key, label]) => (
            <label key={key} className="text-xs font-medium text-slate-500">
              {label}
              <input type="number" min={key === 'caution_risk_multiplier' ? 1 : 0} step="0.01" value={weatherPolicy[key] ?? ''} onChange={event => setWeatherPolicy(current => ({ ...current, [key]: event.target.value === '' ? null : Number(event.target.value) }))} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md" />
            </label>
          ))}
        </div>
        <button type="button" onClick={() => weatherMutation.mutate()} disabled={weatherMutation.isPending} className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded font-medium hover:bg-slate-50 disabled:opacity-50">
          <Save className="w-4 h-4" />
          {weatherMutation.isPending ? 'Updating...' : 'Update F-02 thresholds'}
        </button>
      </div>
    </section>
  );
}
