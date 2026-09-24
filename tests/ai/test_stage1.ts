import { z } from "zod";
import { ProviderRouter } from "../../src/ai/providers/provider-router";
import { config } from "dotenv";

config();

async function run() {
  const provider = new ProviderRouter();
  const schema = z.object({
    intent: z.string(),
    entities: z.array(z.string())
  });

  const prompt = "Find overdue invoices.";
  const systemInstruction = "Analyze the intent.";

  console.log("Sending minimal request to ProviderRouter...");
  const result = await provider.generateStructured(prompt, schema, systemInstruction);
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
