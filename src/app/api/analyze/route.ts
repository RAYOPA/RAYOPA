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

    const systemInstruction = `You are an expert data analyst AI. You are provided with some tabular data (CSV format). Analyze the data and provide a detailed, helpful answer to the user's question.

CRITICAL: You MUST respond with ONLY a valid JSON object in this EXACT format:
{"analysis": "your detailed analysis as a plain string here"}

The value of "analysis" must be a plain text string (NOT an object, NOT an array). Write your full analysis as readable text inside the string. Use \\n for line breaks if needed.

Data:
${data.substring(0, 50000)}`;

    const response = await router.generateStructured(prompt, schema, systemInstruction);

    return NextResponse.json({ result: response.structured_output.analysis });
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to analyze data' }, { status: 500 });
  }
}
