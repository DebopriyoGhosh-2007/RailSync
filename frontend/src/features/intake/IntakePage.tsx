import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intakeApi } from '@/api/intake';
import * as Tabs from '@radix-ui/react-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function IntakePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('reference');
  
  const { data: tasks, isLoading: tasksLoading, isError: tasksError, refetch } = useQuery({
    queryKey: ['ingestion-tasks'],
    queryFn: intakeApi.getTasks,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Data Intake</h1>
          <p className="text-sm text-slate-500 mt-1">Multi-department maintenance ingestion and network mapping.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <Tabs.List className="flex border-b border-slate-200 bg-slate-50 shrink-0">
              <Tabs.Trigger 
                value="reference" 
                className={`flex-1 p-3 text-sm font-medium border-b-2 ${activeTab === 'reference' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Register Reference
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="task" 
                className={`flex-1 p-3 text-sm font-medium border-b-2 ${activeTab === 'task' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Ingest Maintenance Record
              </Tabs.Trigger>
            </Tabs.List>

            <div className="p-6">
              <div className={`focus:outline-none ${activeTab !== 'reference' ? 'hidden' : ''}`}>
                <ReferenceForm />
              </div>
              <div className={`focus:outline-none ${activeTab !== 'task' ? 'hidden' : ''}`}>
                <TaskForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['ingestion-tasks'] })} />
              </div>
            </div>
          </Tabs.Root>
        </div>

        <div className="col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-slate-900 text-sm">Persisted Records</h2>
              <button onClick={() => refetch()} className="text-xs text-primary font-medium hover:underline">Refresh</button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-50">
              {tasksError ? (
                <div className="text-sm text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Error loading records</div>
              ) : tasksLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : tasks?.length === 0 ? (
                <div className="text-sm text-slate-500 text-center mt-10">No records found.</div>
              ) : (
                <div id="records-body" className="space-y-3">
                  {tasks?.map((t: any) => (
                    <div key={t.id || t.task_id} className="bg-white border border-slate-200 p-3 rounded shadow-sm text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold text-xs">{t.source_system} - {t.id || t.task_id}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${t.status === 'COMPLETE' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {t.status}
                        </span>
                      </div>
                      {t.status === 'NEEDS_REVIEW' && t.review_reasons?.length > 0 && (
                        <div className="text-xs text-amber-700 mt-2 bg-amber-50 p-1.5 rounded">
                          {t.review_reasons[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferenceForm() {
  const [formData, setFormData] = useState({
    source_system: 'TMS',
    source_reference: '',
    section_id: '',
    asset_type: '',
    start_km: '',
    end_km: '',
    asset_reference: ''
  });

  const mutation = useMutation({
    mutationFn: intakeApi.registerReference
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      start_km: Number(formData.start_km),
      end_km: Number(formData.end_km)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {mutation.error.message}
        </div>
      )}
      {mutation.isSuccess && (
        <div className="p-3 bg-green-50 text-green-800 text-sm rounded border border-green-200 flex gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          Reference registered successfully!
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Source System</label>
          <select 
            className="w-full border-slate-300 rounded text-sm p-2 border focus:ring-primary focus:border-primary"
            value={formData.source_system}
            onChange={e => setFormData(p => ({ ...p, source_system: e.target.value }))}
          >
            <option value="TMS">TMS</option>
            <option value="SMMS">SMMS</option>
            <option value="TDMS">TDMS</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Source Reference</label>
          <input required type="text" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.source_reference} onChange={e => setFormData(p => ({ ...p, source_reference: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Section ID</label>
          <input required type="text" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.section_id} onChange={e => setFormData(p => ({ ...p, section_id: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Asset Type</label>
          <input required type="text" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.asset_type} onChange={e => setFormData(p => ({ ...p, asset_type: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Start KM</label>
          <input required type="number" step="any" min="0" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.start_km} onChange={e => setFormData(p => ({ ...p, start_km: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">End KM</label>
          <input required type="number" step="any" min="0" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.end_km} onChange={e => setFormData(p => ({ ...p, end_km: e.target.value }))} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Asset Reference</label>
          <input required type="text" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.asset_reference} onChange={e => setFormData(p => ({ ...p, asset_reference: e.target.value }))} />
        </div>
      </div>

      <div className="pt-6 mt-4 border-t border-slate-200">
        <button 
          type="submit" 
          disabled={mutation.isPending}
          className="w-full md:w-auto px-8 py-3 bg-primary text-white rounded font-bold hover:bg-primary/90 disabled:opacity-50 text-base shadow-sm transition-all"
        >
          {mutation.isPending ? 'Registering...' : 'Register Reference'}
        </button>
      </div>
    </form>
  );
}

function TaskForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    source_system: 'TMS',
    severity: 'MEDIUM',
    record: '',
    estimated_duration_minutes: '',
    due_date: '',
    required_crews: '',
    required_equipment: '',
    requires_traffic_block: false,
    requires_traction_disconnection: false,
    co_working_compatible: false
  });

  const mutation = useMutation({
    mutationFn: intakeApi.ingestTask,
    onSuccess: onSuccess
  });

  const sourceGuides: Record<string, string> = {
    TMS: 'ticket_id, track_id, km_start, km_end, defect_class, date_detected',
    SMMS: 'fault_id, station_code, gear_type, failure_category, reported_ts, urgency_code',
    TDMS: 'defect_no, ohe_substation, mast_from, mast_to, issue_type, scheduled_date'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedRecord = {};
    try {
      parsedRecord = JSON.parse(formData.record);
    } catch {
      alert("Invalid JSON in Source Record");
      return;
    }
    
    mutation.mutate({
      source_system: formData.source_system,
      record: parsedRecord,
      planning_context: {
        severity: formData.severity,
        estimated_duration_minutes: Number(formData.estimated_duration_minutes),
        due_date: formData.due_date,
        required_crews: formData.required_crews.split('\n').filter(Boolean),
        required_equipment: formData.required_equipment.split('\n').filter(Boolean),
        requires_traffic_block: formData.requires_traffic_block,
        requires_traction_disconnection: formData.requires_traction_disconnection,
        co_working_compatible: formData.co_working_compatible
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {mutation.error.message}
        </div>
      )}
      
      {mutation.isSuccess && mutation.data && (
        <div id="result-output" className={`p-4 rounded border text-sm ${mutation.data.status === 'COMPLETE' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
          <div id="result-caption" className="font-bold mb-2 flex items-center gap-2">
            {mutation.data.status === 'COMPLETE' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
            {mutation.data.status === 'COMPLETE' ? 'Normalization Complete' : 'Review Required'}
          </div>
          {mutation.data.status === 'COMPLETE' ? (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>Task ID: {mutation.data.task_id}</div>
              <div>Section: {mutation.data.normalized_data?.section}</div>
            </div>
          ) : (
            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
              {mutation.data.review_reasons?.map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Source System</label>
          <select 
            className="w-full border-slate-300 rounded text-sm p-2 border focus:ring-primary focus:border-primary"
            value={formData.source_system}
            onChange={e => setFormData(p => ({ ...p, source_system: e.target.value }))}
          >
            <option value="TMS">TMS</option>
            <option value="SMMS">SMMS</option>
            <option value="TDMS">TDMS</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Severity</label>
          <select 
            className="w-full border-slate-300 rounded text-sm p-2 border"
            value={formData.severity}
            onChange={e => setFormData(p => ({ ...p, severity: e.target.value }))}
          >
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700 flex justify-between">
          Source Record (JSON)
          <span id="source-guide" className="text-xs text-slate-500 font-normal">Requires: {sourceGuides[formData.source_system]}</span>
        </label>
        <textarea 
          required 
          className="w-full border-slate-300 rounded text-sm p-2 border font-mono min-h-[100px]" 
          placeholder="{}"
          value={formData.record} 
          onChange={e => setFormData(p => ({ ...p, record: e.target.value }))} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Estimated Duration (mins)</label>
          <input required type="number" min="1" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.estimated_duration_minutes} onChange={e => setFormData(p => ({ ...p, estimated_duration_minutes: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Due Date</label>
          <input required type="datetime-local" className="w-full border-slate-300 rounded text-sm p-2 border" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Required Crews (One per line)</label>
          <textarea className="w-full border-slate-300 rounded text-sm p-2 border h-20" value={formData.required_crews} onChange={e => setFormData(p => ({ ...p, required_crews: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Required Equipment (One per line)</label>
          <textarea className="w-full border-slate-300 rounded text-sm p-2 border h-20" value={formData.required_equipment} onChange={e => setFormData(p => ({ ...p, required_equipment: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={formData.requires_traffic_block} onChange={e => setFormData(p => ({ ...p, requires_traffic_block: e.target.checked }))} />
          Requires Traffic Block
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={formData.requires_traction_disconnection} onChange={e => setFormData(p => ({ ...p, requires_traction_disconnection: e.target.checked }))} />
          Requires Traction Disconnection
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={formData.co_working_compatible} onChange={e => setFormData(p => ({ ...p, co_working_compatible: e.target.checked }))} />
          Co-working Compatible
        </label>
      </div>

      <div className="pt-6 mt-4 border-t border-slate-200">
        <button 
          type="submit" 
          disabled={mutation.isPending}
          className="w-full md:w-auto px-8 py-3 bg-primary text-white rounded font-bold hover:bg-primary/90 disabled:opacity-50 text-base shadow-sm transition-all"
        >
          {mutation.isPending ? 'Registering...' : 'Register Maintenance Record'}
        </button>
      </div>
    </form>
  );
}
