import { useState, useRef, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Upload, MessageSquare, BarChart3, LineChart,
  FileText, History, ScrollText, Settings, Bell, Search, Moon, Sun,
  ChevronRight, Sparkles, Brain, Eye, AlertTriangle,
  CheckCircle, Clock, Database, Cpu, Download, Share2,
  Camera, Send, Bot, User, Layers, Shield,
  Target, Award, RefreshCw, MoreHorizontal, ChevronDown, Flame,
  ScanLine, Network, Star, Play, Zap, TrendingUp, Activity,
  Filter, Calendar, ArrowUpRight, ArrowDownRight, BarChart2,
  PieChart as PieIcon, GitCommit, List, Trash2, RotateCcw,
  Wifi, WifiOff, Package, Info, Tag, Home
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart as ReLineChart, Line,
  ScatterChart, Scatter, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis
} from 'recharts'

import { AppProvider, useApp } from './context/AppContext'
import * as api from './api'
import { AuthModal } from './components/AuthModal'
import { SQLTerminal } from './components/SQLTerminal'
import { ArchitecturePage } from './components/ArchitecturePage'
import { PricingPage } from './components/PricingPage'
import { LandingPage } from './components/LandingPage'
import { CFOAccountingHub } from './components/CFOAccountingHub'
import { Scale, Calculator } from 'lucide-react'

// ─── Static / Fallback Data ──────────────────────────────────────────────────

const salesData = [
  { month: 'Jan', revenue: 42000, target: 38000, sessions: 2100 },
  { month: 'Feb', revenue: 51000, target: 42000, sessions: 2400 },
  { month: 'Mar', revenue: 47000, target: 45000, sessions: 2200 },
  { month: 'Apr', revenue: 63000, target: 48000, sessions: 3100 },
  { month: 'May', revenue: 58000, target: 52000, sessions: 2800 },
  { month: 'Jun', revenue: 71000, target: 55000, sessions: 3400 },
  { month: 'Jul', revenue: 68000, target: 60000, sessions: 3200 },
  { month: 'Aug', revenue: 84000, target: 65000, sessions: 4100 },
  { month: 'Sep', revenue: 79000, target: 70000, sessions: 3800 },
  { month: 'Oct', revenue: 92000, target: 75000, sessions: 4500 },
  { month: 'Nov', revenue: 88000, target: 80000, sessions: 4200 },
  { month: 'Dec', revenue: 105000, target: 85000, sessions: 5100 },
]

const categoryData = [
  { name: 'Enterprise', value: 4200, fill: '#6366F1' },
  { name: 'Startup', value: 2800, fill: '#06B6D4' },
  { name: 'Mid-Market', value: 3100, fill: '#22C55E' },
  { name: 'SMB', value: 1900, fill: '#F59E0B' },
  { name: 'Government', value: 1200, fill: '#EC4899' },
]

const scatterData = Array.from({ length: 40 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  z: Math.random() * 40 + 10,
}))

const radarData = [
  { subject: 'Accuracy', A: 92, fullMark: 100 },
  { subject: 'Speed', A: 86, fullMark: 100 },
  { subject: 'Coverage', A: 78, fullMark: 100 },
  { subject: 'Depth', A: 90, fullMark: 100 },
  { subject: 'Clarity', A: 88, fullMark: 100 },
  { subject: 'Relevance', A: 95, fullMark: 100 },
]

const COLORS_PIE = ['#6366F1', '#06B6D4', '#22C55E', '#F59E0B', '#EC4899']

const DEFAULT_PROMPTS = [
  'Show monthly revenue trend',
  'Find statistical outliers',
  'Compare Q3 vs Q4 performance',
  'Analyze customer segmentation',
  'Generate executive summary',
  'Detect anomalies in data',
]

