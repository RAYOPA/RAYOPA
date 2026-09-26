"use client";

import { Puzzle, PlusCircle, ArrowRight, Mail, MessageSquare, CreditCard } from "lucide-react";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="fp-h2">Integrations</h2>
          <p className="fp-small mt-0.5">Connected SaaS tools and external APIs for workflow actions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="fp-btn fp-btn-primary">
            <PlusCircle className="w-4 h-4" /> Add Integration
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { name: "SMTP Email", desc: "Send automated emails to customers.", icon: Mail, status: "Connected", color: "var(--fp-success)" },
          { name: "Slack", desc: "Notify team channels of approvals.", icon: MessageSquare, status: "Not Connected", color: "var(--fp-text-faint)" },
          { name: "Stripe", desc: "Process payments and refunds.", icon: CreditCard, status: "Not Connected", color: "var(--fp-text-faint)" },
        ].map(integration => (
          <div key={integration.name} className="fp-card fp-card-body">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--fp-surface-3)]">
                <integration.icon className="w-5 h-5 text-[var(--fp-text-2)]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ color: integration.color, borderColor: `${integration.color}33`, background: `${integration.color}11` }}>
                {integration.status}
              </span>
            </div>
            <h3 className="fp-h3">{integration.name}</h3>
            <p className="fp-small mt-1 mb-4">{integration.desc}</p>
            <button className="fp-btn fp-btn-secondary w-full justify-center">
              Configure
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
