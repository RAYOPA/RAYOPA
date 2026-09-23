import { z } from 'zod';
import { AIProvider, AIProviderResponse } from './ai-provider';
import { 
  AIUnavailableError, 
  ValidationError,
  AIQuotaExceededError,
  AIRateLimitedError,
  AITimeoutError,
  AIAuthError
} from '../errors';

export class GrokProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = "https://api.x.ai/v1/chat/completions";

  constructor() {
    this.apiKey = process.env.XAI_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("XAI_API_KEY environment variable is missing.");
    }
    this.model = process.env.GROK_MODEL || "grok-beta";
  }

  async generateStructured<T>(
    prompt: string, 
    schema: z.ZodSchema<T>,
    systemInstruction?: string
  ): Promise<AIProviderResponse<T>> {
    
    const startTime = Date.now();
    const messages = [];

    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    
    // Ask it to return JSON
    messages.push({ role: "user", content: prompt + "\n\nReturn ONLY a valid JSON object." });

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.2,
          stream: false
        })
      });

      if (!response.ok) {
        const status = response.status;
        const text = await response.text();
        
        if (status === 401 || status === 403) throw new AIAuthError(`Grok Auth Error: ${text}`);
        if (status === 429) {
          if (text.toLowerCase().includes('quota')) throw new AIQuotaExceededError(`Grok Quota Exceeded: ${text}`);
          throw new AIRateLimitedError(`Grok Rate Limited: ${text}`);
        }
        if (status === 503 || status === 504) throw new AITimeoutError(`Grok Timeout: ${text}`);
        throw new AIUnavailableError(`Grok API Error ${status}: ${text}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Empty response from Grok");
      }

      // Parse JSON from the response
      let jsonObject;
      try {
        jsonObject = JSON.parse(content);
      } catch (e) {
        // Fallback for markdown-wrapped JSON blocks
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonObject = JSON.parse(jsonMatch[1]);
        } else {
          throw new ValidationError("Failed to parse JSON from Grok response");
        }
      }

      // Validate against the Zod schema
      const parsedData = schema.parse(jsonObject);
      
      const latencyMs = Date.now() - startTime;
      
      return {
        provider: 'grok',
        model: this.model,
        success: true,
        structured_output: parsedData,
        latency_ms: latencyMs,
        fallback: false
      };
      
    } catch (error: any) {
      console.error(`Grok API Error:`, error?.message || error);

      if (error instanceof z.ZodError) {
        throw new ValidationError("AI output failed schema validation: " + error.message);
      }
      if (
        error instanceof ValidationError ||
        error instanceof AIAuthError ||
        error instanceof AIQuotaExceededError ||
        error instanceof AIRateLimitedError ||
        error instanceof AITimeoutError ||
        error instanceof AIUnavailableError
      ) {
        throw error;
      }

      // Network level fetch errors
      throw new AIUnavailableError(`Grok error: ${error.message}`);
    }
  }
}
