import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDepartment } from '@/auth/useDepartment';
import { getFormSchemaForDepartment } from './schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const DEPT_TO_SOURCE = {
  "ENGINEERING": "TMS",
  "SIGNAL_TELECOM": "SMMS",
  "TRACTION": "TDMS"
};

const TagInput = ({ value, onChange, label, error }: any) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_: any, index: number) => index !== indexToRemove));
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-1">{label} (Press Enter to add)</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag: string, index: number) => (
          <span key={index} className="inline-flex items-center px-2 py-1 rounded bg-secondary text-secondary-foreground text-sm">
            {tag}
            <button type="button" onClick={() => removeTag(index)} className="ml-1 text-muted-foreground hover:text-foreground">&times;</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ${error ? 'border-destructive' : ''}`}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Add ${label.toLowerCase()}...`}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};

const SeveritySelector = ({ value, onChange, error }: any) => {
  const severities = [
    { id: 'CRITICAL', color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' },
    { id: 'HIGH', color: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200' },
    { id: 'MEDIUM', color: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200' },
    { id: 'LOW', color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' }
  ];

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-1">Severity</label>
      <div className="flex gap-2">
        {severities.map((sev) => (
          <button
            key={sev.id}
            type="button"
            onClick={() => onChange(sev.id)}
            className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${value === sev.id ? 'ring-2 ring-primary ring-offset-2 ' + sev.color : 'bg-background text-muted-foreground hover:bg-accent'}`}
          >
            {sev.id}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange, label, description }: any) => {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative flex items-center pt-1">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-300'}`}>
          <div className={`absolute left-1 top-1.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      </div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </label>
  );
};

export default function RaiseRequestPage() {
  const department = useDepartment();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitResult, setSubmitResult] = useState<any>(null);
  
  if (!department) return null;

  const schema = getFormSchemaForDepartment(department);
  const sourceSystem = DEPT_TO_SOURCE[department];

  const { register, handleSubmit, control, formState: { errors }, reset, getValues } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      source_system: sourceSystem,
      record: {},
      planning_context: {
        severity: undefined,
        required_crews: [],
        required_equipment: [],
        requires_traffic_block: false,
        requires_traction_disconnection: false,
        co_working_compatible: false,
      }
    }
  });

  const { data: pastTasks = [] } = useQuery({
    queryKey: ['tasks', sourceSystem],
    queryFn: async () => {
      const res = await fetch('/api/v1/ingestion/tasks');
      if (!res.ok) return [];
      const json = await res.json();
      return json.filter((task: any) => task.source_system === sourceSystem);
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Local time fields from datetime-local inputs are ISO formatted but missing Z.
      // Backend expects proper parsing, which FastAPI handles usually. 
      // We send it as is or append Z if backend strictly needs UTC (backend handles naive ISO).
      const res = await fetch('/api/v1/ingestion/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok && res.status !== 409) {
        throw new Error(json.detail || 'Validation error');
      }
      return { status: res.status, data: json };
    },
    onSuccess: (response) => {
      setSubmitResult(response);
      queryClient.invalidateQueries({ queryKey: ['tasks', sourceSystem] });
    },
    onError: (error) => {
      setSubmitResult({ error: error.message });
    }
  });

  const onSubmit = (data: any) => {
    // Convert number strings to actual numbers where required
    if (department === 'ENGINEERING') {
      data.record.km_start = Number(data.record.km_start);
      data.record.km_end = Number(data.record.km_end);
    } else if (department === 'TRACTION') {
      data.record.mast_from = Number(data.record.mast_from);
      data.record.mast_to = Number(data.record.mast_to);
    }
    data.planning_context.estimated_duration_minutes = Number(data.planning_context.estimated_duration_minutes);
    mutation.mutate(data);
  };

  const handleReset = () => {
    setSubmitResult(null);
    // Keep form values if they just want to fix validation, but this clears if they want a new one
    if (submitResult?.status === 201 || submitResult?.status === 200) {
      reset({ source_system: sourceSystem, record: {}, planning_context: { required_crews: [], required_equipment: [] } });
    }
  };

  // Render department-specific fields
  const renderRecordFields = () => {
    if (department === "ENGINEERING") {
      return (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ticket ID" {...register("record.ticket_id")} error={errors.record?.ticket_id?.message as string} />
          <Input label="Track ID" {...register("record.track_id")} error={errors.record?.track_id?.message as string} />
          <Input label="Start KM" type="number" step="any" {...register("record.km_start", { valueAsNumber: true })} error={errors.record?.km_start?.message as string} />
          <Input label="End KM" type="number" step="any" {...register("record.km_end", { valueAsNumber: true })} error={errors.record?.km_end?.message as string} />
          <Input label="Defect Class" {...register("record.defect_class")} error={errors.record?.defect_class?.message as string} />
          <Input label="Date Detected" type="datetime-local" {...register("record.date_detected")} error={errors.record?.date_detected?.message as string} />
        </div>
      );
    }
    if (department === "SIGNAL_TELECOM") {
      return (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Fault ID" {...register("record.fault_id")} error={errors.record?.fault_id?.message as string} />
          <Input label="Station Code" {...register("record.station_code")} error={errors.record?.station_code?.message as string} />
          <Input label="Gear Type" {...register("record.gear_type")} error={errors.record?.gear_type?.message as string} />
          <Input label="Failure Category" {...register("record.failure_category")} error={errors.record?.failure_category?.message as string} />
          <Input label="Reported Timestamp" type="datetime-local" {...register("record.reported_ts")} error={errors.record?.reported_ts?.message as string} />
          <Input label="Urgency Code" {...register("record.urgency_code")} error={errors.record?.urgency_code?.message as string} />
        </div>
      );
    }
    if (department === "TRACTION") {
      return (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Defect No" {...register("record.defect_no")} error={errors.record?.defect_no?.message as string} />
          <Input label="OHE Substation" {...register("record.ohe_substation")} error={errors.record?.ohe_substation?.message as string} />
          <Input label="Mast From" type="number" {...register("record.mast_from", { valueAsNumber: true })} error={errors.record?.mast_from?.message as string} />
          <Input label="Mast To" type="number" {...register("record.mast_to", { valueAsNumber: true })} error={errors.record?.mast_to?.message as string} />
          <Input label="Issue Type" {...register("record.issue_type")} error={errors.record?.issue_type?.message as string} />
          <Input label="Scheduled Date" type="datetime-local" {...register("record.scheduled_date")} error={errors.record?.scheduled_date?.message as string} />
        </div>
      );
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={department === 'ENGINEERING' ? 'eng' : department === 'SIGNAL_TELECOM' ? 'sig' : 'trc'}>
                  {sourceSystem} ({department})
                </Badge>
              </div>
              <h1 className="text-3xl font-display font-bold">Raise Work Request</h1>
              <p className="text-muted-foreground mt-1">Submit an authoritative operational record to the central intake.</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>Skip to Dashboard</Button>
          </div>

          {submitResult && !submitResult.error ? (
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  {submitResult.data.status === 'NEEDS_REVIEW' ? 'Needs Review' : submitResult.status === 409 ? 'Duplicate Record Found' : 'Submission Complete'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submitResult.data.status === 'NEEDS_REVIEW' && (
                  <div className="bg-white p-4 rounded border text-sm">
                    <p className="font-semibold mb-2">The system flagged this record for manual review:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {submitResult.data.review_reasons?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                <div className="bg-white p-4 rounded border grid grid-cols-2 gap-4 text-sm font-mono">
                  <div><span className="text-muted-foreground">ID:</span> {submitResult.data.task_id}</div>
                  <div><span className="text-muted-foreground">Status:</span> {submitResult.data.status}</div>
                  {submitResult.data.normalized_data?.section && (
                    <div><span className="text-muted-foreground">Section:</span> {submitResult.data.normalized_data.section}</div>
                  )}
                  {submitResult.data.normalized_data?.km_start !== undefined && (
                    <div><span className="text-muted-foreground">KM Range:</span> {submitResult.data.normalized_data.km_start} - {submitResult.data.normalized_data.km_end}</div>
                  )}
                </div>
                <div className="flex gap-4 pt-4">
                  <Button onClick={handleReset}>Raise another request</Button>
                  <Button variant="outline" onClick={() => navigate('/')}>Go to full RailSync dashboard</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {submitResult?.error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/20 text-sm">
                  {submitResult.error}
                </div>
              )}

              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-4">Source Record ({sourceSystem})</h2>
                {renderRecordFields()}
              </section>

              <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-4">Planning Details</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <Controller
                      name="planning_context.severity"
                      control={control}
                      render={({ field }) => (
                        <SeveritySelector value={field.value} onChange={field.onChange} error={errors.planning_context?.severity?.message as string} />
                      )}
                    />
                    <Input 
                      label="Estimated Duration (minutes)" 
                      type="number" 
                      min="1"
                      {...register("planning_context.estimated_duration_minutes", { valueAsNumber: true })} 
                      error={errors.planning_context?.estimated_duration_minutes?.message as string} 
                    />
                    <Input 
                      label="Due Date and Time" 
                      type="datetime-local" 
                      {...register("planning_context.due_date")} 
                      error={errors.planning_context?.due_date?.message as string} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <Controller
                      name="planning_context.required_crews"
                      control={control}
                      render={({ field }) => (
                        <TagInput label="Required Crews" value={field.value} onChange={field.onChange} error={errors.planning_context?.required_crews?.message as string} />
                      )}
                    />
                    <Controller
                      name="planning_context.required_equipment"
                      control={control}
                      render={({ field }) => (
                        <TagInput label="Required Equipment" value={field.value} onChange={field.onChange} error={errors.planning_context?.required_equipment?.message as string} />
                      )}
                    />
                  </div>

                  <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                    <h3 className="text-sm font-semibold text-slate-800">Operational Constraints</h3>
                    <Controller
                      name="planning_context.requires_traffic_block"
                      control={control}
                      render={({ field }) => (
                        <ToggleSwitch checked={field.value} onChange={field.onChange} label="Requires Traffic Block" description="Halts normal train operations in this section for the duration of the work." />
                      )}
                    />
                    <Controller
                      name="planning_context.requires_traction_disconnection"
                      control={control}
                      render={({ field }) => (
                        <ToggleSwitch checked={field.value} onChange={field.onChange} label="Requires Traction Disconnection" description="Cuts overhead OHE power. Required for most bridge and track works using heavy machinery." />
                      )}
                    />
                    <Controller
                      name="planning_context.co_working_compatible"
                      control={control}
                      render={({ field }) => (
                        <ToggleSwitch checked={field.value} onChange={field.onChange} label="Compatible with Co-working" description="Allows other departments to safely execute work in the same shadow block." />
                      )}
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end border-t pt-6">
                <Button type="submit" size="lg" isLoading={mutation.isPending}>Submit Request</Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <aside className="w-80 border-l bg-slate-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="font-semibold">Recent {sourceSystem} Submissions</h2>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {pastTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-4">No recent submissions found.</p>
          ) : (
            pastTasks.map((task: any) => (
              <div key={task.task_id} className="bg-white p-3 rounded border text-sm shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs font-semibold">{task.task_id.substring(0, 8)}...</span>
                  <Badge variant={task.status === 'COMPLETE' ? 'success' : task.status === 'NEEDS_REVIEW' ? 'warning' : 'outline'}>{task.status}</Badge>
                </div>
                <div className="text-muted-foreground text-xs truncate">
                  {task.record?.ticket_id || task.record?.fault_id || task.record?.defect_no || 'Unknown Reference'}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
