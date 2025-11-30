'use client'

import { Star } from 'lucide-react'

interface StarRatingDisplayProps {
  rating: number // 0-5
  totalRatings?: number
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRatingDisplay({ 
  rating, 
  totalRatings, 
  showCount = true,
  size = 'md'
}: StarRatingDisplayProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      // Full star
      stars.push(
        <Star
          key={i}
          className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
        />
      )
    } else if (i === fullStars && hasHalfStar) {
      // Half star (using clip-path)
      stars.push(
        <div key={i} className="relative">
          <Star className={`${sizeClasses[size]} text-gray-300`} />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
          </div>
        </div>
      )
    } else {
      // Empty star
      stars.push(
        <Star
          key={i}
          className={`${sizeClasses[size]} text-gray-300`}
        />
      )
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars}
      </div>
      {showCount && totalRatings !== undefined && (
        <span className={`${textSizeClasses[size]} text-gray-600 ml-1`}>
          ({totalRatings})
        </span>
      )}
      {rating > 0 && (
        <span className={`${textSizeClasses[size]} text-gray-700 font-medium ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
