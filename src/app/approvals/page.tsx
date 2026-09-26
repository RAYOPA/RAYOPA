"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, ShieldCheck, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getApprovals, approveWorkflow, rejectWorkflow, Approval } from "@/lib/api";

const FILTERS = ["PENDING", "APPROVED", "ALL"] as const;
type FilterType = typeof FILTERS[number];

export default function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [filter, setFilter] = useState<FilterType>("PENDING");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadApprovals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getApprovals(filter === "ALL" ? undefined : filter);
      setApprovals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadApprovals(); }, [loadApprovals]);

  const handleApprove = async (approval: Approval) => {
    setProcessingId(approval.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await approveWorkflow(approval.workflow_id, approval.id);
      setSuccessMsg(`Action approved! Resumed execution for workflow #${approval.workflow_id.slice(0, 8)}.`);
      await loadApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve action.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (approval: Approval) => {
    setProcessingId(approval.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await rejectWorkflow(approval.workflow_id, approval.id, "Rejected by operator");
      setSuccessMsg(`Action rejected for workflow #${approval.workflow_id.slice(0, 8)}.`);
      await loadApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject action.");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = filter === "PENDING" ? approvals.length : approvals.filter(a => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="fp-h2">Approvals Gateway</h2>
          <p className="fp-small mt-0.5">Review actions requiring human-in-the-loop authorization.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--fp-surface-3)" }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
                style={
                  filter === f
                    ? { background: "var(--fp-surface)", color: "var(--fp-text)", boxShadow: "var(--fp-shadow-sm)" }
                    : { color: "var(--fp-text-muted)" }
                }
              >
                {f === "PENDING" ? `Pending (${pendingCount})` : f === "APPROVED" ? "Approved" : "All"}
              </button>
            ))}
          </div>

          <button onClick={loadApprovals} className="fp-btn fp-btn-secondary" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border text-sm"
          style={{ background: "var(--fp-success-bg)", borderColor: "var(--fp-success-border)", color: "var(--fp-success)" }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border text-sm"
          style={{ background: "var(--fp-error-bg)", borderColor: "var(--fp-error-border)", color: "var(--fp-error)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── List ── */}
      <div className="fp-card overflow-hidden">
        <div className="fp-card-header bg-[var(--fp-surface-2)]">
          <div className="fp-h3">
            {filter === "PENDING" ? `Pending Approvals (${approvals.length})` : `Approval Records (${approvals.length})`}
          </div>
          <span className="fp-small font-mono">Real-time DB synced</span>
        </div>

        {isLoading && approvals.length === 0 ? (
          <div className="fp-empty">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--fp-indigo)" }} />
            <p className="fp-small">Loading approval gateway state...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="fp-empty">
            <ShieldCheck className="w-10 h-10" style={{ color: "var(--fp-text-faint)" }} />
            <p className="fp-h3" style={{ color: "var(--fp-text-muted)" }}>No pending approvals</p>
            <p className="fp-small">All workflows are currently running autonomously or completed.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--fp-border-light)]">
            {approvals.map(approval => {
              const isProcessing = processingId === approval.id;
              const isPending = approval.status === "PENDING";
              return (
                <div key={approval.id} className="p-5 sm:p-6 hover:bg-[var(--fp-surface-2)] transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`fp-badge ${
                          isPending ? "fp-badge-waiting" :
                          approval.status === "APPROVED" ? "fp-badge-completed" : "fp-badge-failed"
                        }`}>
                          {approval.status}
                        </span>
                        <span className="fp-small">
                          Workflow: <Link href={`/workflows/${approval.workflow_id}`} className="font-mono hover:underline" style={{ color: "var(--fp-indigo)" }}>
                            #{approval.workflow_id.slice(0, 8)}
                          </Link>
                        </span>
                      </div>
                      <h3 className="text-lg font-bold" style={{ color: "var(--fp-text)" }}>
                        Authorize Action: <code className="font-mono text-sm px-1.5 py-0.5 rounded ml-1" style={{ background: "var(--fp-indigo-light)", color: "var(--fp-indigo-hover)" }}>{approval.action}</code>
                      </h3>
                      {approval.workflow_objective && (
                        <p className="text-sm mt-1" style={{ color: "var(--fp-text-2)" }}>
                          “{approval.workflow_objective}”
                        </p>
                      )}
                    </div>
                    <div className="fp-small font-mono shrink-0">
                      {approval.requested_at ? new Date(approval.requested_at).toLocaleString() : "—"}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border mb-6" style={{ background: "var(--fp-surface-2)", borderColor: "var(--fp-border)" }}>
                    <h4 className="fp-label mb-2 text-[10px]">Policy Gate & Reason:</h4>
                    <p className="text-[13px]" style={{ color: "var(--fp-text-2)" }}>
                      {approval.reason || "This action requires explicit human confirmation before dispatching live financial communication or updating account records."}
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleReject(approval)}
                        disabled={isProcessing}
                        className="fp-btn fp-btn-secondary"
                      >
                        <XCircle className="w-4 h-4" style={{ color: "var(--fp-error)" }} />
                        Reject Action
                      </button>
                      <button
                        onClick={() => handleApprove(approval)}
                        disabled={isProcessing}
                        className="fp-btn fp-btn-primary"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve & Execute
                      </button>
                    </div>
                  )}

                  {!isPending && (
                    <div className="flex items-center gap-2 fp-small">
                      <span>Resolved by: <strong style={{ color: "var(--fp-text)" }}>{approval.approved_by || "SYSTEM"}</strong></span>
                      {approval.approved_at && (
                        <span>• Time: {new Date(approval.approved_at).toLocaleString()}</span>
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
