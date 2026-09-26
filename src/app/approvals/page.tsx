"use client";

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, ShieldCheck, AlertCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getApprovals, approveWorkflow, rejectWorkflow, Approval } from '@/lib/api';

export default function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadApprovals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getApprovals(filter === 'ALL' ? undefined : filter);
      setApprovals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals from backend.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const handleApprove = async (approval: Approval) => {
    setProcessingId(approval.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await approveWorkflow(approval.workflow_id, approval.id);
      setSuccessMsg(`Action approved! Resumed LangGraph execution for workflow #${approval.workflow_id.slice(0, 8)}.`);
      await loadApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve action on backend.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (approval: Approval) => {
    setProcessingId(approval.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await rejectWorkflow(approval.workflow_id, approval.id, 'Rejected by operator');
      setSuccessMsg(`Action rejected for workflow #${approval.workflow_id.slice(0, 8)}.`);
      await loadApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject action on backend.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

  return (
    <div className="max-w-6xl mx-auto w-full pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals Gateway</h1>
          <p className="text-slate-500 mt-1">Review actions requiring Human-in-the-Loop authorization.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'PENDING' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'APPROVED' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'ALL' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All
            </button>
          </div>
          <button 
            onClick={loadApprovals} 
            title="Refresh approvals"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="font-semibold text-sm text-slate-700">
            {filter === 'PENDING' ? `Pending Human Approvals (${approvals.length})` : `Approval Records (${approvals.length})`}
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time DB synced</span>
        </div>
        
        {isLoading && approvals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <span className="text-sm">Loading approval gateway state...</span>
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <div className="text-base font-semibold text-slate-700">No pending approvals</div>
            <p className="text-xs text-slate-500 mt-1">All workflows are currently running autonomously or completed.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {approvals.map(approval => {
              const isProcessing = processingId === approval.id;
              const isPending = approval.status === 'PENDING';
              return (
                <div key={approval.id} className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isPending ? 'bg-amber-100 text-amber-800' :
                          approval.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {approval.status}
                        </span>
                        <span className="text-sm text-slate-500">
                          Workflow: <Link href={`/workflows/${approval.workflow_id}`} className="text-blue-600 font-mono hover:underline">
                            #{approval.workflow_id.slice(0, 8)}
                          </Link>
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Authorize Action: <code className="text-blue-600 font-mono">{approval.action}</code>
                      </h3>
                      {approval.workflow_objective && (
                        <p className="text-xs text-slate-500 mt-0.5 italic">
                          "{approval.workflow_objective}"
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {approval.requested_at ? new Date(approval.requested_at).toLocaleTimeString() : '—'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                    <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2">Policy Gate & Reason:</h4>
                    <p className="text-sm text-slate-700">
                      {approval.reason || 'This action requires explicit human confirmation before dispatching live financial communication or updating account records.'}
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => handleReject(approval)}
                        disabled={isProcessing}
                        className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                        Reject Action
                      </button>
                      <button 
                        onClick={() => handleApprove(approval)}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm text-sm disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve & Execute
                      </button>
                    </div>
                  )}

                  {!isPending && (
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Resolved by: <strong>{approval.approved_by || 'SYSTEM'}</strong></span>
                      {approval.approved_at && (
                        <span>• Time: {new Date(approval.approved_at).toLocaleTimeString()}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
