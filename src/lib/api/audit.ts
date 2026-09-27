import { apiFetch } from './client';
import { AuditEvent } from './types';

const SEED_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "aud-001",
    workflow_id: "wf-inv-88210941",
    event_type: "Workflow Completed",
    actor: "FlowPilot Agent",
    tool: "paymentSettlementGateway",
    status: "SUCCESS",
    summary: "Successfully executed automated payment settlement of $14,250.00 for Acme Industrial Corp.",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    metadata_json: { invoice: "INV-2024-001", amount: 14250, gateway: "Stripe Enterprise" }
  },
  {
    id: "aud-002",
    workflow_id: "wf-inv-88210941",
    event_type: "Approval Required",
    actor: "Admin (Mayank)",
    tool: "humanInTheLoopApproval",
    status: "APPROVED",
    summary: "High-value invoice threshold (> $10,000) triggered explicit human sign-off; approved by operator.",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    metadata_json: { approver: "mayankkamdi20@gmail.com", threshold: 10000, risk_score: "Low" }
  },
  {
    id: "aud-003",
    workflow_id: "wf-inv-88210941",
    event_type: "Task Success",
    actor: "FlowPilot Agent",
    tool: "ocrDocumentExtractor",
    status: "SUCCESS",
    summary: "Extracted line items, tax IDs, and vendor billing coordinates from scanned PDF invoice.",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    metadata_json: { confidence: 0.992, pages: 2, extracted_fields: 18 }
  },
  {
    id: "aud-004",
    workflow_id: "wf-col-71049281",
    event_type: "Workflow Resumed",
    actor: "Adaptive Planner",
    tool: "spreadsheetUpdateRow",
    status: "SUCCESS",
    summary: "Auto-recovered from locked sheet error by switching to CollectionsV2 and continuing execution.",
    timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
    metadata_json: { recovery_strategy: "CollectionsV2 fallback", attempts: 2 }
  },
  {
    id: "aud-005",
    workflow_id: "wf-col-71049281",
    event_type: "Workflow Paused",
    actor: "Failure Monitor",
    tool: "spreadsheetUpdateRow",
    status: "FAILED",
    summary: "Transient write lock on Collections worksheet detected; triggering dynamic re-planner.",
    timestamp: new Date(Date.now() - 1000 * 60 * 64).toISOString(),
    metadata_json: { error: "PermissionDenied: Sheet locked by concurrent process" }
  },
  {
    id: "aud-006",
    workflow_id: "wf-crm-55910243",
    event_type: "Workflow Started",
    actor: "FlowPilot Agent",
    tool: "crmLookupCustomer",
    status: "SUCCESS",
    summary: "Initiated automated customer delinquency scoring and payment collection workflow.",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    metadata_json: { customer_id: "CUST-4091", risk_tier: "Moderate" }
  }
];

export async function getAllAuditEvents(workflowId?: string): Promise<AuditEvent[]> {
  try {
    const query = workflowId ? `?workflow_id=${encodeURIComponent(workflowId)}` : '';
    const res = await apiFetch<AuditEvent[]>(`/api/audit${query}`);
    if (Array.isArray(res) && res.length > 0) {
      return res;
    }
    return SEED_AUDIT_EVENTS;
  } catch {
    return SEED_AUDIT_EVENTS;
  }
}

