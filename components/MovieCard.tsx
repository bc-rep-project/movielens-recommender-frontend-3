import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactStars from 'react-rating-stars-component'
import { createInteraction } from '../utils/api'
import { useUser } from '@supabase/auth-helpers-react'

type MovieCardProps = {
  movie: {
    id: string
    title: string
    genres: string[]
    poster_url?: string
    poster_path?: string
    created_at?: string
    updated_at?: string
  }
  showRating?: boolean
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, showRating = true }) => {
  const user = useUser()
  const [imageError, setImageError] = useState(false)
  
  // Default image URL for fallback
  const fallbackImageUrl = '/images/movie-placeholder.jpg'
  
  // Get poster URL - either direct poster_url from API or construct from poster_path
  const posterUrl = !imageError && (movie.poster_url || (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null))
  
  // Handle movie rating
  const handleRating = async (rating: number) => {
    if (!user) return

    try {
      await createInteraction(
        user.id,
        movie.id,
        'rate',
        rating
      )
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
        movie.id,
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <Link href={`/movies/${movie.id}`} onClick={handleView}>
          <div className="relative aspect-[2/3] h-64 overflow-hidden">
            <Image
              src={posterUrl || fallbackImageUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
              onError={handleImageError}
              priority={false}
            />
          </div>
        </Link>
      </div>
      <div className="p-4">
        <Link href={`/movies/${movie.id}`} onClick={handleView}>
          <h3 className="font-bold text-lg text-gray-900 hover:text-primary-600 truncate">{movie.title}</h3>
        </Link>
        <div className="mt-1">
          <div className="flex flex-wrap gap-1 mt-2">
            {movie.genres.map((genre, index) => (
              <span 
                key={index} 
                className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs font-semibold text-gray-600"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
        {showRating && user && (
          <div className="mt-4">
            <div className="text-sm text-gray-500 mb-1">Rate this movie:</div>
            <ReactStars
              count={5}
              onChange={handleRating}
              size={24}
              activeColor="#0ea5e9"
              isHalf={false}
            />
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Link 
            href={`/movies/${movie.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
            onClick={handleView}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}

export default MovieCard 