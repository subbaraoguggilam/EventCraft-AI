import React from 'react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label = 'Loading...',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} role="status">
      <div
        className={`${sizeMap[size]} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}
      />
      {label && <span className="sr-only">{label}</span>}
    </div>
  )
}

export default LoadingSpinner
