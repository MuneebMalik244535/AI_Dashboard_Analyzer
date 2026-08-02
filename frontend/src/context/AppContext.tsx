import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { FileInfo, ChatResponse, InsightsResponse, AgentResults } from '../api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedFile {
  filename: string
  sessionId: string
  info: FileInfo
}

export interface ActivityItem {
  label: string
  time: string
  status: 'completed' | 'running' | 'queued' | 'idle'
  agentKey: keyof AgentResults | 'upload'
}

export interface AppState {
  // Upload
  uploadedFile: UploadedFile | null
  setUploadedFile: (f: UploadedFile | null) => void

  // Last chat response (used to drive agent pipeline + right panel)
  lastChatResponse: ChatResponse | null
  setLastChatResponse: (r: ChatResponse | null) => void

  // Insights (loaded once after upload)
  insightsResponse: InsightsResponse | null
  setInsightsResponse: (r: InsightsResponse | null) => void

  // Follow-up questions from the planner
  followupQuestions: string[]
  setFollowupQuestions: (q: string[]) => void

  // Global loading state
  isChatLoading: boolean
  setIsChatLoading: (v: boolean) => void

  // Live activity timeline
  activityLog: ActivityItem[]
  pushActivity: (item: ActivityItem) => void
  clearActivity: () => void

  // Helper: derive agent statuses from last response
  getAgentStatuses: () => Record<string, 'completed' | 'running' | 'queued' | 'error'>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [lastChatResponse, setLastChatResponse] = useState<ChatResponse | null>(null)
  const [insightsResponse, setInsightsResponse] = useState<InsightsResponse | null>(null)
  const [followupQuestions, setFollowupQuestions] = useState<string[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([])

  const pushActivity = useCallback((item: ActivityItem) => {
    setActivityLog(prev => [item, ...prev].slice(0, 10))
  }, [])

  const clearActivity = useCallback(() => setActivityLog([]), [])

  const getAgentStatuses = useCallback((): Record<string, 'completed' | 'running' | 'queued' | 'error'> => {
    if (!lastChatResponse) {
      return { planner: 'queued', data_worker: 'queued', chart_agent: 'queued', explainer: 'queued' }
    }
    const ar = lastChatResponse.agent_results
    const resolve = (key: keyof AgentResults): 'completed' | 'error' | 'queued' => {
      if (!ar[key]) return 'queued'
      return ar[key]!.error ? 'error' : 'completed'
    }
    return {
      planner: resolve('planner'),
      data_worker: resolve('data_worker'),
      chart_agent: resolve('chart_agent'),
      explainer: resolve('explainer'),
    }
  }, [lastChatResponse])

  return (
    <AppContext.Provider
      value={{
        uploadedFile, setUploadedFile,
        lastChatResponse, setLastChatResponse,
        insightsResponse, setInsightsResponse,
        followupQuestions, setFollowupQuestions,
        isChatLoading, setIsChatLoading,
        activityLog, pushActivity, clearActivity,
        getAgentStatuses,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
