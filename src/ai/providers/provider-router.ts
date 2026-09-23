import { z } from 'zod';
import { AIProvider, AIProviderResponse } from './ai-provider';
import { OpenRouterProvider } from './openrouter-provider';
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
  private providerFactories: (() => AIProvider)[];
  private maxCalls: number;
  private currentCallCount: number;

  constructor(initialCallCount: number = 1) {
    this.providerFactories = [
      () => new OpenRouterProvider(),
      () => new GrokProvider(),
      () => new OllamaProvider()
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
    
    for (let i = 0; i < this.providerFactories.length; i++) {
      const isFallback = i > 0;
      
      let provider: AIProvider;
      let providerName = "Unknown";
      
      try {
        provider = this.providerFactories[i]();
        providerName = provider.constructor.name.replace('Provider', '');
      } catch (e: any) {
        // If a provider fails to instantiate (e.g. missing API key), skip it and fallback
        lastError = e;
        fallbackReason = `PROVIDER_INIT_FAILED: ${e.message}`;
        console.error(`Skipping provider at index ${i} due to init error: ${e.message}`);
        continue;
      }

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
          console.error(`Marking ${providerName} temporarily unavailable. Moving to next provider... Error: ${error.message}`);
          continue;
        }

        // Unrecoverable errors (Validation, Auth, Local unavailable, etc.) bubble up immediately
        console.error(`Unrecoverable error in ${providerName}:`, error);
        throw error;
      }
    }

    throw new AIUnavailableError(`AI_ALL_PROVIDERS_UNAVAILABLE: All fallback options exhausted. Last error: ${lastError?.message}`);
  }
}
