"use client";

import { useState } from 'react';
import { Upload, FileText, Send, Bot, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AnalyzePage() {
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData(event.target?.result as string);
    };
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
    };
    reader.readAsText(file); // This handles CSV and basic text. Real Excel might need SheetJS, but text fallback is a start.
  };

  const handleAnalyze = async () => {
    if (!fileData) {
      setError("Please upload a file first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a question or prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, data: fileData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze data');
      }

      setResult(data.result);
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred.';
      // Provide a user-friendly message for Ollama/AI provider errors
      if (msg.includes('Ollama') || msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ALL_PROVIDERS_UNAVAILABLE')) {
        setError('AI analysis requires a local Ollama server or cloud API key (OPENROUTER_API_KEY). The mock provider will respond with setup instructions.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-20 mt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#12372A] flex items-center gap-2">
          <Bot className="w-8 h-8 text-[#436850]" />
          Data Analyst AI
        </h1>
        <p className="text-[#436850] mt-2">Upload your custom CSV data and ask questions. The AI will analyze it for you.</p>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <div className="bg-white p-6 rounded-2xl border border-[#ADBC9F] shadow-sm">
          <h2 className="text-lg font-bold text-[#12372A] mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#436850]" />
            1. Upload Data
          </h2>
          
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#ADBC9F] border-dashed rounded-xl cursor-pointer bg-[#FBFADA]/30 hover:bg-[#ADBC9F]/10 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileText className="w-8 h-8 mb-2 text-[#436850]" />
                <p className="mb-1 text-sm text-[#436850]">
                  <span className="font-bold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-[#436850]/70">CSV or Text files</p>
              </div>
              <input id="dropzone-file" type="file" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
            </label>
          </div>
          
          {fileName && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between">
              <span className="font-medium">File loaded: {fileName}</span>
              <span className="text-xs text-emerald-600 font-mono">{fileData?.length.toLocaleString()} characters</span>
            </div>
          )}
        </div>

        {/* Query Section */}
        <div className={`bg-white p-6 rounded-2xl border border-[#ADBC9F] shadow-sm transition-opacity ${fileData ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <h2 className="text-lg font-bold text-[#12372A] mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-[#436850]" />
            2. Ask the AI
          </h2>
          
          <div className="flex flex-col gap-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What are the key trends in this data? or Summarize the total revenue by region."
              className="w-full min-h-[100px] p-4 rounded-xl border border-[#ADBC9F] focus:border-[#436850] focus:ring-2 focus:ring-[#436850]/20 resize-y text-sm outline-none"
            />
            
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !fileData || !prompt.trim()}
              className="bg-[#12372A] hover:bg-[#436850] text-[#FBFADA] font-bold py-3 px-6 rounded-xl transition-colors self-end flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="bg-[#12372A] p-6 rounded-2xl border border-[#436850] shadow-xl text-white">
            <h2 className="text-lg font-bold text-[#FBFADA] mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#ADBC9F]" />
              AI Analysis Result
            </h2>
            <div className="prose prose-invert max-w-none text-sm text-[#FBFADA]/90 leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
