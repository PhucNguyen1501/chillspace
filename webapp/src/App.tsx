import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/auth/LoginForm'
import SignupForm from '@/components/auth/SignupForm'
import Dashboard from '@/pages/Dashboard'
import Connections from '@/pages/Connections'
import ConnectionForm from '@/pages/ConnectionForm'
import Endpoints from '@/pages/Endpoints'
import QueryBuilder from '@/pages/QueryBuilder'
import Spinner from '@/components/ui/Spinner'
import { Analytics } from '@vercel/analytics/react'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Public Route wrapper (redirects to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginForm />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <SignupForm />
        </PublicRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* API Connections */}
      <Route path="/connections" element={
        <ProtectedRoute>
          <Connections />
        </ProtectedRoute>
      } />
      <Route path="/connections/new" element={
        <ProtectedRoute>
          <ConnectionForm />
        </ProtectedRoute>
      } />
      <Route path="/connections/:id/edit" element={
        <ProtectedRoute>
          <ConnectionForm />
        </ProtectedRoute>
      } />
      <Route path="/connections/:connectionId/endpoints" element={
        <ProtectedRoute>
          <Endpoints />
        </ProtectedRoute>
      } />
      <Route path="/connections/:connectionId/query" element={
        <ProtectedRoute>
          <QueryBuilder />
        </ProtectedRoute>
      } />
      
      {/* Redirect root to dashboard or login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Analytics />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
