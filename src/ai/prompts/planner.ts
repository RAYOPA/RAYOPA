import { AIProvider } from '../providers/ai-provider';
import { PlanSchema, Plan } from '../schemas/plan';
import { Objective } from '../schemas/objective';
import { getAvailableToolsDescription } from '../tools/registry';

export class DynamicPlanner {
  constructor(private ai: AIProvider) {}

  async plan(objective: Objective, contextData?: string): Promise<Plan> {
    const tools = getAvailableToolsDescription();

    const systemInstruction = `You are the Dynamic Planner for FlowPilot AI.
Translate a structured business objective into a sequential execution plan.

RULES:
1. AVAILABLE TOOLS ARE AUTHORITATIVE. Select tools ONLY from the list.
2. NEVER invent tool names (e.g. unknown_tool, example_tool). Every tool must match an available tool exactly.
3. Each step must have a unique stepId (e.g., step_1).
4. 'dependsOn' contains array of stepIds that execute before this step.
5. 'tool' must be the exact tool name from the list.
6. Set 'requiresApproval': true for sensitive actions (emails, customer status changes, escalations).

Available Tools:
${tools}

Example step:
{
  "stepId": "step_1",
  "action": "Fetch overdue invoices",
  "tool": "getOverdueInvoices",
  "arguments": {},
  "dependsOn": [],
  "requiresApproval": false
}

JSON output format:
{
  "objective": "The overall objective",
  "steps": [
    {
      "stepId": "string",
      "action": "string",
      "tool": "string",
      "arguments": {},
      "dependsOn": ["stepId"],
      "requiresApproval": boolean
    }
  ]
}`;

    const prompt = `Generate a dynamic execution plan for the following objective:

Objective Summary: ${objective.objective}
Entities: ${objective.entities.join(", ")}
Conditions: ${JSON.stringify(objective.conditions)}
Required Actions: ${objective.requiredActions.join(", ")}
Overall Approval Required: ${objective.approvalRequired}

${contextData ? `Business Data:\n${contextData}\n` : ''}
Plan the steps carefully using only the available tools.`;

    const promptChars = systemInstruction.length + prompt.length;
    const tokensEst = Math.ceil(promptChars / 4);
    console.error(`--- AI PLANNER PROMPT DIAGNOSTICS ---`);
    console.error(`planner_prompt_chars=${promptChars}`);
    console.error(`planner_prompt_tokens_estimate=${tokensEst}`);
    console.error(`tool_context_chars=${tools.length}`);
    console.error(`business_context_chars=${contextData ? contextData.length : 0}`);
    console.error(`system_instruction_chars=${systemInstruction.length}`);

    const response = await this.ai.generateStructured<Plan>(prompt, PlanSchema, systemInstruction);
    return response.structured_output;
  }
}
