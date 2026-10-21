import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Button from '../../components/Common/Button'

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles loading state with spinner and disabled attribute', () => {
    render(<Button isLoading>Submit</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
  })

  it('renders primary variant by default', () => {
    render(<Button>Primary</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-indigo-600')
  })
})
