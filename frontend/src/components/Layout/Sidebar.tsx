import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, DollarSign, Clock, Users, MessageSquare, ArrowLeft } from 'lucide-react'

export interface SidebarProps {
  eventId: string
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ eventId, activeTab = 'overview', onTabChange }) => {
  const location = useLocation()
  const isChatRoute = location.pathname.endsWith('/chat')

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget Planner', icon: DollarSign },
    { id: 'timeline', label: 'Timeline & Tasks', icon: Clock },
    { id: 'vendors', label: 'Vendor Checklist', icon: Users },
  ]

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex flex-col p-4 shrink-0">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Events</span>
      </Link>

      <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-2 px-3">
        Event Management
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = !isChatRoute && activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => onTabChange && onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          )
        })}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-2 px-3">
            AI Assistant
          </div>
          <Link
            to={`/events/${eventId}/chat`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isChatRoute
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MessageSquare
              className={`w-4 h-4 ${isChatRoute ? 'text-indigo-600' : 'text-gray-400'}`}
            />
            <span>Chat Assistant</span>
          </Link>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
