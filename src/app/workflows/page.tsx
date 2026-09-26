"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Workflow as WorkflowIcon, PlusCircle, ArrowRight, RefreshCw,
  AlertCircle, Search, Filter, Clock, CheckCircle
} from "lucide-react";
import { getWorkflows, WorkflowListItem } from "@/lib/api";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED:            "fp-badge fp-badge-completed",
    RUNNING:              "fp-badge fp-badge-running",
    FAILED:               "fp-badge fp-badge-failed",
    WAITING_FOR_APPROVAL: "fp-badge fp-badge-waiting",
    RECOVERED:            "fp-badge fp-badge-recovered",
  };
  const cls = map[status] ?? "fp-badge fp-badge-pending";
  const label = status === "WAITING_FOR_APPROVAL" ? "WAITING" : status;
  return <span className={cls}>{label}</span>;
}

function RowSkeleton() {
  return (
    <tr>
      <td className="py-3.5 px-4"><div className="fp-skeleton h-3.5 w-56 rounded mb-1.5" /><div className="fp-skeleton h-2.5 w-24 rounded" /></td>
      <td className="py-3.5 px-4"><div className="fp-skeleton h-5 w-20 rounded" /></td>
      <td className="py-3.5 px-4"><div className="fp-skeleton h-3 w-16 rounded" /></td>
      <td className="py-3.5 px-4"><div className="fp-skeleton h-3 w-24 rounded" /></td>
      <td className="py-3.5 px-4"><div className="fp-skeleton h-3 w-16 rounded" /></td>
    </tr>
  );
}

const STATUS_OPTIONS = ["All", "RUNNING", "COMPLETED", "WAITING_FOR_APPROVAL", "FAILED", "RECOVERED"];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadWorkflows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWorkflows();
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflows.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);

  const filtered = workflows.filter(wf => {
    const matchSearch = !search || wf.objective.toLowerCase().includes(search.toLowerCase()) || wf.id.includes(search);
    const matchStatus = statusFilter === "All" || wf.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total:     workflows.length,
    running:   workflows.filter(w => w.status === "RUNNING").length,
    completed: workflows.filter(w => w.status === "COMPLETED").length,
    waiting:   workflows.filter(w => w.status === "WAITING_FOR_APPROVAL").length,
    failed:    workflows.filter(w => w.status === "FAILED").length,
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="fp-h2">All Workflows</h2>
          <p className="fp-small mt-0.5">{stats.total} total • {stats.running} running • {stats.waiting} awaiting approval</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/workflows/new" className="fp-btn fp-btn-primary">
            <PlusCircle className="w-4 h-4" /> New Workflow
          </Link>
          <button onClick={loadWorkflows} className="fp-btn fp-btn-secondary" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Stat Pills ── */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total",     value: stats.total,     color: "var(--fp-indigo)",  bg: "var(--fp-indigo-light)" },
          { label: "Running",   value: stats.running,   color: "#1d4ed8",           bg: "#dbeafe" },
          { label: "Completed", value: stats.completed, color: "var(--fp-success)", bg: "var(--fp-success-bg)" },
          { label: "Waiting",   value: stats.waiting,   color: "var(--fp-warning)", bg: "var(--fp-warning-bg)" },
          { label: "Failed",    value: stats.failed,    color: "var(--fp-error)",   bg: "var(--fp-error-bg)" },
        ].map(s => (
          <div
            key={s.label}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer"
            style={{ background: s.bg, color: s.color, borderColor: `${s.color}33` }}
            onClick={() => setStatusFilter(s.label === "Total" ? "All" : s.label.toUpperCase())}
          >
            <span>{s.value}</span>
            <span className="font-normal text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border text-sm"
          style={{ background: "var(--fp-error-bg)", borderColor: "var(--fp-error-border)", color: "var(--fp-error)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="fp-card">
        {/* Toolbar */}
        <div className="fp-card-header">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: "var(--fp-text-faint)" }} />
              <input
                type="text"
                className="fp-input pl-8"
                placeholder="Search workflows…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 220, height: 34, fontSize: 12 }}
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 flex-wrap">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border"
                  style={
                    statusFilter === opt
                      ? { background: "var(--fp-indigo)", color: "#fff", borderColor: "var(--fp-indigo)" }
                      : { background: "var(--fp-surface)", color: "var(--fp-text-muted)", borderColor: "var(--fp-border)" }
                  }
                >
                  {opt === "WAITING_FOR_APPROVAL" ? "WAITING" : opt}
                </button>
              ))}
            </div>
          </div>

          <span className="fp-small font-medium">{filtered.length} results</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="fp-table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Mode</th>
                <th>Created</th>
                <th>Completed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading && workflows.length === 0
                ? [1,2,3,4,5].map(i => <RowSkeleton key={i} />)
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="fp-empty">
                        <WorkflowIcon className="w-10 h-10" style={{ color: "var(--fp-text-faint)" }} />
                        <p className="fp-h3" style={{ color: "var(--fp-text-muted)" }}>No workflows found</p>
                        <p className="fp-small">Try adjusting your search or filter, or create a new workflow.</p>
                        <Link href="/workflows/new" className="fp-btn fp-btn-primary mt-2">
                          <PlusCircle className="w-4 h-4" /> Create Workflow
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
                : filtered.map(wf => (
                  <tr key={wf.id}>
                    <td>
                      <Link
                        href={`/workflows/${wf.id}`}
                        className="font-medium hover:text-[var(--fp-indigo)] transition-colors block max-w-xs truncate"
                        style={{ color: "var(--fp-text)" }}
                      >
                        {wf.objective}
                      </Link>
                      <span className="text-[11px] font-mono" style={{ color: "var(--fp-text-faint)" }}>
                        #{wf.id.slice(0, 8)}
                      </span>
                    </td>
                    <td><StatusBadge status={wf.status} /></td>
                    <td>
                      <span className="fp-small capitalize">{wf.mode}</span>
                    </td>
                    <td>
                      <span className="fp-small">
                        {wf.created_at ? new Date(wf.created_at).toLocaleString() : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="fp-small">
                        {wf.completed_at ? new Date(wf.completed_at).toLocaleString() : "—"}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/workflows/${wf.id}`}
                        className="fp-btn fp-btn-ghost text-xs"
                      >
                        Open <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
