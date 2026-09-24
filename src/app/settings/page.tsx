"use client";

import { Settings as SettingsIcon, Server, Cpu, Shield, Database, CheckCircle2, Lock } from 'lucide-react';

export default function SettingsPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-blue-600" />
          System Settings & Environment
        </h1>
        <p className="text-slate-500 mt-1">Runtime configuration and active system status for FlowPilot AI.</p>
      </div>

      <div className="space-y-6">
        {/* RUNTIME ARCHITECTURE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Cognitive Core</h2>
              <p className="text-xs text-slate-500">Local inference model and runtime parameters</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Local Provider:</span>
              <span className="font-bold text-slate-800">Ollama API (127.0.0.1:11434)</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Inference Model:</span>
              <span className="font-bold text-slate-800">qwen3:8b (think=false)</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Acceleration:</span>
              <span className="font-bold text-green-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> NVIDIA RTX 4050 GPU
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Max Output Tokens:</span>
              <span className="font-bold text-slate-800">260 tokens (num_predict)</span>
            </div>
          </div>
        </div>

        {/* BACKEND & DATABASE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Backend Server & API</h2>
              <p className="text-xs text-slate-500">FastAPI gateway and database storage</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">API Base URL:</span>
              <span className="font-bold text-blue-600">{backendUrl}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Orchestration Engine:</span>
              <span className="font-bold text-slate-800">LangGraph (StateGraph)</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Database Dialect:</span>
              <span className="font-bold text-slate-800">PostgreSQL / SQLite fallback</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Email Tool Sandbox:</span>
              <span className="font-bold text-amber-700">SANDBOX (Simulation)</span>
            </div>
          </div>
        </div>

        {/* SECURITY & GOVERNANCE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Security & Approvals Policy</h2>
              <p className="text-xs text-slate-500">Immutable ledger and human verification thresholds</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="font-bold text-slate-800">High-Value Escalation Threshold:</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Invoices &gt; ₹50,000 or customer risk level = HIGH</p>
              </div>
              <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded text-[10px] uppercase">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="font-bold text-slate-800">Immutable Audit Logging:</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Every tool invocation, planning step, and user approval is recorded to audit_events table</p>
              </div>
              <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded text-[10px] uppercase">
                Enforced
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
