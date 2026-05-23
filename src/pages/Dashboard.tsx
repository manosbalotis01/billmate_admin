import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, FileText, Mail, Calendar } from 'lucide-react'
import api from '../lib/api'
import { CardSkeleton } from '../components/Skeleton'

const STATUS_COLORS: Record<string, string> = {
  DUE: '#f59e0b',
  PAID: '#2A7A5E',
  CANCELLED: '#6b7280',
  EXPIRED: '#ef4444',
}

interface Stats {
  users_count: number
  bills_count: number
  email_accounts_count: number
  bills_this_month: number
  bills_by_status: { status: string; count: number }[]
  bills_by_provider: { provider_name: string; count: number }[]
  recent_bills: {
    id: number
    provider: string
    amount: number | null
    status: string
    due_date: string | null
    user_email: string
  }[]
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
        <Icon size={22} className="text-teal-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then((r) => { setStats(r.data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }
  if (!stats) return null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.users_count} icon={Users} />
        <StatCard label="Total Bills" value={stats.bills_count} icon={FileText} />
        <StatCard label="Active Email Accounts" value={stats.email_accounts_count} icon={Mail} />
        <StatCard label="Bills This Month" value={stats.bills_this_month} icon={Calendar} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Bills by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={stats.bills_by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {stats.bills_by_status.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Bills by Provider (Top 10)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.bills_by_provider} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="provider_name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2A7A5E" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent bills */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last 10 Bills</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.recent_bills.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-3 text-gray-500">#{b.id}</td>
                  <td className="px-6 py-3 font-medium">{b.provider}</td>
                  <td className="px-6 py-3">{b.amount != null ? `€${b.amount.toFixed(2)}` : '—'}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-6 py-3 text-gray-500">{b.due_date ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-500">{b.user_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DUE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    PAID: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
