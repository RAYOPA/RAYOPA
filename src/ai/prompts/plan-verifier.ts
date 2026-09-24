import { Plan } from '../schemas/plan';
import { ToolRegistry } from '../tools/registry';
import { CapabilityUnavailableError } from '../errors';

export class PlanVerifier {
  /**
   * Verifies a generated plan against the tool registry and basic rules.
   * Throws an error if the plan is invalid.
   */
  verify(plan: Plan): void {
    const stepIds = new Set<string>();

    // Pass 1: Collect step IDs and verify tools
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const effectiveId = step.stepId || `step_${i + 1}`;
      if (stepIds.has(effectiveId)) {
        throw new Error(`Duplicate stepId found: ${effectiveId}`);
      }
      stepIds.add(effectiveId);

      const toolDef = ToolRegistry[step.tool];
      if (!toolDef) {
        throw new CapabilityUnavailableError(`TOOL_NOT_FOUND: The requested workflow requires a '${step.tool}' capability that is not currently available.`);
      }

      // Basic argument validation could go here
    }

    // Pass 2: Verify dependencies exist
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const effectiveId = step.stepId || `step_${i + 1}`;
      if (step.dependsOn && step.dependsOn.length > 0) {
        for (const dep of step.dependsOn) {
          if (!stepIds.has(dep)) {
            throw new Error(`Step ${effectiveId} depends on unknown step ${dep}`);
          }
        }
      }
    }
  }
}
