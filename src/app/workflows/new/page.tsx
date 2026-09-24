"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Workflow, Sparkles, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { createWorkflow } from '@/lib/api';

const CANONICAL_EXAMPLE = "Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending.";

export default function CreateWorkflow() {
  const [objective, setObjective] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    if (!objective.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createWorkflow({
        objective: objective.trim(),
        mode: 'AUTONOMOUS'
      });
      router.push(`/workflows/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch workflow on backend.');
      setIsSubmitting(false);
    }
  };

  const useExample = () => {
    setObjective(CANONICAL_EXAMPLE);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm w-full">
        <div className="flex items-center gap-3 mb-6 justify-center text-blue-600">
          <Workflow className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-center tracking-tight mb-2">Create New Workflow</h1>
        <p className="text-slate-500 text-center mb-8 text-lg">What natural-language objective should the AI agent accomplish?</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <strong>Error creating workflow:</strong> {error}
            </div>
          </div>
        )}

        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="e.g. Find overdue invoices above ₹50,000, prioritize them, draft follow-up emails and ask for approval before sending."
          className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none text-base"
          disabled={isSubmitting}
        />

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <button
            onClick={useExample}
            disabled={isSubmitting}
            type="button"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-blue-600" />
            Use Canonical Example
          </button>
          <button
            onClick={handleCreate}
            disabled={!objective.trim() || isSubmitting}
            type="button"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Launching LangGraph Runtime...</span>
              </>
            ) : (
              <>
                <span>Run Real Workflow</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
