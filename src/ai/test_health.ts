import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local', override: false });
import { ProviderRouter } from './providers/provider-router';
import { OpenRouterProvider } from './providers/openrouter-provider';
import { GrokProvider } from './providers/grok-provider';
import { OllamaProvider } from './providers/ollama-provider';
import { z } from 'zod';

const testSchema = z.object({
  status: z.string(),
  message: z.string()
});

const prompt = "Reply with a JSON object containing status='SUCCESS' and message='Hello World'";

async function testProvider(name: string, ProviderClass: any) {
  console.log(`\n========================================`);
  console.log(`Testing Provider: ${name}`);
  console.log(`========================================`);
  try {
    const provider = new ProviderClass();
    console.log(`Configuration: Loaded`);
    const start = Date.now();
    const result = await provider.generateStructured(prompt, testSchema);
    const latency = Date.now() - start;
    console.log(`Network Request: SUCCESS`);
    console.log(`Structured Output:`, result.structured_output);
    console.log(`Latency: ${latency}ms`);
  } catch (error: any) {
    console.log(`Network Request: FAILED`);
    console.log(`Error Classification: ${error.name || 'UNKNOWN'}`);
    console.log(`Message: ${error.message}`);
  }
}

async function main() {
  await testProvider("OpenRouter", OpenRouterProvider);
  
  // For Grok, if key is missing we just instantiate and let it fail, 
  // but if it fails in constructor we catch it here.
  try {
    await testProvider("Grok", GrokProvider);
  } catch (e: any) {
    console.log(`\n========================================`);
    console.log(`Testing Provider: Grok`);
    console.log(`========================================`);
    console.log(`Network Request: FAILED`);
    console.log(`Error Classification: ${e.name || 'Error'}`);
    console.log(`Message: ${e.message}`);
  }

  await testProvider("Ollama", OllamaProvider);
}

main();
