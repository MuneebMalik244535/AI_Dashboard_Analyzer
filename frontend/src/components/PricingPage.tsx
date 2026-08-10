import { useState } from 'react'
import { Check, Sparkles, Shield, Zap, HelpCircle, ArrowRight, Server } from 'lucide-react'

interface PricingPageProps {
  onOpenAuth: () => void
}

export function PricingPage({ onOpenAuth }: PricingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const tiers = [
    {
      name: 'Starter / Trial',
      price: '$0',
      period: 'forever',
      desc: 'Ideal for small dataset evaluation & quick CSV summaries',
      features: [
        '3 CSV Dataset uploads per month',
        'Basic Plotly & Recharts visualizations',
        'Gemini 2.0 Flash agent insights',
        'Standard text summary report exports',
        'Community Discord support'
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Pro Analyst',
      price: billingCycle === 'monthly' ? '$49' : '$39',
      period: 'per month',
      desc: 'For business analysts, consultants, and growing teams',
      features: [
        'Unlimited CSV dataset uploads',
        'DuckDB In-Memory OLAP SQL Terminal',
        'Executive PDF Reports (ReportLab Engine)',
        'Multi-Tab Excel Workbooks (OpenPyXL Engine)',
        'Automatic Groq Llama 70b LLM failover',
        'Structured JSON logging & APM telemetry',
        'Priority email & chat support'
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise Scale',
      price: billingCycle === 'monthly' ? '$299' : '$249',
      period: 'per month',
      desc: 'For organizations needing dedicated database storage & branding',
      features: [
        'Everything in Pro Analyst',
        'Dedicated PostgreSQL database storage',
        'White-labeled PDF reports with company logo',
        'Unlimited team seat licenses & RBAC roles',
        'Custom SQL analytical queries & views',
        '24/7 Priority Slack channel & 99.9% SLA'
      ],
      cta: 'Upgrade to Enterprise',
      popular: false,
    }
  ]

  const faqs = [
    { q: 'How does the 4-Agent AI system calculate math accurately?', a: 'Unlike standard LLMs that hallucinate math, our DataWorkerAgent executes 100% deterministic Python Pandas & SciPy calculations. The LLM only handles planning and narrative synthesis.' },
    { q: 'Is my company dataset kept private?', a: 'Yes. Datasets are processed in ephemeral memory sessions or encrypted PostgreSQL databases. Raw data is never used to train public AI models.' },
    { q: 'Can we deploy this on our own private AWS or Azure Cloud?', a: 'Yes! We offer a $4,999 one-time Private Cloud On-Premise license with custom Docker containers deployed directly in your VPC.' }
  ]

  return (
    <div className="flex flex-col gap-10">
      {/* Header & Billing Switch */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
          <Sparkles size={14} /> Commercial SaaS Pricing Tiers
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
          Flexible Pricing for Every Business Scale
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
          Turn your spreadsheets into executive PDF briefings, multi-tab Excel workbooks, and instant DuckDB SQL query answers.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
            style={{ border: 'none' }}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              billingCycle === 'annual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
            style={{ border: 'none' }}
          >
            Annual Billing <span className="text-[10px] text-emerald-400 ml-1">(Save 20%)</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className={`glass-card p-6 flex flex-col justify-between relative transition-all duration-200 ${
              tier.popular
                ? 'gradient-border border-indigo-500/50 bg-indigo-950/20 shadow-xl shadow-indigo-500/10 scale-[1.02]'
                : 'border border-white/10 hover:border-white/20'
            }`}
            style={{ borderRadius: 24 }}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-lg">
                Most Popular
              </span>
            )}

            <div>
              <h3 className="text-base font-bold text-white mb-1">{tier.name}</h3>
              <p className="text-[11px] text-zinc-400 mb-4 min-h-[32px]">{tier.desc}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-white">{tier.price}</span>
                <span className="text-xs text-zinc-500 font-medium">/{tier.period}</span>
              </div>

              <div className="flex flex-col gap-3 mb-6 pt-4 border-t border-white/10">
                {tier.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-2 text-xs text-zinc-300">
                    <Check size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onOpenAuth}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                tier.popular
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:opacity-95'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10'
              }`}
              style={{ border: 'none' }}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>

      {/* On-Premise Enterprise Banner */}
      <div className="glass-card gradient-border p-6 flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderRadius: 20 }}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Server size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Private Cloud On-Premise Deployment</h3>
            <p className="text-xs text-zinc-400">Custom $4,999 one-time turnkey Docker deployment inside your private AWS, Azure, or GCP VPC.</p>
          </div>
        </div>

        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all shrink-0 cursor-pointer"
          style={{ border: 'none' }}
        >
          Contact Solutions Team
        </button>
      </div>

      {/* FAQ Section */}
      <div className="mt-4">
        <h2 className="text-lg font-bold text-white text-center mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {faqs.map((faq, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                <HelpCircle size={14} className="text-indigo-400" /> {faq.q}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
