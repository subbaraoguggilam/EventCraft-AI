import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Calendar, DollarSign, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react'
import Navbar from '../components/Layout/Navbar'
import Button from '../components/Common/Button'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/70 via-rose-50/40 to-slate-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prompt Wars Challenge 5 — Celebration & Event Planner</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
              Plan unforgettable celebrations with{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 bg-clip-text text-transparent">
                GenAI Intelligence
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              EventCraft AI orchestrates your weddings, birthday milestones, and vibrant community
              gatherings. Seamlessly auto-allocate budgets, build schedules, curate vendor
              checklists, and brainstorm creative themes.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Planning Free
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Verticals Showcase */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Tailored Event Archetypes
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
              Engineered for Every Milestone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Wedding */}
            <div className="p-8 rounded-2xl border border-gray-100 bg-gradient-to-b from-indigo-50/30 to-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mb-5">
                💍
              </div>
              <h3 className="text-lg font-bold text-gray-900">Weddings</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Rehearsal dinners, ceremony schedules, floral arrangements, seating charts, and
                harmonious vendor choreography.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Catering & venue breakdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Countdown milestone reminders</span>
                </li>
              </ul>
            </div>

            {/* Birthday */}
            <div className="p-8 rounded-2xl border border-gray-100 bg-gradient-to-b from-rose-50/30 to-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mb-5">
                🎂
              </div>
              <h3 className="text-lg font-bold text-gray-900">Birthdays & Anniversaries</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Personalized party themes, entertainment coordination, playlists, custom cake
                designs, and guest favor ideas.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Unique theme ideation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Activity & games schedule</span>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div className="p-8 rounded-2xl border border-gray-100 bg-gradient-to-b from-emerald-50/30 to-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-5">
                🏘️
              </div>
              <h3 className="text-lg font-bold text-gray-900">Community Festivals</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Neighborhood street fairs, non-profit fundraisers, local sport days, food truck
                rallies, and volunteer management.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Multi-vendor quote tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Permits & logistics tasks</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Powerful Features
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
              Everything Needed for Seamless Execution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">AI Ideas Engine</h4>
              <p className="text-xs text-gray-500 mt-1">
                Gemini generates bespoke themes, decor concepts, culinary menus, and games tailored to
                your vibe and guest count.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Smart Budget Allocation</h4>
              <p className="text-xs text-gray-500 mt-1">
                Visual category charts, payment status flags, and automatic category allocations
                prevent cost overruns.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Milestone Timelines</h4>
              <p className="text-xs text-gray-500 mt-1">
                Step-by-step schedules with priorities and deadlines leading up to the celebration day.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Context-Aware AI Chat</h4>
              <p className="text-xs text-gray-500 mt-1">
                Chat assistant grounded in your exact budget, venue, guest count, and timeline
                milestones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-500">
            EventCraft AI — Built for Prompt Wars Challenge 5: Celebration & Event Planner.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
