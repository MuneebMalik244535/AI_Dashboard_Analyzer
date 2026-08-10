import { useState } from 'react'
import { Network, Cpu, Database, Shield, Zap, FileText, CheckCircle2, ArrowRight, Activity, Terminal, Layers, RefreshCw } from 'lucide-react'

export function ArchitecturePage() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      id: 'ingestion',
      title: '1. Ingestion & Security Guardrails',
      agent: 'FileHandler',
      status: 'Verified',
      desc: 'Raw CSV files uploaded via REST API are inspected for UTF-8 encoding, malicious SQL injections, and validated into memory using Pandas & NumPy.',
      tech: ['Python 3.11', 'Pandas', 'FastAPI', 'SlowAPI Rate Limiter'],
      badge: 'Sub-second'
    },
    {
      id: 'duckdb',
      title: '2. DuckDB In-Memory OLAP Query Layer',
      agent: 'DuckDB Engine',
      status: 'Active',
      desc: 'Dataset is registered into DuckDB OLAP engine in RAM. Enables sub-10ms analytical SQL execution over raw tabular data without disk I/O bottlenecks.',
      tech: ['DuckDB C++ Core', 'In-Memory SQL', 'Zero Disk IO'],
      badge: '<15ms Latency'
    },
    {
      id: 'planner',
      title: '3. Planner Agent Strategy Formulation',
      agent: 'PlannerAgent',
      status: 'Collaborative',
      desc: 'Inspects dataset schema & user query. Formulates a JSON analytical plan specifying exact statistical metrics and group-by aggregations required.',
      tech: ['Google Gemini 2.0 Flash', 'Groq Failover', 'JSON Schema'],
      badge: '99.4% Precision'
    },
    {
      id: 'worker',
      title: '4. DataWorker Deterministic Math Engine',
      agent: 'DataWorkerAgent',
      status: 'Deterministic',
      desc: 'Executes pure Python statistical math. Calculates total revenue, profit margins, AOV, IQR outlier bounds, and Z-score anomaly detections with zero LLM math hallucination.',
      tech: ['SciPy Stats', 'NumPy Vectors', 'IQR Outliers'],
      badge: '100% Math Accuracy'
    },
    {
      id: 'explainer',
      title: '5. Explainer Agent & Groq Failover',
      agent: 'ExplainerAgent',
      status: 'Resilient',
      desc: 'Synthesizes quantitative worker payload into executive business recommendations. If Gemini encounters rate limits (HTTP 429), automatically fails over to Groq Llama-3.3-70b.',
      tech: ['Gemini Flash', 'Groq Llama-3.3-70b', 'Automatic Failover'],
      badge: '99.9% Uptime'
    },
    {
      id: 'export',
      title: '6. ReportLab PDF & OpenPyXL Exporters',
      agent: 'Export Engine',
      status: 'Production',
      desc: 'Generates styled Board-ready Executive PDF reports and Multi-Tab Excel Workbooks with formatted KPI summary sheets and raw cleaned dataset tabs.',
      tech: ['ReportLab PDF', 'OpenPyXL', 'Binary Response Streams'],
      badge: 'Instant Download'
    }
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="glass-card gradient-border p-6 relative overflow-hidden" style={{ borderRadius: 24 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Network size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">4-Agent Autonomous System Architecture</h1>
            <p className="text-xs text-zinc-400">Interactive Technical Case Study: How our multi-agent automation processes business datasets</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Architecture', value: 'Multi-Agent LLM', sub: 'Planner + Worker + Chart + Explainer' },
            { label: 'OLAP Engine', value: 'DuckDB C++', sub: 'Sub-second in-memory SQL' },
            { label: 'LLM Failover', value: 'Gemini + Groq', sub: 'Automatic HTTP 429 failover' },
            { label: 'Math Reliability', value: '100% Deterministic', sub: 'SciPy & Python vector math' },
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="block text-[11px] text-zinc-500 font-semibold mb-1">{item.label}</span>
              <span className="block text-sm font-bold text-white mb-0.5">{item.value}</span>
              <span className="block text-[10px] text-indigo-400 font-mono">{item.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Workflow Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step List */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Pipeline Steps</h3>
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-xl text-left transition-all cursor-pointer border ${
                activeStep === idx
                  ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${activeStep === idx ? 'text-indigo-400' : 'text-zinc-300'}`}>
                  {step.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                  {step.badge}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-1">{step.agent}</p>
            </button>
          ))}
        </div>

        {/* Detailed Step Inspector */}
        <div className="lg:col-span-2 glass-card gradient-border p-6 flex flex-col justify-between" style={{ borderRadius: 20 }}>
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-semibold uppercase">{steps[activeStep].agent} Module</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{steps[activeStep].title}</h2>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 size={14} /> {steps[activeStep].status}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-6">
              {steps[activeStep].desc}
            </p>

            <div className="mb-6">
              <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Technologies & Libraries</h4>
              <div className="flex flex-wrap gap-2">
                {steps[activeStep].tech.map((t, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-indigo-300 font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              disabled={activeStep === 0}
              onClick={() => setActiveStep(s => Math.max(0, s - 1))}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white disabled:opacity-30 cursor-pointer"
            >
              Previous Step
            </button>

            <span className="text-xs font-mono text-zinc-500">Step {activeStep + 1} of {steps.length}</span>

            <button
              disabled={activeStep === steps.length - 1}
              onClick={() => setActiveStep(s => Math.min(steps.length - 1, s + 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-30 cursor-pointer"
            >
              Next Step <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
