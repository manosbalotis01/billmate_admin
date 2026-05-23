import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../lib/toast'
import { TableSkeleton } from '../components/Skeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { StatusBadge } from './Dashboard'

interface BillItem {
  id: number
  provider: string
  amount: number | null
  status: string
  due_date: string | null
  issue_date: string | null
  invoice_number: string | null
  user_email: string
}

const STATUSES = ['', 'DUE', 'PAID', 'CANCELLED', 'EXPIRED']

export default function BillsPage() {
  const [status, setStatus] = useState('')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: BillItem[]; total: number; pages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    api.get('/admin/bills', {
      params: { status: status || undefined, invoice_number: invoiceSearch || undefined, page, limit: 20 },
    })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [status, invoiceSearch])
  useEffect(() => { load() }, [page, status, invoiceSearch])

  const changeStatus = async (id: number, newStatus: string) => {
    await api.patch(`/admin/bills/${id}/status`, { status: newStatus })
    toast('Status updated', 'success')
    load()
  }

  const deleteBill = async () => {
    if (!deleteId) return
    await api.delete(`/admin/bills/${deleteId}`)
    toast('Bill deleted', 'success')
    setDeleteId(null)
    load()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bills</h2>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <input
          value={invoiceSearch}
          onChange={(e) => setInvoiceSearch(e.target.value)}
          placeholder="Invoice number..."
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs text-gray-500 uppercase tracking-wide">
                {['ID', 'Provider', 'Amount', 'Status', 'Due Date', 'Issue Date', 'User', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-4"><TableSkeleton rows={5} cols={8} /></td></tr>
              ) : data?.items.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-3 text-gray-400">#{b.id}</td>
                  <td className="px-6 py-3 font-medium">{b.provider}</td>
                  <td className="px-6 py-3">{b.amount != null ? `€${b.amount.toFixed(2)}` : '—'}</td>
                  <td className="px-6 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-3 text-gray-500">{b.due_date ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-500">{b.issue_date ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-500 truncate max-w-[150px]">{b.user_email}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={b.status}
                        onChange={(e) => changeStatus(b.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800"
                      >
                        {['DUE', 'PAID', 'CANCELLED', 'EXPIRED'].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                        onClick={() => setDeleteId(b.id)}
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
            <span>{data.total} bills</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 disabled:opacity-40">
                <ChevronLeft size={18} />
              </button>
              <span>Page {page} of {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="p-1 disabled:opacity-40">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Delete Bill"
          message={`Are you sure you want to delete bill #${deleteId}? This action cannot be undone.`}
          onConfirm={deleteBill}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
