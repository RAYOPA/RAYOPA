"use client";

import { FileCode, Sparkles, BookOpen, Layers } from 'lucide-react';
import Link from 'next/link';

export default function TemplatesPage() {
  const templates = [
    {
      id: 'canonical-invoice',
      title: 'Canonical Overdue Invoice Recovery',
      category: 'Financial Operations',
      objective: 'Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending.',
      tools: ['getOverdueInvoices', 'getCustomer', 'prepareEmail', 'sendEmail', 'verifyAction'],
      approvalGate: 'Required for high-value / sensitive communications'
    },
    {
      id: 'customer-credit-audit',
      title: 'Customer Credit & Risk Assessment',
      category: 'Credit Risk',
      objective: 'Audit all accounts with overdue invoices exceeding 30 days, evaluate dispute flags, and flag high-risk customers for review.',
      tools: ['getOverdueInvoices', 'getCustomer', 'getInvoiceHistory', 'verifyAction'],
      approvalGate: 'Human confirmation for risk classification adjustments'
    },
    {
      id: 'payment-reconciliation',
      title: 'Payment & Statement Reconciliation',
      category: 'Accounting',
      objective: 'Cross-reference bank statements with unpaid invoice ledgers and reconcile matching transaction amounts.',
      tools: ['getInvoice', 'verifyAction'],
      approvalGate: 'Approval required for write-offs > ₹25,000'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto w-full pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Layers className="w-7 h-7 text-blue-600" />
          Workflow Templates
        </h1>
        <p className="text-slate-500 mt-1">Pre-configured autonomous business objective templates for Nocode AI.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(tmpl => (
          <div key={tmpl.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {tmpl.category}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{tmpl.title}</h3>
              <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                "{tmpl.objective}"
              </p>

              <div className="mb-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registered Tools:</div>
                <div className="flex flex-wrap gap-1.5">
                  {tmpl.tools.map(t => (
                    <code key={t} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {t}
                    </code>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-500 mb-6">
                <strong>Policy:</strong> {tmpl.approvalGate}
              </div>
            </div>

            <Link
              href={`/workflows/new`}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Use Template
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
