import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Mail,
  Boxes,
  Settings,
  Bell,
  Terminal,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/bills', label: 'Bills', icon: FileText },
  { to: '/email-accounts', label: 'Email Accounts', icon: Mail },
  { to: '/providers', label: 'Providers', icon: Boxes },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/logs', label: 'Live Logs', icon: Terminal },
  { to: '/system', label: 'System', icon: Settings },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xl font-bold text-teal-600">BillMate Admin</span>
      </div>
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </div>
      <div className="px-3 pb-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative z-50 flex flex-col w-64 h-full bg-white dark:bg-gray-900 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setOpen(true)}>
            <Menu size={22} className="text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-lg font-bold text-teal-600">BillMate Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
