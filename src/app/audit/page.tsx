"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Filter, History, Database, CheckCircle, ShieldAlert, AlertCircle, FileText, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { getAllAuditEvents, AuditEvent } from '@/lib/api';

export default function AuditTrail() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAudit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllAuditEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit events from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  const filters = ['All', 'Workflow Started', 'Task Success', 'Approval Required', 'Workflow Paused', 'Workflow Resumed', 'Workflow Completed'];
  
  const filteredEvents = filter === 'All' 
    ? events 
    : events.filter(e => e.event_type.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Unified Audit Trail
            </h1>
            <p className="text-xs text-slate-500">Immutable ledger of autonomous actions, human approvals, and dynamic replans</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            {events.length} Events Logged
          </span>
          <button 
            onClick={loadAudit}
            title="Refresh audit log" 
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-8 pt-6 flex flex-col gap-6 flex-1">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* AUDIT TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {isLoading && events.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <div className="text-sm">Fetching audit records from database...</div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <div className="text-base font-semibold text-slate-700">No audit events match your filter</div>
              <p className="text-xs text-slate-500 mt-1">Audit events are automatically recorded during workflow runs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-500 uppercase font-semibold">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Workflow</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Tool</th>
                    <th className="py-3 px-4">Summary / Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {filteredEvents.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/workflows/${e.workflow_id}`} className="text-blue-600 hover:underline">
                          #{e.workflow_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 font-sans">
                        {e.actor}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          e.event_type.toLowerCase().includes('failed') ? 'bg-red-100 text-red-700' :
                          e.event_type.toLowerCase().includes('success') || e.event_type.toLowerCase().includes('completed') ? 'bg-green-100 text-green-700' :
                          e.event_type.toLowerCase().includes('approval') || e.event_type.toLowerCase().includes('paused') ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {e.event_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {e.tool ? <code className="bg-slate-100 px-1 py-0.5 rounded">{e.tool}</code> : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-sans text-xs max-w-md truncate">
                        {e.summary || (e.metadata_json ? JSON.stringify(e.metadata_json) : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
