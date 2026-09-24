import { z } from "zod";
import { ProviderRouter } from "../../src/ai/providers/provider-router";
import { config } from "dotenv";

config();

async function run() {
  const provider = new ProviderRouter();
  const schema = z.object({
    status: z.string()
  });

  const prompt = "Return a JSON object with one field called status whose value is success.";
  const systemInstruction = "You are a helpful assistant.";

  console.log("Sending minimal request to ProviderRouter...");
  const startTime = Date.now();
  const result = await provider.generateStructured(prompt, schema, systemInstruction);
  const latency = Date.now() - startTime;
  console.log("Latency:", latency, "ms");
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
