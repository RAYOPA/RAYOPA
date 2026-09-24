import { z } from 'zod';
import { AIProvider, AIProviderResponse } from './ai-provider';
import { 
  ValidationError,
  AILocalProviderUnavailableError
} from '../errors';

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "qwen3:8b";
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
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          stream: false,
          think: false,
          options: {
            temperature: 0.2,
            num_predict: 512
          }
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new AILocalProviderUnavailableError(`Ollama API Error ${response.status}: ${text}`);
      }

      const data = await response.json();
      const content = data.message?.content;
      
      if (!content) {
        throw new Error("Empty response from Ollama");
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
          throw new ValidationError("Failed to parse JSON from Ollama response");
        }
      }

      // Validate against the Zod schema
      const parsedData = schema.parse(jsonObject);
      
      const latencyMs = Date.now() - startTime;
      
      return {
        provider: 'ollama',
        model: this.model,
        success: true,
        structured_output: parsedData,
        latency_ms: latencyMs,
        fallback: false
      };
      
    } catch (error: any) {
      console.error(`Ollama API Error:`, error?.message || error);

      if (error instanceof z.ZodError) {
        throw new ValidationError("AI output failed schema validation: " + error.message);
      }
      if (
        error instanceof ValidationError ||
        error instanceof AILocalProviderUnavailableError
      ) {
        throw error;
      }

      // Network level fetch errors or timeout connecting to localhost
      throw new AILocalProviderUnavailableError(`Ollama connection error: ${error.message}`);
    }
  }
}
