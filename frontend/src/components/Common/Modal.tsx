import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Save previously focused element to restore on close
    previousActiveElement.current = document.activeElement as HTMLElement

    // Auto-focus first focusable element in the modal
    const focusableElementsSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    
    const timeoutId = setTimeout(() => {
      if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(focusableElementsSelector)
        if (focusables.length > 0) {
          focusables[0].focus()
        }
      }
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(focusableElementsSelector)
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)

        if (focusables.length === 0) {
          e.preventDefault()
          return
        }

        const firstElement = focusables[0]
        const lastElement = focusables[focusables.length - 1]

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timeoutId)
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
      // Restore focus
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className={`w-full ${maxWidthStyles[maxWidth]} bg-white rounded-xl shadow-xl overflow-hidden transform transition-all animate-scaleUp`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-xs text-gray-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal
