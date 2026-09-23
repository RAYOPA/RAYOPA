import { z } from 'zod';

export interface AIProviderResponse<T> {
  provider: string;
  model: string;
  request_id?: string;
  success: boolean;
  structured_output: T;
  latency_ms?: number;
  fallback: boolean;
  fallback_reason?: string;
}

export interface AIProvider {
  /**
   * Generates structured data based on a prompt and a Zod schema.
   * @param prompt The prompt to send to the LLM.
   * @param schema The Zod schema to structure the output.
   * @param systemInstruction Optional system instructions to guide the model.
   * @returns A promise resolving to the AIProviderResponse containing parsed object of type T.
   */
  generateStructured<T>(prompt: string, schema: z.ZodSchema<T>, systemInstruction?: string): Promise<AIProviderResponse<T>>;
}
