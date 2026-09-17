import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthContext';
import { cockpitApi } from '@/api/cockpit';
import { getBlockStatusConfig, BlockStatus, isActionAllowed, BLOCK_ACTIONS, REASON_CODES } from '@/domain/block-state';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Activity, Search } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

export default function CockpitPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  // Filters
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState(profile?.department || 'ALL');

  // Modals state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [whatIfDrawerOpen, setWhatIfDrawerOpen] = useState(false);

  const { data: summary, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['cockpit-summary'],
    queryFn: cockpitApi.getSummary,
  });

  const {
    kpis,
    blocks = [],
    unscheduled_tasks = [],
    deferred_tasks = []
  } = summary || {};

  const filteredBlocks = useMemo(() => {
    return blocks.filter((b: any) => {
      if (sectionFilter !== 'ALL' && b.section_id !== sectionFilter) return false;
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (departmentFilter !== 'ALL' && b.department !== departmentFilter) return false;
      return true;
    });
  }, [blocks, sectionFilter, statusFilter, departmentFilter]);

  const proposedCount = blocks.filter((b: any) => b.status === 'PROPOSED').length;
  const sanctionedCount = blocks.filter((b: any) => b.status === 'SANCTIONED').length;
  const overriddenCount = blocks.filter((b: any) => b.status === 'OVERRIDDEN').length;

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Unable to load cockpit data</h3>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 flex flex-col h-[calc(100vh-80px)]">
      {/* Header & Controls */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Operations Cockpit</h1>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-4">
            <span id="headerRoleDisplay">Active Role: {profile?.department || 'System Operator'}</span>
            <span className="text-slate-300">|</span>
            <span id="controllerNameInput">Officer: {profile?.fullName || 'Unknown'}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            id="openAuditLedgerBtn"
            onClick={() => setAuditDrawerOpen(true)}
            className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded text-sm font-medium hover:bg-slate-50"
          >
            Audit Ledger
          </button>
          <button 
            id="openWhatIfDrawerBtn"
            onClick={() => setWhatIfDrawerOpen(true)}
            className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded text-sm font-medium hover:bg-slate-50"
          >
            What-If Simulator
          </button>
          <button 
            id="refreshCockpitBtn"
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Deck */}
      <div className="grid grid-cols-6 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Block Hrs Saved</div>
          <div id="kpiHoursSaved" className="text-lg font-bold">{isLoading ? <Skeleton className="h-6 w-12" /> : (kpis?.hours_saved || 0)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Planned Avail</div>
          <div id="kpiAvailability" className="text-lg font-bold">{isLoading ? <Skeleton className="h-6 w-12" /> : (kpis?.planned_availability ? `${kpis.planned_availability}%` : '—')}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Hrs Used</div>
          <div id="kpiHoursUsed" className="text-lg font-bold">{isLoading ? <Skeleton className="h-6 w-12" /> : (kpis?.shared_block_hours || 0)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Coordinated Blocks</div>
          <div id="kpiBlockCount" className="text-lg font-bold">{isLoading ? <Skeleton className="h-6 w-12" /> : blocks.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Sanction Queue</div>
          <div className="flex gap-2 text-xs font-medium mt-1">
            <span id="chipCountProposed" className="text-amber-600">{isLoading ? <Skeleton className="h-4 w-4 inline-block" /> : proposedCount} P</span>
            <span id="chipCountSanctioned" className="text-green-600">{isLoading ? <Skeleton className="h-4 w-4 inline-block" /> : sanctionedCount} S</span>
            <span id="chipCountOverridden" className="text-orange-600">{isLoading ? <Skeleton className="h-4 w-4 inline-block" /> : overriddenCount} O</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm border-l-4 border-l-red-500">
          <div className="text-xs text-slate-500 mb-1">Deferred / Critical</div>
          <div id="kpiDeferredCount" className="text-lg font-bold text-red-700">{isLoading ? <Skeleton className="h-6 w-12" /> : deferred_tasks.length}</div>
        </div>
      </div>

      {/* Main Board */}
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
          <div className="p-3 border-b border-slate-100 flex gap-4 shrink-0">
            <select id="sectionFilter" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="text-sm border-slate-300 rounded">
              <option value="ALL">All Sections</option>
              {Array.from(new Set(blocks.map((b: any) => b.section_id))).filter(Boolean).map(s => (
                <option key={s as string} value={s as string}>{s as string}</option>
              ))}
            </select>
            <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border-slate-300 rounded">
              <option value="ALL">All States</option>
              <option value="PROPOSED">Proposed</option>
              <option value="SANCTIONED">Sanctioned</option>
              <option value="OVERRIDDEN">Overridden</option>
              <option value="REJECTED">Rejected</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="text-sm border-slate-300 rounded">
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="S&T">Signal & Telecom</option>
              <option value="Traction">Traction</option>
            </select>
          </div>
          
          <div className="flex-1 p-4 overflow-auto" id="ganttBoard">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredBlocks.length === 0 ? (
              <div id="timelineEmptyState" className="h-full flex flex-col items-center justify-center text-slate-400">
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p>No blocks match the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBlocks.map((b: any) => {
                  const statusConfig = getBlockStatusConfig(b.status);
                  return (
                    <button
                      key={b.block_id || b.id}
                      onClick={() => setSelectedBlockId(b.block_id || b.id)}
                      className="w-full text-left p-3 border border-slate-200 rounded hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center bg-slate-50 transition-all"
                    >
                      <div>
                        <div className="font-mono text-sm font-semibold">{b.section_id}</div>
                        <div className="text-xs text-slate-500 mt-1">{b.window_start || b.start_time} - {b.window_end || b.end_time}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                        {statusConfig.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Deferred Work Side Panel */}
        {deferred_tasks.length > 0 && (
          <div id="deferredSection" className="w-80 bg-red-50 border border-red-200 rounded-lg shadow-sm flex flex-col shrink-0">
            <div className="p-3 border-b border-red-200 flex justify-between items-center shrink-0">
              <h2 className="font-semibold text-red-900 text-sm">Deferred Work</h2>
              <span id="deferredCountBadge" className="bg-red-200 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">{deferred_tasks.length}</span>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <div id="deferredTableBody" className="space-y-3">
                {deferred_tasks.map((dt: any) => (
                  <div key={dt.id} className="bg-white p-2 border border-red-100 rounded text-sm shadow-sm">
                    <div className="font-mono font-bold text-xs text-slate-700">{dt.id}</div>
                    <div className="text-xs text-red-700 mt-1">{dt.reason || 'Capacity exceeded'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Block Modal */}
      <Dialog.Root open={!!selectedBlockId} onOpenChange={(open) => !open && setSelectedBlockId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay id="blockModalBackdrop" className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col z-50 overflow-hidden focus:outline-none">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center shrink-0 bg-slate-50">
              <Dialog.Title id="modalBlockTitle" className="text-lg font-bold font-mono">
                Block {selectedBlockId}
              </Dialog.Title>
              <Dialog.Close id="closeModalBtn" className="text-slate-400 hover:text-slate-700">
                <span className="sr-only">Close</span>
                ✕
              </Dialog.Close>
            </div>
            
            <div className="p-6 flex-1 overflow-auto space-y-6">
              {/* Dummy content for Block detail because we'd need another API fetch or find from list */}
              {selectedBlockId && (
                <BlockDetail 
                  block={blocks.find((b: any) => (b.block_id || b.id) === selectedBlockId)}
                  onActionSuccess={() => {
                    refetch();
                    setSelectedBlockId(null);
                  }}
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Audit Ledger Drawer (Placeholder) */}
      <Dialog.Root open={auditDrawerOpen} onOpenChange={setAuditDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay id="auditDrawerBackdrop" className="fixed inset-0 bg-black/20 z-40" />
          <Dialog.Content className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-xl z-50 flex flex-col focus:outline-none transform transition-transform duration-300">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <Dialog.Title className="font-bold">Audit Ledger</Dialog.Title>
              <Dialog.Close id="closeAuditDrawerBtn" className="text-slate-400 hover:text-slate-700">✕</Dialog.Close>
            </div>
            <div className="flex-1 overflow-auto p-4" id="globalAuditTableBody">
              <p className="text-sm text-slate-500 text-center mt-10">Audit logs will appear here.</p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* What-If Drawer (Placeholder) */}
      <Dialog.Root open={whatIfDrawerOpen} onOpenChange={setWhatIfDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay id="whatIfDrawerBackdrop" className="fixed inset-0 bg-black/20 z-40" />
          <Dialog.Content className="fixed top-0 right-0 h-full w-[600px] bg-white shadow-xl z-50 flex flex-col focus:outline-none transform transition-transform duration-300">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <Dialog.Title className="font-bold">What-If Simulator</Dialog.Title>
              <Dialog.Close id="closeWhatIfDrawerBtn" className="text-slate-400 hover:text-slate-700">✕</Dialog.Close>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <p className="text-sm text-slate-500 text-center mt-10">Simulation interface will appear here.</p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function BlockDetail({ block, onActionSuccess }: { block: any, onActionSuccess: () => void }) {
  const [actionChoice, setActionChoice] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [notes, setNotes] = useState('');
  const { profile } = useAuth();
  
  const mutation = useMutation({
    mutationFn: (payload: any) => cockpitApi.blockAction(block.block_id || block.id, payload),
    onSuccess: onActionSuccess
  });

  if (!block) return <div className="text-slate-500">Block not found in summary.</div>;

  const statusConfig = getBlockStatusConfig(block.status);
  const allowedActions = statusConfig.allowedActions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionChoice || !reasonCode || notes.length < 5) return;
    
    mutation.mutate({
      action: actionChoice,
      actor: profile?.fullName || 'Unknown',
      role: profile?.department || 'System Operator',
      reason_code: reasonCode,
      justification: notes
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500 uppercase">Section</div>
          <div id="mSection" className="font-bold">{block.section_id}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase">Current State</div>
          <div id="mStateBadge" className={`inline-block px-2 py-0.5 mt-1 rounded text-xs font-bold uppercase ${statusConfig.bgClass} ${statusConfig.textClass}`}>
            {statusConfig.label}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 border border-slate-200 rounded">
        <h3 className="text-sm font-bold mb-3">Action Controls</h3>
        {allowedActions.length === 0 ? (
          <p className="text-sm text-slate-500">No actions available from this state.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Action Choice</label>
              <select 
                value={actionChoice} 
                onChange={e => setActionChoice(e.target.value)} 
                className="w-full text-sm border-slate-300 rounded"
                required
              >
                <option value="">-- Select Action --</option>
                {allowedActions.map(a => (
                  <option key={a} value={a}>{BLOCK_ACTIONS[a].label}</option>
                ))}
              </select>
            </div>

            {actionChoice && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Reason Code</label>
                  <select 
                    id="reasonCodeSelect"
                    value={reasonCode} 
                    onChange={e => setReasonCode(e.target.value)} 
                    className="w-full text-sm border-slate-300 rounded"
                    required
                  >
                    <option value="">-- Select Reason --</option>
                    {REASON_CODES.map(rc => (
                      <option key={rc.value} value={rc.value}>{rc.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold flex justify-between">
                    Justification Notes
                    <span id="justificationCharCount" className={notes.length < 5 ? "text-red-500" : "text-green-600"}>
                      {notes.length}/5 min chars
                    </span>
                  </label>
                  <textarea 
                    id="justificationNotesInput"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full text-sm border-slate-300 rounded p-2 min-h-[80px]"
                    required
                    minLength={5}
                  />
                </div>
                <button 
                  id="submitBlockActionBtn"
                  type="submit" 
                  disabled={mutation.isPending || notes.length < 5 || !reasonCode}
                  className="w-full py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {mutation.isPending ? 'Submitting...' : 'Submit Action'}
                </button>
                {mutation.isError && (
                  <div id="actionStatusMsg" className="text-xs text-red-600 mt-2">
                    {mutation.error.message}
                  </div>
                )}
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
