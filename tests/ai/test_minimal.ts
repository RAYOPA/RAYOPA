import { z } from "zod";
import { OpenRouterProvider } from "../../src/ai/providers/openrouter-provider";
import { config } from "dotenv";

config();

async function run() {
  const provider = new OpenRouterProvider();
  const schema = z.object({
    analysis: z.string(),
    sentiment: z.string(),
    score: z.number()
  });

  const prompt = "Analyze the sentiment of: I love this new architecture, it is super fast.";
  const systemInstruction = "You are a sentiment analysis bot.";

  console.log("Sending minimal request to OpenRouter...");
  const result = await provider.generateStructured(prompt, schema, systemInstruction);
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
