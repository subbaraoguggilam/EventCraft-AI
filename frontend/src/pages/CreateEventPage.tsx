import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, Calendar, MapPin, Users, DollarSign, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import type { EventType, CreateEventPayload } from '../types'
import { eventsApi, getErrorMessage } from '../services/api'
import Navbar from '../components/Layout/Navbar'
import Button from '../components/Common/Button'
import Input from '../components/Common/Input'

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form Fields
  const [eventType, setEventType] = useState<EventType>('wedding')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [budget, setBudget] = useState('')
  const [description, setDescription] = useState('')

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter an event title')
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const payload: CreateEventPayload = {
        title: title.trim(),
        event_type: eventType,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        venue: venue.trim(),
        guest_count: parseInt(guestCount, 10) || 50,
        budget: parseFloat(budget) || 5000,
        description: description.trim(),
      }

      const created = await eventsApi.create(payload)
      toast.success('Celebration created successfully!')

      // Optionally trigger initial idea generation
      try {
        await eventsApi.generateIdeas(created.id)
      } catch {
        // AI failure is non-blocking
      }

      navigate(`/events/${created.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10 w-full flex-1">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Wizard Header & Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                AI Planning Wizard
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-0.5">
                {step === 1 ? '1. Choose Event Type & Title' : '2. Key Details & Budget'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                  step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                1
              </span>
              <div className={`w-8 h-0.5 ${step === 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                  step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                2
              </span>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              {/* Event Type Archetype Cards */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Event Archetype
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'wedding' as EventType,
                      title: 'Wedding',
                      emoji: '💍',
                      desc: 'Ceremony, reception, rehearsals & floral',
                    },
                    {
                      id: 'birthday' as EventType,
                      title: 'Birthday',
                      emoji: '🎂',
                      desc: 'Milestone parties, custom cake & DJ entertainment',
                    },
                    {
                      id: 'community' as EventType,
                      title: 'Community',
                      emoji: '🏘️',
                      desc: 'Festivals, charity runs, street food fairs',
                    },
                  ].map((card) => {
                    const isSelected = eventType === card.id
                    return (
                      <button
                        type="button"
                        key={card.id}
                        onClick={() => setEventType(card.id)}
                        className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-3xl">{card.emoji}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{card.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{card.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Title Input */}
              <Input
                label="Celebration Title"
                placeholder={
                  eventType === 'wedding'
                    ? "e.g. Maya & Leo's Vineyard Wedding"
                    : eventType === 'birthday'
                    ? "e.g. Liam's 10th Superhero Birthday Bash"
                    : 'e.g. Annual Riverside Spring Community Gala'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button type="submit" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Continue to Details
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Target Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Venue Location"
                  placeholder="e.g. Sunset Garden Manor, Civic Park"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  leftIcon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Expected Guest Count"
                  type="number"
                  min="1"
                  placeholder="e.g. 75"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  leftIcon={<Users className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Total Budget ($ USD)"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 15000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  leftIcon={<DollarSign className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vision, Themes & Preferences (for AI Grounding)
                </label>
                <textarea
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="e.g. Bohemian rustic theme, pastel florals, vegan catering options, acoustic guitar live set..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Generate Plan with AI
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

export default CreateEventPage
