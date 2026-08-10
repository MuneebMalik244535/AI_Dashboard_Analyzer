import { useState } from 'react'
import { Play, Database, Terminal as TerminalIcon, Clock, Download, RefreshCw, AlertCircle } from 'lucide-react'
import * as api from '../api'

interface SQLTerminalProps {
  sessionId: string | null
}

export function SQLTerminal({ sessionId }: SQLTerminalProps) {
  const [query, setQuery] = useState(
    "SELECT store_location, COUNT(*) as orders, ROUND(SUM(revenue), 2) as total_revenue FROM dataset GROUP BY store_location ORDER BY total_revenue DESC"
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExecute = async () => {
    if (!sessionId) {
      setError('Please upload a dataset first to run SQL queries.')
      return
    }
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/data/sql', {
        method: 'POST',
        headers: api.getAuthToken()
          ? { 'Content-Type': 'application/json', Authorization: `Bearer ${api.getAuthToken()}` }
          : { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, query }),
      })

      const data = await res.json()
      if (!res.ok || data.success === false) {
        setError(data.error || 'SQL execution failed.')
        setResult(null)
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message || 'Connection error executing SQL query.')
    } finally {
      setLoading(false)
    }
  }

  const sampleQueries = [
    { label: 'Revenue by Store Location', sql: 'SELECT store_location, COUNT(*) as total_orders, ROUND(SUM(revenue), 2) as total_revenue FROM dataset GROUP BY store_location ORDER BY total_revenue DESC' },
    { label: 'Top Product Categories', sql: 'SELECT product_category, COUNT(*) as units, ROUND(AVG(revenue), 2) as avg_revenue FROM dataset GROUP BY product_category ORDER BY avg_revenue DESC' },
    { label: 'Outlier Revenue Transactions (> £400)', sql: 'SELECT * FROM dataset WHERE revenue > 400 ORDER BY revenue DESC LIMIT 20' },
  ]

  return (
    <div className="glass-card gradient-border p-6 flex flex-col gap-6" style={{ borderRadius: 20 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <TerminalIcon size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">DuckDB In-Memory OLAP SQL Terminal</h2>
            <p className="text-xs text-zinc-400">Execute sub-second analytical SQL queries directly on your dataset</p>
          </div>
        </div>

        {/* Sample Queries Dropdown / Buttons */}
        <div className="flex gap-2">
          {sampleQueries.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(s.sql)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query Editor Input */}
      <div className="relative font-mono">
        <textarea
          rows={4}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="SELECT * FROM dataset WHERE ..."
          className="w-full p-4 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-indigo-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
          style={{ resize: 'vertical' }}
        />
        <button
          onClick={handleExecute}
          disabled={loading}
          className="absolute right-3 bottom-3 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
          style={{ border: 'none' }}
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
          {loading ? 'Running...' : 'Execute SQL'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Results Table */}
      {result && result.success && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Clock size={12} className="text-emerald-400" /> Latency: <strong>{result.execution_time_ms} ms</strong></span>
              <span className="flex items-center gap-1"><Database size={12} className="text-indigo-400" /> Rows: <strong>{result.rows_returned}</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-950/60 max-h-80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10 text-indigo-300 font-mono">
                  {result.columns.map((col: string) => (
                    <th key={col} className="p-3 font-semibold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-zinc-300 text-[11px]">
                {result.records.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-white/[0.02]">
                    {result.columns.map((col: string) => (
                      <td key={col} className="p-3 whitespace-nowrap">{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
