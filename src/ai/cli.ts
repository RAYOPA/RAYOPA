import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local', override: false });
import { ProviderRouter } from './providers/provider-router';
import { ObjectiveAnalyzer } from './prompts/objective-analyzer';
import { DynamicPlanner } from './prompts/planner';
import { PlanVerifier } from './prompts/plan-verifier';
import { setToolRegistry } from './tools/registry';
import { AIUnavailableError, CapabilityUnavailableError, ValidationError } from './errors';

import * as fs from 'fs';

async function main() {
  try {
    const filePath = process.argv[2];
    const mode = process.argv[3] || "all"; // analyze, plan, replan, all
    
    if (!filePath) {
      throw new Error("Missing file path argument");
    }
    const inputData = fs.readFileSync(filePath, 'utf-8');

    if (!inputData.trim()) {
      throw new Error("No input data received on stdin");
    }

    const payload = JSON.parse(inputData);
    const { objective, completed_actions, failures, tools, context, ai_call_count } = payload;

    if (!objective && mode !== "replan" && mode !== "plan") {
      throw new Error("Missing 'objective' in payload");
    }

    // Set dynamic tools
    if (tools) {
      setToolRegistry(tools);
    }

    const ai = new ProviderRouter(ai_call_count || 1);
    
    if (mode === "analyze") {
      const analyzer = new ObjectiveAnalyzer(ai);
      const structuredObjective = await analyzer.analyze(objective);
      console.log(JSON.stringify({
        status: "SUCCESS",
        structured_objective: structuredObjective
      }));
      return;
    } 
    
    if (mode === "plan") {
      const planner = new DynamicPlanner(ai);
      const verifier = new PlanVerifier();
      
      const structuredObjective = payload.structured_objective;
      if (!structuredObjective) throw new Error("Missing structured_objective for plan mode");
      
      // Pass context cleanly
      const contextStr = context ? JSON.stringify(context, null, 2) : undefined;
      
      const plan = await planner.plan(structuredObjective, contextStr);
      verifier.verify(plan);
      
      console.log(JSON.stringify({
        status: "SUCCESS",
        steps: plan.steps
      }));
      return;
    }
    
    if (mode === "replan") {
      // Create a Replan prompt using DynamicPlanner, but pass failure context.
      const planner = new DynamicPlanner(ai);
      const verifier = new PlanVerifier();
      
      // We'll mock a structured objective for the replan since DynamicPlanner takes one.
      const failuresStr = JSON.stringify(failures, null, 2);
      const contextStr = JSON.stringify(context || {}, null, 2);
      
      const replanObj = {
        objective: `[REPLAN MODE] A tool execution failed. Recover from this failure.\n\nFailures:\n${failuresStr}\n\nContext:\n${contextStr}`,
        entities: [],
        conditions: [],
        requiredActions: ["Recover from failure"],
        approvalRequired: false
      };
      
      const plan = await planner.plan(replanObj);
      verifier.verify(plan);
      
      console.log(JSON.stringify({
        status: "SUCCESS",
        steps: plan.steps
      }));
      return;
    }

    // Fallback for "all" mode (the original behavior for compatibility)
    const completedStr = completed_actions && completed_actions.length > 0 ? JSON.stringify(completed_actions, null, 2) : '[]';
    const failuresStr = failures && failures.length > 0 ? JSON.stringify(failures, null, 2) : '[]';
    const fullObjective = `Objective: ${objective}\n\nCompleted Actions:\n${completedStr}\n\nRecent Failures:\n${failuresStr}\n\nGiven this context, what are the next steps to take? If the objective is fully achieved or no more steps are needed, output an empty plan.`;

    const analyzer = new ObjectiveAnalyzer(ai);
    const planner = new DynamicPlanner(ai);
    const verifier = new PlanVerifier();

    const structuredObjective = await analyzer.analyze(fullObjective);
    const plan = await planner.plan(structuredObjective);
    verifier.verify(plan);

    console.log(JSON.stringify({
      status: "SUCCESS",
      steps: plan.steps
    }));

  } catch (e: any) {
    let errorCode = "UNKNOWN_ERROR";
    if (e instanceof AIUnavailableError) errorCode = "AI_UNAVAILABLE";
    if (e instanceof CapabilityUnavailableError) errorCode = "CAPABILITY_UNAVAILABLE";
    if (e instanceof ValidationError) errorCode = "VALIDATION_ERROR";

    console.log(JSON.stringify({
      status: "FAILED",
      error: errorCode,
      message: e.message || String(e)
    }));
  }
}

main();
