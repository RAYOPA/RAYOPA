import { NextResponse } from 'next/server';
import { ProviderRouter } from '@/ai/providers/provider-router';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { prompt, data } = await req.json();
    
    if (!prompt || !data) {
      return NextResponse.json({ error: 'Prompt and data are required' }, { status: 400 });
    }

    const router = new ProviderRouter();
    
    const schema = z.object({
      analysis: z.string().describe("The detailed analysis and answer to the user's prompt based on the provided data."),
    });

    const systemInstruction = `You are an expert data analyst AI. You are provided with some tabular data (CSV, Excel, etc.). Analyze the data and provide a detailed, helpful answer to the user's question.

Data:
${data.substring(0, 50000)}`;

    const response = await router.generateStructured(prompt, schema, systemInstruction);

    return NextResponse.json({ result: response.structured_output.analysis });
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to analyze data' }, { status: 500 });
  }
}
