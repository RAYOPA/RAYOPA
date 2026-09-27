import { AIProvider } from '../providers/ai-provider';
import { z } from 'zod';

export const ReflectionSchema = z.object({
  summary: z.string(),
  successful_strategy: z.array(z.string()),
  failure_patterns: z.array(z.string()),
  recovery_strategy: z.array(z.string()),
  lessons: z.array(z.string()),
  avoid_actions: z.array(z.string()),
  confidence: z.number(),
  workflow_domain: z.string(),
  applications_involved: z.array(z.string())
});

export type Reflection = z.infer<typeof ReflectionSchema>;

export class Reflector {
  constructor(private ai: AIProvider) {}

  async reflect(payload: any): Promise<Reflection> {
    const systemInstruction = `You are the Reflector component for Nocode AI.
Your job is to convert workflow execution outcomes into structured lessons.
Analyze the provided execution history and extract actionable intelligence.
Do NOT create arbitrary tools, change permissions, or mutate business state. 
Your output is ADVISORY ONLY and provides historical experience for future planners.`;

    const prompt = `Analyze the following executed workflow context and provide a post-execution reflection:

Objective: ${payload.objective}
Status: ${payload.status}
Tools Selected: ${JSON.stringify(payload.tools_selected)}
Successful Actions: ${JSON.stringify(payload.successful_actions)}
Failed Actions: ${JSON.stringify(payload.failed_actions)}
Failures: ${JSON.stringify(payload.failures)}

Generate the reflection matching the required schema exactly (do NOT wrap it in a parent key). Ensure it explicitly records any known failure patterns and their recovery strategies (like alternative data sources).

JSON output format:
{
  "summary": "string",
  "successful_strategy": ["string"],
  "failure_patterns": ["string"],
  "recovery_strategy": ["string"],
  "lessons": ["string"],
  "avoid_actions": ["string"],
  "confidence": 0.9,
  "workflow_domain": "string",
  "applications_involved": ["string"]
}`;

    const response = await this.ai.generateStructured<Reflection>(prompt, ReflectionSchema, systemInstruction);
    return response.structured_output;
  }
}
