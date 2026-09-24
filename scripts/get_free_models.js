import fetch from 'node-fetch';

async function getFreeModels() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    const data = await res.json();
    const models = data.data;

    const freeModels = models.filter(m => m.pricing.prompt === "0" && m.pricing.completion === "0");
    console.log(`Found ${freeModels.length} free models.\n`);

    for (const m of freeModels) {
      console.log(`- ID: ${m.id}`);
      console.log(`  Context Length: ${m.context_length}`);
      console.log(`  Description: ${m.description?.slice(0, 50)}...`);
      // We can't strictly tell if they support tool calling from this API endpoint,
      // but we can look for "llama-3", "gemma", "mistral", "qwen", "phi" which typically do.
    }
  } catch (e) {
    console.error(e);
  }
}

getFreeModels();
