"use client";

import {
  Workflow, CheckCircle, Clock, AlertCircle,
  TrendingUp, TrendingDown, RotateCcw, Zap,
  RefreshCw, PlusCircle, ArrowRight, Activity,
  ShieldCheck, BarChart2, Users, Database
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { getMetrics, getWorkflows, getBenchmark, DashboardMetrics, WorkflowListItem } from "@/lib/api";

/* ─────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────── */
function KpiSkeleton() {
  return (
    <div className="fp-kpi-card">
      <div className="fp-skeleton h-3 w-20 mb-4 rounded" />
      <div className="fp-skeleton h-9 w-16 mb-2 rounded" />
      <div className="fp-skeleton h-2.5 w-28 rounded" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <tr>
      <td className="py-3 px-4"><div className="fp-skeleton h-3 w-48 rounded" /></td>
      <td className="py-3 px-4"><div className="fp-skeleton h-3 w-16 rounded" /></td>
      <td className="py-3 px-4"><div className="fp-skeleton h-3 w-20 rounded" /></td>
      <td className="py-3 px-4"><div className="fp-skeleton h-3 w-24 rounded" /></td>
    </tr>
  );
}

/* ─────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "fp-badge fp-badge-completed",
    RUNNING: "fp-badge fp-badge-running",
    FAILED: "fp-badge fp-badge-failed",
    WAITING_FOR_APPROVAL: "fp-badge fp-badge-waiting",
    RECOVERED: "fp-badge fp-badge-recovered",
  };
  const cls = map[status] ?? "fp-badge fp-badge-pending";
  const label = status === "WAITING_FOR_APPROVAL" ? "WAITING" : status;
  return <span className={cls}>{label}</span>;
}

/* ─────────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────────── */
interface KpiProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color?: string;
  trend?: "up" | "down" | "neutral";
  sub?: string;
  loading?: boolean;
}

