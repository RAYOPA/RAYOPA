export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  outputSchema?: any;
  requiresApproval?: boolean;
}

export let ToolRegistry: Record<string, ToolDefinition> = {};

export function setToolRegistry(tools: Record<string, ToolDefinition>) {
  ToolRegistry = tools;
}

/**
 * Returns a formatted string of available tools for injection into prompts.
 */
export function getAvailableToolsDescription(): string {
  return Object.values(ToolRegistry).map(tool => {
    let inputsStr = "";
    if (tool.inputSchema?.properties) {
      inputsStr = Object.keys(tool.inputSchema.properties).join(", ");
    }
    return `- ${tool.name}(${inputsStr}): ${tool.description} ${tool.requiresApproval ? '(Requires Approval)' : ''}`;
  }).join('\n');
}
