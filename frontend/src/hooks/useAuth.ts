import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

/**
 * Custom hook to access authentication state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
