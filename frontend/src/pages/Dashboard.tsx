import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, DollarSign, Sparkles, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Event } from '../types'
import { eventsApi, getErrorMessage } from '../services/api'
import { formatINR } from '../utils/currency'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Layout/Navbar'
import EventCard from '../components/Events/EventCard'
import Button from '../components/Common/Button'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import EmptyState from '../components/Common/EmptyState'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const data = await eventsApi.list()
      setEvents(data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true
    return e.event_type === filterType
  })

  const totalBudgetPlanned = events.reduce((sum, e) => sum + (e.budget || (e as any).total_budget || 0), 0)
  const totalGuests = events.reduce((sum, e) => sum + (e.guest_count || 0), 0)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Planner'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Here is an overview of your active event plans and budgets.
            </p>
          </div>

          <Link to="/events/new">
            <Button size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Create New Event
            </Button>
          </Link>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Total Events
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{events.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Total Budget (₹)
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {formatINR(totalBudgetPlanned)}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Total Expected Guests
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {totalGuests.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-700">Filter Archetype:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Celebrations' },
              { id: 'wedding', label: '💍 Shaadi / Weddings' },
              { id: 'birthday', label: '🎂 Janmadin / Birthdays' },
              { id: 'community', label: '🏘️ Utsavs / Melas' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filterType === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" label="Loading celebrations..." />
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-10 h-10 text-gray-300" />}
            title="No events found"
            description={
              filterType === 'all'
                ? "You haven't planned any celebrations yet. Create your first event to get started with GenAI recommendations!"
                : `No events in the "${filterType}" category.`
            }
            actionLabel="Create Celebration"
            onAction={() => (window.location.href = '/events/new')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
