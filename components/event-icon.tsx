"use client"

import { useState } from 'react'

interface EventIconProps {
  image?: string | null
  icon?: string | null
  title: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EventIcon({ image, icon, title, size = 'md', className = '' }: EventIconProps) {
  // Track loading/error states for image and icon separately
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [iconError, setIconError] = useState(false)
  const [iconLoaded, setIconLoaded] = useState(false)

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleIconError = () => {
    setIconError(true)
  }

  const handleIconLoad = () => {
    setIconLoaded(true)
  }

  const canShowImage = Boolean(image) && !imageError
  const canShowIcon = !canShowImage && Boolean(icon) && !iconError
  const isLoaded = (canShowImage && imageLoaded) || (canShowIcon && iconLoaded)
  const showFallback = !isLoaded

  return (
    <div className={`relative overflow-hidden rounded-lg ${sizeClasses[size]} ${className}`}>
      {canShowImage && (
        <img
          src={image as string}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover shadow-sm transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
      {!canShowImage && canShowIcon && (
        <img
          src={icon as string}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover shadow-sm transition-opacity duration-200 ${
            iconLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleIconError}
          onLoad={handleIconLoad}
        />
      )}
      <div
        className={`absolute inset-0 bg-muted flex items-center justify-center shadow-sm transition-opacity duration-200 ${
          showFallback ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!showFallback}
      >
        <span className={`${textSizeClasses[size]} font-medium text-muted-foreground`}>
          {title.charAt(0).toUpperCase()}
        </span>
      </div>
    </div>
  )
} 