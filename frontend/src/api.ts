// ─── API Service ─────────────────────────────────────────────────────────────
// All calls go through /api, which Vite proxies to http://localhost:8000

const BASE = '/api'

// ─── Response Types ───────────────────────────────────────────────────────────

export interface FileInfo {
  shape: [number, number]
  columns: string[]
  dtypes: Record<string, string>
  head: Record<string, unknown>[]
}

export interface UploadResponse {
  success: boolean
  filename: string
  session_id: string
  info: FileInfo
  error?: string
}

export interface AgentLog {
  agent: string
  status: string
  elapsed_s: number
  powered_by: string
  detail: string
  reasoning?: string
}

export interface AgentMessage {
  from: string
  to: string
  content: string
}

export interface AgentResults {
  planner?: {
    query_type?: string[]
    mentioned_columns?: string[]
    execution_plan?: {
      data_operations?: string[]
      target_columns?: string[]
      output_format?: string
    }
    requires_chart?: boolean
    reasoning?: string
    powered_by?: string
    error?: string
  }
  data_worker?: {
    statistics?: Record<string, unknown>
    business_kpis?: {
      total_orders?: number
      total_revenue?: number
      total_profit?: number
      average_order_value?: number
      top_categories?: Record<string, unknown>[]
      monthly_sales_trends?: Record<string, unknown>[]
      customer_insights?: Record<string, unknown>
    }
    metadata?: {
      operations_executed?: string[]
    }
    error?: string
  }
  chart_agent?: {
    error?: string
    [key: string]: unknown
  }
  explainer?: {
    narrative?: string
    summary?: Record<string, unknown>
    key_findings?: string[]
    recommendations?: string[]
    data_quality?: Record<string, unknown>
    powered_by?: string
    error?: string
  }
}

export interface FinalResponse {
  text: string
  charts: Record<string, unknown>
  insights: {
    summary?: Record<string, unknown>
    key_findings?: string[]
    recommendations?: string[]
    data_quality?: Record<string, unknown>
    powered_by?: string
  }
  data_summary: Record<string, unknown>
  business_kpis?: Record<string, unknown>
  query_type: string[]
  confidence_score: number
  requires_chart?: boolean
  plan_reasoning?: string
}

export interface ChatResponse {
  query: string
  timestamp: string
  agent_results: AgentResults
  final_response: FinalResponse
  followup_questions: string[]
  confidence_score: number
  agent_logs?: AgentLog[]
  agent_messages?: AgentMessage[]
  error?: string
}

export interface InsightsResponse extends ChatResponse {}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any)?.detail ?? `Upload failed (${res.status})`)
  }

  return res.json()
}

export async function sendChat(query: string, sessionId: string): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, session_id: sessionId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any)?.detail ?? `Chat request failed (${res.status})`)
  }

  return res.json()
}

export async function getInsights(sessionId: string): Promise<InsightsResponse> {
  const res = await fetch(`${BASE}/insights/${encodeURIComponent(sessionId)}`)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any)?.detail ?? `Insights request failed (${res.status})`)
  }

  return res.json()
}

export async function getDataSummary(sessionId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/data/summary/${encodeURIComponent(sessionId)}`)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any)?.detail ?? `Data summary request failed (${res.status})`)
  }

  return res.json()
}

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new Error('Backend not reachable')
  return res.json()
}
