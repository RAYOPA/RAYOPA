import { AIProvider } from '../providers/ai-provider';
import { ObjectiveSchema, Objective } from '../schemas/objective';

export class ObjectiveAnalyzer {
  constructor(private ai: AIProvider) {}

  async analyze(userInput: string): Promise<Objective> {
    const systemInstruction = `You are the Objective Analyzer for Nocode AI.
Your job is to convert natural language business objectives into structured requirements.
Extract the core entities, explicitly listed conditions, and required high-level actions.
Determine if the requested actions imply sensitive operations (e.g., sending emails, making payments, escalating issues) which require human approval.

Return ONLY a valid JSON object matching the requested schema.`;

    const prompt = `Analyze the following user objective:
    
"${userInput}"

Extract the required fields:
- objective: A clean, concise summary of the goal.
- entities: Array of business entities (e.g., invoices, customers, communications).
- conditions: Array of objects with field, operator, and value.
- requiredActions: Array of logical steps requested (e.g., analyze, prioritize, prepare_follow_up, request_approval, execute).
- approvalRequired: Boolean, true if the task involves sensitive state changes.`;

    const response = await this.ai.generateStructured<Objective>(prompt, ObjectiveSchema, systemInstruction);
    return response.structured_output;
  }
}
