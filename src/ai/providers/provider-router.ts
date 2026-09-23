import { z } from 'zod';
import { AIProvider, AIProviderResponse } from './ai-provider';
import { GeminiProvider } from './gemini-provider';
import { GrokProvider } from './grok-provider';
import { OllamaProvider } from './ollama-provider';
import { 
  AIQuotaExceededError,
  AIRateLimitedError,
  AIUnavailableError,
  AITimeoutError,
  AIBudgetExceededError,
  AIAuthError,
  ValidationError
} from '../errors';

export class ProviderRouter implements AIProvider {
  private providers: AIProvider[];
  private maxCalls: number;
  private currentCallCount: number;

  constructor(initialCallCount: number = 1) {
    this.providers = [
      new GeminiProvider(),
      new GrokProvider(),
      new OllamaProvider()
    ];
    this.maxCalls = parseInt(process.env.MAX_AI_CALLS || "10", 10);
    this.currentCallCount = initialCallCount;
  }

  private isRecoverableError(error: any): boolean {
    return (
      error instanceof AIQuotaExceededError ||
      error instanceof AIRateLimitedError ||
      error instanceof AIUnavailableError ||
      error instanceof AITimeoutError
    );
  }

  async generateStructured<T>(
    prompt: string, 
    schema: z.ZodSchema<T>,
    systemInstruction?: string
  ): Promise<AIProviderResponse<T>> {
    
    let lastError: any = null;
    let fallbackReason = "";
    
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const isFallback = i > 0;
      
      if (this.currentCallCount > this.maxCalls) {
        throw new AIBudgetExceededError(`Global AI budget of ${this.maxCalls} calls exceeded.`);
      }

      this.currentCallCount++;

      try {
        const response = await provider.generateStructured(prompt, schema, systemInstruction);
        
        // Log the successful call
        console.log(`\nAI Provider: ${response.provider}`);
        console.log(`AI Model: ${response.model}`);
        console.log(`Fallback: ${isFallback}`);
        if (isFallback) {
          console.log(`Fallback Reason: ${fallbackReason}`);
        }
        console.log(`AI Calls Used: ${this.currentCallCount - 1}`);

        response.fallback = isFallback;
        response.fallback_reason = fallbackReason;
        
        return response;
        
      } catch (error: any) {
        // Record failure
        const providerName = provider.constructor.name.replace('Provider', '');
        console.log(`\nAI Provider: ${providerName}`);
        console.log(`AI Model: Unknown`);
        console.log(`Fallback: ${isFallback}`);
        if (isFallback) {
          console.log(`Fallback Reason: ${fallbackReason}`);
        }
        console.log(`AI Calls Used: ${this.currentCallCount - 1}`);
        console.error(`Status: FAILED (${error.name || 'UNKNOWN'}) - ${error.message}`);
        
        if (this.isRecoverableError(error)) {
          lastError = error;
          fallbackReason = `${providerName.toUpperCase()}_${error.name || 'UNAVAILABLE'}`;
          console.log(`Marking ${providerName} temporarily unavailable. Moving to next provider...`);
          continue;
        }

        // Unrecoverable errors (Validation, Auth, Local unavailable, etc.) bubble up immediately
        throw error;
      }
    }

    throw new AIUnavailableError(`AI_ALL_PROVIDERS_UNAVAILABLE: All fallback options exhausted. Last error: ${lastError?.message}`);
  }
}
