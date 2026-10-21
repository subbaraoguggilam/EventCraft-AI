import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import EventCard from '../../components/Events/EventCard'
import type { Event } from '../../types'

describe('EventCard Component', () => {
  const mockEvent: Event = {
    id: 'evt-101',
    title: 'Aarav & Diya Royal Wedding',
    event_type: 'wedding',
    date: '2026-12-10T10:00:00.000Z',
    venue: 'City Palace, Udaipur, Rajasthan',
    guest_count: 350,
    budget: 2500000,
    description: 'Grand Rajasthani destination wedding with Sangeet and Haldi ceremonies.',
    status: 'planning',
    ai_ideas: [],
    owner_id: 'user-1',
    created_at: '2026-10-21T00:00:00Z',
    updated_at: '2026-10-21T00:00:00Z',
  }

  it('renders event details, Indian currency format, and navigation link', () => {
    render(
      <BrowserRouter>
        <EventCard event={mockEvent} />
      </BrowserRouter>
    )

    expect(screen.getByText('Aarav & Diya Royal Wedding')).toBeInTheDocument()
    expect(screen.getByText('Wedding')).toBeInTheDocument()
    expect(screen.getByText('City Palace, Udaipur, Rajasthan')).toBeInTheDocument()
    expect(screen.getByText('350 guests')).toBeInTheDocument()
    expect(screen.getByText(/₹25,00,000/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open planner/i })).toHaveAttribute(
      'href',
      '/events/evt-101'
    )
  })
})