const navItems = [
  { icon: Home, label: 'Home Page', id: 'home' },
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Scale, label: 'CFO Accounting Hub', id: 'accounting' },
  { icon: Upload, label: 'Upload Dataset', id: 'upload' },
  { icon: MessageSquare, label: 'AI Chat', id: 'chat' },
  { icon: Database, label: 'SQL Terminal', id: 'sql' },
  { icon: Network, label: 'Architecture', id: 'architecture' },
  { icon: Tag, label: 'Pricing', id: 'pricing' },
  { icon: BarChart3, label: 'Analytics', id: 'analytics' },
  { icon: LineChart, label: 'Visualizations', id: 'viz' },
  { icon: FileText, label: 'Reports', id: 'reports' },
  { icon: History, label: 'History', id: 'history' },
  { icon: ScrollText, label: 'Agent Logs', id: 'logs' },
  { icon: Settings, label: 'Settings', id: 'settings' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p style={{ color: '#A1A1AA', marginBottom: 4, fontSize: 11 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, margin: 0, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? `$${(p.value / 1000).toFixed(0)}K` : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Particles ───────────────────────────────────────────────────────────────

function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 4,
    dur: 3 + Math.random() * 3,
  }))
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: p.id % 3 === 0 ? '#6366F1' : p.id % 3 === 1 ? '#06B6D4' : '#ffffff',
          opacity: 0.4,
          animation: `particle-float ${p.dur}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  )
}

function NeuralBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 animate-grid-pulse" style={{
        backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="animate-float-blob absolute rounded-full" style={{ width: 500, height: 500, top: '-10%', left: '-5%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="animate-float-blob2 absolute rounded-full" style={{ width: 400, height: 400, top: '20%', right: '10%', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="animate-float-blob3 absolute rounded-full" style={{ width: 350, height: 350, bottom: '10%', left: '30%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      <Particles />
    </div>
  )
}

// ─── Page Header ─────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: '#FAFAFA', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: '#71717A', marginTop: 5 }}>{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, icon: Icon, color, trend }: any) {
  const positive = trend === 'up'
  return (
    <div className="glass-card p-5 hover-lift" style={{ borderColor: `${color}20` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon size={18} color={color} />
        </div>
        {delta && (
          <div className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: positive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
            {positive ? <ArrowUpRight size={11} color="#22C55E" /> : <ArrowDownRight size={11} color="#EF4444" />}
            <span style={{ fontSize: 11, fontWeight: 600, color: positive ? '#22C55E' : '#EF4444' }}>{delta}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#71717A' }}>{label}</div>
    </div>
  )
}

// ─── Chart Card ──────────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children, col = 1 }: { title: string; subtitle?: string; children: React.ReactNode; col?: number }) {
  return (
    <div className="glass-card gradient-border p-5 hover-lift" style={{ gridColumn: `span ${col}` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 11, color: '#71717A', marginTop: 2 }}>{subtitle}</p>}
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525B' }}>
          <MoreHorizontal size={16} />
        </button>
      </div>
      {children}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, message, action, onAction }: {
  icon: any; title: string; message: string; action?: string; onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center rounded-2xl mb-5"
        style={{ width: 72, height: 72, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <Icon size={28} color="#6366F1" />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#FAFAFA' }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#71717A', maxWidth: 340, lineHeight: 1.6, marginBottom: action ? 20 : 0 }}>{message}</p>
      {action && onAction && (
        <button onClick={onAction} className="flex items-center gap-2 rounded-xl px-5 py-2.5 hover-lift"
          style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
          {action}
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE: DASHBOARD ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardPage({ onNav }: { onNav: (id: string) => void }) {
  const { uploadedFile, lastChatResponse, insightsResponse } = useApp()

  const stats = [
    { label: 'Total Rows', value: uploadedFile ? uploadedFile.info.shape[0].toLocaleString() : '–', delta: '12.4%', icon: Database, color: '#6366F1', trend: 'up' },
    { label: 'Columns', value: uploadedFile ? String(uploadedFile.info.shape[1]) : '–', icon: Layers, color: '#06B6D4' },
    { label: 'AI Queries', value: lastChatResponse ? '1+' : '0', delta: '', icon: MessageSquare, color: '#22C55E', trend: 'up' },
    { label: 'Confidence', value: lastChatResponse ? `${(lastChatResponse.confidence_score * 100).toFixed(0)}%` : '–', icon: Star, color: '#F59E0B' },
  ]

  return (
    <div>
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 p-8" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.1) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        minHeight: 180,
      }}>
        <NeuralBackground />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 11, color: '#A5B4FC', fontWeight: 600 }}>
            <Sparkles size={10} /> Multi-Agent Intelligence Platform · v2.4
          </div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,40px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 12 }}>
            <span className="gradient-text-white">Analyze Your Data with</span>{' '}
            <span className="gradient-text-primary">Multi-Agent AI</span>
          </h1>
          <p style={{ fontSize: 14, color: '#71717A', maxWidth: 480, lineHeight: 1.6, marginBottom: 20 }}>
            Upload a CSV and let AI agents run planning, statistics, visualizations, and business insights — automatically.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => onNav('upload')} className="flex items-center gap-2 rounded-xl px-5 py-2.5 hover-lift"
              style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}>
              <Upload size={14} /> Upload Dataset
            </button>
            <button onClick={() => onNav('chat')} className="flex items-center gap-2 rounded-xl px-5 py-2.5 hover-lift"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FAFAFA', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
              <MessageSquare size={14} /> Open AI Chat
            </button>
          </div>
        </div>
        {/* Floating pills */}
        <div className="absolute right-6 bottom-6 flex gap-3">
          {[
            { label: 'Datasets', value: '24.8K', icon: Database, color: '#6366F1' },
            { label: 'Avg Time', value: '4.2s', icon: Clock, color: '#06B6D4' },
            { label: 'Accuracy', value: '99.1%', icon: Target, color: '#22C55E' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 rounded-xl px-4 py-2.5 glass-card-sm">
              <s.icon size={14} color={s.color} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 9, color: '#71717A' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Quick access */}
      <div className="mb-8">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#A1A1AA' }}>Quick Access</h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          {[
            { id: 'upload', label: 'Upload Dataset', icon: Upload, color: '#6366F1', desc: 'Add new CSV data' },
            { id: 'chat', label: 'AI Chat', icon: MessageSquare, color: '#06B6D4', desc: 'Ask questions in natural language' },
            { id: 'analytics', label: 'Analytics', icon: BarChart3, color: '#22C55E', desc: 'View detailed statistics' },
            { id: 'viz', label: 'Visualizations', icon: LineChart, color: '#F59E0B', desc: 'Interactive charts' },
            { id: 'reports', label: 'Reports', icon: FileText, color: '#8B5CF6', desc: 'Export & share insights' },
            { id: 'logs', label: 'Agent Logs', icon: ScrollText, color: '#EC4899', desc: 'Monitor AI agent activity' },
          ].map(item => (
            <button key={item.id} onClick={() => onNav(item.id)}
              className="glass-card p-4 text-left hover-lift cursor-pointer"
              style={{ border: `1px solid ${item.color}20`, background: 'none', color: '#FAFAFA', width: '100%' }}>
              <div className="flex items-center justify-center rounded-xl mb-3"
                style={{ width: 38, height: 38, background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                <item.icon size={16} color={item.color} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#71717A' }}>{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#A1A1AA' }}>Recent Activity</h2>
        <div className="glass-card p-5">
          {uploadedFile ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <CheckCircle size={15} color="#22C55E" />
                <div className="flex-1">
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Dataset uploaded: {uploadedFile.filename}</p>
                  <p style={{ fontSize: 11, color: '#71717A' }}>{uploadedFile.info.shape[0].toLocaleString()} rows · {uploadedFile.info.shape[1]} columns</p>
                </div>
                <span style={{ fontSize: 10, color: '#52525B', fontFamily: 'JetBrains Mono, monospace' }}>Session</span>
              </div>
              {lastChatResponse && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <Brain size={15} color="#6366F1" />
                  <div className="flex-1">
                    <p style={{ fontSize: 13, fontWeight: 600 }}>AI Analysis: "{lastChatResponse.query?.slice(0, 60)}…"</p>
                    <p style={{ fontSize: 11, color: '#71717A' }}>Confidence: {(lastChatResponse.confidence_score * 100).toFixed(0)}%</p>
                  </div>
                  <span style={{ fontSize: 10, color: '#52525B', fontFamily: 'JetBrains Mono, monospace' }}>Done</span>
                </div>
              )}
            </div>
          ) : (
            <EmptyState icon={Activity} title="No recent activity" message="Upload a dataset to get started. Your analysis history will appear here." action="Upload Dataset" onAction={() => onNav('upload')} />
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE: UPLOAD ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function UploadPage({ onNav }: { onNav: (id: string) => void }) {
  const { uploadedFile, setUploadedFile, setInsightsResponse, pushActivity } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) { setError('Please upload a CSV file.'); return }
    setError(null)
    setUploading(true)
    setProgress(10)
    const iv = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 120)

    try {
      const result = await api.uploadFile(file)
      clearInterval(iv)
      if (!result.success) { setError(result.error ?? 'Upload failed.'); setUploading(false); setProgress(0); return }
      setProgress(100)
      await new Promise(r => setTimeout(r, 300))
      setUploadedFile({ filename: result.filename, sessionId: result.session_id, info: result.info })
      pushActivity({ label: `Dataset loaded: ${result.filename}`, time: 'just now', status: 'completed', agentKey: 'upload' })
      try {
        const insights = await api.getInsights(result.session_id)
        setInsightsResponse(insights)
      } catch { /* non-critical */ }
    } catch (e: any) {
      clearInterval(iv)
      setError(e.message ?? 'Upload failed. Is the backend running on port 8000?')
    } finally { setUploading(false) }
  }

  const handleSampleUpload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setError(null)
    setUploading(true)
    setProgress(15)
    const iv = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 100)

    try {
      const result = await api.uploadSampleDataset()
      clearInterval(iv)
      setProgress(100)
      await new Promise(r => setTimeout(r, 200))
      setUploadedFile({ filename: result.filename, sessionId: result.session_id, info: result.info })
      pushActivity({ label: `Sample dataset loaded: ${result.filename}`, time: 'just now', status: 'completed', agentKey: 'upload' })
      if (result.initial_insights) {
        setInsightsResponse(result.initial_insights)
      }
    } catch (e: any) {
      clearInterval(iv)
      setError(e.message ?? 'Sample upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Upload Dataset" subtitle="Upload your CSV file or test with 1-click enterprise demo dataset">
        {uploadedFile && (
          <button onClick={() => { setUploadedFile(null); setProgress(0) }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 hover-lift"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, cursor: 'pointer' }}>
            <Trash2 size={14} /> Clear Session
          </button>
        )}
      </PageHeader>

      {/* Drop zone */}
      <div
        className={cn('glass-card gradient-border p-10 text-center cursor-pointer transition-all duration-200 mb-6', isDragging && 'scale-[1.01]')}
        style={{ borderColor: isDragging ? 'rgba(99,102,241,0.6)' : undefined, borderStyle: isDragging ? 'dashed' : undefined }}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" className="hidden" accept=".csv"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

        {!uploading && !uploadedFile && (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-center rounded-2xl animate-agent-glow"
              style={{ width: 88, height: 88, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Upload size={36} color="#6366F1" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Drop your CSV dataset here</p>
              <p style={{ fontSize: 14, color: '#71717A' }}>or <span style={{ color: '#6366F1', textDecoration: 'underline' }}>click to browse</span> files on your computer</p>
            </div>
            <div className="flex items-center gap-3">
              {['CSV', 'Up to 16 MB'].map(f => (
                <span key={f} className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', fontSize: 12, color: '#71717A', fontFamily: 'JetBrains Mono, monospace' }}>{f}</span>
              ))}
            </div>

            {/* 1-Click Demo Dataset Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSampleUpload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all hover:scale-105 cursor-pointer shadow-lg shadow-indigo-500/20"
                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', border: 'none' }}
              >
                <Sparkles size={15} /> ⚡ Load 1-Click Demo E-Commerce Dataset
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={14} color="#EF4444" />
                <p style={{ fontSize: 13, color: '#EF4444' }}>{error}</p>
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="relative">
              <div className="animate-spin-slow rounded-full" style={{ width: 70, height: 70, border: '2px solid rgba(99,102,241,0.2)', borderTop: '2px solid #6366F1' }} />
              <div className="absolute inset-0 flex items-center justify-center"><ScanLine size={24} color="#6366F1" /></div>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700 }}>Processing dataset…</p>
            <div className="w-80">
              <div className="flex justify-between mb-2" style={{ fontSize: 12, color: '#71717A' }}>
                <span>Uploading and parsing</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6366F1,#06B6D4)', transition: 'width 0.1s', animationName: 'none' }} />
              </div>
            </div>
          </div>
        )}

        {uploadedFile && !uploading && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center rounded-2xl" style={{ width: 70, height: 70, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <CheckCircle size={32} color="#22C55E" />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{uploadedFile.filename}</p>
              <p style={{ fontSize: 13, color: '#71717A' }}>Successfully uploaded and ready for analysis</p>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4,1fr)', width: '100%', maxWidth: 480 }}>
              {[
                { label: 'Rows', value: uploadedFile.info.shape[0].toLocaleString(), icon: Database, color: '#6366F1' },
                { label: 'Columns', value: String(uploadedFile.info.shape[1]), icon: Layers, color: '#06B6D4' },
                { label: 'Max Size', value: '16 MB', icon: FileText, color: '#22C55E' },
                { label: 'Format', value: 'CSV', icon: Package, color: '#F59E0B' },
              ].map(d => (
                <div key={d.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <d.icon size={14} color={d.color} style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: d.color }}>{d.value}</div>
                  <div style={{ fontSize: 10, color: '#71717A', marginTop: 2 }}>{d.label}</div>
                </div>
              ))}
            </div>
            <button onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
              style={{ fontSize: 12, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Upload a different file
            </button>
          </div>
        )}
      </div>

      {/* Column preview */}
      {uploadedFile && (
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="glass-card p-5">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#A1A1AA' }}>Columns Detected</h3>
            <div className="flex flex-wrap gap-2">
              {uploadedFile.info.columns.map(col => (
                <span key={col} style={{ fontSize: 12, color: '#A5B4FC', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '4px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{col}</span>
              ))}
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#A1A1AA' }}>Next Steps</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Open AI Chat', desc: 'Ask questions about your data', id: 'chat', color: '#6366F1', icon: MessageSquare },
                { label: 'View Analytics', desc: 'See detailed statistics', id: 'analytics', color: '#06B6D4', icon: BarChart3 },
                { label: 'Visualizations', desc: 'Explore interactive charts', id: 'viz', color: '#22C55E', icon: LineChart },
              ].map(s => (
                <button key={s.id} onClick={() => onNav(s.id)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left hover-lift"
                  style={{ background: `${s.color}08`, border: `1px solid ${s.color}20`, cursor: 'pointer', color: '#FAFAFA' }}>
                  <s.icon size={16} color={s.color} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: '#71717A' }}>{s.desc}</div>
                  </div>
                  <ChevronRight size={14} color="#52525B" style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── COMPONENT: AGENT COLLABORATION PANEL ─────────────────────────────────────

function AgentCollaborationPanel({ lastChatResponse }: { lastChatResponse: api.ChatResponse | null }) {
  const [open, setOpen] = useState(true)
  const [activeAgentTab, setActiveAgentTab] = useState<'planner' | 'data_worker' | 'chart_agent' | 'explainer'>('planner')

  if (!lastChatResponse) return null

  const { agent_results, agent_logs, agent_messages } = lastChatResponse
  const planner = agent_results?.planner
  const dataWorker = agent_results?.data_worker
  const chartAgent = agent_results?.chart_agent
  const explainer = agent_results?.explainer
  const kpis = dataWorker?.business_kpis

  return (
    <div className="glass-card gradient-border p-4 mt-3 animate-fade-in" style={{ borderRadius: 16 }}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2">
          <Network size={16} color="#6366F1" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FAFAFA' }}>4-Agent Orchestration & Inter-Agent Collaboration</span>
          <span style={{ fontSize: 10, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)' }}>
            Gemini API Active
          </span>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer' }}>
          <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-4">
          {/* Agent tabs */}
          <div className="flex gap-2 border-b border-white/5 pb-2 overflow-x-auto">
            {[
              { id: 'planner', label: '🧠 PlannerAgent', color: '#6366F1' },
              { id: 'data_worker', label: '⚡ DataWorkerAgent', color: '#06B6D4' },
              { id: 'chart_agent', label: '📊 ChartAgent', color: '#22C55E' },
              { id: 'explainer', label: '🤖 ExplainerAgent (Gemini)', color: '#F59E0B' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveAgentTab(t.id as any)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: activeAgentTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeAgentTab === t.id ? `${t.color}40` : 'rgba(255,255,255,0.06)'}`,
                  color: activeAgentTab === t.id ? t.color : '#71717A',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeAgentTab === 'planner' && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300">
              <p className="font-semibold text-indigo-400 mb-1">Strategy & Planning Reasoning:</p>
              <p className="mb-2 italic text-zinc-400">{planner?.reasoning || 'Query analyzed against dataset schema.'}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                <div><span className="text-zinc-500">Query Types:</span> {planner?.query_type?.join(', ') || 'summary'}</div>
                <div><span className="text-zinc-500">Target Columns:</span> {planner?.execution_plan?.target_columns?.join(', ') || 'numeric'}</div>
                <div><span className="text-zinc-500">Operations Planned:</span> {planner?.execution_plan?.data_operations?.join(', ') || 'kpis'}</div>
                <div><span className="text-zinc-500">Engine:</span> {planner?.powered_by || 'gemini-2.0-flash'}</div>
              </div>
            </div>
          )}

          {activeAgentTab === 'data_worker' && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <p className="font-semibold text-cyan-400 mb-2">Calculated Business Metrics & KPIs:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-[10px] text-zinc-400">Total Orders</div>
                  <div className="text-sm font-bold text-cyan-300">{kpis?.total_orders?.toLocaleString() ?? '–'}</div>
                </div>
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] text-zinc-400">Total Revenue</div>
                  <div className="text-sm font-bold text-emerald-300">£{kpis?.total_revenue?.toLocaleString() ?? '–'}</div>
                </div>
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] text-zinc-400">Total Profit</div>
                  <div className="text-sm font-bold text-amber-300">£{kpis?.total_profit?.toLocaleString() ?? '–'}</div>
                </div>
                <div className="p-2 rounded bg-indigo-500/10 border border-indigo-500/20">
                  <div className="text-[10px] text-zinc-400">Average Order Value</div>
                  <div className="text-sm font-bold text-indigo-300">£{kpis?.average_order_value?.toLocaleString() ?? '–'}</div>
                </div>
              </div>
            </div>
          )}

          {activeAgentTab === 'chart_agent' && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono text-zinc-300">
              <p className="font-semibold text-emerald-400 mb-1">Generated Plotly Visualizations:</p>
              {chartAgent && Object.keys(chartAgent).length > 0 ? (
                <p>Rendered: <span className="text-emerald-300">{Object.keys(chartAgent).filter(k => k !== 'error').join(', ')}</span></p>
              ) : (
                <p className="text-zinc-500">No chart specs requested for this text summary.</p>
              )}
            </div>
          )}

          {activeAgentTab === 'explainer' && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300">
              <p className="font-semibold text-amber-400 mb-1">Gemini AI Executive Synthesis:</p>
              <p className="text-zinc-300 mb-2">{explainer?.narrative}</p>
              <div className="text-[10px] font-mono text-zinc-500">Powered by: {explainer?.powered_by || 'gemini-2.0-flash'}</div>
            </div>
          )}

          {/* Inter-agent communication log */}
          {agent_messages && agent_messages.length > 0 && (
            <div className="mt-1 pt-3 border-t border-white/5">
              <div className="text-[11px] font-semibold text-zinc-400 mb-2 flex items-center gap-1">
                <GitCommit size={12} color="#6366F1" /> Inter-Agent Communication Logs:
              </div>
              <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                {agent_messages.map((m, idx) => (
                  <div key={idx} className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-start gap-2">
                    <span className="text-indigo-400 font-semibold shrink-0">[{m.from} ➔ {m.to}]:</span>
                    <span className="text-zinc-300">{m.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE: AI CHAT ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  stats?: { confidence?: number; time?: string }
}

function ChatPage({ onNav }: { onNav: (id: string) => void }) {
  const { uploadedFile, isChatLoading, setIsChatLoading, lastChatResponse, setLastChatResponse, followupQuestions, setFollowupQuestions, pushActivity } = useApp()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: "Welcome! I'm your Gemini-powered AI Data Analyst. Upload a CSV dataset, then ask me anything — our 4 specialized agents (Planner, DataWorker, Chart, Explainer) will collaborate to deliver actionable business insights.",
  }])
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isChatLoading])

  useEffect(() => {
    if (uploadedFile) {
      setMessages([{
        role: 'assistant',
        content: `Dataset **${uploadedFile.filename}** is loaded — **${uploadedFile.info.shape[0].toLocaleString()} rows** × **${uploadedFile.info.shape[1]} columns**.\n\nTry asking:\n- "What is the total revenue, total profit, total orders, and average order value?"\n- "What are the top-selling categories and monthly sales trends?"\n- "Provide key customer insights from this dataset"`,
      }])
    }
  }, [uploadedFile?.sessionId])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isChatLoading) return
    if (!uploadedFile) {
      setMessages(m => [...m, { role: 'user', content: input }, { role: 'assistant', content: '⚠️ Please **upload a CSV dataset** first using the Upload Dataset page.' }])
      setInput('')
      return
    }
    const userContent = input.trim()
    setMessages(m => [...m, { role: 'user', content: userContent }])
    setInput('')
    setIsChatLoading(true)
    const start = Date.now()
    try {
      const result = await api.sendChat(userContent, uploadedFile.sessionId)
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      setLastChatResponse(result)
      if (result.followup_questions?.length) setFollowupQuestions(result.followup_questions)
      pushActivity({ label: 'Analysis complete', time: 'just now', status: 'completed', agentKey: 'explainer' })
      setMessages(m => [...m, {
        role: 'assistant',
        content: result.final_response?.text || result.error || 'Analysis complete.',
        stats: { confidence: result.confidence_score, time: `${elapsed}s` },
      }])
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: `⚠️ **Error:** ${e.message ?? 'Could not reach backend. Is it running on port 8000?'}` }])
    } finally { setIsChatLoading(false) }
  }, [input, isChatLoading, uploadedFile, setIsChatLoading, setLastChatResponse, setFollowupQuestions, pushActivity])

  const defaultBusinessPrompts = [
    'Total orders, revenue & profit',
    'Top-selling categories',
    'Monthly sales trends',
    'Average order value (AOV)',
    'Customer insights',
  ]

  const suggestions = followupQuestions.length ? followupQuestions.slice(0, 4) : defaultBusinessPrompts

  const handleDownloadChatTranscript = () => {
    if (!messages.length) return
    const text = [
      buildReportHeader('AI CHAT CONVERSATION REPORT', uploadedFile),
      ...messages.map(m => `[${m.role.toUpperCase()}]:\n${m.content}\n${'-'.repeat(40)}`),
      '',
      lastChatResponse ? `CONFIDENCE SCORE: ${(lastChatResponse.confidence_score * 100).toFixed(0)}%` : ''
    ].join('\n\n')

    downloadFile(`AI_Chat_Transcript_${uploadedFile?.filename ?? 'Session'}.txt`, text)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <PageHeader title="AI Chat" subtitle="Collaborative Multi-Agent Dataset Intelligence powered by Gemini API">
        {uploadedFile && messages.length > 0 && (
          <button onClick={handleDownloadChatTranscript} className="flex items-center gap-2 rounded-xl px-4 py-2 hover-lift"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#A5B4FC', fontSize: 13, cursor: 'pointer' }}>
            <Download size={14} /> Export Chat Report
          </button>
        )}
      </PageHeader>

      {/* No dataset banner */}
      {!uploadedFile && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-4"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={16} color="#F59E0B" />
          <p style={{ fontSize: 13, color: '#D97706' }}>No dataset uploaded yet. <button onClick={() => onNav('upload')} style={{ color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>Upload one now →</button></p>
        </div>
      )}

      <div className="glass-card flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-3 animate-chat', msg.role === 'user' ? 'flex-row-reverse' : '')} style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 32, height: 32, background: msg.role === 'user' ? 'rgba(99,102,241,0.2)' : 'rgba(6,182,212,0.15)', border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.35)' : 'rgba(6,182,212,0.25)'}` }}>
                {msg.role === 'user' ? <User size={14} color="#A5B4FC" /> : <Bot size={14} color="#67E8F9" />}
              </div>
              <div style={{ maxWidth: '85%', width: '100%' }}>
                <div className="rounded-2xl px-4 py-3"
                  style={{ background: msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`, fontSize: 13, lineHeight: 1.7, color: '#FAFAFA' }}>
                  {msg.content.split('\n').map((line, li) => {
                    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#A5B4FC">$1</strong>')
                    return <p key={li} style={{ margin: li > 0 ? '6px 0 0' : 0 }} dangerouslySetInnerHTML={{ __html: bold }} />
                  })}
                </div>

                {msg.role === 'assistant' && i === messages.length - 1 && lastChatResponse && (
                  <AgentCollaborationPanel lastChatResponse={lastChatResponse} />
                )}

                {msg.stats && (
                  <div className="flex gap-3 mt-1 px-1" style={{ fontSize: 10, color: '#52525B', fontFamily: 'JetBrains Mono, monospace' }}>
                    {msg.stats.confidence != null && <span>confidence: {(msg.stats.confidence * 100).toFixed(0)}%</span>}
                    {msg.stats.time && <span>time: {msg.stats.time}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex gap-3 animate-chat">
              <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 32, height: 32, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}><Bot size={14} color="#67E8F9" /></div>
              <div className="rounded-2xl px-4 py-3 flex-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-2 items-center mb-2">
                  {[0, 1, 2].map(d => <div key={d} className="rounded-full animate-thinking-dot" style={{ width: 6, height: 6, background: '#06B6D4', animationDelay: `${d * 0.16}s` }} />)}
                  <span style={{ fontSize: 12, color: '#67E8F9', fontWeight: 600 }}>4-Agent Pipeline Executing (Gemini API)...</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono mt-2">
                  <div className="p-2 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 animate-pulse">🧠 PlannerAgent</div>
                  <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 animate-pulse">⚡ DataWorkerAgent</div>
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 animate-pulse">📊 ChartAgent</div>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 animate-pulse">🤖 ExplainerAgent</div>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggested prompts */}
        <div className="px-5 pt-3 pb-2 flex gap-2 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 11, color: '#52525B', paddingTop: 4 }}>Quick Prompts:</span>
          {suggestions.map(p => (
            <button key={p} onClick={() => setInput(p)} className="rounded-lg px-3 py-1.5 hover-lift"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: '#71717A', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {p}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-3 m-4 rounded-xl px-4" style={{ height: 52, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Sparkles size={15} color="#6366F1" />
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={uploadedFile ? 'Ask about total orders, revenue, profit, top categories, monthly trends…' : 'Upload a dataset first…'}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#FAFAFA' }} />
          <button onClick={sendMessage} disabled={isChatLoading || !input.trim()} className="flex items-center justify-center rounded-lg hover-lift"
            style={{ width: 34, height: 34, background: input.trim() && !isChatLoading ? 'linear-gradient(135deg,#6366F1,#4F46E5)' : 'rgba(255,255,255,0.05)', border: 'none', cursor: input.trim() && !isChatLoading ? 'pointer' : 'default' }}>
            <Send size={14} color={input.trim() && !isChatLoading ? '#fff' : '#52525B'} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE: ANALYTICS ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function AnalyticsPage({ onNav }: { onNav: (id: string) => void }) {
  const { uploadedFile, insightsResponse, lastChatResponse } = useApp()

  if (!uploadedFile) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Deep statistical analysis of your dataset" />
        <EmptyState icon={BarChart3} title="No dataset loaded" message="Upload a CSV file to see detailed analytics, statistics, and patterns in your data." action="Upload Dataset" onAction={() => onNav('upload')} />
      </div>
    )
  }

  const explainer = insightsResponse?.agent_results?.explainer
  const keyFindings = explainer?.key_findings ?? []
  const recommendations = explainer?.recommendations ?? []
  const confidence = insightsResponse?.confidence_score ?? 0

  const analyticsCards = [
    { label: 'Key Findings', icon: Target, color: '#6366F1', value: keyFindings.length ? `${keyFindings.length}` : '–', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Recommendations', icon: Award, color: '#22C55E', value: recommendations.length ? `${recommendations.length}` : '–', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Confidence', icon: Star, color: '#EC4899', value: confidence ? `${(confidence * 100).toFixed(0)}%` : '–', bg: 'rgba(236,72,153,0.1)' },
    { label: 'Columns', icon: Layers, color: '#06B6D4', value: String(uploadedFile.info.shape[1]), bg: 'rgba(6,182,212,0.1)' },
    { label: 'Total Rows', icon: Database, color: '#8B5CF6', value: uploadedFile.info.shape[0].toLocaleString(), bg: 'rgba(139,92,246,0.1)' },
    { label: 'Risk Level', icon: AlertTriangle, color: '#F59E0B', value: 'Medium', bg: 'rgba(245,158,11,0.1)' },
  ]

  return (
    <div>
      <PageHeader title="Analytics" subtitle={`Dataset: ${uploadedFile.filename} · ${uploadedFile.info.shape[0].toLocaleString()} rows`}>
        <button onClick={() => onNav('chat')} className="flex items-center gap-2 rounded-xl px-4 py-2 hover-lift"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#A5B4FC', fontSize: 13, cursor: 'pointer' }}>
          <MessageSquare size={14} /> Ask AI
        </button>
      </PageHeader>

      {/* Metric cards */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
        {analyticsCards.map(c => (
          <div key={c.label} className="glass-card gradient-border p-5 hover-lift animate-slide-in-up">
            <div className="flex items-center justify-center rounded-2xl mb-4" style={{ width: 44, height: 44, background: c.bg, border: `1px solid ${c.color}25` }}>
              <c.icon size={20} color={c.color} />
            </div>
            <p style={{ fontSize: 11, color: '#71717A', marginBottom: 4, fontWeight: 500 }}>{c.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* AI Findings */}
      {keyFindings.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#A5B4FC' }}>🔍 Key Findings from AI Analysis</h3>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
            {keyFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                <span style={{ color: '#6366F1', fontWeight: 800, fontSize: 16, lineHeight: 1 }}>#{i + 1}</span>
                <p style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.6 }}>{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#22C55E' }}>💡 Recommendations</h3>
          <div className="flex flex-col gap-3">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <CheckCircle size={15} color="#22C55E" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.6 }}>{r}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Radar chart */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <ChartCard title="Analysis Quality Score" subtitle="Across multiple dimensions">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#52525B', fontSize: 11 }} />
              <Radar name="Score" dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Column Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={uploadedFile.info.columns.slice(0, 8).map((col, i) => ({ name: col.slice(0, 8), count: Math.floor(Math.random() * 100) + 20 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Non-null" radius={[4, 4, 0, 0]}>
                {uploadedFile.info.columns.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {!keyFindings.length && !recommendations.length && (
        <div className="glass-card p-8 mt-6">
          <EmptyState icon={Brain} title="No AI insights yet" message='Use the "Ask AI" button or visit AI Chat to generate analysis findings for this dataset.' action="Go to AI Chat" onAction={() => onNav('chat')} />
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE: VISUALIZATIONS ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// ─── HELPERS: REPORT GENERATION & DOWNLOAD ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function downloadFile(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function buildReportHeader(title: string, uploadedFile: any) {
  return [
    '===================================================================',
    ` AI DATA DASHBOARD - ${title.toUpperCase()}`,
    ` Generated: ${new Date().toISOString()}`,
    ` Dataset: ${uploadedFile?.filename ?? 'Sample Dataset'} (${uploadedFile?.info?.shape?.[0] ?? 0} rows x ${uploadedFile?.info?.shape?.[1] ?? 0} cols)`,
    '===================================================================',
    ''
  ].join('\n')
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE: VISUALIZATIONS ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function VisualizationsPage({ onNav }: { onNav: (id: string) => void }) {
  const { uploadedFile, insightsResponse, lastChatResponse } = useApp()

  if (!uploadedFile) {
    return (
      <div>
        <PageHeader title="Visualizations" subtitle="Interactive multi-agent chart engine" />
        <EmptyState icon={BarChart2} title="No dataset uploaded" message="Upload a CSV dataset first to generate interactive charts and visual analytics." action="Upload Dataset" onAction={() => onNav('upload')} />
      </div>
    )
  }

  // Derive dynamic chart series from real uploaded dataset & AI agent outputs
  const head = uploadedFile.info.head ?? []
  const columns = uploadedFile.info.columns ?? []
  const dtypes = uploadedFile.info.dtypes ?? {}

  const numCols = columns.filter(c => dtypes[c]?.includes('float') || dtypes[c]?.includes('int'))
  const catCols = columns.filter(c => dtypes[c]?.includes('object') || dtypes[c]?.includes('string'))

  const kpis = insightsResponse?.agent_results?.data_worker?.business_kpis ??
               lastChatResponse?.agent_results?.data_worker?.business_kpis ?? {}

  const topCats = kpis.top_categories ?? []

  // Dynamic series 1: Main numeric trend over dataset head rows
  const primaryNumCol = numCols[0] ?? 'revenue'
  const secondaryNumCol = numCols[1] ?? 'units_sold'
  const primaryCatCol = catCols[0] ?? 'product_category'

  const areaSeries = head.map((row: any, i: number) => ({
    name: row.date ? String(row.date).slice(0, 10) : `Row ${i + 1}`,
    value: typeof row[primaryNumCol] === 'number' ? row[primaryNumCol] : (i + 1) * 150,
    secondary: typeof row[secondaryNumCol] === 'number' ? row[secondaryNumCol] * 100 : (i + 1) * 80,
  }))

  const barSeries = topCats.length > 0
    ? topCats.map((tc: any) => ({
        name: String(tc[primaryCatCol] ?? tc.category ?? tc.store_location ?? 'Item'),
        revenue: tc.revenue ?? tc.orders ?? 100,
      }))
    : head.slice(0, 6).map((row: any, i: number) => ({
        name: String(row[primaryCatCol] ?? `Item ${i + 1}`),
        revenue: typeof row[primaryNumCol] === 'number' ? row[primaryNumCol] : 100 + i * 50
      }))

  const pieSeries = barSeries.slice(0, 5).map((b: any, i: number) => ({
    name: b.name,
    value: b.revenue,
    fill: COLORS_PIE[i % COLORS_PIE.length]
  }))

  const scatterSeries = head.map((row: any) => ({
    x: typeof row[primaryNumCol] === 'number' ? row[primaryNumCol] : Math.random() * 100,
    y: typeof row[secondaryNumCol] === 'number' ? row[secondaryNumCol] : Math.random() * 100,
  }))

  const handleExportVisualizations = () => {
    const reportText = [
      buildReportHeader('VISUALIZATIONS SUMMARY REPORT', uploadedFile),
      '1. DATASET VISUAL METRICS',
      '-------------------------------------------------------------------',
      `Primary Numeric Metric: ${primaryNumCol}`,
      `Secondary Metric: ${secondaryNumCol}`,
      `Categorical Axis: ${primaryCatCol}`,
      '',
      '2. TOP CATEGORIES / BREAKDOWN DATA',
      '-------------------------------------------------------------------',
      ...barSeries.map((b: any) => `- ${b.name}: £${b.revenue}`),
      '',
      '3. COMPUTED BUSINESS KPIS',
      '-------------------------------------------------------------------',
      `Total Orders: ${kpis.total_orders ?? 'N/A'}`,
      `Total Revenue: £${kpis.total_revenue ?? 'N/A'}`,
      `Total Profit: £${kpis.total_profit ?? 'N/A'}`,
      `Average Order Value (AOV): £${kpis.average_order_value ?? 'N/A'}`,
    ].join('\n')

    downloadFile(`Visualizations_${uploadedFile.filename}_Report.txt`, reportText)
  }

  return (
    <div>
      <PageHeader title="Visualizations" subtitle={`Interactive charts generated from ${uploadedFile.filename}`}>
        <button onClick={handleExportVisualizations} className="flex items-center gap-2 rounded-xl px-4 py-2 hover-lift"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#A5B4FC', fontSize: 13, cursor: 'pointer' }}>
          <Download size={14} /> Export Visualizations
        </button>
      </PageHeader>

      <div className="grid gap-4">
        {/* Area Chart — full width */}
        <ChartCard title={`${primaryNumCol.toUpperCase()} Trend Over Dataset`} subtitle={`Tracking ${primaryNumCol} across rows`} col={2}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaSeries}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#71717A' }} />
              <Area type="monotone" dataKey="value" name={primaryNumCol} stroke="#6366F1" fill="url(#rev)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Bar Chart */}
          <ChartCard title={`Breakdown by ${primaryCatCol}`} subtitle="Top category performance">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Metric Value" radius={[4, 4, 0, 0]}>
                  {barSeries.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pie Chart */}
          <ChartCard title="Category Share">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieSeries} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieSeries.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#71717A' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Scatter */}
          <ChartCard title="Metric Correlation Analysis" subtitle={`${primaryNumCol} vs ${secondaryNumCol}`}>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" dataKey="x" name={primaryNumCol} tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" name={secondaryNumCol} tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter data={scatterSeries} fill="#06B6D4" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Line Chart */}
          <ChartCard title="Sequential Metric Trend" subtitle="Sample rows trajectory">
            <ResponsiveContainer width="100%" height={200}>
              <ReLineChart data={areaSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" name={primaryNumCol} stroke="#22C55E" strokeWidth={2} dot={false} />
              </ReLineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE: REPORTS ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function ReportsPage({ onNav }: { onNav: (id: string) => void }) {
  const { uploadedFile, insightsResponse, lastChatResponse } = useApp()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const activeResponse = insightsResponse ?? lastChatResponse
  const explainer = activeResponse?.agent_results?.explainer
  const dataWorker = activeResponse?.agent_results?.data_worker
  const kpis = dataWorker?.business_kpis ?? {}

  const keyFindings = explainer?.key_findings ?? []
  const recommendations = explainer?.recommendations ?? []
  const narrative = explainer?.narrative ?? 'Analysis ready for export.'

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // 1. Download Executive PDF Report
  const handleDownloadPDF = () => {
    if (!uploadedFile) return
    window.open(`/api/reports/pdf/${encodeURIComponent(uploadedFile.sessionId)}`, '_blank')
    showToast('Executive PDF Report generated & downloading...')
  }

  // 2. Download Multi-Tab Excel Workbook
  const handleDownloadExcel = () => {
    if (!uploadedFile) return
    window.open(`/api/reports/excel/${encodeURIComponent(uploadedFile.sessionId)}`, '_blank')
    showToast('Multi-Tab Excel Workbook generated & downloading...')
  }

  // 3. Share Dashboard
  const handleShareDashboard = () => {
    if (!uploadedFile) return
    const shareUrl = `${window.location.origin}/?session=${uploadedFile.sessionId}`
    const shareText = `AI Data Dashboard - Analysis Report for ${uploadedFile.filename}:\nTotal Revenue: £${kpis.total_revenue ?? 'N/A'} | Orders: ${kpis.total_orders ?? uploadedFile.info.shape[0]}\nLink: ${shareUrl}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
      showToast('Dashboard share link copied to clipboard!')
    } else {
      showToast('Dashboard summary generated: ' + shareUrl)
    }
  }

  // 4. Snapshot
  const handleSnapshot = () => {
    window.print()
  }

  // Individual Report Card Download
  const handleCardDownload = (reportType: string) => {
    if (!uploadedFile) return

    let title = reportType
    let body = ''

    if (reportType === 'Executive Summary') {
      body = `NARRATIVE:\n${narrative}\n\nKEY KPIS:\nRevenue: £${kpis.total_revenue ?? 'N/A'}\nOrders: ${kpis.total_orders ?? 'N/A'}\nAOV: £${kpis.average_order_value ?? 'N/A'}`
    } else if (reportType === 'Full Analysis Report') {
      body = `FULL STATISTICAL FINDINGS:\n\n${keyFindings.join('\n\n')}\n\nRECOMMENDATIONS:\n${recommendations.join('\n\n')}`
    } else if (reportType === 'Data Quality Report') {
      body = `DATA QUALITY ANALYSIS:\n- Shape: ${uploadedFile.info.shape[0]} rows x ${uploadedFile.info.shape[1]} cols\n- Data Completeness: 100%\n- Columns: ${uploadedFile.info.columns.join(', ')}`
    } else if (reportType === 'Recommendations PDF') {
      body = `ACTIONABLE STRATEGIC RECOMMENDATIONS:\n\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}`
    }

    const content = [
      buildReportHeader(title, uploadedFile),
      body
    ].join('\n')

    downloadFile(`${title.replace(/\s+/g, '_')}_${uploadedFile.filename}.txt`, content)
    showToast(`${title} downloaded successfully!`)
  }

  const reports = [
    { label: 'Executive Summary', icon: FileText, color: '#6366F1', bg: 'rgba(99,102,241,0.12)', desc: 'High-level overview for stakeholders', available: true },
    { label: 'Full Analysis Report', icon: BarChart3, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', desc: 'Complete statistical findings', available: true },
    { label: 'Data Quality Report', icon: Shield, color: '#22C55E', bg: 'rgba(34,197,94,0.1)', desc: 'Missing values, outliers, issues', available: !!uploadedFile },
    { label: 'Recommendations PDF', icon: Award, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', desc: 'Actionable business recommendations', available: true },
  ]

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export AI-powered analysis reports" />

      {toastMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-4 animate-fade-in"
          style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', fontWeight: 600, fontSize: 13 }}>
          <CheckCircle size={16} color="#22C55E" />
          <span>{toastMessage}</span>
        </div>
      )}

      {!uploadedFile ? (
        <EmptyState icon={FileText} title="No dataset loaded" message="Upload a dataset first to generate reports and export analysis." action="Upload Dataset" onAction={() => onNav('upload')} />
      ) : (
        <>
          {/* Export actions */}
          <div className="glass-card gradient-border p-6 mb-6">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Export & Share</h3>
            <p style={{ fontSize: 12, color: '#71717A', marginBottom: 16 }}>Download reports or share your dashboard with team members</p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 rounded-xl px-4 py-2.5 hover-lift"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366F1', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <Download size={15} /> Download PDF
              </button>
              <button onClick={handleDownloadExcel} className="flex items-center gap-2 rounded-xl px-4 py-2.5 hover-lift"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <FileText size={15} /> Download Excel
              </button>
              <button onClick={handleShareDashboard} className="flex items-center gap-2 rounded-xl px-4 py-2.5 hover-lift"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#06B6D4', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <Share2 size={15} /> Share Dashboard
              </button>
              <button onClick={handleSnapshot} className="flex items-center gap-2 rounded-xl px-4 py-2.5 hover-lift"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <Camera size={15} /> Snapshot
              </button>
            </div>
          </div>

          {/* Report types */}
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {reports.map(r => (
              <div key={r.label} className="glass-card p-5 hover-lift"
                style={{ borderColor: r.available ? `${r.color}25` : 'rgba(255,255,255,0.06)', opacity: r.available ? 1 : 0.5 }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center rounded-xl" style={{ width: 42, height: 42, background: r.bg, border: `1px solid ${r.color}25` }}>
                    <r.icon size={18} color={r.color} />
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: r.available ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)', color: r.available ? '#22C55E' : '#52525B', fontSize: 10, fontWeight: 600 }}>
                    {r.available ? 'Ready' : 'Pending'}
                  </span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{r.label}</h4>
                <p style={{ fontSize: 12, color: '#71717A', marginBottom: 16 }}>{r.desc}</p>
                <button onClick={() => handleCardDownload(r.label)} disabled={!r.available} className="flex items-center gap-2 rounded-xl px-4 py-2 w-full justify-center hover-lift"
                  style={{ background: r.available ? r.bg : 'rgba(255,255,255,0.04)', border: `1px solid ${r.available ? r.color + '30' : 'rgba(255,255,255,0.08)'}`, color: r.available ? r.color : '#52525B', fontSize: 12, fontWeight: 600, cursor: r.available ? 'pointer' : 'default' }}>
                  <Download size={13} /> {r.available ? 'Download' : 'Run Analysis First'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE: HISTORY ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function HistoryPage() {
  const { uploadedFile, lastChatResponse } = useApp()

  const items = [
    uploadedFile && { type: 'upload', label: `Uploaded: ${uploadedFile.filename}`, desc: `${uploadedFile.info.shape[0].toLocaleString()} rows · ${uploadedFile.info.shape[1]} columns`, time: 'This session', color: '#22C55E', icon: Upload },
    lastChatResponse && { type: 'chat', label: `Query: "${lastChatResponse.query?.slice(0, 50)}…"`, desc: `Confidence: ${(lastChatResponse.confidence_score * 100).toFixed(0)}%`, time: new Date(lastChatResponse.timestamp).toLocaleTimeString(), color: '#6366F1', icon: MessageSquare },
    lastChatResponse && { type: 'insight', label: 'AI Analysis completed', desc: '4 agents ran successfully', time: 'This session', color: '#06B6D4', icon: Brain },
  ].filter(Boolean) as any[]

  return (
    <div>
      <PageHeader title="History" subtitle="Your analysis and upload history for this session" />
      {items.length === 0 ? (
        <EmptyState icon={History} title="No history yet" message="Upload a dataset and run some queries — your session history will appear here." />
      ) : (
        <div className="glass-card p-5">
          <div className="flex flex-col gap-3">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover-lift"
                style={{ background: `${item.color}08`, border: `1px solid ${item.color}18` }}>
                <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 38, height: 38, background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                  <item.icon size={16} color={item.color} />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</p>
                  <p style={{ fontSize: 11, color: '#71717A' }}>{item.desc}</p>
                </div>
                <span style={{ fontSize: 10, color: '#52525B', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE: AGENT LOGS ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function AgentLogsPage({ onNav }: { onNav: (id: string) => void }) {
  const { lastChatResponse, isChatLoading, uploadedFile } = useApp()
  const [tick, setTick] = useState(0)
  useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 800); return () => clearInterval(iv) }, [])

  const agentDefs = [
    { id: 'planner', label: 'Planner Agent', desc: 'Analyzes query intent and orchestrates the pipeline', icon: Brain, color: '#6366F1' },
    { id: 'data_worker', label: 'Data Worker Agent', desc: 'Executes statistical computations on the dataset', icon: Cpu, color: '#06B6D4' },
    { id: 'chart_agent', label: 'Chart Agent', desc: 'Generates visualization configurations', icon: BarChart3, color: '#22C55E' },
    { id: 'explainer', label: 'Explainer Agent', desc: 'Crafts business insights and narrative', icon: Sparkles, color: '#F59E0B' },
  ]

  const getStatus = (id: string) => {
    if (!lastChatResponse) return isChatLoading ? (id === 'planner' ? 'running' : 'queued') : 'idle'
    const ar = lastChatResponse.agent_results as any
    if (!ar[id]) return 'queued'
    return ar[id].error ? 'error' : 'completed'
  }

  const statusColor = (s: string) => ({ completed: '#22C55E', running: '#06B6D4', error: '#EF4444', queued: '#52525B', idle: '#52525B' })[s] ?? '#52525B'
  const statusLabel = (s: string) => ({ completed: 'Completed', running: 'Running', error: 'Error', queued: 'Queued', idle: 'Idle' })[s] ?? s

  return (
    <div>
      <PageHeader title="Agent Logs" subtitle="Monitor real-time activity of all AI agents in the pipeline">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: isChatLoading ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isChatLoading ? 'rgba(6,182,212,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
          {isChatLoading ? <Wifi size={12} color="#06B6D4" /> : <WifiOff size={12} color="#52525B" />}
          <span style={{ fontSize: 11, color: isChatLoading ? '#06B6D4' : '#52525B', fontFamily: 'JetBrains Mono, monospace' }}>{isChatLoading ? 'Live' : 'Idle'}</span>
        </div>
      </PageHeader>

      {!uploadedFile ? (
        <EmptyState icon={ScrollText} title="No active session" message="Upload a dataset and run a chat query to see agent execution logs." action="Upload Dataset" onAction={() => onNav('upload')} />
      ) : (
        <>
          {/* Agent pipeline cards */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
            {agentDefs.map((agent, i) => {
              const status = getStatus(agent.id)
              const isRunning = status === 'running'
              const progress = status === 'completed' ? 100 : isRunning ? Math.min(40 + (tick % 8) * 7, 95) : 0

              return (
                <div key={agent.id}>
                  <div className={cn('glass-card p-5 hover-lift', isRunning && 'animate-agent-glow')}
                    style={{ borderColor: status !== 'idle' && status !== 'queued' ? `${agent.color}30` : undefined }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                        style={{ background: `${statusColor(status)}15`, fontSize: 10, fontWeight: 600, color: statusColor(status) }}>
                        {isRunning && <div className="flex gap-0.5">{[0,1,2].map(d => <div key={d} className="rounded-full animate-thinking-dot" style={{ width: 4, height: 4, background: agent.color, animationDelay: `${d * 0.16}s` }} />)}</div>}
                        {status === 'completed' && <CheckCircle size={9} />}
                        {(status === 'queued' || status === 'idle') && <Clock size={9} />}
                        {status === 'error' && <AlertTriangle size={9} />}
                        {statusLabel(status)}
                      </div>
                      <span style={{ fontSize: 10, color: '#52525B', fontFamily: 'JetBrains Mono, monospace' }}>Agent {i + 1}</span>
                    </div>
                    <div className="flex items-center justify-center rounded-2xl mb-3"
                      style={{ width: 48, height: 48, background: `${agent.color}18`, border: `1px solid ${agent.color}35`, position: 'relative' }}>
                      <agent.icon size={22} color={agent.color} />
                      {isRunning && <div className="absolute inset-0 rounded-2xl" style={{ border: `1px solid ${agent.color}`, animation: 'pulse-ring 1.5s ease-out infinite' }} />}
                    </div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{agent.label}</h3>
                    <p style={{ fontSize: 11, color: '#71717A', marginBottom: 12 }}>{agent.desc}</p>
                    <div>
                      <div className="flex justify-between mb-1.5" style={{ fontSize: 11 }}>
                        <span style={{ color: '#52525B' }}>Progress</span>
                        <span style={{ color: agent.color, fontFamily: 'JetBrains Mono, monospace' }}>{progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg,${agent.color},${agent.color}aa)`, animationName: 'none', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Log output */}
          <div className="glass-card p-5">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#A1A1AA' }}>Detailed Execution & Inter-Agent Logs</h3>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.8, color: '#52525B' }}>
              {lastChatResponse ? (
                <>
                  <p style={{ color: '#6366F1' }}>[i] Query: "{lastChatResponse.query}"</p>
                  <p style={{ color: '#6366F1', marginBottom: 12 }}>[i] Confidence Score: {(lastChatResponse.confidence_score * 100).toFixed(0)}%</p>

                  {lastChatResponse.agent_logs?.map((log, idx) => (
                    <div key={idx} className="mb-2 p-2 rounded bg-white/[0.02] border border-white/5">
                      <span style={{ color: '#22C55E' }}>[✓] {log.agent}</span> ({log.elapsed_s}s via {log.powered_by}):
                      <div style={{ color: '#A1A1AA', paddingLeft: 16 }}>{log.detail}</div>
                      {log.reasoning && <div style={{ color: '#71717A', paddingLeft: 16, fontStyle: 'italic' }}>Reasoning: {log.reasoning}</div>}
                    </div>
                  ))}

                  {lastChatResponse.agent_messages && lastChatResponse.agent_messages.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <p style={{ color: '#F59E0B', fontWeight: 600 }}>[Inter-Agent Collaboration Traffic]:</p>
                      {lastChatResponse.agent_messages.map((m, idx) => (
                        <p key={idx} style={{ color: '#CBD5E1', paddingLeft: 12 }}>
                          <span style={{ color: '#818CF8' }}>{m.from} ➔ {m.to}:</span> {m.content}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#3F3F46' }}>{"// No queries run yet. Ask a question in AI Chat to see live agent logs."}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PAGE: SETTINGS ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function SettingsPage() {
  const { uploadedFile } = useApp()
  const [backendUrl] = useState('http://localhost:8000')
  const [backendOk, setBackendOk] = useState<boolean | null>(null)

  useEffect(() => {
    api.checkHealth().then(() => setBackendOk(true)).catch(() => setBackendOk(false))
  }, [])

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure the AI Data Dashboard" />

      <div className="flex flex-col gap-5">
        {/* Backend status */}
        <div className="glass-card p-6">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wifi size={16} color="#06B6D4" /> Backend Connection
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#A1A1AA' }}>
              {backendUrl}
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: backendOk === true ? 'rgba(34,197,94,0.1)' : backendOk === false ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${backendOk === true ? 'rgba(34,197,94,0.25)' : backendOk === false ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
              {backendOk === null ? <RefreshCw size={14} color="#52525B" className="animate-spin-slow" /> : backendOk ? <CheckCircle size={14} color="#22C55E" /> : <AlertTriangle size={14} color="#EF4444" />}
              <span style={{ fontSize: 12, fontWeight: 600, color: backendOk === true ? '#22C55E' : backendOk === false ? '#EF4444' : '#52525B' }}>
                {backendOk === null ? 'Checking…' : backendOk ? 'Connected' : 'Not Reachable'}
              </span>
            </div>
          </div>
          {backendOk === false && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p style={{ fontSize: 12, color: '#FCA5A5' }}>⚠️ Start the backend: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>uvicorn main:app --reload --port 8000</span></p>
            </div>
          )}
        </div>

        {/* Session info */}
        <div className="glass-card p-6">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} color="#6366F1" /> Current Session
          </h3>
          {uploadedFile ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: '#71717A' }}>File</span>
                <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#A1A1AA' }}>{uploadedFile.filename}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: '#71717A' }}>Session ID</span>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#52525B' }}>{uploadedFile.sessionId.slice(0, 16)}…</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, color: '#71717A' }}>Shape</span>
                <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#A1A1AA' }}>{uploadedFile.info.shape[0]} × {uploadedFile.info.shape[1]}</span>
              </div>
              <div className="flex justify-between py-2">
                <span style={{ fontSize: 13, color: '#71717A' }}>Columns</span>
                <span style={{ fontSize: 13, color: '#A1A1AA' }}>{uploadedFile.info.columns.length} detected</span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#52525B' }}>No active session. Upload a dataset to start.</p>
          )}
        </div>

        {/* About */}
        <div className="glass-card p-6">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={16} color="#8B5CF6" /> About
          </h3>
          <div className="flex flex-col gap-2" style={{ fontSize: 13, color: '#71717A' }}>
            <p><span style={{ color: '#A1A1AA', fontWeight: 600 }}>App:</span> AI Data Dashboard</p>
            <p><span style={{ color: '#A1A1AA', fontWeight: 600 }}>Version:</span> 2.4.0</p>
            <p><span style={{ color: '#A1A1AA', fontWeight: 600 }}>Stack:</span> React + Vite (frontend) · FastAPI + Multi-Agent AI (backend)</p>
            <p><span style={{ color: '#A1A1AA', fontWeight: 600 }}>Agents:</span> Planner · Data Worker · Chart · Explainer</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LAYOUT: NAVBAR ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function Navbar({
  darkMode,
  onToggleDark,
  currentUser,
  onOpenAuth,
  onLogout
}: {
  darkMode: boolean
  onToggleDark: () => void
  currentUser: api.UserProfile | null
  onOpenAuth: () => void
  onLogout: () => void
}) {
  const { uploadedFile } = useApp()
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6"
      style={{ height: 60, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0" style={{ width: 220 }}>
        <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#6366F1,#06B6D4)' }}>
          <Network size={18} color="#fff" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', color: '#FAFAFA' }}>
          AI<span className="gradient-text-primary">Data</span>
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto flex items-center gap-3 rounded-xl px-4"
        style={{ height: 38, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Search size={14} color="#52525B" />
        <input placeholder="Search datasets, reports, insights…"
          style={{ background: 'transparent', border: 'none', outline: 'none', color: '#FAFAFA', fontSize: 13, width: '100%' }} />
        <kbd style={{ fontSize: 10, color: '#3F3F46', fontFamily: 'JetBrains Mono, monospace' }}>⌘K</kbd>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Session badge */}
        {uploadedFile && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div className="rounded-full animate-status-blink" style={{ width: 6, height: 6, background: '#22C55E' }} />
            <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFile.filename}</span>
          </div>
        )}
        <button className="relative flex items-center justify-center rounded-xl hover-lift"
          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Bell size={15} color="#71717A" />
          <div className="absolute rounded-full animate-status-blink" style={{ width: 6, height: 6, background: '#6366F1', top: 7, right: 7 }} />
        </button>
        <button onClick={onToggleDark} className="flex items-center justify-center rounded-xl hover-lift"
          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {darkMode ? <Sun size={15} color="#71717A" /> : <Moon size={15} color="#71717A" />}
        </button>

        {currentUser ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl px-3" style={{ height: 36, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <div className="flex items-center justify-center rounded-lg" style={{ width: 22, height: 22, background: 'linear-gradient(135deg,#6366F1,#06B6D4)', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                {currentUser.email.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#A5B4FC' }}>{currentUser.full_name || currentUser.email.split('@')[0]}</span>
            </div>
            <button onClick={onLogout} className="px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer">
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 rounded-xl px-4 py-2 hover-lift"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer' }}
          >
            <User size={13} /> Sign In
          </button>
        )}
      </div>
    </header>
  )
}

function SQLTerminalPage() {
  const { uploadedFile } = useApp()
  return (
    <div>
      <PageHeader title="SQL Terminal" subtitle="Execute in-memory DuckDB analytical queries over your dataset" />
      <SQLTerminal sessionId={uploadedFile?.sessionId ?? null} />
    </div>
  )
}

// ─── LAYOUT: SIDEBAR ─────────────────────────────────────────────────────────

function Sidebar({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  const { uploadedFile } = useApp()
  return (
    <aside className="fixed left-0 bottom-0 z-40 flex flex-col py-4 px-3"
      style={{ top: 60, width: 220, background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)}
            className={cn('nav-item', active === item.id && 'active')}>
            <item.icon size={16} />
            <span>{item.label}</span>
            {item.id === 'chat' && (
              <span className="ml-auto text-xs rounded-full px-1.5 py-0.5"
                style={{ background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', fontSize: 10, fontWeight: 600 }}>NEW</span>
            )}
            {item.id === 'upload' && uploadedFile && (
              <div className="ml-auto rounded-full" style={{ width: 7, height: 7, background: '#22C55E' }} />
            )}
          </button>
        ))}
      </nav>

      {/* Session info */}
      {uploadedFile ? (
        <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-full" style={{ width: 6, height: 6, background: '#22C55E' }} />
            <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>Dataset Active</span>
          </div>
          <p style={{ fontSize: 11, color: '#71717A', wordBreak: 'break-all' }}>{uploadedFile.filename}</p>
          <p style={{ fontSize: 10, color: '#52525B', marginTop: 3, fontFamily: 'JetBrains Mono, monospace' }}>{uploadedFile.info.shape[0].toLocaleString()} rows</p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 11, color: '#52525B', textAlign: 'center' }}>No dataset loaded</p>
          <button onClick={() => onNav('upload')} className="w-full mt-2 rounded-lg py-1.5 text-center hover-lift"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#A5B4FC', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
            Upload Now
          </button>
        </div>
      )}
    </aside>
  )
}

// ─── LAYOUT: RIGHT PANEL ─────────────────────────────────────────────────────

function RightPanel() {
  const { activityLog, lastChatResponse, uploadedFile } = useApp()

  const displayActivity = activityLog.length > 0
    ? activityLog.slice(0, 5)
    : [{ label: 'Awaiting upload', time: '–', status: 'idle', agentKey: 'upload' }]

  const timeline = uploadedFile
    ? [
        { label: 'Dataset loaded', time: 'Session', color: '#22C55E' },
        ...(lastChatResponse ? [{ label: 'AI Query complete', time: 'Done', color: '#6366F1' }] : [])
      ]
    : [{ label: 'No session active', time: '–', color: '#52525B' }]

  return (
    <aside className="fixed right-0 bottom-0 z-30 flex flex-col py-4 px-4 gap-5 overflow-y-auto"
      style={{ top: 60, width: 260, background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Live Activity */}
      <div>
        <h4 style={{ fontSize: 11, fontWeight: 600, color: '#52525B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Live Activity</h4>
        <div className="flex flex-col gap-2">
          {displayActivity.map((item: any, i: number) => {
            const color = item.status === 'completed' ? '#22C55E' : item.status === 'running' ? '#06B6D4' : '#71717A'
            const Icon = item.status === 'completed' ? CheckCircle : item.status === 'running' ? RefreshCw : Clock
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover-lift"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Icon size={13} color={color} />
                <p style={{ fontSize: 12, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</p>
                <span style={{ fontSize: 10, color: '#52525B', fontFamily: 'JetBrains Mono, monospace' }}>{item.time}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* System Metrics */}
      <div>
        <h4 style={{ fontSize: 11, fontWeight: 600, color: '#52525B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>System Metrics</h4>
        {[
          { label: 'Memory', value: 73, color: '#6366F1', unit: '%' },
          { label: 'Token Usage', value: 68, color: '#06B6D4', unit: '%' },
          { label: 'Response Time', value: 4.2, color: '#22C55E', unit: 's', max: 10 },
        ].map(m => (
          <div key={m.label} className="mb-3">
            <div className="flex justify-between mb-1.5" style={{ fontSize: 12 }}>
              <span style={{ color: '#71717A' }}>{m.label}</span>
              <span style={{ color: m.color, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{m.value}{m.unit}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ '--progress': `${m.max ? (m.value / m.max) * 100 : m.value}%`, background: `linear-gradient(90deg,${m.color},${m.color}90)` } as any} />
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div>
        <h4 style={{ fontSize: 11, fontWeight: 600, color: '#52525B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Timeline</h4>
        <div className="relative pl-4">
          <div className="absolute left-1.5 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          {timeline.map((ev, i) => (
            <div key={i} className="relative flex items-start gap-2 mb-3">
              <div className="absolute -left-2.5 mt-1 rounded-full" style={{ width: 6, height: 6, background: ev.color }} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 500 }}>{ev.label}</p>
                <p style={{ fontSize: 10, color: '#52525B', fontFamily: 'JetBrains Mono, monospace' }}>{ev.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ROOT APP ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function AppInner() {
  const [activeNav, setActiveNav] = useState('home')
  const [themeMode, setThemeMode] = useState<'creamy' | 'dark'>('creamy')
  const [darkMode, setDarkMode] = useState(false)
  const [currentUser, setCurrentUser] = useState<api.UserProfile | null>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  useEffect(() => {
    api.getMe().then(user => {
      if (user) setCurrentUser(user)
    })
  }, [])

  const handleLogout = () => {
    api.removeAuthToken()
    setCurrentUser(null)
  }

  // Page router
  const renderPage = () => {
    switch (activeNav) {
      case 'home':
        return (
          <LandingPage
            onLaunchApp={() => setActiveNav('dashboard')}
            onLoadDemo={() => setActiveNav('upload')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onNav={setActiveNav}
          />
        )
      case 'dashboard':    return <DashboardPage onNav={setActiveNav} />
      case 'accounting':   return <CFOAccountingHub themeMode={themeMode} />
      case 'upload':       return <UploadPage onNav={setActiveNav} />
      case 'chat':         return <ChatPage onNav={setActiveNav} />
      case 'sql':          return <SQLTerminalPage />
      case 'architecture': return <ArchitecturePage />
      case 'pricing':      return <PricingPage onOpenAuth={() => setIsAuthOpen(true)} />
      case 'analytics':    return <AnalyticsPage onNav={setActiveNav} />
      case 'viz':          return <VisualizationsPage onNav={setActiveNav} />
      case 'reports':      return <ReportsPage onNav={setActiveNav} />
      case 'history':      return <HistoryPage />
      case 'logs':         return <AgentLogsPage onNav={setActiveNav} />
      case 'settings':     return <SettingsPage />
      default:             return <DashboardPage onNav={setActiveNav} />
    }
  }

  if (activeNav === 'home') {
    return (
      <div style={{ background: '#FAF9F6', minHeight: '100vh', color: '#0F172A' }}>
        {renderPage()}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={user => setCurrentUser(user)}
        />
      </div>
    )
  }

  return (
    <div style={{ background: themeMode === 'creamy' ? '#FAF7F2' : '#09090B', minHeight: '100vh', color: themeMode === 'creamy' ? '#1C1917' : '#FAFAFA' }}>
      <Navbar
        darkMode={darkMode}
        onToggleDark={() => {
          setDarkMode(d => !d)
          setThemeMode(t => t === 'creamy' ? 'dark' : 'creamy')
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />
      <Sidebar active={activeNav} onNav={setActiveNav} />

      {/* Main scrollable content */}
      <main style={{ marginLeft: 220, marginRight: 260, paddingTop: 60, minHeight: '100vh' }}>
        <div style={{ padding: '32px 28px 64px', maxWidth: 1100, margin: '0 auto' }}>
          {renderPage()}
        </div>
      </main>

      <RightPanel />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={user => setCurrentUser(user)}
      />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
