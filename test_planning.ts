import { ProviderRouter } from "./src/ai/providers/provider-router";
import { ObjectiveAnalyzer } from "./src/ai/prompts/objective-analyzer";
import { DynamicPlanner } from "./src/ai/prompts/planner";
import { PlanVerifier } from "./src/ai/prompts/plan-verifier";
import { setToolRegistry } from "./src/ai/tools/registry";
import { config } from "dotenv";

config();

setToolRegistry({
  getOverdueInvoices: { name: "getOverdueInvoices", description: "Gets overdue invoices", inputSchema: {}, requiresApproval: false },
  getCustomer: { name: "getCustomer", description: "Gets customer details", inputSchema: { properties: { customer_id: { type: "string" } } }, requiresApproval: false },
  prepareEmail: { name: "prepareEmail", description: "Prepares an email draft", inputSchema: { properties: { recipient: { type: "string" }, subject: { type: "string" }, body: { type: "string" } } }, requiresApproval: false },
  sendEmail: { name: "sendEmail", description: "Sends an email", inputSchema: { properties: { recipient: { type: "string" }, subject: { type: "string" }, body: { type: "string" } } }, requiresApproval: true },
  verifyAction: { name: "verifyAction", description: "Verifies an action", inputSchema: { properties: { action: { type: "string" } } }, requiresApproval: false }
});

async function run() {
  const provider = new ProviderRouter();
  const analyzer = new ObjectiveAnalyzer(provider);
  const planner = new DynamicPlanner(provider);
  const verifier = new PlanVerifier();

  const objectiveStr = "Find overdue invoices above ₹50,000.";
  console.log("Analyzing objective:", objectiveStr);
  const structuredObjective = await analyzer.analyze(objectiveStr);
  console.log("Structured Objective:", JSON.stringify(structuredObjective, null, 2));

  console.log("Generating plan...");
  const plan = await planner.plan(structuredObjective);
  console.log("Plan generated:", JSON.stringify(plan, null, 2));

  console.log("Verifying plan...");
  verifier.verify(plan);
  console.log("Plan verification successful!");
}

run().catch(console.error);
