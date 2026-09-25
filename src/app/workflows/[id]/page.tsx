"use client";

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { 
  CheckCircle, AlertCircle, Clock, PlayCircle, Loader2, RotateCcw,
  Database, Users, History, FileText, ArrowRight, ShieldCheck, ListTodo, ShieldAlert,
  AlertTriangle, RefreshCw, Lightbulb, Brain
} from 'lucide-react';
import clsx from 'clsx';
import { 
  getWorkflow, getWorkflowEvents, approveWorkflow, rejectWorkflow,
  Workflow, AuditEvent, Approval
} from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function WorkflowControlCenter({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const [wf, evts] = await Promise.all([
        getWorkflow(id),
        getWorkflowEvents(id).catch(() => [])
      ]);
      setWorkflow(wf);
      setEvents(evts);
      setError(null);
      return wf;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching workflow details.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let isActive = true;

    async function poll() {
      const currentWf = await fetchState();
      if (!isActive) return;

      // Poll while the workflow is actively executing
      if (currentWf && (currentWf.status === 'IN_PROGRESS' || currentWf.status === 'PLAN')) {
        timer = setTimeout(poll, 1500);
      }
    }

    poll();

    return () => {
      isActive = false;
      if (timer) clearTimeout(timer);
    };
  }, [fetchState]);

  const handleApprove = async (approvalId?: string) => {
    setIsApproving(true);
    setActionMessage(null);
    try {
      await approveWorkflow(id, approvalId);
      setActionMessage('Action approved successfully. Resuming LangGraph execution...');
      // Immediately refresh and trigger polling
      const updated = await fetchState();
      if (updated && (updated.status === 'IN_PROGRESS' || updated.status === 'PLAN')) {
        const interval = setInterval(async () => {
          const fresh = await fetchState();
          if (!fresh || (fresh.status !== 'IN_PROGRESS' && fresh.status !== 'PLAN')) {
            clearInterval(interval);
          }
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve workflow step.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (approvalId?: string) => {
    setIsApproving(true);
    setActionMessage(null);
    try {
      await rejectWorkflow(id, approvalId, 'Rejected by operator');
      setActionMessage('Action rejected.');
      await fetchState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject action.');
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading && !workflow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Loading Workflow Execution...</h2>
        <p className="text-slate-500 text-sm mt-1">Connecting to LangGraph state and database</p>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white p-8 rounded-2xl border border-red-200 shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Workflow Not Found or Unreachable</h2>
        <p className="text-slate-600 text-sm mb-6">{error}</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => fetchState()} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            Retry
          </button>
          <Link href="/workflows" className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200">
            Back to Workflows
          </Link>
        </div>
      </div>
    );
  }

  const isWaitingApproval = workflow?.status === 'WAITING_FOR_APPROVAL';
  const isRunning = workflow?.status === 'IN_PROGRESS' || workflow?.status === 'PLAN';
  const isCompleted = workflow?.status === 'COMPLETED';
  const isFailed = workflow?.status === 'FAILED';

  // Find pending approvals
  const pendingApprovals = workflow?.approvals?.filter(a => a.status === 'PENDING') || [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* HEADER */}
      <header className="bg-slate-950 text-white px-8 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">FLOWPILOT AI</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/50 text-green-400 border border-green-800/50">
              LIVE MODE
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">Real-time LangGraph + Qwen3 8B orchestration</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">ID: {id}</div>
            <div className="text-xs font-bold flex items-center gap-2 justify-end mt-1">
              {isRunning && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
              {isWaitingApproval && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
              {isCompleted && <span className="w-2 h-2 rounded-full bg-green-400" />}
              {isFailed && <span className="w-2 h-2 rounded-full bg-red-400" />}
              <span className={clsx(
                isCompleted ? "text-green-400" :
                isWaitingApproval ? "text-amber-400 font-extrabold" :
                isFailed ? "text-red-400" : "text-blue-400"
              )}>
                {workflow?.status}
              </span>
            </div>
          </div>
          <button 
            onClick={() => fetchState()} 
            title="Refresh status"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-xs transition-colors border border-slate-700 text-slate-200"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", isRunning && "animate-spin")} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-8 pt-8 flex flex-col gap-8 flex-1">
        
        {/* ACTION / NOTIFICATION BANNER */}
        {actionMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* HUMAN APPROVAL GATEWAY BANNER (IF WAITING) */}
        {isWaitingApproval && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-7 h-7 text-amber-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-amber-900">Human-in-the-Loop Authorization Required</h2>
                    <span className="bg-amber-200 text-amber-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                      Execution Paused
                    </span>
                  </div>
                  <p className="text-amber-800 text-sm mt-1">
                    An action in the generated plan requires manager approval before dispatching business communications or sensitive financial escalations.
                  </p>
                  
                  {pendingApprovals.length > 0 && (
                    <div className="mt-4 bg-white p-4 rounded-xl border border-amber-200">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pending Action Details:</div>
                      {pendingApprovals.map(appr => (
                        <div key={appr.id} className="text-sm text-slate-800 mb-2">
                          <span className="font-bold text-slate-900">Tool:</span> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700">{appr.action}</code>
                          <div className="text-xs text-slate-600 mt-1"><strong>Reason:</strong> {appr.reason || 'High-value or external action threshold triggered'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {getUser()?.role !== 'viewer' ? (
                  <>
                    <button
                      onClick={() => handleReject(pendingApprovals[0]?.id)}
                      disabled={isApproving}
                      className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(pendingApprovals[0]?.id)}
                      disabled={isApproving}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-600/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Approve & Resume Execution
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm italic border border-slate-200">
                    Your viewer role does not have permission to approve or reject actions.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. OBJECTIVE & EXECUTION SUMMARY */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Business Objective
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">Mode: {workflow?.mode}</span>
              <span className="text-xs font-mono text-slate-400">•</span>
              <span className="text-xs font-mono text-slate-500">AI Calls: {workflow?.ai_call_count ?? 0}</span>
            </div>
          </div>
          <p className="text-slate-800 text-lg font-medium border-l-4 border-blue-500 pl-4 py-1 bg-slate-50 rounded-r-lg">
            "{workflow?.objective}"
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-500 font-medium">Status</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{workflow?.status}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Plan Steps</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{workflow?.plan?.length ?? 0} generated</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Completed Actions</div>
              <div className="text-base font-bold text-green-600 mt-0.5">{workflow?.completed_actions?.length ?? 0}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Failures / Replans</div>
              <div className="text-base font-bold text-purple-600 mt-0.5">{workflow?.failures?.length ?? 0}</div>
            </div>
            </div>
          </div>
        </section>
        {/* 1.5 ADAPTIVE CONTEXT & RETRIEVAL METRICS */}
        {workflow?.retrieval_metrics && Object.keys(workflow.retrieval_metrics).length > 0 && (
          <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-blue-600" />
              Adaptive Context & Retrieval Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Tools Available</div>
                <div className="text-lg font-bold text-slate-900 mt-1">{workflow.retrieval_metrics.tools_available ?? 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Tools Retrieved</div>
                <div className="text-lg font-bold text-blue-600 mt-1">{workflow.retrieval_metrics.tools_retrieved ?? 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Historical Experiences</div>
                <div className="text-lg font-bold text-purple-600 mt-1">{workflow.retrieval_metrics.historical_experiences_retrieved ?? 0}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Tools Actually Used</div>
                <div className="text-lg font-bold text-green-600 mt-1">
                  {new Set(workflow.completed_actions?.map(a => a.tool_name) || []).size}
                </div>
              </div>
            </div>
            {workflow.retrieval_metrics.top_k_tools && workflow.retrieval_metrics.top_k_tools.length > 0 && (
              <div className="mt-4 text-sm">
                <span className="font-bold text-slate-700">Top-K Retrieved Tools: </span>
                <span className="text-slate-600 font-mono text-xs">{workflow.retrieval_metrics.top_k_tools.join(', ')}</span>
              </div>
            )}
          </section>
        )}

        {/* 1.6 CROSS-APPLICATION EXECUTION */}
        {workflow?.completed_actions && workflow.completed_actions.length > 0 && (
          <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm p-6 mt-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-purple-600" />
              Cross-Application Execution
            </h2>
            <div className="grid gap-2">
              {workflow.completed_actions.map((action, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-1.5 rounded text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Application Step</div>
                      <div className="text-sm font-bold text-slate-900">{action.tool_name}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    Status: {action.status}
                  </div>
                </div>
              ))}
              
              {workflow.status === 'WAITING_FOR_APPROVAL' && workflow.plan && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200 shadow-sm opacity-80 border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-1.5 rounded text-orange-600 animate-pulse">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-orange-600/80 font-medium">Application Step (Pending)</div>
                      <div className="text-sm font-bold text-orange-900">
                        {workflow.plan[workflow.current_step_index]?.tool}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-orange-700 bg-orange-100/50 px-2 py-1 rounded">
                    ⏸ Waiting for approval
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2. DYNAMIC PLAN & TOOL EXECUTION */}
        <section className="grid lg:grid-cols-2 gap-6">
          {/* Plan generated by Qwen3 8B */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-600" />
                Dynamic Plan Generated
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {workflow?.plan?.length ?? 0} steps
              </span>
            </div>

            {(!workflow?.plan || workflow.plan.length === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span>AI Planner analyzing objective...</span>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
                {workflow.plan.map((step, idx) => {
                  const isCurrent = workflow.current_step_index === idx && isRunning;
                  const isPast = idx < (workflow.completed_actions?.length ?? 0);
                  return (
                    <div 
                      key={idx}
                      className={clsx(
                        "p-3 rounded-xl border text-sm transition-all",
                        isCurrent ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20" :
                        isPast ? "bg-slate-50/50 border-slate-200 opacity-80" : "bg-white border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-mono font-bold text-slate-900">{step.tool}</span>
                        </div>
                        {step.requires_approval && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Approval
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 pl-7">{step.reason || 'Execute step'}</div>
                      {step.arguments && Object.keys(step.arguments).length > 0 && (
                        <div className="mt-2 pl-7">
                          <code className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded block overflow-x-auto">
                            {JSON.stringify(step.arguments)}
                          </code>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real Actions Executed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Actions Executed
              </h3>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono font-bold">
                {workflow?.completed_actions?.length ?? 0} executed
              </span>
            </div>

            {(!workflow?.completed_actions || workflow.completed_actions.length === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
                <Clock className="w-6 h-6 mb-2" />
                <span>Waiting for tool execution to commence...</span>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
                {workflow.completed_actions.map((act, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-mono font-bold text-slate-900">{act.tool_name}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-green-100 text-green-800 rounded">
                        {act.status}
                      </span>
                    </div>
                    {act.result && (
                      <div className="mt-2">
                        <pre className="text-[11px] bg-white border border-slate-200 p-2 rounded text-slate-700 overflow-x-auto font-mono">
                          {JSON.stringify(act.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3. FAILURES & REPLANNING SECTION */}
        {workflow?.failures && workflow.failures.length > 0 && (
          <section className="bg-purple-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-purple-900 font-bold mb-3">
              <RotateCcw className="w-5 h-5 text-purple-600" />
              Dynamic Failure Recovery & Replanning
            </div>
            <p className="text-sm text-purple-800/90 mb-4">
              FlowPilot detected an execution failure, captured error context, and autonomously triggered the Dynamic Planner to formulate a recovery plan.
            </p>
            <div className="space-y-2">
              {workflow.failures.map((f, idx) => (
                <div key={idx} className="bg-white border border-purple-200 p-3 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-red-600">{f.tool_name || 'Tool'} Execution Failed:</span>{' '}
                    <span className="text-slate-700">{f.error || 'Execution attempt failed'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold text-[10px] uppercase">
                    Recovered via Replan
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. REAL AUDIT EVENTS FOR THIS WORKFLOW */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-600" />
              Workflow Audit Trail
            </h3>
            <span className="text-xs text-slate-400 font-mono">{events.length} events logged to database</span>
          </div>

          {events.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No audit events recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase font-semibold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Event Type</th>
                    <th className="py-2.5 px-3">Tool</th>
                    <th className="py-2.5 px-3">Summary / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {events.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                        {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-800 font-semibold">{e.actor}</td>
                      <td className="py-2 px-3">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          e.event_type.includes('Failed') ? "bg-red-100 text-red-700" :
                          e.event_type.includes('Success') || e.event_type.includes('Completed') ? "bg-green-100 text-green-700" :
                          e.event_type.includes('Approval') ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-700"
                        )}>
                          {e.event_type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{e.tool || '—'}</td>
                      <td className="py-2 px-3 text-slate-700 font-sans text-xs max-w-md truncate">
                        {e.summary || (e.metadata_json ? JSON.stringify(e.metadata_json) : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 5. POST-EXECUTION REFLECTION & EXPERIENCE LEARNING */}
        {workflow?.reflection && (
          <section className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                Post-Execution Reflection
              </h3>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Completed
              </span>
            </div>
            
            <p className="text-sm text-indigo-800/90 mb-6 italic">
              "What did FlowPilot learn from this execution, and how does that affect the next one?"
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white/80 p-4 rounded-xl border border-indigo-100 shadow-sm">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Known Failure Pattern
                </div>
                <div className="text-sm text-slate-800 font-medium">
                  {workflow.reflection.failure_patterns.length > 0 
                    ? workflow.reflection.failure_patterns.join("; ") 
                    : "None detected"}
                </div>
              </div>
              
              <div className="bg-white/80 p-4 rounded-xl border border-indigo-100 shadow-sm">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Known Recovery Strategy
                </div>
                <div className="text-sm text-slate-800 font-medium">
                  {workflow.reflection.recovery_strategy.length > 0 
                    ? workflow.reflection.recovery_strategy.join("; ") 
                    : "Standard execution"}
                </div>
              </div>
            </div>

            <div className="bg-white/90 p-4 rounded-xl border border-indigo-100 shadow-sm">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Lessons Learned
              </div>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {workflow.reflection.lessons.map((lesson, idx) => (
                  <li key={idx}>{lesson}</li>
                ))}
              </ul>
              {workflow.reflection.lessons.length === 0 && (
                <div className="text-sm text-slate-500">No specific lessons recorded for this run.</div>
              )}
            </div>
            
            <div className="mt-4 flex items-center justify-between text-xs text-indigo-600/70 border-t border-indigo-200/50 pt-3">
              <div className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5" /> Saved to Execution Memory
              </div>
              <div>Domain: {workflow.reflection.workflow_domain}</div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
