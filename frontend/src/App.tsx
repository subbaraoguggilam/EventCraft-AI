import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/Layout/ProtectedRoute'
import ErrorBoundary from './components/Common/ErrorBoundary'
import LoadingSpinner from './components/Common/LoadingSpinner'

// Lazy-loaded route chunks for optimal performance and minimal initial bundle size
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))

const PageLoader: React.FC = () => (
  <div
    className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-rose-50"
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner size="lg" label="Loading application content" />
      <p className="text-gray-500 text-sm font-medium">Loading EventCraft AI…</p>
    </div>
  </div>
)

export default function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <CreateEventPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
