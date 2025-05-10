import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactStars from 'react-rating-stars-component'
import { FaPlay, FaPlus, FaStar, FaChevronDown, FaInfo } from 'react-icons/fa'
import { createInteraction } from '../utils/api'
import { useUser } from '@supabase/auth-helpers-react'
import MoviePlaceholder from './MoviePlaceholder'
import { Movie } from '../types/common'

interface MovieCardProps {
  movie: Movie;
  hideOverlay?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const MovieCard: React.FC<MovieCardProps> = ({ 
  movie, 
  hideOverlay = false,
  size = 'medium' 
}) => {
  const user = useUser()
  const [isHovered, setIsHovered] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [rated, setRated] = useState(false)
  
  const { id, title, genres, poster_url, poster_path, year } = movie
  
  // Determine the image source, with fallback
  const posterUrl = poster_url || (poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : null)
  
  // Size classes - adjusted for better mobile experience
  const sizeClasses = {
    small: 'w-28 h-40 sm:w-32 sm:h-48',
    medium: 'w-36 h-52 sm:w-40 sm:h-60',
    large: 'w-40 h-60 sm:w-48 sm:h-72'
  }
  
  // Handle movie rating
  const handleRating = async (rating: number) => {
    if (!user) return

    try {
      await createInteraction(
        user.id,
        id,
        'rate',
        rating
      )
      setRated(true)
    } catch (error) {
      console.error('Error rating movie:', error)
    }
  }

  // Handle movie view
  const handleView = async () => {
    if (!user) return

    try {
      await createInteraction(
        user.id,
        id,
        'view'
      )
    } catch (error) {
      console.error('Error logging movie view:', error)
    }
  }
  
  // Handle image loading error
  const handleImageError = () => {
    setImageError(true)
  }

  // Touch event handlers for mobile
  const handleTouchStart = () => {
    setIsTouched(true)
  }

  const handleTouchEnd = () => {
    // Delay turning off touch state slightly for better feedback
    setTimeout(() => setIsTouched(false), 200)
  }

  // Combine hover and touch states
  const isActive = isHovered || isTouched

  return (
    <div 
      className={`relative group ${sizeClasses[size]} transition-all duration-300 rounded-sm overflow-hidden shadow-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Movie poster or placeholder */}
      <Link href={`/movies/${id}`} onClick={handleView}>
        <div className="w-full h-full bg-background-elevated relative">
          {posterUrl && !imageError ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              className={`object-cover ${isActive ? 'brightness-75' : ''} transition-all`}
              sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, 200px"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <MoviePlaceholder title={title} />
          )}
          
          {/* Overlay gradient on hover/touch */}
          {!hideOverlay && (
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent 
                ${isActive ? 'opacity-100' : 'opacity-0'} 
                transition-opacity duration-300`}
            />
          )}
          
          {/* Title and info on hover/touch */}
          {!hideOverlay && (
            <div 
              className={`absolute bottom-0 left-0 right-0 p-2 text-white
                ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} 
                transition-all duration-300`}
            >
              <h3 className="text-sm font-medium line-clamp-1">{title}</h3>
              
              {/* Year and first genre if available */}
              <div className="flex items-center text-xs text-text-secondary mt-1">
                {year && <span className="mr-2">{year}</span>}
                {genres && genres.length > 0 && <span>{genres[0]}</span>}
              </div>
            </div>
          )}
          
          {/* Action buttons on hover/touch - simplified for mobile */}
          {!hideOverlay && isActive && (
            <div className="absolute top-2 right-2">
              <button 
                aria-label="More Info"
                className="bg-background/80 text-white p-2 rounded-full hover:bg-background transition touch-manipulation"
              >
                <FaInfo size={14} />
              </button>
            </div>
          )}
          
          {/* Play button on hover/touch - larger target for mobile */}
          {!hideOverlay && isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Link 
                href={`/movies/${id}`}
                className="p-3 sm:p-2 bg-white bg-opacity-30 rounded-full hover:bg-opacity-40 transition touch-manipulation"
                onClick={handleView}
              >
                <FaPlay className="text-white" size={16} />
              </Link>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}

export default MovieCard 