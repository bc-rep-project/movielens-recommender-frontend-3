import { useRouter } from 'next/router'
import React, { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import Layout from '../../components/Layout'
import { getMovie, getSimilarMovies, createInteraction } from '../../utils/api'
import Image from 'next/image'
import ReactStars from 'react-rating-stars-component'
import { Movie } from '../../types'
import MovieCard from '../../components/MovieCard'
import { FaPlay, FaHeart, FaRegHeart, FaPlus, FaCheck } from 'react-icons/fa'
import { useUser } from '@supabase/auth-helpers-react'
import VideoPlayer from '../../components/VideoPlayer'

// Helper function to validate MongoDB ObjectId format
const isValidObjectId = (id: string | undefined): boolean => {
  return id ? /^[0-9a-fA-F]{24}$/.test(id) : false
}

const MovieDetailsPage = () => {
  const router = useRouter()
  const { movie_id } = router.query // Updated to use movie_id instead of id
  const user = useUser()
  
  const [showVideo, setShowVideo] = useState(false)
  const [favorite, setFavorite] = useState(false)
  const [watchlist, setWatchlist] = useState(false)
  const [rated, setRated] = useState(false)
  const [posterLoaded, setPosterLoaded] = useState(false)
  const [backdropLoaded, setBackdropLoaded] = useState(false)

  // Validate movie_id before fetching
  const validMovieId = typeof movie_id === 'string' && isValidObjectId(movie_id) ? movie_id : null
  
  // Log the movie ID being used
  useEffect(() => {
    if (movie_id) {
      console.log(`Movie details page for ID: ${movie_id}, Valid: ${Boolean(validMovieId)}`)
    }
  }, [movie_id, validMovieId])

  // Fetch movie details
  const { 
    data: movie, 
    error: movieError,
    isLoading: movieLoading,
    mutate: refreshMovie
  } = useSWR(
    validMovieId ? [`/api/movies/${validMovieId}`, 'movie'] : null,
    validMovieId ? () => getMovie(validMovieId) : null
  )

  // Fetch similar movies if the main movie loads
  const {
    data: similarMovies,
    error: similarError,
    isLoading: similarLoading
  } = useSWR(
    movie && validMovieId ? [`/api/movies/${validMovieId}/similar`, 'similar'] : null,
    movie && validMovieId ? () => getSimilarMovies(validMovieId) : null
  )

  // Log view interaction when movie loads
  useEffect(() => {
    const logView = async () => {
      if (user && movie && validMovieId) {
        try {
          console.log(`Logging view for movie: ${validMovieId}`)
          await createInteraction(
            user.id,
            validMovieId,
            'view'
          )
          console.log('View interaction logged successfully')
        } catch (error) {
          console.error('Error logging view interaction:', error)
        }
      }
    }

    logView()
  }, [user, movie, validMovieId])

  // Handle movie rating
  const handleRating = async (rating: number) => {
    if (!user || !validMovieId) return

    try {
      console.log(`Rating movie ${validMovieId} with score ${rating}`)
      await createInteraction(
        user.id,
        validMovieId,
        'rate',
        rating
      )
      setRated(true)
      console.log('Rating saved successfully')
    } catch (error) {
      console.error('Error rating movie:', error)
    }
  }

  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!user || !validMovieId) return

    try {
      console.log(`Toggling favorite for movie ${validMovieId}`)
      await createInteraction(
        user.id,
        validMovieId,
        'favorite',
        favorite ? 0 : 1
      )
      setFavorite(!favorite)
      console.log(`Movie ${favorite ? 'removed from' : 'added to'} favorites`)
    } catch (error) {
      console.error('Error updating favorite status:', error)
    }
  }

  // Toggle watchlist status
  const toggleWatchlist = async () => {
    if (!user || !validMovieId) return

    try {
      console.log(`Toggling watchlist for movie ${validMovieId}`)
      await createInteraction(
        user.id,
        validMovieId,
        'watchlist',
        watchlist ? 0 : 1
      )
      setWatchlist(!watchlist)
      console.log(`Movie ${watchlist ? 'removed from' : 'added to'} watchlist`)
    } catch (error) {
      console.error('Error updating watchlist status:', error)
    }
  }

  // Handle play button click
  const handlePlay = () => {
    if (movie) {
      setShowVideo(true)
      console.log('Playing movie trailer')
    }
  }

  // Error message if movie_id is invalid
  if (movie_id && !validMovieId) {
    return (
      <Layout title="Invalid Movie ID">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Error</p>
            <p>Invalid movie ID format: {movie_id}</p>
            <button 
              onClick={() => router.push('/movies')}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Browse Movies
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // Show loading state
  if (movieLoading || !movie) {
    return (
      <Layout title="Loading Movie...">
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading movie details...</p>
        </div>
      </Layout>
    )
  }

  // Show error state
  if (movieError) {
    const status = movieError.status || 'unknown'
    const message = movieError.message || 'An unknown error occurred'
    
    return (
      <Layout title="Error">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Error {status}</p>
            <p>{message}</p>
            {status === 404 && (
              <p className="mt-2">The movie you're looking for could not be found.</p>
            )}
            <button 
              onClick={() => router.push('/movies')}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Browse Movies
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const { 
    title, 
    genres, 
    overview, 
    backdrop_url, 
    poster_url,
    year
  } = movie

  return (
    <Layout title={title}>
      {/* Video player modal */}
      {showVideo && (
        <VideoPlayer
          movieId={validMovieId!}
          title={title}
          onClose={() => setShowVideo(false)}
        />
      )}
      
      {/* Backdrop image */}
      <div className="relative">
        <div className="w-full h-[50vh] lg:h-[60vh] relative">
          {backdrop_url ? (
            <>
              {!backdropLoaded && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse"></div>
              )}
              <Image
                src={backdrop_url}
                alt={title}
                fill
                className={`object-cover object-top ${backdropLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                priority
                onLoad={() => setBackdropLoaded(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-background to-gray-800" />
          )}
        </div>

        {/* Movie details overlay */}
        <div className="container mx-auto px-4 absolute bottom-0 left-0 right-0">
          <div className="flex flex-col md:flex-row gap-8 -mb-20 md:-mb-24">
            {/* Poster */}
            <div className="relative flex-shrink-0 w-40 h-60 md:w-48 md:h-72 -mt-20 md:-mt-16 z-10 rounded-lg overflow-hidden shadow-2xl mx-auto md:mx-0">
              {!posterLoaded && (
                <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>
              )}
              {poster_url ? (
                <Image
                  src={poster_url}
                  alt={title}
                  fill
                  className={`object-cover ${posterLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                  sizes="(max-width: 768px) 160px, 192px"
                  priority
                  onLoad={() => setPosterLoaded(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-center p-4">
                  <span>{title}</span>
                </div>
              )}
            </div>
            
            {/* Details */}
            <div className="flex-grow text-white pb-6 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold">{title} {year && `(${year})`}</h1>
              
              {/* Genres */}
              {genres && genres.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                  {genres.map((genre: string) => (
                    <span 
                      key={genre} 
                      className="text-xs bg-gray-700/50 text-gray-200 px-2 py-1 rounded"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <button 
                  onClick={handlePlay}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <FaPlay /> Play Trailer
                </button>
                
                {user && (
                  <>
                    <button 
                      onClick={toggleFavorite}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                      {favorite ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                      {favorite ? 'Favorited' : 'Favorite'}
                    </button>
                    
                    <button 
                      onClick={toggleWatchlist}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                      {watchlist ? <FaCheck /> : <FaPlus />}
                      {watchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </button>
                  </>
                )}
              </div>
              
              {/* Rating */}
              {user && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <span className="text-sm">Rate:</span>
                    <ReactStars
                      count={5}
                      onChange={handleRating}
                      size={24}
                      activeColor="#ffd700"
                    />
                    {rated && (
                      <span className="text-sm text-green-500">Rating saved!</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Overview */}
              {overview && (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold">Overview</h3>
                  <p className="mt-2 text-gray-300 line-clamp-4 md:line-clamp-none">{overview}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Movie content section */}
      <div className="container mx-auto px-4 py-28 md:py-32">
        {/* Similar movies */}
        {similarMovies && similarMovies.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Similar Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarMovies.map((movie: Movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={movie} 
                  size="medium"
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Show loading state for similar movies */}
        {similarLoading && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Similar Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array(6).fill(0).map((_, index) => (
                <div 
                  key={`similar-skeleton-${index}`} 
                  className="w-full h-60 bg-gray-800 animate-pulse rounded"
                ></div>
              ))}
            </div>
          </div>
        )}
        
        {/* Error state for similar movies */}
        {similarError && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Similar Movies</h2>
            <div className="p-4 bg-red-100 text-red-700 rounded">
              <p>Failed to load similar movies. Please try again later.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MovieDetailsPage 