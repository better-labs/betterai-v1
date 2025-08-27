"use client"

import Image from 'next/image'
import { useState } from 'react'

interface EventIconProps {
  image?: string | null
  icon?: string | null
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'twoxl' 
  className?: string
}

export function EventIcon({ image, icon, title, size = 'md', className = '' }: EventIconProps) {
  // Track error to show fallback when remote image fails
  const [loadError, setLoadError] = useState(false)

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
    twoxl: 'w-16 h-16'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
    twoxl: 'text-lg'
  }

  const srcCandidate = loadError ? null : (image || icon || null)
  const showFallback = !srcCandidate

  return (
    <div className={`relative overflow-hidden rounded-lg ${sizeClasses[size]} ${className}`}>
      {srcCandidate && (
        <Image
          src={srcCandidate}
          alt={title}
          fill
          sizes={size === 'lg' ? '40px' : size === 'md' ? '32px' : '24px'}
          className="object-cover shadow-sm"
          onError={() => setLoadError(true)}
        />
      )}
      {(showFallback || loadError) && (
        <div className={`absolute inset-0 bg-muted flex items-center justify-center shadow-sm`}>
          <span className={`${textSizeClasses[size]} font-medium text-muted-foreground`}>
            {title.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
} 