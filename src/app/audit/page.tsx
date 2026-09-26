"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Filter, History, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { getAllAuditEvents, AuditEvent } from "@/lib/api";

const FILTERS = ["All", "Workflow Started", "Task Success", "Approval Required", "Workflow Paused", "Workflow Resumed", "Workflow Completed"];

export default function AuditTrail() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAudit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllAuditEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch audit events.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAudit(); }, [loadAudit]);

  const filteredEvents = filter === "All"
    ? events
    : events.filter(e => e.event_type.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="fp-h2">Unified Audit Trail</h2>
          <p className="fp-small mt-0.5">Immutable ledger of autonomous actions, human approvals, and dynamic replans.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="fp-small font-mono px-3 py-1.5 rounded-lg border" style={{ background: "var(--fp-surface-2)", borderColor: "var(--fp-border-light)" }}>
            {events.length} Events Logged
          </span>
          <button onClick={loadAudit} className="fp-btn fp-btn-secondary" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border text-sm"
          style={{ background: "var(--fp-error-bg)", borderColor: "var(--fp-error-border)", color: "var(--fp-error)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border" style={{ background: "var(--fp-surface)", borderColor: "var(--fp-border)", boxShadow: "var(--fp-shadow-sm)" }}>
        <div className="fp-label flex items-center gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </div>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-md text-[12px] font-semibold transition-colors border"
            style={
              filter === f
                ? { background: "var(--fp-indigo)", color: "#fff", borderColor: "var(--fp-indigo)" }
                : { background: "var(--fp-surface-2)", color: "var(--fp-text-muted)", borderColor: "transparent" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Audit Table ── */}
      <div className="fp-card">
        {isLoading && events.length === 0 ? (
          <div className="fp-empty">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--fp-indigo)" }} />
            <p className="fp-small mt-2">Fetching audit records from database...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="fp-empty">
            <History className="w-10 h-10" style={{ color: "var(--fp-text-faint)" }} />
            <p className="fp-h3 mt-2" style={{ color: "var(--fp-text-muted)" }}>No audit events match your filter</p>
            <p className="fp-small">Audit events are automatically recorded during workflow runs.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="fp-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Workflow</th>
                  <th>Actor</th>
                  <th>Event</th>
                  <th>Tool</th>
                  <th>Summary / Metadata</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[12px]">
                {filteredEvents.map(e => {
                  const type = e.event_type.toLowerCase();
                  let badgeClass = "fp-badge ";
                  if (type.includes("failed")) badgeClass += "fp-badge-failed";
                  else if (type.includes("success") || type.includes("completed")) badgeClass += "fp-badge-completed";
                  else if (type.includes("approval") || type.includes("paused")) badgeClass += "fp-badge-waiting";
                  else badgeClass += "fp-badge-running";

                  return (
                    <tr key={e.id}>
                      <td style={{ color: "var(--fp-text-faint)" }}>
                        {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : "—"}
                      </td>
                      <td>
                        <Link href={`/workflows/${e.workflow_id}`} className="hover:underline" style={{ color: "var(--fp-indigo)" }}>
                          #{e.workflow_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="font-sans font-semibold" style={{ color: "var(--fp-text)" }}>
                        {e.actor}
                      </td>
                      <td>
                        <span className={badgeClass}>{e.event_type}</span>
                      </td>
                      <td style={{ color: "var(--fp-text-2)" }}>
                        {e.tool ? <code className="px-1.5 py-0.5 rounded" style={{ background: "var(--fp-surface-3)" }}>{e.tool}</code> : "—"}
                      </td>
                      <td className="font-sans" style={{ color: "var(--fp-text-2)" }}>
                        <div className="max-w-md truncate">
                          {e.summary || (e.metadata_json ? JSON.stringify(e.metadata_json) : "—")}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
