import { z } from 'zod';

export const StepSchema = z.object({
  stepId: z.string().optional().describe("A unique identifier for this step"),
  action: z.string().optional().describe("Description of what this step does"),
  tool: z.string().describe("The exact name of the tool to use from the registry"),
  arguments: z.record(z.string(), z.any()).optional().default({}).describe("The arguments to pass to the tool"),
  dependsOn: z.array(z.string()).optional().default([]).describe("Array of stepIds that must complete before this step"),
  requiresApproval: z.boolean().optional().default(false).describe("Whether this step requires approval")
});

export const PlanSchema = z.object({
  objective: z.string().optional().default("").describe("The overall objective"),
  steps: z.array(StepSchema).describe("The sequence of steps to execute")
});

export type Step = z.infer<typeof StepSchema>;
export type Plan = z.infer<typeof PlanSchema>;
