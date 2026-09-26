"use client";

import { HelpCircle, Play, FileText, ArrowRight } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="fp-h2">Help & Documentation</h2>
          <p className="fp-small mt-0.5">Learn how to use FlowPilot AI autonomous workflows.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="fp-card fp-card-body">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--fp-indigo-light)] mb-4">
            <Play className="w-5 h-5 text-[var(--fp-indigo)]" />
          </div>
          <h3 className="fp-h3">Quick Start Guide</h3>
          <p className="fp-small mt-1 mb-4">
            Watch a 3-minute video on how to define a business objective and let the AI plan the workflow.
          </p>
          <button className="fp-btn fp-btn-secondary">
            Watch Video <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="fp-card fp-card-body">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--fp-surface-3)] mb-4">
            <FileText className="w-5 h-5 text-[var(--fp-text-2)]" />
          </div>
          <h3 className="fp-h3">API Documentation</h3>
          <p className="fp-small mt-1 mb-4">
            Learn how to integrate your custom tools and APIs with the FlowPilot LangGraph engine.
          </p>
          <button className="fp-btn fp-btn-secondary">
            Read Docs <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
