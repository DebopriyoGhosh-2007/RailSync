import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { whatIfApi } from '@/api/what-if';
import { Activity, Clock, AlertTriangle } from 'lucide-react';

export default function WhatIfPage() {
  const [formData, setFormData] = useState({
    corridor_id: '',
    section_from: '',
    section_to: '',
    block_start_time: '',
    block_end_time: '',
    trains: ''
  });

  const mutation = useMutation({
    mutationFn: whatIfApi.simulate
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedTrains = [];
    if (formData.trains.trim()) {
      try {
        parsedTrains = JSON.parse(formData.trains);
        if (!Array.isArray(parsedTrains)) throw new Error();
      } catch {
        alert("Invalid JSON Array for Trains");
        return;
      }
    }

    mutation.mutate({
      corridor_id: formData.corridor_id,
      section_from: formData.section_from,
      section_to: formData.section_to,
      block_start_time: formData.block_start_time,
      block_end_time: formData.block_end_time,
      trains: parsedTrains.length > 0 ? parsedTrains : undefined
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">What-If Simulation</h1>
          <p className="text-sm text-slate-500 mt-1">Pre-sanction operational-impact simulation. Values are estimates, not movement authority.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <form id="whatif-form" onSubmit={handleSubmit} className="space-y-4">
            {mutation.isError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {mutation.error.message}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Corridor ID</label>
              <input required type="text" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.corridor_id} onChange={e => setFormData(p => ({ ...p, corridor_id: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Section From</label>
                <input required type="text" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.section_from} onChange={e => setFormData(p => ({ ...p, section_from: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Section To</label>
                <input required type="text" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.section_to} onChange={e => setFormData(p => ({ ...p, section_to: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Block Start Time</label>
                <input required type="datetime-local" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.block_start_time} onChange={e => setFormData(p => ({ ...p, block_start_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Block End Time</label>
                <input required type="datetime-local" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.block_end_time} onChange={e => setFormData(p => ({ ...p, block_end_time: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                Verified Train Schedules (Optional JSON Array)
              </label>
              <textarea 
                className="w-full border-slate-300 rounded text-sm p-2 border font-mono min-h-[100px]" 
                placeholder="[] (Leaves blank to derive from timetable occupancy)"
                value={formData.trains} 
                onChange={e => setFormData(p => ({ ...p, trains: e.target.value }))} 
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="w-full py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {mutation.isPending ? 'Simulating...' : 'Run Simulation'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col">
          <div id="sim-heading" className="border-b border-slate-200 pb-4 mb-4 flex justify-between items-end">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Simulation Result</h2>
              <p id="sim-caption" className="text-xs text-slate-500 mt-1">Network delay and regulation estimates.</p>
            </div>
            {mutation.isSuccess && (
              <div className={`px-3 py-1 rounded font-bold text-sm uppercase ${mutation.data.status === 'CLEAR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {mutation.data.status}
              </div>
            )}
          </div>
          
          <div id="sim-result" className="flex-1">
            {!mutation.isSuccess && !mutation.isError && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <p>Run a simulation to view impacts</p>
              </div>
            )}

            {mutation.isSuccess && (
              <div className="space-y-6">
                <div id="sim-detail" className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 border rounded shadow-sm">
                    <div className="text-xs text-slate-500 font-semibold mb-1">Passenger Delay</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      {mutation.data.total_passenger_delay_minutes} min
                    </div>
                  </div>
                  <div className="bg-white p-4 border rounded shadow-sm">
                    <div className="text-xs text-slate-500 font-semibold mb-1">Freight Delay</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      {mutation.data.total_freight_delay_minutes} min
                    </div>
                  </div>
                  <div className="bg-white p-4 border rounded shadow-sm">
                    <div className="text-xs text-slate-500 font-semibold mb-1">Regulated Trains</div>
                    <div className="text-2xl font-bold">{mutation.data.regulated_trains}</div>
                  </div>
                  <div className="bg-white p-4 border rounded shadow-sm">
                    <div className="text-xs text-slate-500 font-semibold mb-1">Punctuality Impact</div>
                    <div className="text-2xl font-bold text-red-600">-{mutation.data.network_punctuality_impact_pct}%</div>
                  </div>
                </div>

                {mutation.data.headway_conflict_warnings?.length > 0 && (
                  <div id="sim-warnings" className="bg-amber-50 border border-amber-200 p-4 rounded text-sm text-amber-900">
                    <h4 className="font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Warnings</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      {mutation.data.headway_conflict_warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-bold text-sm">Regulated Trains Breakdown</h4>
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-xs text-left" id="sim-trains">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2">Train No</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Delay</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y">
                        {mutation.data.regulated_train_details?.map((t: any, i: number) => (
                          <tr key={i}>
                            <td className="p-2 font-mono font-semibold">{t.train_no}</td>
                            <td className="p-2">{t.train_type}</td>
                            <td className="p-2 text-red-600">+{t.delay_minutes}m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
