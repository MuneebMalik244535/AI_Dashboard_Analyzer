import React from 'react'
import { Sparkles, ArrowRight, ShieldCheck, Database, FileText, Cpu, Check, BarChart3, Lock, Zap } from 'lucide-react'

interface LandingPageProps {
  onLaunchApp: () => void
  onLoadDemo: () => void
  onOpenAuth: () => void
  onNav: (id: string) => void
}

export function LandingPage({ onLaunchApp, onLoadDemo, onOpenAuth, onNav }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={onLaunchApp}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              AI
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              AI Data Dashboard
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <button onClick={() => onNav('dashboard')} className="hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer">
              Dashboard
            </button>
            <button onClick={() => onNav('architecture')} className="hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer">
              Architecture
            </button>
            <button onClick={() => onNav('sql')} className="hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer">
              DuckDB SQL
            </button>
            <button onClick={() => onNav('pricing')} className="hover:text-indigo-600 transition-colors bg-transparent border-none cursor-pointer">
              Pricing
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onLaunchApp}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer border-none"
            >
              Launch App
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
          <Sparkles size={14} /> Autonomous 4-Agent Data Intelligence Platform
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Turn Raw CSV Data into Executive Briefings & SQL Insights in <span className="text-indigo-600">5 Seconds</span>
        </h1>

        <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Upload your tabular spreadsheets. Our 4 autonomous AI agents execute 100% deterministic Python math, run sub-second DuckDB OLAP queries, and generate Board-ready PDF & Excel reports.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer border-none flex items-center justify-center gap-2"
          >
            Launch Analytics Dashboard <ArrowRight size={15} />
          </button>

          <button
            onClick={onLoadDemo}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-stone-100 text-slate-800 font-semibold text-xs rounded-xl border border-stone-300 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap size={15} className="text-indigo-600" /> ⚡ Load 1-Click Demo Dataset
          </button>
        </div>
      </section>

      {/* Clean Feature Pillars Section */}
      <section className="py-16 px-6 bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Engineered for Accuracy & Speed</h2>
            <p className="text-xs text-slate-500">Built for analysts, executives, and enterprise data teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: '100% Math Reliability',
                desc: 'Calculated in pure Python SciPy & NumPy vectors. Zero LLM math hallucinations or incorrect numbers.'
              },
              {
                icon: Database,
                title: 'DuckDB OLAP Engine',
                desc: 'Sub-15ms SQL query execution directly over in-memory dataset DataFrames without database bottlenecks.'
              },
              {
                icon: FileText,
                title: 'Executive PDF & Excel',
                desc: 'One-click ReportLab PDF executive summaries and OpenPyXL multi-tab workbook exports.'
              },
              {
                icon: Lock,
                title: 'Enterprise Privacy',
                desc: 'JWT token authentication, database user isolation, and non-root Docker container security.'
              }
            ].map((pillar, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#FAF9F6] border border-stone-200 hover:border-indigo-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <pillar.icon size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{pillar.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Agent Process Breakdown */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How the 4-Agent Engine Works</h2>
          <p className="text-xs text-slate-500">Collaborative intelligence working seamlessly together.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { step: '01', name: 'PlannerAgent', desc: 'Inspects CSV columns, schema types, and formulates an analytical JSON execution plan.' },
            { step: '02', name: 'DataWorkerAgent', desc: 'Runs Python statistical engine, calculates Total Revenue, Profit, AOV, and IQR outliers.' },
            { step: '03', name: 'ChartAgent', desc: 'Generates responsive Plotly & Recharts visual configurations for interactive display.' },
            { step: '04', name: 'ExplainerAgent', desc: 'Synthesizes quantitative findings into executive briefings using Gemini Flash + Groq Failover.' },
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-white border border-stone-200 flex items-start gap-4">
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                {item.step}
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">{item.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Simple Pricing Section */}
      <section className="py-16 px-6 bg-white border-t border-stone-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Simple & Transparent Pricing</h2>
          <p className="text-xs text-slate-500 mb-10">Start free and scale as your data needs grow.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { title: 'Free Starter', price: '$0', desc: '3 Uploads / month', cta: 'Get Started Free' },
              { title: 'Pro Analyst', price: '$49', desc: 'Unlimited Uploads, DuckDB SQL & Exporters', cta: 'Start Pro Trial', popular: true },
              { title: 'Enterprise', price: '$299', desc: 'PostgreSQL DB, White-Labeled PDF', cta: 'Contact Sales' },
            ].map((p, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border ${p.popular ? 'border-indigo-600 bg-indigo-50/30' : 'border-stone-200 bg-[#FAF9F6]'}`}>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{p.title}</h3>
                <div className="text-2xl font-extrabold text-slate-900 mb-2">{p.price} <span className="text-xs font-normal text-slate-500">/mo</span></div>
                <p className="text-xs text-slate-600 mb-6">{p.desc}</p>
                <button
                  onClick={() => onNav('pricing')}
                  className={`w-full py-2 rounded-lg text-xs font-semibold cursor-pointer border-none ${
                    p.popular ? 'bg-indigo-600 text-white' : 'bg-stone-200 hover:bg-stone-300 text-slate-800'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-[#FAF9F6] border-t border-stone-200 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 AI Data Dashboard — Enterprise Multi-Agent Analytics Platform.</p>
          <div className="flex gap-6 font-medium">
            <button onClick={() => onNav('architecture')} className="hover:text-slate-900 bg-transparent border-none cursor-pointer text-xs text-slate-500">Architecture</button>
            <button onClick={() => onNav('pricing')} className="hover:text-slate-900 bg-transparent border-none cursor-pointer text-xs text-slate-500">Pricing</button>
            <a href="https://github.com/MuneebMalik244535/AI_Dashboard_Analyzer.git" target="_blank" rel="noreferrer" className="hover:text-slate-900 text-slate-500 no-underline">GitHub Repo</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
