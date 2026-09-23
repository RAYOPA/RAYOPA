import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { AIProvider } from './ai-provider';
import { AIUnavailableError, ValidationError } from '../errors';

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
  ): Promise<T> {
    
    const config: any = {
      responseMimeType: "application/json",
      temperature: 0.2, // Low temperature for deterministic, structured output
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
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
        return parsedData;
        
      } catch (error: any) {
        console.error(`Gemini API Error on attempt ${attempt}:`, error?.message || error);

        // If it's a Zod validation error, DO NOT retry (permanent malformed output)
        if (error instanceof z.ZodError) {
          throw new ValidationError("AI output failed schema validation: " + error.message);
        }
        if (error instanceof ValidationError) {
          throw error;
        }

        // If it's a 503, 429, or network error, retry using exponential backoff
        const isRetryable = error.message && (
          error.message.includes('503') || 
          error.message.includes('429') || 
          error.message.includes('UNAVAILABLE') ||
          error.message.includes('fetch')
        );

        if (isRetryable && attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s + jitter
          const baseDelay = Math.pow(2, attempt) * 1000;
          const jitter = Math.random() * 500;
          // Default backoff, but if 429, wait longer
        let delayMs = 2000 * Math.pow(2, attempt); 
        if (error.status === 429 || error?.message?.includes("429")) {
            delayMs = 25000; // wait 25s for rate limit to reset
        }
        console.warn(`[GeminiProvider] Attempt ${attempt} failed with ${error.status || 'error'}. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
          continue; // Retry
        }

        // If we exhausted retries or it's a non-retryable error
        if (isRetryable && attempt >= maxRetries) {
          throw new AIUnavailableError(`Gemini AI is currently unavailable after ${maxRetries} attempts.`);
        }

        // Throw generic error for anything else (e.g., auth failure)
        throw error;
      }
    }
    
    throw new AIUnavailableError("Unexpected exit from retry loop");
  }
}
