import { useState } from 'react'

interface EventIconProps {
  icon?: string | null
  title: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EventIcon({ icon, title, size = 'md', className = '' }: EventIconProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

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

  const showFallback = !icon || imageError || !imageLoaded

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {icon && !imageError && (
        <img 
          src={icon} 
          alt={title}
          className={`${sizeClasses[size]} rounded-lg object-cover shadow-sm transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
      <div className={`${sizeClasses[size]} bg-muted rounded-lg flex items-center justify-center shadow-sm ${
        showFallback ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-200`}>
        <span className={`${textSizeClasses[size]} font-medium text-muted-foreground`}>
          {title.charAt(0).toUpperCase()}
        </span>
      </div>
    </div>
  )
} 