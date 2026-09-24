import { config } from 'dotenv';
config({ path: '.env.local' });
import { Day1Orchestrator, OrchestrationResult } from '../../src/ai/runtime/day1-orchestrator';

function printReport(title: string, result: OrchestrationResult) {
  console.log(title);
  console.log(`Objective Analysis: ${result.objectiveAnalysis}`);
  console.log(`Plan Generation: ${result.planGeneration}`);
  console.log(`Plan Verification: ${result.planVerification}`);
  console.log(`Overall: ${result.overall}`);
  
  if (result.error) {
    console.log(`Error Details: ${result.error}`);
  }
  if (result.plan) {
    console.log(`\nFinal Plan JSON:\n${JSON.stringify(result.plan, null, 2)}`);
  }
  console.log("\n=========================================\n");
}

async function runTests() {
  const orchestrator = new Day1Orchestrator();

  console.log("=========================================\n");

  const result1 = await orchestrator.processObjectiveWithReport("Find all overdue invoices above ₹50,000 and prepare the required follow-up actions.");
  printReport("TEST 1 (Valid Invoice Scenario)", result1);

  const result2 = await orchestrator.processObjectiveWithReport("Find customers with unresolved payment issues and recommend the next appropriate action.");
  printReport("TEST 2 (Distinct Valid Scenario)", result2);

  const result3 = await orchestrator.processObjectiveWithReport("Book a flight for every customer.");
  printReport("TEST 3 (Capability Unavailable - Hallucination Test)", result3);
}

runTests().catch(console.error);
