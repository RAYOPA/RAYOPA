import fetch from 'node-fetch';

async function getPaidModels() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    const data = await res.json();
    const models = data.data;

    // Filter paid models
    const paidModels = models.filter(m => m.pricing.prompt !== "0" || m.pricing.completion !== "0");
    
    // Pick out some top fast models
    const targets = [
      "google/gemini-1.5-flash",
      "google/gemini-1.5-pro",
      "anthropic/claude-3-haiku",
      "anthropic/claude-3-5-haiku",
      "openai/gpt-4o-mini",
      "meta-llama/llama-3.3-70b-instruct"
    ];

    for (const m of paidModels) {
      if (targets.includes(m.id)) {
        console.log(`- ID: ${m.id}`);
        console.log(`  Context Length: ${m.context_length}`);
        console.log(`  Pricing: Prompt ${m.pricing.prompt}, Completion ${m.pricing.completion}`);
        console.log(`  Description: ${m.description?.slice(0, 100)}...`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

getPaidModels();
