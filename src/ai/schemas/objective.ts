import { z } from 'zod';

export const ConditionSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.any()
});

export const ObjectiveSchema = z.object({
  objective: z.string().describe("The clean, normalized business objective."),
  entities: z.array(z.string()).describe("The core business entities involved (e.g., invoices, customers)."),
  conditions: z.array(ConditionSchema).describe("Specific filters or constraints mentioned in the objective."),
  requiredActions: z.array(z.string()).describe("The sequence of high-level actions required."),
  approvalRequired: z.boolean().describe("Whether the objective implies sensitive actions that would require human approval.")
});

export type Objective = z.infer<typeof ObjectiveSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
