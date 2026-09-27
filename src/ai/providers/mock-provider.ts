import { z } from 'zod';
import { AIProvider, AIProviderResponse } from './ai-provider';

export class MockProvider implements AIProvider {
  async generateStructured<T>(prompt: string, schema: z.ZodSchema<T>, systemInstruction?: string): Promise<AIProviderResponse<T>> {
    let result: any = {};
    
    // Data analyst feature — system instruction contains the CSV data
    if (systemInstruction && systemInstruction.startsWith("You are an expert data analyst AI")) {
      result = {
        analysis: "⚠️ No AI provider is currently configured (API keys are missing and Ollama is not running locally). " +
          "To enable real AI analysis, please configure one of the following in your .env file:\n" +
          "  • OPENROUTER_API_KEY — for OpenRouter (supports many models)\n" +
          "  • GROK_API_KEY — for Grok (xAI)\n" +
          "  • Or run Ollama locally: https://ollama.ai\n\n" +
          "Your file was uploaded successfully and the prompt was received. " +
          "Once an AI provider is configured this feature will return real data insights."
      };
    } else if (prompt.includes("Analyze the following user objective:")) {
      // Analyze mode
      result = {
        objective: "Cross-app orchestration workflow",
        entities: [{ name: "customer", value: "overdue" }],
        conditions: [{ type: "financial", expression: "amount > 50000" }],
        requiredActions: ["crmLookupCustomer", "spreadsheetUpdateRow", "prepareEmail", "sendEmail", "verifyDelivery"],
        approvalRequired: true
      };
    } else if (prompt.includes("REPLAN MODE")) {
      // Replan mode
      result = {
        steps: [
          {
            tool: "spreadsheetUpdateRow",
            arguments: { sheet: "CollectionsV2", data: { priority: "high" } },
            reason: "Retry spreadsheet update with unlocked sheet",
            requires_approval: false
          }
        ]
      };
    } else if (prompt.includes("post-execution reflection")) {
      // Reflect mode
      result = {
        summary: "Completed cross-app workflow with a spreadsheet failure and successful recovery.",
        successful_strategy: ["Looked up CRM", "Used CollectionsV2 spreadsheet"],
        failure_patterns: ["Collections spreadsheet is locked"],
        recovery_strategy: ["Switch to CollectionsV2 for updates"],
        lessons: ["Always check if Collections is locked before writing"],
        avoid_actions: ["Writing to Collections"],
        confidence: 0.95,
        workflow_domain: "Collections",
        applications_involved: ["CRM", "Spreadsheet", "Email"]
      };
    } else {
      // Plan mode
      const isRun2 = prompt.includes("Collections spreadsheet is locked");
      
      result = {
        steps: [
          {
            tool: "crmLookupCustomer",
            arguments: { email: "customer@example.com" },
            reason: "Check CRM status",
            requires_approval: false
          },
          {
            tool: "spreadsheetUpdateRow",
            arguments: { sheet: isRun2 ? "CollectionsV2" : "Collections", data: { priority: "high" } },
            reason: "Update spreadsheet",
            requires_approval: false
          },
          {
            tool: "prepareEmail",
            arguments: { recipient: "customer@example.com", subject: "Overdue", body: "Please pay" },
            reason: "Prepare follow up email",
            requires_approval: false
          },
          {
            tool: "sendEmail",
            arguments: { recipient: "customer@example.com", subject: "Overdue", body: "Please pay" },
            reason: "Send email",
            requires_approval: true
          },
          {
            tool: "verifyDelivery",
            arguments: { message_id: "msg-1" },
            reason: "Verify delivery",
            requires_approval: false
          }
        ]
      };
    }
    
    return {
      structured_output: result as T,
      provider: 'mock',
      model: 'mock-1.0',
      success: true,
      fallback: false
    };
  }
}
