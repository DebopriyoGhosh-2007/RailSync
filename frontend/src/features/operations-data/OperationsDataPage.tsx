import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsApi } from '@/api/operations';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function OperationsDataPage() {
  const queryClient = useQueryClient();
  const { data: summary, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['operations-summary'],
    queryFn: operationsApi.getSummary,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Operations Data</h1>
          <p className="text-sm text-slate-500 mt-1">Timetable occupancy, goods forecasts, and COA windows.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Import Operational Record</h2>
            <ImportForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['operations-summary'] })} />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Integrated Planning</h2>
            <IntegratedPlanForm />
          </div>
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-slate-900 text-sm">Stored Records</h2>
              <button id="refresh-records" onClick={() => refetch()} className="text-xs text-primary font-medium hover:underline">Refresh</button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-50" id="stored-records">
              {isError ? (
                <div className="text-sm text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Error loading summary</div>
              ) : isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Timetable Occupancy</div>
                    <div className="text-2xl font-bold">{summary?.timetable_occupancy?.count || 0}</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Goods Forecasts</div>
                    <div className="text-2xl font-bold">{summary?.goods_forecasts?.count || 0}</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">COA Windows</div>
                    <div className="text-2xl font-bold">{summary?.coa_windows?.count || 0}</div>
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

function ImportForm({ onSuccess }: { onSuccess: () => void }) {
  const [recordType, setRecordType] = useState('timetable');
  const [jsonText, setJsonText] = useState('');

  const importMutation = useMutation({
    mutationFn: (payload: any) => {
      if (recordType === 'timetable') return operationsApi.importTimetable(payload);
      if (recordType === 'goods') return operationsApi.importGoods(payload);
      return operationsApi.importCoa(payload);
    },
    onSuccess: () => {
      setJsonText('');
      onSuccess();
    }
  });

  const guides: Record<string, string> = {
    timetable: 'record_id, section_id, window_start, window_end, passenger_trains_affected, source_timestamp',
    goods: 'record_id, section_id, window_start, window_end, goods_trains_affected, source_timestamp',
    coa: 'source_timestamp, window: { corridor_id, section_id, start_time, end_time, max_simultaneous_crews, traffic_block_available, traction_disconnection_available, timetable_reference, goods_forecast_reference }'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsed = null;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      alert("Invalid JSON format");
      return;
    }
    importMutation.mutate(parsed);
  };

  return (
    <form id="operations-form" onSubmit={handleSubmit} className="space-y-4">
      {importMutation.isError && (
        <div id="import-result" className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          <div id="import-heading" className="font-bold mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Import Failed</div>
          <div id="import-caption">{importMutation.error.message}</div>
        </div>
      )}
      {importMutation.isSuccess && (
        <div id="import-result" className="p-3 bg-green-50 text-green-800 text-sm rounded border border-green-200">
          <div id="import-heading" className="font-bold mb-1 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Import Complete</div>
          <div id="import-caption">Record successfully added to register.</div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">Record Type</label>
        <select 
          id="record-type"
          className="w-full border-slate-300 rounded text-sm p-2 border"
          value={recordType}
          onChange={e => setRecordType(e.target.value)}
        >
          <option value="timetable">Timetable Occupancy</option>
          <option value="goods">Goods Forecast</option>
          <option value="coa">COA Availability Window</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700 flex flex-col">
          Source JSON
          <span id="record-guide" className="text-xs text-slate-500 font-normal mt-1">Requires: {guides[recordType]}</span>
        </label>
        <textarea 
          required 
          className="w-full border-slate-300 rounded text-sm p-2 border font-mono min-h-[150px]" 
          placeholder="{}"
          value={jsonText} 
          onChange={e => setJsonText(e.target.value)} 
        />
      </div>

      <button 
        type="submit" 
        disabled={importMutation.isPending}
        className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary/90 disabled:opacity-50 text-sm"
      >
        {importMutation.isPending ? 'Importing...' : 'Import Record'}
      </button>
    </form>
  );
}

function IntegratedPlanForm() {
  const [formData, setFormData] = useState({
    horizon: 'WEEKLY',
    horizon_start: '',
    horizon_end: ''
  });

  const planMutation = useMutation({
    mutationFn: operationsApi.planFromIntegrated
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    planMutation.mutate(formData);
  };

  return (
    <form id="integrated-plan-form" onSubmit={handleSubmit} className="space-y-4">
      {planMutation.isError && (
        <div id="integrated-status" className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          <AlertCircle className="w-4 h-4 inline mr-2 -mt-0.5" />
          {planMutation.error.message}
        </div>
      )}
      {planMutation.isSuccess && (
        <div id="integrated-status" className="p-4 bg-green-50 text-green-900 text-sm rounded border border-green-200 space-y-2">
          <div className="font-bold flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" /> Plan Generated Successfully
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>Plan ID: {planMutation.data.plan_id}</div>
            <div>Scheduled Tasks: {planMutation.data.scheduled_task_count}</div>
          </div>
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

      <button 
        type="submit" 
        disabled={planMutation.isPending}
        className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 disabled:opacity-50 text-sm"
      >
        {planMutation.isPending ? 'Generating...' : 'Generate Integrated Plan'}
      </button>
    </form>
  );
}
