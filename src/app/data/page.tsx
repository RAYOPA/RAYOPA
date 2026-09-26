"use client";

import { Database, PlusCircle, Search, Filter, Server, ArrowRight } from "lucide-react";

export default function BusinessData() {
  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="fp-h2">Business Data</h2>
          <p className="fp-small mt-0.5">Manage data sources, databases, and connected storage.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="fp-btn fp-btn-primary">
            <PlusCircle className="w-4 h-4" /> Connect Source
          </button>
        </div>
      </div>

      <div className="fp-card">
        <div className="fp-empty">
          <Database className="w-10 h-10" style={{ color: "var(--fp-text-faint)" }} />
          <p className="fp-h3 mt-2" style={{ color: "var(--fp-text-muted)" }}>No external data sources connected</p>
          <p className="fp-small max-w-sm mx-auto">
            Connect FlowPilot to your PostgreSQL, Snowflake, or REST APIs to allow autonomous agents to read and write business data.
          </p>
          <button className="fp-btn fp-btn-secondary mt-4">
            <Server className="w-4 h-4" /> Browse Connectors <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
