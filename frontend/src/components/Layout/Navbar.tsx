import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, LogOut, Calendar, Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../Common/Button'

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 leading-tight">EventCraft AI</span>
              <span className="text-[10px] text-indigo-600 font-medium tracking-wider uppercase">
                Planner
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/events/new">
                  <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    New Event
                  </Button>
                </Link>
                <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />
                <div className="flex items-center gap-2 pl-1">
                  <span className="text-xs font-medium text-gray-700 hidden md:block">
                    {user.full_name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label="Log out"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Navbar
