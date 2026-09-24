import { AIProvider } from '../providers/ai-provider';
import { PlanSchema, Plan } from '../schemas/plan';
import { Objective } from '../schemas/objective';
import { getAvailableToolsDescription } from '../tools/registry';

export class DynamicPlanner {
  constructor(private ai: AIProvider) {}

  async plan(objective: Objective, contextData?: string): Promise<Plan> {
    const tools = getAvailableToolsDescription();

    const systemInstruction = `You are the Dynamic Planner for FlowPilot AI.
Output ONLY a high-level minimal JSON execution plan using authoritative tools.

RULES:
1. Output HIGH-LEVEL workflow steps only (e.g., getOverdueInvoices, verifyAction, prepareEmail, sendEmail). Do NOT unroll per-item or per-customer steps.
2. Keep tool arguments minimal (e.g., {} or {"min_amount": 50000}). Arguments for prepareEmail and sendEmail MUST be empty objects {}.
3. Select tools ONLY from the Available Tools list. NEVER invent tool names.
4. Do NOT include explanations, reasoning, prose, or extra fields.

Available Tools:
${tools}

JSON output format:
{
  "steps": [
    { "tool": "getOverdueInvoices", "arguments": { "min_amount": 50000 } },
    { "tool": "verifyAction", "arguments": { "action": "analyze" } },
    { "tool": "prepareEmail", "arguments": {} },
    { "tool": "sendEmail", "arguments": {} }
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
