import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Square, Trash2, ArrowDown } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL as string

const LEVEL_COLORS: Record<string, string> = {
  DEBUG:    'text-gray-400',
  INFO:     'text-blue-400',
  WARNING:  'text-amber-400',
  ERROR:    'text-red-400',
  CRITICAL: 'text-red-600 font-bold',
}

const LEVEL_BADGES: Record<string, string> = {
  DEBUG:    'bg-gray-700 text-gray-300',
  INFO:     'bg-blue-900/60 text-blue-300',
  WARNING:  'bg-amber-900/60 text-amber-300',
  ERROR:    'bg-red-900/60 text-red-300',
  CRITICAL: 'bg-red-700 text-white',
}

const LEVELS = ['ALL', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
const MAX_LINES = 500

interface LogRecord {
  id: number
  ts: string
  ms: number
  level: string
  logger: string
  message: string
}

function formatTime(rec: LogRecord) {
  return `${rec.ts.slice(11)}.${String(rec.ms).padStart(3, '0')}`
}

export default function LogsPage() {
  const [records, setRecords] = useState<LogRecord[]>([])
  const [connected, setConnected] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [loggerFilter, setLoggerFilter] = useState('')
  const [search, setSearch] = useState('')

  const esRef = useRef<EventSource | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const buildUrl = useCallback(() => {
    const token = localStorage.getItem('admin_token') ?? ''
    const params = new URLSearchParams()
    if (levelFilter !== 'ALL') params.set('level', levelFilter)
    if (loggerFilter) params.set('logger_filter', loggerFilter)
    // Pass token via query param for SSE (EventSource doesn't support headers)
    params.set('token', token)
    return `${API_URL}/admin/logs/stream?${params.toString()}`
  }, [levelFilter, loggerFilter])

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
    }
    const es = new EventSource(buildUrl())
    esRef.current = es

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      try {
        const rec: LogRecord = JSON.parse(e.data)
        setRecords(prev => {
          const next = [...prev, rec]
          return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next
        })
      } catch {}
    }

    es.addEventListener('connected', () => {
      setConnected(true)
    })

    es.onerror = () => {
      setConnected(false)
      // EventSource auto-reconnects; we just update state
    }
  }, [buildUrl])

  const disconnect = () => {
    esRef.current?.close()
    esRef.current = null
    setConnected(false)
  }

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [records, autoScroll])

  // Pause auto-scroll when user scrolls up
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAutoScroll(atBottom)
  }

  // Cleanup on unmount
  useEffect(() => () => { esRef.current?.close() }, [])

  // Filtered view (SSE server also filters, this is a client-side extra pass)
  const visible = records.filter(r => {
    if (search && !r.message.toLowerCase().includes(search.toLowerCase()) &&
        !r.logger.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Live Logs</h2>

        {/* Connect / Disconnect */}
        {!connected ? (
          <button
            onClick={connect}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg"
          >
            <Play size={14} /> Σύνδεση
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
          >
            <Square size={14} /> Αποσύνδεση
          </button>
        )}

        {/* Connected indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-teal-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-gray-500">{connected ? 'Συνδεδεμένο' : 'Αποσυνδεδεμένο'}</span>
        </div>

        <div className="flex-1" />

        {/* Filters */}
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900"
        >
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <input
          value={loggerFilter}
          onChange={e => setLoggerFilter(e.target.value)}
          placeholder="Logger filter..."
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 w-36"
        />

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Αναζήτηση..."
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 w-36"
        />

        <button
          onClick={() => setRecords([])}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <Trash2 size={13} /> Καθαρισμός
        </button>
      </div>

      {/* Log output */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-gray-950 text-gray-100 rounded-xl font-mono text-xs leading-5 p-4 min-h-0"
        style={{ minHeight: '400px', maxHeight: 'calc(100vh - 220px)' }}
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
            <Play size={28} className="opacity-30" />
            <p>{connected ? 'Αναμονή logs...' : 'Πατήστε "Σύνδεση" για να δείτε live logs.'}</p>
          </div>
        ) : (
          visible.map((r) => (
            <div key={r.id} className="flex gap-3 hover:bg-gray-900 px-1 rounded group">
              {/* Time */}
              <span className="text-gray-600 shrink-0 tabular-nums">{formatTime(r)}</span>
              {/* Level badge */}
              <span className={`shrink-0 w-16 text-center rounded px-1 ${LEVEL_BADGES[r.level] ?? 'bg-gray-800 text-gray-400'}`}>
                {r.level}
              </span>
              {/* Logger */}
              <span className="text-gray-500 shrink-0 max-w-[160px] truncate">{r.logger}</span>
              {/* Message */}
              <span className={`flex-1 break-all ${LEVEL_COLORS[r.level] ?? 'text-gray-300'}`}>
                {r.message}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{visible.length} / {MAX_LINES} γραμμές</span>
        <button
          onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
          className={`flex items-center gap-1 px-2 py-1 rounded ${autoScroll ? 'text-teal-600' : 'text-gray-400 hover:text-teal-600 border border-gray-200 dark:border-gray-700'}`}
        >
          <ArrowDown size={13} /> Auto-scroll {autoScroll ? '●' : '○'}
        </button>
      </div>
    </div>
  )
}
