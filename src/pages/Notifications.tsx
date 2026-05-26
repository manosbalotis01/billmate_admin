import { useEffect, useState } from 'react'
import { Bell, Send, Play, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../lib/toast'
import { TableSkeleton } from '../components/Skeleton'

interface NotifStats {
  total: number
  by_type: { type: string; count: number }[]
}

interface NotifLog {
  id: number
  user_email: string
  bill_id: number
  provider: string
  notification_type: string
  sent_at: string
}

interface DueCheckResult {
  target_date: string
  reminders_sent: number
  due_today_sent: number
  overdue_sent: number
  skipped_duplicates: number
  failed: number
}

const TYPE_LABELS: Record<string, string> = {
  new_bill_detected: 'Νέος λογαριασμός',
  bill_due_reminder: 'Υπενθύμιση',
  bill_due_today: 'Λήγει σήμερα',
  bill_overdue: 'Εκπρόθεσμος',
}

const TYPE_COLORS: Record<string, string> = {
  new_bill_detected: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  bill_due_reminder: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  bill_due_today: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  bill_overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// ── Send custom push form ────────────────────────────────────────────────────
function SendPushForm() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [broadcast, setBroadcast] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!title || !message) { toast('Συμπλήρωσε title και message', 'error'); return }
    if (!broadcast && !userEmail) { toast('Δώσε email χρήστη ή ενεργοποίησε broadcast', 'error'); return }
    setLoading(true)
    setResult(null)
    try {
      const r = await api.post('/admin/notifications/send', {
        title,
        message,
        user_email: broadcast ? undefined : userEmail,
        broadcast,
      })
      setResult(r.data)
      toast('Push notification στάλθηκε!', 'success')
    } catch (e: any) {
      toast(e?.response?.data?.detail ?? 'Αποτυχία αποστολής', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Send size={16} className="text-teal-600" /> Αποστολή Custom Push
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Τίτλος</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="π.χ. Νέα ανακοίνωση"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Μήνυμα</label>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Σώμα της ειδοποίησης..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setBroadcast(b => !b)}
            className={`w-10 h-5 rounded-full transition-colors ${broadcast ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'} flex items-center px-0.5`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${broadcast ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Broadcast σε όλους</span>
        </label>

        {!broadcast && (
          <div className="flex-1 min-w-[200px]">
            <input
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              placeholder="user@email.com"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        )}
      </div>

      {broadcast && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle size={14} />
          Broadcast στέλνει σε ΟΛΟΥΣ τους εγγεγραμμένους χρήστες.
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSend}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg disabled:opacity-60 transition-colors"
        >
          <Send size={15} />
          {loading ? 'Αποστολή...' : 'Αποστολή'}
        </button>

        {result && (
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded">
            {JSON.stringify(result)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Due-check trigger ────────────────────────────────────────────────────────
function DueCheckTrigger() {
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DueCheckResult | null>(null)
  const { toast } = useToast()

  const run = async () => {
    setLoading(true)
    setResult(null)
    try {
      const r = await api.post('/admin/notifications/run-due-check',
        targetDate ? { target_date: targetDate } : {}
      )
      setResult(r.data)
      toast('Due-check ολοκληρώθηκε', 'success')
    } catch {
      toast('Αποτυχία due-check', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Play size={16} className="text-teal-600" /> Trigger Due-Date Check
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Τρέχει τη λογική υπενθυμίσεων/overdue για συγκεκριμένη ημερομηνία (default: σήμερα).
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="date"
          value={targetDate}
          onChange={e => setTargetDate(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg disabled:opacity-60 transition-colors"
        >
          <Play size={15} />
          {loading ? 'Τρέχει...' : 'Εκτέλεση'}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {[
            { label: 'Υπενθυμίσεις', value: result.reminders_sent, color: 'text-amber-600' },
            { label: 'Λήγουν σήμερα', value: result.due_today_sent, color: 'text-orange-600' },
            { label: 'Overdue', value: result.overdue_sent, color: 'text-red-600' },
            { label: 'Παρελήφθησαν (dedup)', value: result.skipped_duplicates, color: 'text-gray-500' },
            { label: 'Αποτυχίες', value: result.failed, color: 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [stats, setStats] = useState<NotifStats | null>(null)
  const [logs, setLogs] = useState<{ items: NotifLog[]; total: number; pages: number } | null>(null)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/notifications/stats').then(r => setStats(r.data))
  }, [])

  useEffect(() => {
    setLogsLoading(true)
    api.get('/admin/notifications/logs', {
      params: { page, limit: 50, notification_type: typeFilter || undefined }
    }).then(r => setLogs(r.data)).finally(() => setLogsLoading(false))
  }, [page, typeFilter])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Bell size={20} /> Push Notifications
      </h2>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm text-center col-span-2 sm:col-span-1">
            <p className="text-3xl font-bold text-teal-600">{stats.total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Σύνολο</p>
          </div>
          {stats.by_type.map(({ type, count }) => (
            <div key={type} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{count.toLocaleString()}</p>
              <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600'}`}>
                {TYPE_LABELS[type] ?? type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SendPushForm />
        <DueCheckTrigger />
      </div>

      {/* Logs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ιστορικό Ειδοποιήσεων</h3>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
          >
            <option value="">Όλοι τύποι</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs text-gray-500 uppercase tracking-wide">
                {['ID', 'User', 'Provider', 'Τύπος', 'Στάλθηκε'].map(h => (
                  <th key={h} className="px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {logsLoading ? (
                <tr><td colSpan={5} className="px-6 py-4"><TableSkeleton rows={5} cols={5} /></td></tr>
              ) : logs?.items.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-3 text-gray-400">#{l.id}</td>
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{l.user_email}</td>
                  <td className="px-6 py-3 font-medium">{l.provider}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[l.notification_type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[l.notification_type] ?? l.notification_type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 tabular-nums">{l.sent_at.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500">
            <span>{logs.total.toLocaleString()} εγγραφές</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 disabled:opacity-40"><ChevronLeft size={18} /></button>
              <span>{page} / {logs.pages}</span>
              <button disabled={page >= logs.pages} onClick={() => setPage(p => p + 1)} className="p-1 disabled:opacity-40"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
