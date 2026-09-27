"use client";

import { useState, useEffect, useCallback } from 'react';
import { Database, FileText, Users, Loader2, AlertCircle, RefreshCw, Plus, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { getInvoices, getCustomers, createCustomer, createInvoice, Invoice, Customer } from '@/lib/api';

export default function DataExplorerPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New customer / invoice form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAmount, setNewAmount] = useState('75000');
  const [newDaysOverdue, setNewDaysOverdue] = useState('14');
  const [newRisk, setNewRisk] = useState('MEDIUM');

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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      setError('Name and Email are required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // 1. Create customer
      const cust = await createCustomer({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
        status: 'ACTIVE',
        risk_level: newRisk
      });

      // 2. Create an invoice for this customer if amount provided
      const amt = parseFloat(newAmount);
      if (amt > 0) {
        await createInvoice({
          customer_id: cust.id,
          amount: amt,
          days_overdue: parseInt(newDaysOverdue, 10) || 10,
          status: 'OVERDUE'
        });
      }

      setSuccessMsg(`Successfully added ${cust.name} (${cust.email}) and overdue invoice!`);
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add customer record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#12372A] flex items-center gap-2">
            <Database className="w-7 h-7 text-[#436850]" />
            Data Explorer
          </h1>
          <p className="text-[#436850] mt-1">Live customer records and invoice data queried by Nocode tools.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#12372A] hover:bg-[#12372A]/90 text-[#FBFADA] rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Customer / Email
          </button>
          <div className="flex bg-white p-1 rounded-xl text-xs font-semibold border border-[#ADBC9F]">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'invoices' ? 'bg-[#12372A] text-[#FBFADA] shadow' : 'text-[#436850] hover:text-[#12372A]'}`}
            >
              <FileText className="w-3.5 h-3.5" /> Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === 'customers' ? 'bg-[#12372A] text-[#FBFADA] shadow' : 'text-[#436850] hover:text-[#12372A]'}`}
            >
              <Users className="w-3.5 h-3.5" /> Customers ({customers.length})
            </button>
          </div>
          <button 
            onClick={loadData}
            title="Refresh database records" 
            className="p-2 border border-[#ADBC9F] bg-white hover:bg-[#ADBC9F]/20 rounded-xl text-[#12372A] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#ADBC9F] rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#12372A] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#436850]" />
                Add Customer & Invoice
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#436850] hover:text-[#12372A] p-1 rounded-lg hover:bg-[#ADBC9F]/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#436850] mb-4">
              Add custom users/emails to test overdue invoice analysis, anti-spam safeguards, and notification follow-ups.
            </p>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#12372A] mb-1">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Innovations or John Doe"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ADBC9F] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#12372A] text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#12372A] mb-1">Recipient Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@company.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ADBC9F] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#12372A] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#12372A] mb-1">Alternate / Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. alt@company.com or phone"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ADBC9F] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#12372A] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#12372A] mb-1">Risk Level</label>
                  <select
                    value={newRisk}
                    onChange={e => setNewRisk(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ADBC9F] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#12372A] text-sm bg-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#ADBC9F]/30 pt-3 mt-3">
                <h3 className="font-semibold text-[#12372A] mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#436850]" /> Invoice Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#12372A] mb-1">Invoice Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={newAmount}
                      onChange={e => setNewAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-[#ADBC9F] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#12372A] text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#12372A] mb-1">Days Overdue</label>
                    <input
                      type="number"
                      required
                      value={newDaysOverdue}
                      onChange={e => setNewDaysOverdue(e.target.value)}
                      className="w-full px-3 py-2 border border-[#ADBC9F] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#12372A] text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#ADBC9F] rounded-xl text-[#436850] hover:bg-[#ADBC9F]/20 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#12372A] hover:bg-[#12372A]/90 text-[#FBFADA] rounded-xl font-semibold shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-[#ADBC9F] shadow-sm overflow-hidden">
        {isLoading && invoices.length === 0 && customers.length === 0 ? (
          <div className="p-16 text-center text-[#436850]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#12372A]" />
            <div className="text-sm">Fetching records from backend database...</div>
          </div>
        ) : activeTab === 'invoices' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#ADBC9F] bg-[#ADBC9F]/20 text-xs text-[#12372A] uppercase font-semibold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Overdue Days</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ADBC9F]/30 font-mono text-xs">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-[#ADBC9F]/10 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#12372A]">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-[#436850]">{inv.customer_id}</td>
                    <td className="py-3 px-4 font-bold text-[#12372A] font-sans">
                      ₹{inv.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[#436850]">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-[#436850]">{inv.days_overdue} days</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'OVERDUE' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        inv.status === 'PAYMENT_EXTENDED' ? 'bg-[#ADBC9F]/30 text-[#12372A] border border-[#ADBC9F]' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
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
                <tr className="border-b border-[#ADBC9F] bg-[#ADBC9F]/20 text-xs text-[#12372A] uppercase font-semibold">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Primary Email</th>
                  <th className="py-3 px-4">Alternate / Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ADBC9F]/30 text-xs">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-[#ADBC9F]/10 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#436850]">{c.id}</td>
                    <td className="py-3 px-4 font-bold text-[#12372A]">{c.name}</td>
                    <td className="py-3 px-4 font-mono text-[#436850]">{c.email}</td>
                    <td className="py-3 px-4 font-mono text-[#436850]">{c.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.risk_level === 'HIGH' ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-[#ADBC9F]/30 text-[#12372A]'
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
