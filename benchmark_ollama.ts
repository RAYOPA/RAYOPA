import { config } from 'dotenv';
config({ path: '.env' });
import { OllamaProvider } from './src/ai/providers/ollama-provider';
import { PlanSchema } from './src/ai/schemas/plan';
import { DynamicPlanner } from './src/ai/prompts/planner';
import { setToolRegistry } from './src/ai/tools/registry';
import { Objective } from './src/ai/schemas/objective';

// Set up sample tool registry
setToolRegistry({
  getOverdueInvoices: { name: "getOverdueInvoices", description: "Gets overdue invoices", inputSchema: {}, requiresApproval: false },
  getCustomer: { name: "getCustomer", description: "Gets customer details", inputSchema: { properties: { customer_id: { type: "string" } } }, requiresApproval: false },
  prepareEmail: { name: "prepareEmail", description: "Prepares an email draft", inputSchema: { properties: { recipient: { type: "string" }, subject: { type: "string" }, body: { type: "string" } } }, requiresApproval: false },
  sendEmail: { name: "sendEmail", description: "Sends an email", inputSchema: { properties: { recipient: { type: "string" }, subject: { type: "string" }, body: { type: "string" } } }, requiresApproval: true },
  verifyAction: { name: "verifyAction", description: "Verifies an action", inputSchema: { properties: { action: { type: "string" } } }, requiresApproval: false }
});

async function runBenchmark() {
  const provider = new OllamaProvider();
  const planner = new DynamicPlanner(provider);

  const objective: Objective = {
    objective: "Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending.",
    entities: ["invoices", "customers", "emails"],
    conditions: [{ field: "amount", operator: ">", value: "50000" }, { field: "status", operator: "=", value: "OVERDUE" }],
    requiredActions: ["analyze", "prioritize", "prepare_email", "request_approval"],
    overallApprovalRequired: true
  };

  const businessData = JSON.stringify({
    cases: [
      { inv: "INV-1001", cust: "Alpha Corp", email: "alpha@acme.com", amt: 60000, days_overdue: 10, status: "OVERDUE" },
      { inv: "INV-1002", cust: "Beta Inc", email: "beta@acme.com", amt: 120000, days_overdue: 40, status: "OVERDUE" },
      { inv: "INV-1003", cust: "Gamma LLC", email: "gamma@acme.com", amt: 600000, days_overdue: 10, status: "OVERDUE" },
      { inv: "INV-1004", cust: "Delta Logistics", email: "invalid@acme.com", alt_contact: "valid@deltalogistics.com", amt: 80000, days_overdue: 10, status: "OVERDUE" },
      { inv: "INV-1005", cust: "Epsilon Group", email: "epsilon@acme.com", amt: 70000, days_overdue: 10, status: "OVERDUE" },
      { inv: "INV-1006", cust: "Zeta Partners", email: "zeta@acme.com", amt: 150000, days_overdue: 5, status: "OVERDUE" },
      { inv: "INV-1009", cust: "Eta Systems", email: "eta@acme.com", amt: 55000, days_overdue: 10, status: "PAYMENT_EXTENDED" }
    ],
    policy: "POLICY: amt>=100k & overdue>30d -> mgr approval; amt>500k -> fin-mgr approval; status==PAYMENT_EXTENDED -> monitoring only; failed email -> find alt contact; ext comms -> approval required"
  }, null, 2);

  console.log("=== CANONICAL DYNAMIC PLANNER BENCHMARK ===");
  const start = Date.now();
  try {
    const plan = await planner.plan(objective, businessData);
    console.log("Plan generated successfully:", JSON.stringify(plan, null, 2));
  } catch (e: any) {
    console.error("Benchmark error:", e.message);
  }
  console.log(`Total duration: ${Date.now() - start} ms`);
}

runBenchmark().catch(console.error);
