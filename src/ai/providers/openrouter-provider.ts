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

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = "https://openrouter.ai/api/v1/chat/completions";

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is missing.");
    }
    this.model = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";
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

    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(this.baseUrl, {
          method: "POST",
          signal: AbortSignal.timeout(30000),
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: messages,
            temperature: 0.2,
            stream: false,
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const status = response.status;
          const text = await response.text();
          
          if (status === 401 || status === 403) throw new AIAuthError(`OpenRouter Auth Error: ${text}`);
          if (status === 429) {
            if (text.toLowerCase().includes('quota') || text.toLowerCase().includes('insufficient_quota')) throw new AIQuotaExceededError(`OpenRouter Quota Exceeded: ${text}`);
            throw new AIRateLimitedError(`OpenRouter Rate Limited: ${text}`);
          }
          if (status === 503 || status === 504 || status === 524 || status === 529) {
             if (attempt === maxRetries) {
                 throw new AITimeoutError(`OpenRouter Timeout: ${text}`);
             }
             await new Promise(res => setTimeout(res, 2000 * attempt));
             continue;
          }
          
          if (status >= 500) {
             if (attempt === maxRetries) {
                 throw new AIUnavailableError(`OpenRouter API Error ${status}: ${text}`);
             }
             await new Promise(res => setTimeout(res, 2000 * attempt));
             continue;
          }
          
          throw new AIUnavailableError(`OpenRouter API Error ${status}: ${text}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error("Empty response from OpenRouter");
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
            throw new ValidationError("Failed to parse JSON from OpenRouter response");
          }
        }

        // Validate against the Zod schema
        const parsedData = schema.parse(jsonObject);
        
        const latencyMs = Date.now() - startTime;
        
        return {
          provider: 'openrouter',
          model: this.model,
          success: true,
          structured_output: parsedData,
          latency_ms: latencyMs,
          fallback: false
        };
        
      } catch (error: any) {
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

        if (error.name === 'TypeError' && error.message === 'fetch failed') {
           if (attempt === maxRetries) {
               throw new AIUnavailableError(`OpenRouter connection error: ${error.message}`);
           }
           await new Promise(res => setTimeout(res, 2000 * attempt));
           continue;
        }
        
        // Network level fetch errors
        throw new AIUnavailableError(`OpenRouter error: ${error.message}`);
      }
    }
    throw new AIUnavailableError(`OpenRouter AI is currently unavailable after ${maxRetries} attempts.`);
  }
}
