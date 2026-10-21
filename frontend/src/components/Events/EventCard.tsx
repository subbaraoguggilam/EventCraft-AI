import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, DollarSign, ArrowRight } from 'lucide-react'
import type { Event } from '../../types'
import Badge from '../Common/Badge'

export interface EventCardProps {
  event: Event
  onDelete?: (id: string) => void
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const typeIcons: Record<string, string> = {
    wedding: '💍',
    birthday: '🎂',
    community: '🏘️',
  }

  const typeVariants: Record<string, 'primary' | 'success' | 'warning'> = {
    wedding: 'primary',
    birthday: 'warning',
    community: 'success',
  }

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date TBD'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label={event.event_type}>
              {typeIcons[event.event_type] || '🎉'}
            </span>
            <Badge variant={typeVariants[event.event_type] || 'primary'}>
              {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
            </Badge>
          </div>
        </div>

        <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{event.venue || 'Venue TBD'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{event.guest_count ? `${event.guest_count} guests` : 'Guests TBD'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{event.budget ? `$${event.budget.toLocaleString()}` : 'Budget TBD'}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <Link
          to={`/events/${event.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <span>Open Planner</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          to={`/events/${event.id}/chat`}
          className="text-xs text-gray-400 hover:text-indigo-600 font-medium"
        >
          AI Chat →
        </Link>
      </div>
    </div>
  )
}

export default EventCard
