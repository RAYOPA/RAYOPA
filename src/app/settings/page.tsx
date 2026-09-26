"use client";

import { Settings as SettingsIcon, Save, Key, User, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="fp-h2">Settings</h2>
          <p className="fp-small mt-0.5">Manage platform configuration and user preferences.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="fp-btn fp-btn-primary">
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="space-y-1">
          <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium bg-[var(--fp-surface-2)] text-[var(--fp-text)] flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--fp-text-muted)]" /> Profile
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-[var(--fp-text-muted)] hover:bg-[var(--fp-surface-2)] flex items-center gap-2 transition-colors">
            <Shield className="w-4 h-4 text-[var(--fp-text-muted)]" /> Security
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-[var(--fp-text-muted)] hover:bg-[var(--fp-surface-2)] flex items-center gap-2 transition-colors">
            <Key className="w-4 h-4 text-[var(--fp-text-muted)]" /> API Keys
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="fp-card">
            <div className="fp-card-header">
              <span className="fp-h3">Profile Settings</span>
            </div>
            <div className="fp-card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--fp-text)] mb-1">Display Name</label>
                <input type="text" className="fp-input max-w-md" defaultValue="Admin User" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--fp-text)] mb-1">Email Address</label>
                <input type="email" className="fp-input max-w-md" defaultValue="admin@flowpilot.ai" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--fp-text)] mb-1">Role</label>
                <input type="text" className="fp-input max-w-md bg-[var(--fp-surface-2)] cursor-not-allowed" defaultValue="Superadmin" disabled />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
