import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Sparkles,
  Trash2,
  Share2,
  Lightbulb,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Event, BudgetItem, TimelineItem, VendorItem } from '../types'
import { eventsApi, budgetApi, timelineApi, vendorsApi, getErrorMessage } from '../services/api'
import { formatINR } from '../utils/currency'
import Navbar from '../components/Layout/Navbar'
import Sidebar from '../components/Layout/Sidebar'
import BudgetTab from '../components/Budget/BudgetTab'
import TimelineTab from '../components/Timeline/TimelineTab'
import VendorsTab from '../components/Vendors/VendorsTab'
import Button from '../components/Common/Button'
import Badge from '../components/Common/Badge'
import LoadingSpinner from '../components/Common/LoadingSpinner'
import ConfirmDialog from '../components/Common/ConfirmDialog'

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<string>('overview')
  const [event, setEvent] = useState<Event | null>(null)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [vendorItems, setVendorItems] = useState<VendorItem[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false)
  const [ideas, setIdeas] = useState<string[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchEventData = async () => {
    if (!id) return
    try {
      setIsLoading(true)
      const ev = await eventsApi.get(id)
      setEvent(ev)

      // Fetch related items in parallel
      const [b, t, v] = await Promise.all([
        budgetApi.list(id).catch(() => []),
        timelineApi.list(id).catch(() => []),
        vendorsApi.list(id).catch(() => []),
      ])
      setBudgetItems(b)
      setTimelineItems(t)
      setVendorItems(v)

      // Load initial ideas
      if (ev.ai_ideas && ev.ai_ideas.length > 0) {
        setIdeas(ev.ai_ideas)
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEventData()
  }, [id])

  const handleGenerateIdeas = async () => {
    if (!id) return
    try {
      setIsGeneratingIdeas(true)
      const res = await eventsApi.generateIdeas(id)
      setIdeas(res)
      toast.success('Generated creative event ideas!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsGeneratingIdeas(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!id) return
    try {
      setIsDeleting(true)
      await eventsApi.delete(id)
      toast.success('Celebration deleted')
      navigate('/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" label="Loading planner..." />
        </div>
      </div>
    )
  }

  if (!event || !id) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">Celebration not found</h2>
            <Button className="mt-4" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date not finalized'

  const typeEmojis: Record<string, string> = {
    wedding: '💍',
    birthday: '🎂',
    community: '🏘️',
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar eventId={id} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{typeEmojis[event.event_type] || '🎉'}</span>
                  <Badge variant="primary">
                    {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                  </Badge>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-emerald-600 font-medium">Active Planning</span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900">{event.title}</h1>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Share2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    toast.success('Planner link copied to clipboard!')
                  }}
                >
                  Share
                </Button>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete event"
                  aria-label="Delete celebration"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Metadata Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">{event.venue || 'Venue TBD'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{event.guest_count ? `${event.guest_count} guests` : 'TBD'}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold text-gray-900">
                  {formatINR(event.budget || (event as any).total_budget)} Target Budget
                </span>
              </div>
            </div>
          </div>

          {/* Tab Body */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Vision / Notes */}
              {event.description && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Celebration Vision</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{event.description}</p>
                </div>
              )}

              {/* AI Creative Ideas Card */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">AI Ideas & Personalization</h3>
                      <p className="text-[11px] text-gray-500">
                        Themes, food pairings, decor concepts, and activities generated for this event.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateIdeas}
                    isLoading={isGeneratingIdeas}
                    leftIcon={<Lightbulb className="w-3.5 h-3.5 text-amber-500" />}
                  >
                    Brainstorm More
                  </Button>
                </div>

                {ideas.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-gray-500 mb-3">
                      Generate tailored creative ideas based on your budget and guest count.
                    </p>
                    <Button size="sm" onClick={handleGenerateIdeas} isLoading={isGeneratingIdeas}>
                      Generate Ideas with Gemini
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {ideas.map((idea, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white/90 rounded-xl border border-indigo-100/60 shadow-xs flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-gray-700 leading-snug">{idea}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Planning Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('budget')}
                  className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-indigo-200 text-left transition-all group"
                >
                  <DollarSign className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-gray-900">Budget Tracker</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {budgetItems.length} expenses recorded
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('timeline')}
                  className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-indigo-200 text-left transition-all group"
                >
                  <Calendar className="w-5 h-5 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-gray-900">Timeline & Tasks</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {timelineItems.length} milestone deadlines
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('vendors')}
                  className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-indigo-200 text-left transition-all group"
                >
                  <Users className="w-5 h-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-gray-900">Vendor Checklist</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {vendorItems.length} service providers
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <BudgetTab
              eventId={id}
              totalBudget={event.budget || (event as any).total_budget}
              items={budgetItems}
              onRefresh={fetchEventData}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineTab eventId={id} items={timelineItems} onRefresh={fetchEventData} />
          )}

          {activeTab === 'vendors' && (
            <VendorsTab eventId={id} items={vendorItems} onRefresh={fetchEventData} />
          )}
        </main>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteEvent}
        title="Delete Celebration"
        message="Are you sure you want to permanently delete this event plan? All budgets, milestones, and notes will be removed."
        confirmLabel="Delete Forever"
        isDangerous
        isLoading={isDeleting}
      />
    </div>
  )
}

export default EventDetailPage
