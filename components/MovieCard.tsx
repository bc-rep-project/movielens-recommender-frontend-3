import React from 'react'
import Link from 'next/link'
import ReactStars from 'react-rating-stars-component'
import { createInteraction } from '../utils/api'
import { useUser } from '@supabase/auth-helpers-react'

type MovieCardProps = {
  movie: {
    _id: string
    title: string
    genres: string[]
    created_at: string
    updated_at: string
  }
  showRating?: boolean
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, showRating = true }) => {
  const user = useUser()

  // Handle movie rating
  const handleRating = async (rating: number) => {
    if (!user) return

    try {
      await createInteraction(
        user.id,
        movie._id,
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
        movie._id,
        'view'
      )
    } catch (error) {
      console.error('Error logging movie view:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-4">
        <Link href={`/movies/${movie._id}`} onClick={handleView}>
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
            href={`/movies/${movie._id}`}
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