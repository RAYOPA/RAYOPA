"use client";

import { useState, useEffect, useCallback } from 'react';
import { Database, FileText, Users, Loader2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getInvoices, getCustomers, Invoice, Customer } from '@/lib/api';

export default function DataExplorerPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invs, custs] = await Promise.all([
        getInvoices(),
        getCustomers()
      ]);
      setInvoices(invs);
      setCustomers(custs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch database records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="max-w-6xl mx-auto w-full pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#5347CE] flex items-center gap-2">
            <Database className="w-7 h-7 text-[#887CFD]" />
            Data Explorer
          </h1>
          <p className="text-[#887CFD] mt-1">Live customer records and invoice data queried by FlowPilot tools.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl text-xs font-semibold border border-[#4896FE]">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'invoices' ? 'bg-[#5347CE] text-[#ffffff] shadow' : 'text-[#887CFD] hover:text-[#5347CE]'}`}
            >
              <FileText className="w-3.5 h-3.5" /> Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'customers' ? 'bg-[#5347CE] text-[#ffffff] shadow' : 'text-[#887CFD] hover:text-[#5347CE]'}`}
            >
              <Users className="w-3.5 h-3.5" /> Customers ({customers.length})
            </button>
          </div>
          <button 
            onClick={loadData}
            title="Refresh database records" 
            className="p-2 border border-[#4896FE] bg-white hover:bg-[#4896FE]/20 rounded-xl text-[#5347CE] transition-colors"
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

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-[#4896FE] shadow-sm overflow-hidden">
        {isLoading && invoices.length === 0 && customers.length === 0 ? (
          <div className="p-16 text-center text-[#887CFD]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#5347CE]" />
            <div className="text-sm">Fetching records from backend database...</div>
          </div>
        ) : activeTab === 'invoices' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#4896FE] bg-[#4896FE]/20 text-xs text-[#5347CE] uppercase font-semibold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Overdue Days</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4896FE]/30 font-mono text-xs">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-[#4896FE]/10 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#5347CE]">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-[#887CFD]">{inv.customer_id}</td>
                    <td className="py-3 px-4 font-bold text-[#5347CE] font-sans">
                      ₹{inv.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[#887CFD]">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#887CFD]">{inv.days_overdue} days</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'OVERDUE' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        inv.status === 'PAYMENT_EXTENDED' ? 'bg-[#4896FE]/30 text-[#5347CE] border border-[#4896FE]' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#4896FE] bg-[#4896FE]/20 text-xs text-[#5347CE] uppercase font-semibold">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Primary Email</th>
                  <th className="py-3 px-4">Alternate / Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4896FE]/30 text-xs">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-[#4896FE]/10 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#887CFD]">{c.id}</td>
                    <td className="py-3 px-4 font-bold text-[#5347CE]">{c.name}</td>
                    <td className="py-3 px-4 font-mono text-[#887CFD]">{c.email}</td>
                    <td className="py-3 px-4 font-mono text-[#887CFD]">{c.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.risk_level === 'HIGH' ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-[#4896FE]/30 text-[#5347CE]'
                      }`}>
                        {c.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
