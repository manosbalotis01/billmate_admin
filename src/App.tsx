import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './lib/toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UsersPage from './pages/Users'
import BillsPage from './pages/Bills'
import EmailAccountsPage from './pages/EmailAccounts'
import ProvidersPage from './pages/Providers'
import SystemPage from './pages/System'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/bills" element={<BillsPage />} />
                    <Route path="/email-accounts" element={<EmailAccountsPage />} />
                    <Route path="/providers" element={<ProvidersPage />} />
                    <Route path="/system" element={<SystemPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
