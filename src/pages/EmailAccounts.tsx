import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Trash2, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../lib/toast'
import { TableSkeleton } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface AccountItem {
  id: number
  user_email: string
  email_address: string
  provider: string
  status: string
  last_sync_at: string | null
  sync_error: string | null
}

const PROVIDERS = ['', 'GMAIL', 'OUTLOOK', 'IMAP', 'GOOGLE']

export default function EmailAccountsPage() {
  const [provider, setProvider] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: AccountItem[]; total: number; pages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [syncing, setSyncing] = useState<number | null>(null)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    api.get('/admin/email-accounts', { params: { provider: provider || undefined, page, limit: 20 } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [provider])
  useEffect(() => { load() }, [page, provider])

  const triggerSync = async (id: number) => {
    setSyncing(id)
    try {
      await api.post(`/admin/email-accounts/${id}/sync`)
      toast('Sync queued', 'success')
    } catch {
      toast('Sync failed', 'error')
    } finally {
      setSyncing(null)
    }
  }

  const deleteAccount = async () => {
    if (!deleteId) return
    await api.delete(`/admin/email-accounts/${deleteId}`)
    toast('Account deleted', 'success')
    setDeleteId(null)
    load()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Email Accounts</h2>

      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
      >
        {PROVIDERS.map((p) => <option key={p} value={p}>{p || 'All Providers'}</option>)}
      </select>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs text-gray-500 uppercase tracking-wide">
                {['ID', 'User', 'Email', 'Provider', 'Status', 'Last Sync', 'Error', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-4"><TableSkeleton rows={5} cols={8} /></td></tr>
              ) : data?.items.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-3 text-gray-400">#{a.id}</td>
                  <td className="px-6 py-3 text-gray-500 truncate max-w-[120px]">{a.user_email}</td>
                  <td className="px-6 py-3 font-medium">{a.email_address}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                      {a.provider}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'ACTIVE' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-gray-100 text-gray-600'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400">{a.last_sync_at?.slice(0, 16) ?? '—'}</td>
                  <td className="px-6 py-3">
                    {a.sync_error ? (
                      <div className="group relative inline-block">
                        <AlertCircle size={16} className="text-red-500 cursor-help" />
                        <div className="hidden group-hover:block absolute z-10 bg-red-900 text-white text-xs rounded p-2 w-56 left-0 top-full mt-1 shadow-lg">
                          {a.sync_error}
                        </div>
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => triggerSync(a.id)}
                        disabled={syncing === a.id}
                        className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded disabled:opacity-40"
                        title="Trigger sync"
                      >
                        <RefreshCw size={14} className={syncing === a.id ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => setDeleteId(a.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500">
            <span>{data.total} accounts</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 disabled:opacity-40"><ChevronLeft size={18} /></button>
              <span>Page {page} of {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="p-1 disabled:opacity-40"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Delete Email Account"
          message={`Delete email account #${deleteId}? This cannot be undone.`}
          onConfirm={deleteAccount}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
