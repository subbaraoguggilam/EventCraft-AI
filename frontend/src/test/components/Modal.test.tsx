import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Modal from '../../components/Common/Modal'

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    )
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
  })

  it('renders title, description and accessible dialog attributes when open', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Event Budget Breakdown"
        description="Review all estimated and actual expenses"
      >
        <button>Submit</button>
      </Modal>
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description')

    expect(screen.getByText('Event Budget Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Review all estimated and actual expenses')).toBeInTheDocument()
  })

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Closeable Modal">
        <p>Inner Content</p>
      </Modal>
    )

    const closeBtn = screen.getByLabelText('Close dialog')
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('triggers onClose when Escape key is pressed', () => {
    const handleClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={handleClose} title="Escape Modal">
        <p>Inner Content</p>
      </Modal>
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
