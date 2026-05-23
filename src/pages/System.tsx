import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, RefreshCw, Database, Server, Cpu } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../lib/toast'

interface SystemStatus {
  db_ok: boolean
  redis_ok: boolean
  worker_ok: boolean
}

function StatusCard({ label, ok, icon: Icon }: { label: string; ok: boolean; icon: React.ElementType }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm flex items-center gap-4">
      <Icon size={22} className="text-gray-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      </div>
      {ok ? (
        <CheckCircle size={22} className="text-teal-600" />
      ) : (
        <XCircle size={22} className="text-red-500" />
      )}
    </div>
  )
}

export default function SystemPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const { toast } = useToast()

  const loadStatus = () => {
    setLoading(true)
    api.get('/admin/system').then((r) => setStatus(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadStatus() }, [])

  const syncAll = async () => {
    setSyncing(true)
    try {
      await api.post('/admin/sync/all')
      toast('Sync all accounts queued', 'success')
    } catch {
      toast('Failed to queue sync', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const seedProviders = async () => {
    setSeeding(true)
    try {
      await api.post('/admin/seed-providers')
      toast('Providers seeded successfully', 'success')
    } catch {
      toast('Seed failed', 'error')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">System</h2>
        <button onClick={loadStatus} className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-gray-900 rounded-xl animate-pulse shadow-sm" />
          ))
        ) : status ? (
          <>
            <StatusCard label="Database" ok={status.db_ok} icon={Database} />
            <StatusCard label="Redis" ok={status.redis_ok} icon={Server} />
            <StatusCard label="Worker" ok={status.worker_ok} icon={Cpu} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sync All Accounts</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Queues a sync job for all active email accounts (GMAIL + OUTLOOK).
          </p>
          <button
            onClick={syncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-60"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Queuing...' : 'Sync All Accounts'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Seed Providers</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Inserts or updates default providers from the seed list.
          </p>
          <button
            onClick={seedProviders}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 dark:bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-60"
          >
            <Database size={16} />
            {seeding ? 'Seeding...' : 'Seed Providers'}
          </button>
        </div>
      </div>
    </div>
  )
}
