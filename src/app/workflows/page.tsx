"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Workflow as WorkflowIcon, PlusCircle, ArrowRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getWorkflows, WorkflowListItem } from '@/lib/api';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWorkflows();
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  return (
    <div className="max-w-6xl mx-auto w-full pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workflows</h1>
          <p className="text-slate-500 mt-1">Manage and inspect all autonomous business execution workflows.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/workflows/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 text-sm"
          >
            <PlusCircle className="w-4 h-4" /> New Workflow
          </Link>
          <button 
            onClick={loadWorkflows}
            title="Refresh workflows list"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="font-semibold text-sm text-slate-700">All Workflows ({workflows.length})</div>
          <span className="text-xs text-slate-400 font-mono">Live PostgreSQL/SQLite backend</span>
        </div>

        {isLoading && workflows.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <div className="text-sm">Loading workflows...</div>
          </div>
        ) : workflows.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <WorkflowIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <div className="text-base font-semibold text-slate-700">No workflows found</div>
            <p className="text-xs text-slate-500 mt-1 mb-4">Create your first autonomous workflow with a natural-language goal.</p>
            <Link
              href="/workflows/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4" /> Create Workflow
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {workflows.map(wf => (
              <div key={wf.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      wf.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      wf.status === 'WAITING_FOR_APPROVAL' ? 'bg-amber-100 text-amber-800 animate-pulse font-extrabold' :
                      wf.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {wf.status}
                    </span>
                    <span className="text-xs font-mono text-slate-400">#{wf.id.slice(0, 8)}</span>
                    <span className="text-xs text-slate-400">• Mode: {wf.mode}</span>
                  </div>
                  <Link href={`/workflows/${wf.id}`} className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors block">
                    {wf.objective}
                  </Link>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
                    <span>Created: {wf.created_at ? new Date(wf.created_at).toLocaleString() : '—'}</span>
                    {wf.completed_at && <span>Completed: {new Date(wf.completed_at).toLocaleString()}</span>}
                  </div>
                </div>

                <Link
                  href={`/workflows/${wf.id}`}
                  className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0"
                >
                  <span>Open Execution</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
