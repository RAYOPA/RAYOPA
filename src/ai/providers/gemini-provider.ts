import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { AIProvider, AIProviderResponse } from './ai-provider';
import { 
  AIUnavailableError, 
  ValidationError,
  AIQuotaExceededError,
  AIRateLimitedError,
  AITimeoutError
} from '../errors';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    
    // Initialize the official Gemini SDK
    this.ai = new GoogleGenAI({ apiKey });
    this.model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  }

  async generateStructured<T>(
    prompt: string, 
    schema: z.ZodSchema<T>,
    systemInstruction?: string
  ): Promise<AIProviderResponse<T>> {
    
    const config: any = {
      responseMimeType: "application/json",
      temperature: 0.2, // Low temperature for deterministic, structured output
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const startTime = Date.now();

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: config
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      // Parse JSON from the response
      let jsonObject;
      try {
        jsonObject = JSON.parse(text);
      } catch (e) {
        // Fallback for markdown-wrapped JSON blocks
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonObject = JSON.parse(jsonMatch[1]);
        } else {
          throw new ValidationError("Failed to parse JSON from Gemini response");
        }
      }

      // Validate against the Zod schema
      const parsedData = schema.parse(jsonObject);
      
      const latencyMs = Date.now() - startTime;
      
      return {
        provider: 'gemini',
        model: this.model,
        success: true,
        structured_output: parsedData,
        latency_ms: latencyMs,
        fallback: false
      };
      
    } catch (error: any) {
      console.error(`Gemini API Error:`, error?.message || error);

      if (error instanceof z.ZodError) {
        throw new ValidationError("AI output failed schema validation: " + error.message);
      }
      if (error instanceof ValidationError) {
        throw error;
      }

      const msg = error?.message?.toLowerCase() || "";
      const status = error?.status;

      // Quota / Rate limit mapping
      if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('exhausted')) {
        throw new AIQuotaExceededError(`Gemini quota exceeded: ${error.message}`);
      }
      
      if (msg.includes('rate limit')) {
        throw new AIRateLimitedError(`Gemini rate limited: ${error.message}`);
      }

      if (status === 503 || status === 504 || msg.includes('timeout')) {
        throw new AITimeoutError(`Gemini timeout/unavailable: ${error.message}`);
      }
      
      if (status === 500 || msg.includes('unavailable') || msg.includes('fetch')) {
        throw new AIUnavailableError(`Gemini unavailable: ${error.message}`);
      }

      // Fallback
      throw new AIUnavailableError(`Gemini error: ${error.message}`);
    }
  }
}
