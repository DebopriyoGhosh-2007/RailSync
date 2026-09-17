import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthContext';
import { cockpitApi } from '@/api/cockpit';
import { getBlockStatusConfig } from '@/domain/block-state';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OverviewPage() {
  const { profile } = useAuth();
  const { data: summary, isLoading, isError, error } = useQuery({
    queryKey: ['cockpit-summary'],
    queryFn: cockpitApi.getSummary,
  });

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold" id="overview-data-status">Unable to load dashboard data</h3>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Use optional chaining for summary since it might be undefined while loading
  const {
    kpis,
    blocks = [],
    unscheduled_tasks = []
  } = summary || {};

  const activeBlocks = blocks.filter((b: any) => ['ACTIVE', 'EXTENDED'].includes(b.status));
  const proposedCount = blocks.filter((b: any) => b.status === 'PROPOSED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Automatic block planning and coordinated maintenance windows.</h1>
          <div className="mt-4 flex gap-4">
            <Link to="/planner" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              Generate weekly plan
            </Link>
            <Link to="/what-if" className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
              Run what-if scenario
            </Link>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4 shadow-sm">
          <div id="profile-avatar" className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-300">
            {profile?.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="profile-copy">
            <strong className="block text-slate-900">{profile?.fullName || 'Unknown Officer'}</strong>
            <small className="block text-slate-500">{profile?.department || 'Unknown Role'}</small>
          </div>
        </div>
      </div>

      {/* KPIs Deck */}
      <div className="grid grid-cols-4 gap-4">
        {/* Availability KPI */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Planned availability</div>
          {isLoading ? <Skeleton className="h-8 w-16" /> : (
            <div className="flex items-baseline gap-2">
              <span id="metric-availability" className="text-2xl font-bold text-slate-900">
                {kpis?.planned_availability ? `${kpis.planned_availability}%` : '—'}
              </span>
            </div>
          )}
          <div id="metric-availability-note" className="text-xs text-slate-500 mt-1">
            {kpis?.planned_availability ? 'Based on approved baseline' : 'No approved availability baseline exists'}
          </div>
        </div>

        {/* Block Hours KPI */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Shared block hours</div>
          {isLoading ? <Skeleton className="h-8 w-16" /> : (
            <div id="metric-hours" className="text-2xl font-bold text-slate-900">{kpis?.shared_block_hours || 0}h</div>
          )}
        </div>

        {/* Scheduled Tasks KPI */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Scheduled tasks</div>
          {isLoading ? <Skeleton className="h-8 w-16" /> : (
            <div id="metric-tasks" className="text-2xl font-bold text-slate-900">{kpis?.scheduled_tasks || 0}</div>
          )}
          <div id="metric-unscheduled" className="text-xs text-amber-600 mt-1 font-medium">
            {isLoading ? <Skeleton className="h-4 w-24" /> : `${unscheduled_tasks.length} unscheduled`}
          </div>
        </div>

        {/* Sanctioned Blocks KPI */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Sanctioned blocks</div>
          {isLoading ? <Skeleton className="h-8 w-16" /> : (
            <div id="metric-sanctioned" className="text-2xl font-bold text-slate-900">{kpis?.sanctioned_blocks || 0}</div>
          )}
          <div id="metric-proposed" className="text-xs text-amber-600 mt-1 font-medium">
            {isLoading ? <Skeleton className="h-4 w-24" /> : `${proposedCount} proposed`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="overview-section-title" className="text-lg font-bold text-slate-900">Current Plan Timeline</h2>
            <div id="overview-route-status" className="text-sm text-slate-500">
              {isLoading ? <Skeleton className="h-4 w-24" /> : `${blocks.length} blocks across sections`}
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm min-h-[300px]">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : blocks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-2 p-8">
                <div className="text-lg">No stored block plans exist</div>
                <div className="text-sm">Generate a plan or import data to get started.</div>
              </div>
            ) : (
              <div id="overview-timeline-rows" className="space-y-3">
                {/* Simplified timeline view for overview - group by section */}
                {Object.entries(
                  blocks.reduce((acc: any, block: any) => {
                    const sec = block.section_id || 'Unknown Section';
                    if (!acc[sec]) acc[sec] = [];
                    acc[sec].push(block);
                    return acc;
                  }, {})
                ).map(([section, secBlocks]: [string, any]) => (
                  <div key={section} className="border border-slate-100 rounded p-3">
                    <div className="text-sm font-semibold mb-2">{section}</div>
                    <div className="flex gap-2 flex-wrap">
                      {secBlocks.map((b: any) => {
                        const statusConfig = getBlockStatusConfig(b.status);
                        return (
                          <Link 
                            key={b.id || b.block_id}
                            to="/cockpit"
                            className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bgClass} ${statusConfig.textClass} hover:opacity-80 transition-opacity`}
                            title={statusConfig.description}
                          >
                            {statusConfig.label} ({b.window_start || b.start_time})
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div id="overview-plan-status" className="text-xs text-slate-400 text-right">
             {isLoading ? <Skeleton className="h-3 w-16 ml-auto" /> : `${blocks.length} total blocks`}
          </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          {/* Priority Queue */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Priority Queue (Needs Review)</h2>
            <div id="overview-task-list" className="space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : unscheduled_tasks.length === 0 ? (
                <div className="text-sm text-slate-500 py-4 text-center">No tasks currently require review.</div>
              ) : (
                unscheduled_tasks.slice(0, 3).map((task: any) => (
                  <Link to="/intake" key={task.id} className="block p-3 rounded border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                    <div className="text-xs font-semibold text-slate-900">{task.id} - {task.department}</div>
                    <div className="text-xs text-slate-500 mt-1 truncate">{task.description || 'Maintenance review required'}</div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Live State Panel */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Live Block State</h2>
            <div id="overview-live-state" className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : activeBlocks.length === 0 ? (
                <div className="text-sm text-slate-500 py-4 text-center">No blocks are currently active.</div>
              ) : (
                activeBlocks.map((b: any) => {
                  const statusConfig = getBlockStatusConfig(b.status);
                  return (
                    <Link to="/live-monitor" key={b.id || b.block_id} className="block p-3 rounded border border-slate-100 hover:border-blue-50 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-xs font-semibold">{b.section_id}</div>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">{b.department || 'Multi-department'}</div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
