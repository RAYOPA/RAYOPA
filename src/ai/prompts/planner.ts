import { AIProvider } from '../providers/ai-provider';
import { PlanSchema, Plan } from '../schemas/plan';
import { Objective } from '../schemas/objective';
import { getAvailableToolsDescription } from '../tools/registry';

export class DynamicPlanner {
  constructor(private ai: AIProvider) {}

  async plan(objective: Objective, contextData?: string): Promise<Plan> {
    const tools = getAvailableToolsDescription();

    const systemInstruction = `You are the Dynamic Planner for FlowPilot AI.
Output ONLY a minimal JSON execution plan using authoritative tools.

RULES:
1. When Business Data cases are provided:
   - For each case with status 'OVERDUE', emit a 'sendEmail' step using the EXACT 'email' property from the case: {"recipient": case.email}. For Delta Logistics, you MUST use "invalid@acme.com" (NEVER invent "delta@acme.com" or use any other address).
   - For cases with status 'PAYMENT_EXTENDED', emit a 'verifyAction' step with {"action": "monitor"} and requiresApproval: false.
   - Set 'requiresApproval': true for high-value cases where amt >= 100000, and false for amt < 100000.
2. In [REPLAN MODE] (recovery after failure):
   - When an email delivery failed, emit a 'sendEmail' step using the verified alternative contact 'alt_contact' from context with requiresApproval: false.
3. Keep step objects minimal: only "tool", "arguments", and "requiresApproval".
4. Select tools ONLY from: sendEmail, verifyAction, getOverdueInvoices, getCustomer.

Available Tools:
${tools}

JSON output format:
{
  "steps": [
    { "tool": "sendEmail", "arguments": { "recipient": "string" }, "requiresApproval": boolean }
  ]
}`;

    const prompt = `Generate a minimal execution plan for:
Objective: ${objective.objective}
Conditions: ${JSON.stringify(objective.conditions)}
Required Actions: ${objective.requiredActions.join(", ")}

${contextData ? `Business Data:\n${contextData}\n` : ''}
Output minimal JSON steps.`;

    const promptChars = systemInstruction.length + prompt.length;
    const tokensEst = Math.ceil(promptChars / 4);
    console.error(`--- AI PLANNER PROMPT DIAGNOSTICS ---`);
    console.error(`planner_prompt_chars=${promptChars}`);
    console.error(`planner_prompt_tokens_estimate=${tokensEst}`);
    console.error(`tool_context_chars=${tools.length}`);
    console.error(`business_context_chars=${contextData ? contextData.length : 0}`);
    console.error(`system_instruction_chars=${systemInstruction.length}`);

    const response = await this.ai.generateStructured<Plan>(prompt, PlanSchema, systemInstruction);
    
    let idx = 1;
    for (const step of response.structured_output.steps) {
      if (!step.stepId) step.stepId = `step_${idx}`;
      if (!step.action) step.action = `Execute ${step.tool}`;
      if (!step.arguments) step.arguments = {};
      if (!step.dependsOn) step.dependsOn = [];
      idx++;
    }

    return response.structured_output;
  }
}
