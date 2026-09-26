"use client";

import { Activity, CheckCircle, AlertCircle, Clock, Workflow as WorkflowIcon, RotateCcw, ArrowRight, Server, Zap, Database, PlayCircle, PlusCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { getMetrics, getWorkflows, getBenchmark, DashboardMetrics, WorkflowListItem } from '@/lib/api';

const defaultMetrics: DashboardMetrics = {
  invoices_analyzed: 0,
  actionable_cases: 0,
  monitoring_cases: 0,
  approval_requests: 0,
  approved: 0,
  rejected: 0,
  business_actions: 0,
  successful_actions: 0,
  failed_attempts: 0,
  recovered_failures: 0,
  replans: 0,
  unresolved: 0
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

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
    } catch (err) {
      setBackendError(err instanceof Error ? err.message : 'Unable to connect to FlowPilot backend server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Poll metrics periodically while viewing dashboard
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="flex flex-col gap-12 w-full max-w-6xl mx-auto pb-24">
      
      {/* LANDING / DASHBOARD HERO */}
      <section className="bg-[#5347CE] text-white rounded-3xl p-12 relative overflow-hidden mt-6 shadow-xl border border-[#887CFD]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#887CFD]/30 to-[#5347CE]/50 pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#887CFD]/40 text-[#ffffff] border border-[#4896FE]/30 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${backendError ? 'bg-red-500' : 'bg-[#4896FE] animate-pulse'}`} />
              {backendError ? 'BACKEND OFFLINE' : 'LIVE API CONNECTED'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-[#ffffff]">FLOWPILOT AI</h1>
          <p className="text-xl md:text-2xl font-light text-[#4896FE] mb-6">From business intent<br/>to completed action.</p>
          <p className="text-[#ffffff]/80 mb-8 max-w-xl leading-relaxed">
            Turn natural-language business objectives into intelligent, adaptive workflows. Powered by Qwen3 8B with local Ollama acceleration, LangGraph state management, and human-in-the-loop authorization.
          </p>
          
          <div className="flex flex-wrap gap-4 items-center mb-10">
            <Link href="/workflows/new" className="bg-[#887CFD] hover:bg-[#4896FE] hover:text-[#5347CE] text-[#ffffff] px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#0c251c]/50 flex items-center gap-2 border border-[#887CFD]">
              <PlusCircle className="w-5 h-5" /> Create New Workflow
            </Link>
            <Link href="/workflows" className="bg-[#0c251c] hover:bg-[#887CFD] border border-[#887CFD] text-[#ffffff] px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
              <WorkflowIcon className="w-5 h-5" /> View Workflows
            </Link>
            <Link href="/audit" className="bg-[#0c251c] hover:bg-[#887CFD] border border-[#887CFD] text-[#ffffff] px-5 py-3 rounded-xl font-medium transition-colors">
              Audit Trail
            </Link>
            <Link href="/analyze" className="bg-[#0c251c] hover:bg-[#887CFD] border border-[#887CFD] text-[#ffffff] px-5 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
              <Database className="w-5 h-5" /> Analyze Data
            </Link>
            <button onClick={loadData} title="Refresh metrics" className="bg-[#0c251c] hover:bg-[#887CFD] border border-[#887CFD] text-[#ffffff] p-3 rounded-xl font-medium transition-colors flex items-center justify-center">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-[#4896FE] tracking-wider">
            <span>AI PLANNING</span> •
            <span>MULTI-SOURCE REASONING</span> •
            <span>HUMAN APPROVAL</span> •
            <span>DYNAMIC RE-PLANNING</span> •
            <span>AUDIT TRAIL</span> •
            <span>TOOL EXECUTION</span>
          </div>
        </div>
      </section>

      {/* BACKEND ERROR BANNER */}
      {backendError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">Cannot reach FlowPilot Backend</div>
              <div className="text-xs text-red-600 mt-0.5">{backendError} — Please ensure FastAPI server is running at {process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}.</div>
            </div>
          </div>
          <button onClick={loadData} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">
            Retry Connection
          </button>
        </div>
      )}

      {/* DASHBOARD KPI AREA */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#5347CE]">Live Workflow Metrics</h2>
            <p className="text-xs text-[#887CFD] mt-0.5">Real-time KPI metrics aggregated from backend database and LangGraph execution runtime</p>
          </div>
          <span className="text-xs font-mono text-[#887CFD]">Auto-refreshing (5s)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Invoices Analyzed', value: metrics.invoices_analyzed, color: 'text-[#5347CE]', sub: 'Target set' },
            { label: 'Actionable Cases', value: metrics.actionable_cases, color: 'text-[#5347CE]', sub: 'Overdue > ₹50K' },
            { label: 'Monitoring Cases', value: metrics.monitoring_cases, color: 'text-[#887CFD]', sub: 'Extended grace' },
            { label: 'Approval Requests', value: metrics.approval_requests, color: 'text-amber-800', sub: 'Human-in-loop' },
            { label: 'Successful Actions', value: metrics.successful_actions, color: 'text-[#5347CE]', sub: 'Executed' },
            { label: 'Failed Attempts', value: metrics.failed_attempts, color: 'text-red-700', sub: 'Email failures' },
            { label: 'Recovered Failures', value: metrics.recovered_failures, color: 'text-[#887CFD]', sub: 'Auto-healed' },
            { label: 'Re-plans Triggered', value: metrics.replans, color: 'text-[#887CFD]', sub: 'Dynamic plans' },
            { label: 'Unresolved Cases', value: metrics.unresolved, color: metrics.unresolved > 0 ? 'text-red-700' : 'text-[#887CFD]', sub: 'Pending' }
          ].map(kpi => (
            <div key={kpi.label} className="bg-white p-5 rounded-xl border border-[#4896FE] shadow-sm text-center">
              <div className="text-xs font-medium text-[#887CFD] mb-1">{kpi.label}</div>
              <div className={`text-3xl font-extrabold ${kpi.color}`}>{isLoading && metrics.invoices_analyzed === 0 ? '—' : kpi.value}</div>
              <div className="text-[10px] text-[#887CFD]/70 mt-1 uppercase tracking-wider">{kpi.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT WORKFLOWS TABLE */}
      {workflows.length > 0 && (
        <section className="bg-white border border-[#4896FE] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#5347CE]">Recent Live Workflows</h2>
            <Link href="/workflows" className="text-xs font-bold text-[#5347CE] hover:underline">
              View All ({workflows.length}) →
            </Link>
          </div>
          <div className="divide-y divide-[#ffffff]">
            {workflows.slice(0, 4).map(wf => (
              <div key={wf.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <Link href={`/workflows/${wf.id}`} className="font-semibold text-[#5347CE] hover:underline">
                    {wf.objective}
                  </Link>
                  <div className="text-xs text-[#887CFD] mt-0.5">ID: {wf.id} • Mode: {wf.mode}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    wf.status === 'COMPLETED' ? 'bg-[#4896FE]/40 text-[#5347CE] border border-[#4896FE]' :
                    wf.status === 'WAITING_FOR_APPROVAL' ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' :
                    wf.status === 'FAILED' ? 'bg-red-100 text-red-800 border border-red-300' :
                    'bg-[#ffffff] text-[#5347CE] border border-[#4896FE]'
                  }`}>
                    {wf.status}
                  </span>
                  <Link href={`/workflows/${wf.id}`} className="p-1.5 text-[#887CFD] hover:text-[#5347CE]">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CANONICAL WORKFLOW BENCHMARK CARD */}
      <section className="bg-[#887CFD]/10 border border-[#4896FE] rounded-2xl p-8">
        <h2 className="text-lg font-bold text-[#5347CE] mb-2">Canonical Invoice Resolution Objective</h2>
        <p className="text-[#5347CE]/80 mb-6 max-w-3xl">
          "Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending."
        </p>
        
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#5347CE]">
           <span className="bg-white px-3 py-1 rounded-full border border-[#4896FE]">7 invoices</span> <ArrowRight className="w-4 h-4 opacity-50"/>
           <span className="bg-white px-3 py-1 rounded-full border border-[#4896FE]">6 actionable</span> <ArrowRight className="w-4 h-4 opacity-50"/>
           <span className="bg-white px-3 py-1 rounded-full border border-[#4896FE]">1 monitoring</span> <ArrowRight className="w-4 h-4 opacity-50"/>
           <span className="bg-white px-3 py-1 rounded-full border border-amber-300 text-amber-900">3 approvals</span> <ArrowRight className="w-4 h-4 opacity-50"/>
           <span className="bg-white px-3 py-1 rounded-full border border-[#4896FE]">6 business actions</span> <ArrowRight className="w-4 h-4 opacity-50"/>
           <span className="bg-white px-3 py-1 rounded-full border border-red-300 text-red-900">1 failed attempt</span> <ArrowRight className="w-4 h-4 opacity-50"/>
           <span className="bg-white px-3 py-1 rounded-full border border-[#4896FE]">1 dynamic replan</span> <ArrowRight className="w-4 h-4 opacity-50"/>
           <span className="bg-white px-3 py-1 rounded-full border border-emerald-400 text-[#5347CE]">1 recovered failure</span>
        </div>
      </section>

      {/* EVALUATION DASHBOARD */}
      {benchmark && benchmark.runs_executed && (
        <section className="bg-gradient-to-br from-[#5347CE] to-[#1c4b3a] border border-[#887CFD] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8 border-b border-[#4896FE]/30 pb-4">
              <div>
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <Activity className="w-6 h-6 text-[#4896FE]" />
                  Evaluation Suite Results
                </h2>
                <p className="text-[#ffffff]/80 text-sm mt-1">FlowPilot Benchmark Engine • Generalized cross-domain performance</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-[#887CFD] text-[#ffffff] text-xs px-3 py-1.5 rounded-full font-mono border border-[#4896FE]/40">
                  {benchmark.scenarios_defined} Scenarios
                </span>
                <span className="bg-[#887CFD] text-[#ffffff] text-xs px-3 py-1.5 rounded-full font-mono border border-[#4896FE]/40">
                  {benchmark.runs_executed} Runs
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-black/20 p-5 rounded-2xl border border-[#4896FE]/30 backdrop-blur-sm text-center">
                <div className="text-xs text-[#4896FE] uppercase tracking-widest font-bold mb-2">Success Rate</div>
                <div className="text-4xl font-black text-white">{benchmark.aggregate_success_rate.toFixed(1)}%</div>
              </div>
              <div className="bg-black/20 p-5 rounded-2xl border border-[#4896FE]/30 backdrop-blur-sm text-center">
                <div className="text-xs text-[#4896FE] uppercase tracking-widest font-bold mb-2">Final-State Match</div>
                <div className="text-4xl font-black text-[#4896FE]">{benchmark.final_state_correctness.toFixed(1)}%</div>
              </div>
              <div className="bg-black/20 p-5 rounded-2xl border border-[#4896FE]/30 backdrop-blur-sm text-center">
                <div className="text-xs text-[#4896FE] uppercase tracking-widest font-bold mb-2">Failure Recovery</div>
                <div className="text-4xl font-black text-[#ffffff]">{benchmark.recovery_success_rate.toFixed(1)}%</div>
              </div>
              <div className="bg-black/20 p-5 rounded-2xl border border-[#4896FE]/30 backdrop-blur-sm text-center">
                <div className="text-xs text-[#4896FE] uppercase tracking-widest font-bold mb-2">Policy Safety</div>
                <div className="text-4xl font-black text-white">{benchmark.approval_correctness.toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium">
               <div className="flex items-center gap-2 bg-[#0c251c]/70 px-4 py-2 rounded-xl border border-[#4896FE]/30">
                 <span className="text-[#4896FE] text-xs uppercase tracking-wider">Duplicates</span>
                 <span className="font-mono text-white">{benchmark.duplicate_actions_total}</span>
               </div>
               <div className="flex items-center gap-2 bg-[#0c251c]/70 px-4 py-2 rounded-xl border border-[#4896FE]/30">
                 <span className="text-[#4896FE] text-xs uppercase tracking-wider">Avg Latency</span>
                 <span className="font-mono text-white">{benchmark.average_latency_ms.toFixed(0)} ms</span>
               </div>
               <div className="flex items-center gap-2 bg-[#0c251c]/70 px-4 py-2 rounded-xl border border-[#4896FE]/30">
                 <span className="text-[#4896FE] text-xs uppercase tracking-wider">p95 Latency</span>
                 <span className="font-mono text-white">{benchmark.p95_latency_ms.toFixed(0)} ms</span>
               </div>
               <div className="flex items-center gap-2 bg-[#0c251c]/70 px-4 py-2 rounded-xl border border-[#4896FE]/30">
                 <span className="text-[#4896FE] text-xs uppercase tracking-wider">Experience Runs</span>
                 <span className="font-mono text-white">{benchmark.experience_informed_runs}</span>
               </div>
            </div>
          </div>
        </section>
      )}

      {/* WHY FLOWPILOT? */}
      <section>
        <h2 className="text-2xl font-bold mb-8 text-center">From Static Automation to Adaptive Execution</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
            <h3 className="text-sm font-bold tracking-widest text-slate-400 mb-6 uppercase">Traditional Automation</h3>
            <div className="flex flex-col items-center gap-3 text-sm font-medium text-slate-600">
               <div className="px-4 py-2 border rounded w-48 bg-slate-50">Fixed rules</div> ↓
               <div className="px-4 py-2 border rounded w-48 bg-slate-50">Fixed sequence</div> ↓
               <div className="px-4 py-2 border rounded w-48 bg-slate-50">Execute</div> ↓
               <div className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 w-48">Failure</div> ↓
               <div className="px-4 py-2 border border-amber-200 bg-amber-50 text-amber-700 w-48">Manual intervention</div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-sm text-center text-slate-300">
            <h3 className="text-sm font-bold tracking-widest text-blue-400 mb-6 uppercase">FlowPilot AI</h3>
            <div className="flex flex-col items-center gap-2 text-sm font-medium">
               <div className="px-4 py-1.5 border border-slate-700 rounded w-48 bg-slate-800 text-white">Business Objective</div> ↓
               <div className="px-4 py-1.5 border border-slate-700 rounded w-48 bg-slate-800">Understand</div> ↓
               <div className="px-4 py-1.5 border border-slate-700 rounded w-48 bg-slate-800">Plan & Gather</div> ↓
               <div className="px-4 py-1.5 border border-slate-700 rounded w-48 bg-slate-800">Reason</div> ↓
               <div className="px-4 py-1.5 border border-slate-700 rounded w-48 bg-slate-800">Execute</div> ↓
               <div className="px-4 py-1.5 border border-purple-800 rounded w-48 bg-purple-900/30 text-purple-300">Observe & Re-plan</div> ↓
               <div className="px-4 py-1.5 border border-green-800 rounded w-48 bg-green-900/30 text-green-400">Recover & Complete</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section>
        <h2 className="text-2xl font-bold mb-8 text-center">Core Capabilities</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: '01', title: 'Objective Understanding', desc: 'Converts natural-language business goals into structured workflow requirements.' },
            { id: '02', title: 'Adaptive Planning', desc: 'Creates multi-step execution plans and dynamically rewrites them when conditions change.' },
            { id: '03', title: 'Multi-Source Intelligence', desc: 'Combines information from invoices, customer records, payment status, and corporate credit policies.' },
            { id: '04', title: 'Intelligent Decisions', desc: 'Uses business context, customer relationship history, and financial factors to determine actions.' },
            { id: '05', title: 'Human-in-the-Loop', desc: 'Pauses sensitive and high-value actions for explicit human approval via approval gateways.' },
            { id: '06', title: 'Failure Recovery', desc: 'Detects failed execution, searches for alternatives, dynamically re-plans, and continues execution.' }
          ].map(cap => (
            <div key={cap.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="text-2xl font-bold text-blue-100 mb-2">{cap.id}</div>
              <h3 className="font-bold text-slate-800 mb-2">{cap.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{cap.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
