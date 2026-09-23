import { AIProvider } from '../providers/ai-provider';
import { PlanSchema, Plan } from '../schemas/plan';
import { Objective } from '../schemas/objective';
import { getAvailableToolsDescription } from '../tools/registry';

export class DynamicPlanner {
  constructor(private ai: AIProvider) {}

  async plan(objective: Objective, contextData?: string): Promise<Plan> {
    const tools = getAvailableToolsDescription();

    const systemInstruction = `You are the Dynamic Planner for FlowPilot AI.
Your job is to translate a structured business objective into a sequential execution plan.
You have access to a specific set of tools. You MUST ONLY use the tools provided in the tool registry.
If a requested capability does not exist in the tools list (e.g., booking a flight), do NOT invent a tool. You must still generate a step, but use a tool name like "unknown_tool" so the verifier can catch it, or attempt to use the closest tool.

Available Tools:
${tools}

Rules:
1. Each step must have a unique stepId (e.g., step_1).
2. 'dependsOn' must contain an array of stepIds that must execute before this step.
3. 'tool' must be the exact name from the registry.
4. Set 'requiresApproval' to true for steps that actually perform sensitive actions, based on the objective's requirement.

You must output a JSON object with this exact structure:
{
  "objective": "The overall objective this plan achieves",
  "steps": [
    {
      "stepId": "unique string identifier",
      "action": "human readable description of the step",
      "tool": "exact tool name from the registry",
      "arguments": { "key": "value" },
      "dependsOn": ["array of stepIds"],
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

    console.error(`--- AI PLANNER PROMPT METRICS ---`);
    console.error(`System Instruction Size: ${systemInstruction.length} chars`);
    console.error(`User Prompt Size: ${prompt.length} chars`);
    console.error(`Total Size: ${systemInstruction.length + prompt.length} chars`);

    const response = await this.ai.generateStructured<Plan>(prompt, PlanSchema, systemInstruction);
    return response.structured_output;
  }
}
