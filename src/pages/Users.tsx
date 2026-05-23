import { useEffect, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../lib/toast'
import { TableSkeleton } from '../components/Skeleton'

interface UserItem {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  is_active: boolean
  is_admin: boolean
  created_at: string
}

interface UserDetail {
  user: UserItem
  email_accounts: {
    id: number
    email_address: string
    provider: string
    status: string
    last_sync_at: string | null
    sync_error: string | null
  }[]
  bills: {
    id: number
    provider: string
    amount: number | null
    status: string
    due_date: string | null
  }[]
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: UserItem[]; total: number; pages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<UserDetail | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    api.get('/admin/users', { params: { search, page, limit: 20 } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [search])
  useEffect(() => { load() }, [page, search])

  const openUser = async (id: number) => {
    setModalLoading(true)
    const r = await api.get(`/admin/users/${id}`)
    setSelected(r.data)
    setModalLoading(false)
  }

  const toggleActive = async (u: UserItem) => {
    await api.patch(`/admin/users/${u.id}`, { is_active: !u.is_active })
    toast(`User ${u.is_active ? 'deactivated' : 'activated'}`, 'success')
    load()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Users</h2>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs text-gray-500 uppercase tracking-wide">
                {['ID', 'Email', 'Name', 'Created', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4"><TableSkeleton rows={5} cols={6} /></td></tr>
              ) : data?.items.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
                  onClick={() => openUser(u.id)}
                >
                  <td className="px-6 py-3 text-gray-500">#{u.id}</td>
                  <td className="px-6 py-3 font-medium">{u.email}</td>
                  <td className="px-6 py-3 text-gray-500">{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-6 py-3 text-gray-500">{u.created_at.slice(0, 10)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleActive(u)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20' : 'bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/20'}`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500">
            <span>{data.total} users</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 disabled:opacity-40 hover:text-gray-700">
                <ChevronLeft size={18} />
              </button>
              <span>Page {page} of {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="p-1 disabled:opacity-40 hover:text-gray-700">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User detail modal */}
      {(modalLoading || selected) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-semibold">{selected?.user.email ?? 'Loading...'}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {selected && (
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Email Accounts</h4>
                  {selected.email_accounts.length === 0 ? (
                    <p className="text-sm text-gray-400">No email accounts</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-xs text-gray-400 uppercase">
                        <th className="pb-2">Email</th><th className="pb-2">Provider</th><th className="pb-2">Status</th><th className="pb-2">Last Sync</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {selected.email_accounts.map((a) => (
                          <tr key={a.id}>
                            <td className="py-2">{a.email_address}</td>
                            <td className="py-2 text-gray-500">{a.provider}</td>
                            <td className="py-2 text-gray-500">{a.status}</td>
                            <td className="py-2 text-gray-400">{a.last_sync_at?.slice(0, 16) ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2">Bills</h4>
                  {selected.bills.length === 0 ? (
                    <p className="text-sm text-gray-400">No bills</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-xs text-gray-400 uppercase">
                        <th className="pb-2">ID</th><th className="pb-2">Provider</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Due</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {selected.bills.map((b) => (
                          <tr key={b.id}>
                            <td className="py-2 text-gray-400">#{b.id}</td>
                            <td className="py-2 font-medium">{b.provider}</td>
                            <td className="py-2">{b.amount != null ? `€${b.amount.toFixed(2)}` : '—'}</td>
                            <td className="py-2">{b.status}</td>
                            <td className="py-2 text-gray-400">{b.due_date ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
