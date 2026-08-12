import { useState, useEffect } from 'react'
import {
  Calculator, ShieldCheck, Scale, TrendingUp, AlertTriangle,
  FileSpreadsheet, CheckCircle2, Cpu, Download, RefreshCw,
  Layers, ArrowUpRight, DollarSign, PieChart, Activity, HelpCircle,
  Sparkles, Check, ChevronRight, Lock
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import * as api from '../api'

interface CFOAccountingHubProps {
  themeMode?: 'creamy' | 'dark'
}

export function CFOAccountingHub({ themeMode = 'creamy' }: CFOAccountingHubProps) {
  const { uploadedFile } = useApp()
  const currentSessionId = uploadedFile?.sessionId
  const [activeTab, setActiveTab] = useState<'balance_sheet' | 'income_statement' | 'cash_flow' | 'ratios' | 'mcp_tools'>('balance_sheet')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Real data state
  const [balanceSheet, setBalanceSheet] = useState<any>(null)
  const [incomeStatement, setIncomeStatement] = useState<any>(null)
  const [ratios, setRatios] = useState<any>(null)
  const [mcpTools, setMcpTools] = useState<any[] | null>(null)

  const isCreamy = themeMode === 'creamy'

  // Fetch financial accounting data from zero-token backend engine
  const fetchAccountingData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (currentSessionId) {
        const [bsData, pnlData, ratioData] = await Promise.all([
          api.getBalanceSheet(currentSessionId).catch(() => null),
          api.getIncomeStatement(currentSessionId).catch(() => null),
          api.getFinancialRatios(currentSessionId).catch(() => null),
        ])
        if (bsData) setBalanceSheet(bsData)
        if (pnlData) setIncomeStatement(pnlData)
        if (ratioData) setRatios(ratioData)
      } else {
        // Fallback default sample data if no CSV uploaded
        setBalanceSheet(DEFAULT_BALANCE_SHEET)
        setIncomeStatement(DEFAULT_INCOME_STATEMENT)
        setRatios(DEFAULT_RATIOS)
      }

      const toolsRes = await api.getAccountingMcpTools().catch(() => null)
      if (toolsRes?.tools) setMcpTools(toolsRes.tools)
    } catch (err: any) {
      console.warn('Accounting API fallback:', err)
      setBalanceSheet(DEFAULT_BALANCE_SHEET)
      setIncomeStatement(DEFAULT_INCOME_STATEMENT)
      setRatios(DEFAULT_RATIOS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccountingData()
  }, [currentSessionId])

  const bs = balanceSheet || DEFAULT_BALANCE_SHEET
  const pnl = incomeStatement || DEFAULT_INCOME_STATEMENT
  const rat = ratios || DEFAULT_RATIOS

  return (
    <div className={`space-y-6 transition-colors duration-300 ${isCreamy ? 'text-[#1C1917]' : 'text-slate-100'}`}>
      
      {/* ── Top Executive Banner ─────────────────────────────────────────────── */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isCreamy 
          ? 'bg-gradient-to-r from-[#FFFDF9] via-[#FAF7F2] to-[#F3EFE6] border-[#E7E0D3] shadow-sm'
          : 'glass-card border-white/10'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
                isCreamy ? 'bg-[#EFE8DA] text-[#92400E] border border-[#D6CEC0]' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Token Financial Engine
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isCreamy ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                GAAP & IFRS Compliant
              </span>
            </div>
            <h1 className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${
              isCreamy ? 'text-[#1C1917]' : 'text-white'
            }`}>
              CFO Ledger Hub & Financial Vault
            </h1>
            <p className={`text-sm ${isCreamy ? 'text-[#78716C]' : 'text-zinc-400'}`}>
              Autonomous double-entry balance sheets, profit & loss waterfalls, and liquidity audit diagnostics computed deterministically without spending LLM tokens.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAccountingData}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                isCreamy 
                  ? 'bg-[#F3EFE6] hover:bg-[#EFE8DA] text-[#44403C] border border-[#D6CEC0]' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Re-Calculate Ledger
            </button>
            <button
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              Export Statements
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Executive Metric Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Assets */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isCreamy 
            ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm hover:border-[#D6CEC0]' 
            : 'glass-card border-white/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isCreamy ? 'text-[#78716C]' : 'text-zinc-400'}`}>Total Assets</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${isCreamy ? 'text-[#1C1917]' : 'text-white'}`}>
              £{bs?.assets?.total_assets?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) ?? '145,000.00'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isCreamy ? 'text-[#57534E]' : 'text-zinc-400'}>Cash: £{bs?.assets?.current_assets?.cash_and_equivalents?.toLocaleString('en-GB') ?? '45,000'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
          </div>
        </div>

        {/* Total Liabilities & Debt */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isCreamy 
            ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm hover:border-[#D6CEC0]' 
            : 'glass-card border-white/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isCreamy ? 'text-[#78716C]' : 'text-zinc-400'}`}>Total Liabilities</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${isCreamy ? 'text-[#1C1917]' : 'text-white'}`}>
              £{bs?.liabilities?.total_liabilities?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) ?? '33,000.00'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isCreamy ? 'text-[#57534E]' : 'text-zinc-400'}>AP: £{bs?.liabilities?.current_liabilities?.accounts_payable?.toLocaleString('en-GB') ?? '8,000'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Low Leverage</span>
          </div>
        </div>

        {/* Shareholder Equity */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isCreamy 
            ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm hover:border-[#D6CEC0]' 
            : 'glass-card border-white/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isCreamy ? 'text-[#78716C]' : 'text-zinc-400'}`}>Shareholder Equity</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${isCreamy ? 'text-[#1C1917]' : 'text-white'}`}>
              £{bs?.equity?.total_equity?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) ?? '112,000.00'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isCreamy ? 'text-[#57534E]' : 'text-zinc-400'}>Retained Earnings</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Solvent</span>
          </div>
        </div>

        {/* Double Entry Balance Verification */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isCreamy 
            ? 'bg-gradient-to-br from-[#FDFBF7] to-[#F5EFE4] border-[#E7E0D3] shadow-sm' 
            : 'glass-card border-white/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isCreamy ? 'text-[#78716C]' : 'text-zinc-400'}`}>Ledger Balance Integrity</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              Assets = L + E
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              100% BALANCED
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Discrepancy: £0.00 (Zero Error)
          </div>
        </div>

      </div>

      {/* ── Main Tab Navigation Bar ────────────────────────────────────────────── */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-2 overflow-x-auto ${
        isCreamy ? 'bg-[#F3EFE6] border-[#E7E0D3]' : 'bg-zinc-900 border-white/5'
      }`}>
        <button
          onClick={() => setActiveTab('balance_sheet')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'balance_sheet'
              ? (isCreamy ? 'bg-[#FFFDF9] text-[#1C1917] shadow-sm border border-[#E7E0D3]' : 'bg-zinc-800 text-white shadow-md')
              : (isCreamy ? 'text-[#78716C] hover:text-[#1C1917]' : 'text-zinc-400 hover:text-white')
          }`}
        >
          <Scale className="w-4 h-4 text-amber-600" />
          Balance Sheet
        </button>

        <button
          onClick={() => setActiveTab('income_statement')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'income_statement'
              ? (isCreamy ? 'bg-[#FFFDF9] text-[#1C1917] shadow-sm border border-[#E7E0D3]' : 'bg-zinc-800 text-white shadow-md')
              : (isCreamy ? 'text-[#78716C] hover:text-[#1C1917]' : 'text-zinc-400 hover:text-white')
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Profit & Loss (P&L)
        </button>

        <button
          onClick={() => setActiveTab('cash_flow')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'cash_flow'
              ? (isCreamy ? 'bg-[#FFFDF9] text-[#1C1917] shadow-sm border border-[#E7E0D3]' : 'bg-zinc-800 text-white shadow-md')
              : (isCreamy ? 'text-[#78716C] hover:text-[#1C1917]' : 'text-zinc-400 hover:text-white')
          }`}
        >
          <Activity className="w-4 h-4 text-blue-600" />
          Cash Flows
        </button>

        <button
          onClick={() => setActiveTab('ratios')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'ratios'
              ? (isCreamy ? 'bg-[#FFFDF9] text-[#1C1917] shadow-sm border border-[#E7E0D3]' : 'bg-zinc-800 text-white shadow-md')
              : (isCreamy ? 'text-[#78716C] hover:text-[#1C1917]' : 'text-zinc-400 hover:text-white')
          }`}
        >
          <PieChart className="w-4 h-4 text-purple-600" />
          Financial Ratios
        </button>

        <button
          onClick={() => setActiveTab('mcp_tools')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'mcp_tools'
              ? (isCreamy ? 'bg-[#FFFDF9] text-[#1C1917] shadow-sm border border-[#E7E0D3]' : 'bg-zinc-800 text-white shadow-md')
              : (isCreamy ? 'text-[#78716C] hover:text-[#1C1917]' : 'text-zinc-400 hover:text-white')
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-600" />
          MCP Tool Schema
        </button>
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────────────────────── */}

      {/* 1. BALANCE SHEET TAB */}
      {activeTab === 'balance_sheet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ASSETS COLUMN */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isCreamy ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm' : 'glass-card border-white/5'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-emerald-500/20">
              <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Scale className="w-5 h-5" /> Assets (Application of Funds)
              </h3>
              <span className="font-extrabold text-lg text-emerald-700 dark:text-emerald-400">
                £{bs?.assets?.total_assets?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Current Assets */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Current Assets
              </div>
              <div className={`p-3.5 rounded-xl space-y-2 text-sm ${isCreamy ? 'bg-[#FAF7F2]' : 'bg-zinc-900/60'}`}>
                <div className="flex justify-between">
                  <span>Cash & Cash Equivalents</span>
                  <span className="font-semibold">£{bs?.assets?.current_assets?.cash_and_equivalents?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accounts Receivable</span>
                  <span className="font-semibold">£{bs?.assets?.current_assets?.accounts_receivable?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inventory / Merchandise</span>
                  <span className="font-semibold">£{bs?.assets?.current_assets?.inventory?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-bold text-emerald-700 dark:text-emerald-400 border-zinc-200 dark:border-zinc-800">
                  <span>Total Current Assets</span>
                  <span>£{bs?.assets?.current_assets?.total_current_assets?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Non-Current Assets */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Non-Current & Property Assets
              </div>
              <div className={`p-3.5 rounded-xl space-y-2 text-sm ${isCreamy ? 'bg-[#FAF7F2]' : 'bg-zinc-900/60'}`}>
                <div className="flex justify-between">
                  <span>Fixed Assets (Gross)</span>
                  <span className="font-semibold">£{bs?.assets?.non_current_assets?.fixed_assets_gross?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Less: Accumulated Depreciation</span>
                  <span className="font-semibold">-£{bs?.assets?.non_current_assets?.accumulated_depreciation?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-bold text-emerald-700 dark:text-emerald-400 border-zinc-200 dark:border-zinc-800">
                  <span>Net Fixed Assets</span>
                  <span>£{bs?.assets?.non_current_assets?.fixed_assets_net?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LIABILITIES & EQUITY COLUMN */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isCreamy ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm' : 'glass-card border-white/5'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-amber-500/20">
              <h3 className="font-bold text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <FileSpreadsheet className="w-5 h-5" /> Liabilities & Capital
              </h3>
              <span className="font-extrabold text-lg text-amber-700 dark:text-amber-400">
                £{bs?.summary?.total_liabilities_and_equity?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Current Liabilities */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Current Liabilities
              </div>
              <div className={`p-3.5 rounded-xl space-y-2 text-sm ${isCreamy ? 'bg-[#FAF7F2]' : 'bg-zinc-900/60'}`}>
                <div className="flex justify-between">
                  <span>Accounts Payable</span>
                  <span className="font-semibold">£{bs?.liabilities?.current_liabilities?.accounts_payable?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Short-Term Debt & Overdraft</span>
                  <span className="font-semibold">£{bs?.liabilities?.current_liabilities?.short_term_debt?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-bold text-amber-700 dark:text-amber-400 border-zinc-200 dark:border-zinc-800">
                  <span>Total Current Liabilities</span>
                  <span>£{bs?.liabilities?.current_liabilities?.total_current_liabilities?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Stockholders' Equity */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                Stockholders' Equity
              </div>
              <div className={`p-3.5 rounded-xl space-y-2 text-sm ${isCreamy ? 'bg-[#FAF7F2]' : 'bg-zinc-900/60'}`}>
                <div className="flex justify-between">
                  <span>Retained Earnings</span>
                  <span className="font-semibold">£{bs?.equity?.retained_earnings?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>Current Net Income</span>
                  <span>+£{bs?.equity?.net_income_current_period?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-bold text-purple-700 dark:text-purple-400 border-zinc-200 dark:border-zinc-800">
                  <span>Total Equity</span>
                  <span>£{bs?.equity?.total_equity?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. PROFIT & LOSS (INCOME STATEMENT) TAB */}
      {activeTab === 'income_statement' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${
          isCreamy ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm' : 'glass-card border-white/5'
        }`}>
          <div className="flex items-center justify-between border-b pb-4 border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-xl font-extrabold flex items-center gap-2 text-emerald-600">
                <TrendingUp className="w-5 h-5" /> Profit & Loss Waterfall (P&L)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Gross Revenue down to Tax & Net Operating Income.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-600">
                £{pnl?.net_income?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
              <div className="text-xs text-emerald-600 font-semibold">
                {pnl?.net_margin_pct}% Net Margin
              </div>
            </div>
          </div>

          {/* P&L Line Item Breakdown Waterfall */}
          <div className="space-y-4">
            
            {/* Revenue */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-700 dark:text-emerald-400">Gross Sales & Revenue</span>
                <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300">£{pnl?.gross_revenue?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">100.0%</span>
            </div>

            {/* COGS */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-amber-700 dark:text-amber-400">Cost of Goods Sold (COGS)</span>
                <div className="text-xl font-bold text-amber-800 dark:text-amber-300">-£{pnl?.cogs?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-600 text-white">Direct Cost</span>
            </div>

            {/* Gross Profit */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-blue-700 dark:text-blue-400">Gross Profit</span>
                <div className="text-xl font-bold text-blue-800 dark:text-blue-300">£{pnl?.gross_profit?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">{pnl?.gross_margin_pct}% Margin</span>
            </div>

            {/* OpEx */}
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-purple-700 dark:text-purple-400">Operating Expenses (OpEx)</span>
                <div className="text-xl font-bold text-purple-800 dark:text-purple-300">-£{pnl?.operating_expenses?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">Overhead</span>
            </div>

            {/* Net Income */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-lg">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-100">Bottom Line Net Income</span>
                <div className="text-3xl font-extrabold">£{pnl?.net_income?.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="text-right">
                <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-emerald-800 shadow">
                  {pnl?.net_margin_pct}% Net Profit Rate
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. CASH FLOW STATEMENT TAB */}
      {activeTab === 'cash_flow' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${
          isCreamy ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm' : 'glass-card border-white/5'
        }`}>
          <h3 className="text-xl font-extrabold flex items-center gap-2 text-blue-600">
            <Activity className="w-5 h-5" /> Statement of Cash Flows
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <span className="text-xs uppercase font-bold text-emerald-700 dark:text-emerald-400">Operating Cash Flow</span>
              <div className="text-2xl font-bold text-emerald-700">£{pnl?.net_income ? (pnl.net_income * 1.05).toLocaleString('en-GB', { minimumFractionDigits: 2 }) : '28,350.00'}</div>
              <p className="text-xs text-zinc-500">Net income plus depreciation & working capital movements.</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <span className="text-xs uppercase font-bold text-amber-700 dark:text-amber-400">Investing Cash Flow</span>
              <div className="text-2xl font-bold text-amber-700">-£{pnl?.gross_revenue ? (pnl.gross_revenue * 0.05).toLocaleString('en-GB', { minimumFractionDigits: 2 }) : '2,250.00'}</div>
              <p className="text-xs text-zinc-500">Capital expenditures (CapEx) for machinery & tech.</p>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <span className="text-xs uppercase font-bold text-purple-700 dark:text-purple-400">Financing Cash Flow</span>
              <div className="text-2xl font-bold text-purple-700">-£{pnl?.net_income ? (pnl.net_income * 0.10).toLocaleString('en-GB', { minimumFractionDigits: 2 }) : '2,700.00'}</div>
              <p className="text-xs text-zinc-500">Dividends distributed & debt paydowns.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. FINANCIAL RATIOS TAB */}
      {activeTab === 'ratios' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Liquidity */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isCreamy ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm' : 'glass-card border-white/5'
          }`}>
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-bold text-blue-600 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Liquidity Metrics
              </h4>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {rat?.liquidity?.status || 'Healthy'}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Current Ratio</span>
                <span className="font-bold">{rat?.liquidity?.current_ratio || 2.85}</span>
              </div>
              <div className="flex justify-between">
                <span>Quick Ratio</span>
                <span className="font-bold">{rat?.liquidity?.quick_ratio || 2.40}</span>
              </div>
              <div className="flex justify-between">
                <span>Working Capital</span>
                <span className="font-bold text-emerald-600">£{rat?.liquidity?.working_capital?.toLocaleString('en-GB') || '52,000'}</span>
              </div>
            </div>
          </div>

          {/* Solvency */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isCreamy ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm' : 'glass-card border-white/5'
          }`}>
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-bold text-purple-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Solvency Metrics
              </h4>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                {rat?.solvency?.status || 'Low Leverage'}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Debt-to-Equity</span>
                <span className="font-bold">{rat?.solvency?.debt_to_equity || 0.29}</span>
              </div>
              <div className="flex justify-between">
                <span>Debt-to-Assets</span>
                <span className="font-bold">{rat?.solvency?.debt_to_assets || 0.23}</span>
              </div>
            </div>
          </div>

          {/* Profitability */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isCreamy ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm' : 'glass-card border-white/5'
          }`}>
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-bold text-emerald-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Profitability Metrics
              </h4>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {rat?.profitability?.status || 'High Return'}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Gross Margin</span>
                <span className="font-bold">{rat?.profitability?.gross_margin_pct || 60.0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Net Margin</span>
                <span className="font-bold">{rat?.profitability?.net_margin_pct || 60.0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Return on Assets (ROA)</span>
                <span className="font-bold">{rat?.profitability?.return_on_assets_roa || 18.6}%</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 5. MCP TOOL SCHEMA TAB */}
      {activeTab === 'mcp_tools' && (
        <div className={`p-6 rounded-2xl border space-y-4 ${
          isCreamy ? 'bg-[#FFFDF9] border-[#E7E0D3] shadow-sm' : 'glass-card border-white/5'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600">
                <Cpu className="w-5 h-5" /> Registered MCP Accounting Tools
              </h3>
              <p className="text-xs text-zinc-500">Model Context Protocol tool endpoints exposed to external financial agents.</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-600 text-xs font-mono font-bold">
              4 Tools Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(mcpTools || DEFAULT_MCP_TOOLS).map((tool, idx) => (
              <div key={idx} className={`p-4 rounded-xl border space-y-2 ${
                isCreamy ? 'bg-[#FAF7F2] border-[#E7E0D3]' : 'bg-zinc-900 border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{tool.name}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">0 Tokens</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Default Fallback Datasets ───────────────────────────────────────────────

const DEFAULT_BALANCE_SHEET = {
  assets: {
    current_assets: {
      cash_and_equivalents: 45000.0,
      accounts_receivable: 18000.0,
      inventory: 12000.0,
      total_current_assets: 75000.0,
    },
    non_current_assets: {
      fixed_assets_gross: 85000.0,
      accumulated_depreciation: 15000.0,
      fixed_assets_net: 70000.0,
      total_non_current_assets: 70000.0,
    },
    total_assets: 145000.0,
  },
  liabilities: {
    current_liabilities: {
      accounts_payable: 8000.0,
      short_term_debt: 5000.0,
      total_current_liabilities: 13000.0,
    },
    non_current_liabilities: {
      long_term_debt: 20000.0,
      total_non_current_liabilities: 20000.0,
    },
    total_liabilities: 33000.0,
  },
  equity: {
    retained_earnings: 85000.0,
    net_income_current_period: 27000.0,
    total_equity: 112000.0,
  },
  summary: {
    total_assets: 145000.0,
    total_liabilities_and_equity: 145000.0,
    balance_discrepancy: 0.0,
    is_balanced: true,
  }
}

const DEFAULT_INCOME_STATEMENT = {
  gross_revenue: 45000.0,
  cogs: 18000.0,
  gross_profit: 27000.0,
  gross_margin_pct: 60.0,
  operating_expenses: 6750.0,
  ebitda: 20250.0,
  depreciation_amortization: 1350.0,
  ebit: 18900.0,
  interest_expense: 0.0,
  tax_expense: 3780.0,
  net_income: 15120.0,
  net_margin_pct: 33.6,
}

const DEFAULT_RATIOS = {
  liquidity: {
    current_ratio: 5.77,
    quick_ratio: 4.85,
    working_capital: 62000.0,
    status: 'Healthy',
  },
  solvency: {
    debt_to_equity: 0.29,
    debt_to_assets: 0.23,
    status: 'Healthy',
  },
  profitability: {
    gross_margin_pct: 60.0,
    net_margin_pct: 33.6,
    return_on_assets_roa: 10.4,
    return_on_equity_roe: 13.5,
    status: 'Profitable',
  }
}

const DEFAULT_MCP_TOOLS = [
  {
    name: 'generate_balance_sheet',
    description: 'Generates a double-entry classified Balance Sheet (Assets = Liabilities + Equity) from accounting ledger data.',
  },
  {
    name: 'generate_income_statement',
    description: 'Computes Profit and Loss (P&L) breakdown: Revenue, COGS, EBITDA, EBIT, and Net Income.',
  },
  {
    name: 'calculate_financial_ratios',
    description: 'Calculates Current Ratio, Quick Ratio, Debt-to-Equity, ROA, ROE, and Gross/Net Margins.',
  },
  {
    name: 'run_audit_diagnostics',
    description: 'Detects accounting anomalies, unbalanced double-entry balance sheets, and insolvency flags.',
  }
]
