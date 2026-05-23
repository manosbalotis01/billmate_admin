import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Check, X, Pencil } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../lib/toast'

interface Provider {
  id: number
  code: string
  name: string
  category: string
  aliases: string[]
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    api.get('/admin/providers').then((r) => setProviders(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const startEdit = (p: Provider) => {
    setEditing(p.id)
    setEditName(p.name)
    setEditCategory(p.category)
  }

  const saveEdit = async (id: number) => {
    await api.patch(`/admin/providers/${id}`, { name: editName, category: editCategory })
    toast('Provider updated', 'success')
    setEditing(null)
    load()
  }

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Providers</h2>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 w-8"></th>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          {providers.map((p) => (
              <tbody key={p.id} className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="text-gray-400 hover:text-gray-600">
                      {expanded === p.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{p.code}</td>
                  <td className="px-6 py-3">
                    {editing === p.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border border-teal-500 rounded px-2 py-1 text-sm w-full focus:outline-none"
                      />
                    ) : (
                      <span className="font-medium">{p.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {editing === p.id ? (
                      <input
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="border border-teal-500 rounded px-2 py-1 text-sm w-32 focus:outline-none"
                      />
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">{p.category}</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {editing === p.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(p.id)} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded"><Check size={14} /></button>
                        <button onClick={() => setEditing(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(p)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded">
                        <Pencil size={14} />
                      </button>
                    )}
                  </td>
                </tr>
                {expanded === p.id && (
                  <tr className="bg-gray-50 dark:bg-gray-800/20">
                    <td colSpan={5} className="px-10 py-3">
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Aliases</p>
                      {p.aliases.length === 0 ? (
                        <p className="text-sm text-gray-400">No aliases</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.aliases.map((a) => (
                            <span key={a} className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs">{a}</span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
        </table>
      </div>
    </div>
  )
}