function KpiCard({ label, value, icon: Icon, color = "var(--fp-indigo)", trend, sub, loading }: KpiProps) {
  if (loading) return <KpiSkeleton />;
  return (
    <div className="fp-kpi-card">
      <div className="flex items-start justify-between mb-3">
        <span className="fp-label">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="fp-metric" style={{ color: "var(--fp-text)" }}>
        {value}
      </div>
      {(sub || trend) && (
        <div className="mt-2 flex items-center gap-1.5">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-[var(--fp-success)]" />}
          {trend === "down" && <TrendingDown className="w-3 h-3 text-[var(--fp-error)]" />}
          {sub && <span className="fp-small">{sub}</span>}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   BACKEND BANNER
───────────────────────────────────────────────── */
function BackendBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-lg border text-sm mb-6"
      style={{
        background: "var(--fp-error-bg)",
        borderColor: "var(--fp-error-border)",
        color: "var(--fp-error)",
      }}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span><strong>Backend offline</strong> — {error}</span>
      </div>
      <button onClick={onRetry} className="fp-btn fp-btn-secondary text-xs px-3 py-1.5">
        Retry
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────── */
const defaultMetrics: DashboardMetrics = {
  invoices_analyzed: 0, actionable_cases: 0, monitoring_cases: 0,
  approval_requests: 0, approved: 0, rejected: 0,
  business_actions: 0, successful_actions: 0, failed_attempts: 0,
  recovered_failures: 0, replans: 0, unresolved: 0
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setBackendError(null);
    try {
      const [m, wfList, bench] = await Promise.all([
        getMetrics(),
        getWorkflows().catch(() => []),
        getBenchmark().catch(() => null)
      ]);
      setMetrics(m);
      setWorkflows(wfList);
      setBenchmark(bench);
      setLastRefresh(new Date());
    } catch (err) {
      setBackendError(err instanceof Error ? err.message : "Unable to connect to FlowPilot backend.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const successRate =
    metrics.business_actions > 0
      ? Math.round((metrics.successful_actions / metrics.business_actions) * 100)
      : 0;

  const kpis: KpiProps[] = [
    {
      label: "Active Workflows",
      value: workflows.filter(w => w.status === "RUNNING").length,
      icon: Workflow,
      color: "var(--fp-indigo)",
      sub: "Currently executing",
    },
    {
      label: "Completed",
      value: workflows.filter(w => w.status === "COMPLETED").length,
      icon: CheckCircle,
      color: "var(--fp-success)",
      trend: "up",
      sub: "All time",
    },
    {
      label: "Pending Approvals",
      value: metrics.approval_requests,
      icon: ShieldCheck,
      color: "var(--fp-warning)",
      sub: "Awaiting review",
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: TrendingUp,
      color: successRate >= 80 ? "var(--fp-success)" : "var(--fp-warning)",
      sub: `${metrics.successful_actions} of ${metrics.business_actions} actions`,
    },
    {
      label: "Recovered Failures",
      value: metrics.recovered_failures,
      icon: RotateCcw,
      color: "var(--fp-violet)",
      sub: "Auto-healed by AI",
    },
    {
      label: "Re-plans Triggered",
      value: metrics.replans,
      icon: Zap,
      color: "var(--fp-teal)",
      sub: "Dynamic adaptation",
    },
    {
      label: "Invoices Analyzed",
      value: metrics.invoices_analyzed,
      icon: Database,
      color: "var(--fp-indigo)",
      sub: "Business data",
    },
    {
      label: "Unresolved",
      value: metrics.unresolved,
      icon: AlertCircle,
      color: metrics.unresolved > 0 ? "var(--fp-error)" : "var(--fp-success)",
      sub: "Needs attention",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="fp-h2">Overview</h2>
          <p className="fp-small mt-0.5">
            {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString()}` : "Loading data…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Backend status pill */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border"
            style={
              backendError
                ? { background: "var(--fp-error-bg)", borderColor: "var(--fp-error-border)", color: "var(--fp-error)" }
                : { background: "var(--fp-success-bg)", borderColor: "var(--fp-success-border)", color: "var(--fp-success)" }
            }
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: backendError ? "var(--fp-error)" : "var(--fp-success)", ...(backendError ? {} : { animation: "pulse 2s infinite" }) }}
            />
            {backendError ? "Backend Offline" : "Live"}
          </span>

          <Link href="/workflows/new" className="fp-btn fp-btn-primary">
            <PlusCircle className="w-4 h-4" />
            New Workflow
          </Link>

          <button
            onClick={loadData}
            className="fp-btn fp-btn-secondary"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {backendError && <BackendBanner error={backendError} onRetry={loadData} />}

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        {kpis.slice(0, 4).map(k => (
          <KpiCard key={k.label} {...k} loading={isLoading} />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.slice(4).map(k => (
          <KpiCard key={k.label} {...k} loading={isLoading} />
        ))}
      </div>

      {/* ── Lower 2-col ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Workflows — 2/3 width */}
        <div className="lg:col-span-2 fp-card">
          <div className="fp-card-header">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: "var(--fp-indigo)" }} />
              <span className="fp-h3">Recent Workflows</span>
            </div>
            <Link
              href="/workflows"
              className="flex items-center gap-1 text-[12px] font-medium"
              style={{ color: "var(--fp-indigo)" }}
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="fp-table">
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {isLoading && workflows.length === 0
                  ? [1,2,3,4].map(i => <RowSkeleton key={i} />)
                  : workflows.length === 0
                  ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="fp-empty">
                          <Workflow className="w-8 h-8" style={{ color: "var(--fp-text-faint)" }} />
                          <p className="fp-h3" style={{ color: "var(--fp-text-muted)" }}>No workflows yet</p>
                          <p className="fp-small">Create your first intelligent workflow to get started.</p>
                          <Link href="/workflows/new" className="fp-btn fp-btn-primary mt-2">
                            <PlusCircle className="w-4 h-4" /> Create Workflow
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                  : workflows.slice(0, 6).map(wf => (
                    <tr key={wf.id} style={{ cursor: "pointer" }}>
                      <td>
                        <Link
                          href={`/workflows/${wf.id}`}
                          className="font-medium text-[var(--fp-text)] hover:text-[var(--fp-indigo)] transition-colors block max-w-xs truncate"
                        >
                          {wf.objective}
                        </Link>
                        <span className="fp-small font-mono">#{wf.id.slice(0, 8)}</span>
                      </td>
                      <td><StatusBadge status={wf.status} /></td>
                      <td>
                        <span className="fp-small font-medium capitalize">{wf.mode}</span>
                      </td>
                      <td>
                        <span className="fp-small">
                          {wf.created_at ? new Date(wf.created_at).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/workflows/${wf.id}`}
                          className="p-1 rounded hover:bg-[var(--fp-indigo-light)] transition-colors inline-flex"
                          style={{ color: "var(--fp-text-muted)" }}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Workflow Health — 1/3 width */}
        <div className="fp-card">
          <div className="fp-card-header">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" style={{ color: "var(--fp-indigo)" }} />
              <span className="fp-h3">Workflow Health</span>
            </div>
          </div>
          <div className="fp-card-body space-y-4">
            {[
              {
                label: "Completed",
                value: workflows.filter(w => w.status === "COMPLETED").length,
                total: workflows.length,
                color: "var(--fp-success)",
              },
              {
                label: "Running",
                value: workflows.filter(w => w.status === "RUNNING").length,
                total: workflows.length,
                color: "var(--fp-indigo)",
              },
              {
                label: "Waiting Approval",
                value: workflows.filter(w => w.status === "WAITING_FOR_APPROVAL").length,
                total: workflows.length,
                color: "var(--fp-warning)",
              },
              {
                label: "Failed",
                value: workflows.filter(w => w.status === "FAILED").length,
                total: workflows.length,
                color: "var(--fp-error)",
              },
            ].map(stat => {
              const pct = workflows.length > 0 ? Math.round((stat.value / workflows.length) * 100) : 0;
              return (
                <div key={stat.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="fp-small font-medium">{stat.label}</span>
                    <span className="fp-small font-semibold">{stat.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--fp-border)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: stat.color }}
                    />
                  </div>
                </div>
              );
            })}

            {/* AI metrics */}
            <div
              className="mt-4 pt-4 space-y-3"
              style={{ borderTop: "1px solid var(--fp-border-light)" }}
            >
              <p className="fp-label">AI Operations</p>
              {[
                { label: "Approval Requests", value: metrics.approval_requests, icon: ShieldCheck, color: "var(--fp-warning)" },
                { label: "Re-plans", value: metrics.replans, icon: Zap, color: "var(--fp-violet)" },
                { label: "Recovered", value: metrics.recovered_failures, icon: RotateCcw, color: "var(--fp-success)" },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                    <span className="fp-small">{m.label}</span>
                  </div>
                  <span className="fp-small font-semibold">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Benchmark Results (only if backend returned data) ── */}
      {benchmark?.runs_executed > 0 && (
        <div className="fp-card">
          <div className="fp-card-header">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: "var(--fp-indigo)" }} />
              <span className="fp-h3">Evaluation Suite</span>
              <span className="fp-badge fp-badge-running" style={{ fontSize: 10 }}>
                {benchmark.runs_executed} Runs
              </span>
            </div>
          </div>
          <div className="fp-card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Success Rate",      value: `${benchmark.aggregate_success_rate?.toFixed(1)}%`,    color: "var(--fp-success)" },
                { label: "Final-State Match", value: `${benchmark.final_state_correctness?.toFixed(1)}%`,   color: "var(--fp-indigo)" },
                { label: "Failure Recovery",  value: `${benchmark.recovery_success_rate?.toFixed(1)}%`,     color: "var(--fp-violet)" },
                { label: "Policy Safety",     value: `${benchmark.approval_correctness?.toFixed(1)}%`,      color: "var(--fp-teal)" },
              ].map(s => (
                <div key={s.label} className="text-center p-4 rounded-lg" style={{ background: "var(--fp-surface-2)" }}>
                  <div className="fp-label mb-2">{s.label}</div>
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
