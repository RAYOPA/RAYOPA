"use client";

import React, { useState } from "react";
import Link from "next/link";

const slides = [
  {
    title: "The Problem: Business Workflows Are Not Static",
    content: (
      <div className="space-y-4 text-lg">
        <p>SMBs operate across:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Emails</li>
          <li>Spreadsheets</li>
          <li>Documents</li>
          <li>Databases</li>
          <li>Messaging systems</li>
          <li>Internal policies</li>
        </ul>
        <p className="pt-4">Employees manually:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>search information</li>
          <li>cross-check records</li>
          <li>make decisions</li>
          <li>follow up</li>
          <li>transfer data</li>
          <li>recover from failures</li>
        </ul>
        <div className="mt-6 p-4 bg-slate-100 rounded-md">
          <p>Traditional automation follows predefined paths.</p>
          <p className="font-semibold text-blue-700 mt-2">Real business workflows often require decisions based on changing information.</p>
        </div>
      </div>
    ),
  },
  {
    title: "The Problem With Traditional Automation",
    content: (
      <div className="space-y-6">
        <div className="bg-slate-900 text-green-400 p-6 rounded-md font-mono text-sm inline-block">
          STATIC RULES<br /><br />
          IF condition<br />
          &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
          DO action<br />
          &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
          NEXT FIXED STEP<br />
          &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
          FAILURE<br />
          &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
          MANUAL INTERVENTION
        </div>
        <div>
          <h3 className="text-xl font-bold">The limitation</h3>
          <p className="text-lg text-slate-600 mt-2">
            Traditional workflows generally assume that the expected path remains valid.<br />
            Business operations frequently do not.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Our Solution: FlowPilot AI",
    subtitle: "An adaptive business workflow orchestration system",
    content: (
      <div className="space-y-6">
        <div className="bg-slate-900 text-blue-300 p-6 rounded-md font-mono text-sm inline-block text-center">
          Business Objective<br />
          ↓<br />
          Understand<br />
          ↓<br />
          Plan<br />
          ↓<br />
          Gather Context<br />
          ↓<br />
          Reason<br />
          ↓<br />
          Approve<br />
          ↓<br />
          Execute<br />
          ↓<br />
          Observe<br />
          ↓<br />
          Re-plan<br />
          ↓<br />
          Complete
        </div>
        <blockquote className="border-l-4 border-blue-600 pl-4 text-xl font-medium italic text-slate-700">
          FlowPilot transforms business intent into an executable, stateful, adaptive workflow.
        </blockquote>
      </div>
    ),
  },
  {
    title: "How It Is Different",
    content: (
      <div className="grid grid-cols-2 gap-8 text-lg">
        <div className="bg-slate-50 p-6 rounded-lg border">
          <h3 className="font-bold mb-4">Conventional Automation</h3>
          <ul className="space-y-2 text-slate-600">
            <li>• Predefined rules</li>
            <li>• Fixed path</li>
            <li>• Limited context</li>
            <li>• Failure → manual handling</li>
            <li>• Limited adaptation</li>
          </ul>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="font-bold mb-4 text-blue-900">FlowPilot AI</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Natural-language objective</li>
            <li>• Dynamic planning</li>
            <li>• Multi-source context</li>
            <li>• Human approval</li>
            <li>• Failure detection</li>
            <li>• Dynamic re-planning</li>
            <li>• Audit trail</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "System Architecture",
    content: (
      <div className="overflow-x-auto">
        <pre className="bg-slate-900 text-slate-300 p-6 rounded-md font-mono text-sm leading-tight inline-block">
{`                    USER
                     │
                     ▼
            BUSINESS OBJECTIVE
                     │
                     ▼
          OBJECTIVE UNDERSTANDING
                     │
                     ▼
               AI PLANNER
                     │
                     ▼
             PLAN VERIFIER
                     │
                     ▼
              TOOL LAYER
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Invoice    Customer   Communication
       Database   Database     History
          │          │          │
          └──────────┼──────────┘
                     ▼
              DECISION ENGINE
                     │
                     ▼
              HUMAN APPROVAL
                     │
                     ▼
              ACTION EXECUTION
                     │
                     ▼
                 OBSERVE
                     │
               ┌─────┴─────┐
               ▼           ▼
             SUCCESS     FAILURE
               │           │
               │           ▼
               │        RE-PLANNER
               │           │
               └─────┬─────┘
                     ▼
                VERIFICATION
                     │
                     ▼
                 AUDIT LOG`}
        </pre>
      </div>
    ),
  },
  {
    title: "Demo Scenario: Overdue Invoice Resolution",
    content: (
      <div className="space-y-6">
        <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
          <h3 className="font-bold text-amber-900 mb-2">Business objective:</h3>
          <p className="text-lg italic text-amber-800">
            "Find overdue invoices above ₹50,000, analyze customer context, prioritize cases, prepare follow-up actions, and execute approved actions."
          </p>
        </div>
        <div className="bg-slate-900 text-blue-300 p-6 rounded-md font-mono text-lg text-center inline-block">
          12 invoices<br />
          ↓<br />
          7 matching invoices<br />
          ↓<br />
          6 actionable<br />
          ↓<br />
          1 monitoring<br />
          ↓<br />
          3 approval requests
        </div>
      </div>
    ),
  },
  {
    title: "Intelligent Decision Making",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">INV-1001</h3>
            <div className="bg-slate-100 p-4 rounded-md font-mono text-sm space-y-1">
              <div><span className="text-slate-500">Amount:</span> ₹185,000</div>
              <div><span className="text-slate-500">Overdue:</span> 47 days</div>
              <div><span className="text-slate-500">Risk:</span> <span className="text-red-600 font-bold">HIGH</span></div>
              <div><span className="text-slate-500">Payment:</span> NOT RECEIVED</div>
              <div><span className="text-slate-500">History:</span> Previous reminders unresolved</div>
            </div>
          </div>
          <div>
            <div className="bg-blue-50 p-6 rounded-lg h-full border border-blue-200">
              <h3 className="text-sm text-blue-600 uppercase font-semibold mb-2">System decision:</h3>
              <p className="text-2xl font-bold text-blue-900 mb-4">Escalation follow-up</p>
              <h3 className="text-sm text-slate-500 uppercase font-semibold mb-2">Reasoning factors:</h3>
              <ul className="list-disc pl-5 text-slate-700 space-y-1">
                <li>invoice value</li>
                <li>overdue duration</li>
                <li>customer risk</li>
                <li>payment status</li>
                <li>communication history</li>
                <li>business policy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "AI Does Not Bypass Human Control",
    content: (
      <div className="space-y-8 text-center">
        <div className="bg-slate-900 text-slate-300 p-6 rounded-md font-mono text-sm inline-block">
          AI identifies sensitive action<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
          Approval required<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
          Human reviews<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↙&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↘<br />
          &nbsp;&nbsp;&nbsp;&nbsp;Approve&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Reject/Edit<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
          &nbsp;&nbsp;&nbsp;Execution
        </div>
        <div>
          <span className="inline-block bg-amber-100 text-amber-900 px-4 py-2 rounded-full font-bold text-lg border border-amber-300">
            3 approval requests
          </span>
        </div>
      </div>
    ),
  },
  {
    title: "What Happens When the Workflow Fails?",
    content: (
      <div className="space-y-6">
        <div className="bg-slate-900 text-slate-300 p-6 rounded-md font-mono text-sm inline-block text-center">
          <span className="text-white font-bold">INV-1004</span><br /><br />
          Primary contact invalid<br />
          ↓<br />
          <span className="text-red-400">Execution fails</span><br />
          ↓<br />
          Failure detected<br />
          ↓<br />
          Search customer records<br />
          ↓<br />
          Alternate contact found<br />
          ↓<br />
          <span className="text-blue-300">Workflow re-planned</span><br />
          ↓<br />
          Revised execution<br />
          ↓<br />
          <span className="text-green-400 font-bold">SUCCESS</span>
        </div>
        <div className="border-l-4 border-slate-400 pl-4 py-2">
          <p className="font-bold mb-2">The workflow does not simply stop.</p>
          <p className="text-slate-600 italic">
            "The demonstrated workflow detects the failed execution, modifies its execution path, and successfully completes the action using an alternate verified contact."
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Final Results",
    content: (
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-slate-50 p-6 rounded-lg border font-mono text-sm">
          <div className="font-bold text-slate-500 mb-4 border-b pb-2">WORKFLOW RESULT</div>
          <div className="grid grid-cols-2 gap-y-2">
            <div>Invoices analyzed</div><div className="text-right">7</div>
            <div>Actionable cases</div><div className="text-right">6</div>
            <div className="mb-2">Monitoring cases</div><div className="text-right mb-2">1</div>
            
            <div>Approval requests</div><div className="text-right">3</div>
            <div className="mb-2">Approved</div><div className="text-right mb-2">3</div>
            
            <div>Business actions</div><div className="text-right">6</div>
            <div className="mb-2">Execution attempts</div><div className="text-right mb-2">7</div>
            
            <div>Successful actions</div><div className="text-right">6</div>
            <div className="mb-2 text-red-600">Failed attempts</div><div className="text-right text-red-600 mb-2">1</div>
            
            <div className="text-green-600">Recovered failures</div><div className="text-right text-green-600">1</div>
            <div className="text-blue-600">Dynamic re-plans</div><div className="text-right text-blue-600">1</div>
            <div>Unresolved</div><div className="text-right">0</div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <pre className="bg-slate-900 text-slate-300 p-6 rounded-md font-mono text-sm leading-tight inline-block text-center">
{`6 BUSINESS ACTIONS
       │
       └──── completed through ────┐
                                  ▼
                           7 EXECUTION ATTEMPTS`}
          </pre>
        </div>
      </div>
    ),
  },
  {
    title: "Auditability",
    content: (
      <div className="grid grid-cols-2 gap-8 items-center">
        <div className="bg-slate-900 text-slate-300 p-6 rounded-md font-mono text-sm inline-block text-center">
          OBJECTIVE<br />
          ↓<br />
          PLAN<br />
          ↓<br />
          DATA RETRIEVAL<br />
          ↓<br />
          DECISION<br />
          ↓<br />
          APPROVAL<br />
          ↓<br />
          EXECUTION<br />
          ↓<br />
          FAILURE<br />
          ↓<br />
          RE-PLAN<br />
          ↓<br />
          RECOVERY<br />
          ↓<br />
          VERIFICATION
        </div>
        <div>
          <p className="mb-4 text-lg">Every major event is recorded with:</p>
          <ul className="list-disc pl-6 text-slate-600 space-y-2 text-lg mb-6">
            <li>timestamp</li>
            <li>actor</li>
            <li>tool</li>
            <li>status</li>
            <li>result</li>
          </ul>
          <blockquote className="border-l-4 border-blue-600 pl-4 text-lg font-medium italic text-slate-700">
            Every demonstrated workflow transition is traceable through the audit trail.
          </blockquote>
        </div>
      </div>
    ),
  },
  {
    title: "Technology Stack",
    content: (
      <div className="grid grid-cols-2 gap-8 text-lg">
        <div>
          <h3 className="font-bold text-blue-900 mb-2 border-b pb-1">Frontend</h3>
          <p className="text-slate-600">Next.js<br />React<br />TypeScript<br />Tailwind CSS<br />shadcn/ui</p>
          
          <h3 className="font-bold text-blue-900 mt-6 mb-2 border-b pb-1">Orchestration</h3>
          <p className="text-slate-600">LangGraph</p>
          
          <h3 className="font-bold text-blue-900 mt-6 mb-2 border-b pb-1">Validation</h3>
          <p className="text-slate-600">Zod</p>
        </div>
        <div>
          <h3 className="font-bold text-blue-900 mb-2 border-b pb-1">Data</h3>
          <p className="text-slate-600">PostgreSQL<br />Workflow State<br />Audit Events</p>
          
          <h3 className="font-bold text-blue-900 mt-6 mb-2 border-b pb-1">AI</h3>
          <p className="text-slate-600">Configured LLM provider(s)</p>
          
          <h3 className="font-bold text-blue-900 mt-6 mb-2 border-b pb-1">Development</h3>
          <p className="text-slate-600">Git<br />GitHub</p>
        </div>
      </div>
    ),
  },
  {
    title: "Future Extensions",
    content: (
      <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
        <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider mb-6">Future Extensions</span>
        <div className="grid grid-cols-2 gap-4 text-lg text-slate-700">
          <ul className="list-disc pl-6 space-y-2">
            <li>Gmail integration</li>
            <li>CRM connectors</li>
            <li>ERP integration</li>
            <li>document ingestion</li>
            <li>additional workflow templates</li>
          </ul>
          <ul className="list-disc pl-6 space-y-2">
            <li>enterprise permissions</li>
            <li>workflow optimization</li>
            <li>process analytics</li>
            <li>additional business domains</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Business intent → adaptive execution",
    content: (
      <div className="text-center space-y-8 py-12">
        <p className="text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          FlowPilot AI demonstrates how AI agents can move beyond conversation and participate in structured, stateful business workflows—with context gathering, human approval, tool execution, failure recovery, and auditability.
        </p>
        <div>
          <Link href="/workflows" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg text-xl transition-all transform hover:scale-105">
            Run the live workflow
          </Link>
        </div>
      </div>
    ),
  }
];

export default function DemoPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("slides");
  const [showNotes, setShowNotes] = useState(false);

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">FlowPilot AI <span className="font-normal text-slate-500">| Judge Presentation</span></h1>
          <div className="flex bg-slate-100 rounded-md p-1">
            <button 
              onClick={() => setActiveTab("slides")}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === "slides" ? "bg-white shadow text-blue-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              Slides
            </button>
            <button 
              onClick={() => setActiveTab("demo")}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === "demo" ? "bg-white shadow text-blue-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              3-Min Demo Flow
            </button>
            <button 
              onClick={() => setActiveTab("qa")}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === "qa" ? "bg-white shadow text-blue-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              Judge Q&A
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
            Exit Presentation
          </Link>
        </div>
      </header>

      <main className="flex-1 p-6 flex justify-center">
        <div className="w-full max-w-5xl">
          
          {activeTab === "slides" && (
            <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="flex-1 p-12 overflow-y-auto min-h-[500px]">
                <div className="mb-8 border-b pb-4">
                  <h2 className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-1">Slide {currentSlide + 1} of {slides.length}</h2>
                  <h1 className="text-4xl font-extrabold text-slate-900">{slides[currentSlide].title}</h1>
                  {slides[currentSlide].subtitle && (
                    <p className="text-xl text-slate-500 mt-2">{slides[currentSlide].subtitle}</p>
                  )}
                </div>
                <div>
                  {slides[currentSlide].content}
                </div>
              </div>
              
              <div className="bg-slate-50 border-t flex flex-col">
                <div className="p-4 flex items-center justify-between border-b border-slate-200">
                  <button 
                    onClick={() => setShowNotes(!showNotes)} 
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    {showNotes ? "Hide Presenter Notes" : "Show Presenter Notes"}
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={prevSlide}
                      disabled={currentSlide === 0}
                      className="px-6 py-2 bg-white border rounded hover:bg-slate-50 disabled:opacity-50 font-medium"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={nextSlide}
                      disabled={currentSlide === slides.length - 1}
                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
                
                {showNotes && (
                  <div className="p-6 bg-amber-50 h-64 overflow-y-auto border-t border-amber-100 text-slate-800">
                    <h4 className="font-bold text-amber-900 uppercase text-xs mb-3">Presenter Notes & Talking Points</h4>
                    <div className="space-y-4">
                      <div>
                        <strong className="block text-amber-800">Opening</strong>
                        <p>Businesses don't operate inside one application. Their workflows span emails, databases, documents, spreadsheets, and internal policies. Traditional automation usually follows predefined paths. FlowPilot demonstrates an adaptive approach where a business objective becomes an executable workflow.</p>
                      </div>
                      <div>
                        <strong className="block text-amber-800">Objective</strong>
                        <p>Instead of asking a chatbot a question, we give the system a business objective.</p>
                      </div>
                      <div>
                        <strong className="block text-amber-800">Planning</strong>
                        <p>The system converts that objective into a multi-step workflow and verifies that the required information and actions are available.</p>
                      </div>
                      <div>
                        <strong className="block text-amber-800">Context</strong>
                        <p>It gathers information from multiple simulated business systems before making decisions.</p>
                      </div>
                      <div>
                        <strong className="block text-amber-800">Approval</strong>
                        <p>Sensitive actions pause for human approval instead of being blindly executed.</p>
                      </div>
                      <div>
                        <strong className="block text-amber-800">Failure & Recovery</strong>
                        <p>We intentionally introduced an invalid contact for INV-1004. The first execution fails. The system detects the failure, searches for an alternate verified contact, modifies the execution path, and completes the action.</p>
                      </div>
                      <div>
                        <strong className="block text-amber-800">Closing</strong>
                        <p>The key idea is not simply generating an answer. The system maintains workflow state, uses tools, reacts to execution results, adapts the plan, and records what happened.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "demo" && (
            <div className="bg-white p-10 rounded-xl shadow-sm border">
              <h2 className="text-3xl font-bold mb-8">3-Minute Demo Flow</h2>
              <div className="bg-slate-900 text-green-400 p-6 rounded-md font-mono text-base space-y-2">
                <div><span className="text-yellow-300 w-16 inline-block">00:00</span> — Introduce problem</div>
                <div><span className="text-yellow-300 w-16 inline-block">00:20</span> — Show objective</div>
                <div><span className="text-yellow-300 w-16 inline-block">00:35</span> — Show generated plan</div>
                <div><span className="text-yellow-300 w-16 inline-block">00:55</span> — Show multi-source data</div>
                <div><span className="text-yellow-300 w-16 inline-block">01:15</span> — Show intelligent decisions</div>
                <div><span className="text-yellow-300 w-16 inline-block">01:35</span> — Show approval</div>
                <div><span className="text-yellow-300 w-16 inline-block">01:50</span> — Execute</div>
                <div><span className="text-yellow-300 w-16 inline-block">02:05</span> — Trigger INV-1004 failure</div>
                <div><span className="text-yellow-300 w-16 inline-block">02:20</span> — Show re-planning</div>
                <div><span className="text-yellow-300 w-16 inline-block">02:40</span> — Show recovery</div>
                <div><span className="text-yellow-300 w-16 inline-block">02:50</span> — Show final accounting</div>
                <div><span className="text-yellow-300 w-16 inline-block">03:00</span> — Show audit trail</div>
              </div>
            </div>
          )}

          {activeTab === "qa" && (
            <div className="bg-white p-10 rounded-xl shadow-sm border">
              <h2 className="text-3xl font-bold mb-8">Judge Q&A Reference</h2>
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: Is this just a chatbot?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">No. The system accepts a business objective and executes a stateful workflow involving planning, data retrieval, decision-making, approvals, tool execution, verification, failure handling, and audit logging.</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: What happens if something fails?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">The workflow records the failure, evaluates the available recovery path, re-plans the affected portion of the workflow, and continues when a valid alternative exists. INV-1004 demonstrates this behavior.</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: Why is human approval needed?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">Business actions such as escalations can have external consequences. The workflow therefore supports explicit approval gates before configured sensitive actions.</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: How is this different from rule-based automation?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">Rules are still used for business policies, but the workflow can combine those policies with retrieved business context and execution results, then adapt the execution path when conditions change.</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: What makes the workflow dynamic?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">The execution state is maintained throughout the workflow. When an action fails, the system can modify the remaining execution plan instead of simply terminating.</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: Why not use a normal workflow engine?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">Conventional workflow engines are effective when the process path is known beforehand. FlowPilot focuses on cases where the system must interpret an objective, gather context, decide what should happen, and adapt when execution results differ from expectations.</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: Is the demo using real customer data?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">No. It uses deterministic simulated business data designed specifically for the demonstration.</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: Does it send real emails?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">No. The current hackathon prototype uses simulated execution and <code>.example</code> email addresses.</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: Can this work with real systems?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">The architecture is designed around tool interfaces, so real connectors can be added later. The current prototype intentionally uses simulated tools to keep the demonstration deterministic and safe.</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: Why use LangGraph?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">The workflow requires explicit state, branching, approval pauses, execution results, and re-planning. LangGraph provides a suitable stateful orchestration model for those behaviors.</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Q: What is the main technical challenge?</h3>
                  <p className="text-slate-600 bg-slate-50 p-4 rounded border-l-4 border-blue-500">Maintaining consistent workflow state while combining planning, tool execution, approval gates, failure handling, and dynamic re-planning without losing traceability.</p>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
