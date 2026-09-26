"use client";

import { FileText, PlusCircle, ArrowRight } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="fp-h2">Documents & Templates</h2>
          <p className="fp-small mt-0.5">Indexed PDF documents, standard operating procedures, and email templates.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="fp-btn fp-btn-primary">
            <PlusCircle className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      <div className="fp-card">
        <div className="fp-empty">
          <FileText className="w-10 h-10" style={{ color: "var(--fp-text-faint)" }} />
          <p className="fp-h3 mt-2" style={{ color: "var(--fp-text-muted)" }}>Document Knowledge Base Empty</p>
          <p className="fp-small max-w-sm mx-auto">
            Upload PDF invoices, policy documents, or template files. FlowPilot uses RAG to fetch relevant context during execution.
          </p>
          <button className="fp-btn fp-btn-secondary mt-4">
            Browse Files <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
