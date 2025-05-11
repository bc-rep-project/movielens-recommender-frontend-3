import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import ReactStars from 'react-rating-stars-component'
import { useUser } from '@supabase/auth-helpers-react'
import Layout from '../../components/Layout'
import MovieCard from '../../components/MovieCard'
import MovieRow from '../../components/MovieRow'
import MoviePlaceholder from '../../components/MoviePlaceholder'
import { getMovie, getSimilarMovies, createInteraction } from '../../utils/api'
import { FaPlay, FaPlus, FaStar, FaChevronDown, FaTimes } from 'react-icons/fa'
import { Movie } from '../../types/common'

// Helper function to ensure we have a valid ID
const isValidObjectId = (id?: string): boolean => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const MovieDetailsPage = () => {
  const router = useRouter()
  const { id } = router.query
  const user = useUser()
  const [rated, setRated] = useState(false)
  const [posterError, setPosterError] = useState(false)
  const [backdropError, setBackdropError] = useState(false)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [validId, setValidId] = useState<string | null>(null)

  // Validate the ID when it becomes available
  useEffect(() => {
    if (typeof id === 'string') {
      const valid = isValidObjectId(id);
      setValidId(valid ? id : null);
      
      // If invalid ID, you could redirect or show a message
      if (!valid && process.env.NODE_ENV === 'development') {
        console.error(`Invalid movie ID: ${id}`);
      }
    }
  }, [id]);

  // Fetch movie details (only if ID is valid)
  const { data: movie, error: movieError } = useSWR<Movie>(
    validId ? `movie-${validId}` : null,
    validId ? () => getMovie(validId) : null
  )

  // Fetch similar movies (only if ID is valid)
  const { data: similarMoviesResponse, error: similarError } = useSWR(
    validId ? `similar-movies-${validId}` : null,
    validId ? () => getSimilarMovies(validId, 5) : null
  )

  // Extract the similar movies from the response (handle both array and object formats)
  const similarMovies = similarMoviesResponse ? 
    (Array.isArray(similarMoviesResponse) ? similarMoviesResponse : 
     similarMoviesResponse.similar_items || []) : 
    [];

  // Log for debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('Movie ID:', id);
      console.debug('Valid ID:', validId);
      console.debug('Similar movies response:', similarMoviesResponse);
    }
  }, [id, validId, similarMoviesResponse]);

  // Handle movie rating
  const handleRating = async (rating: number) => {
    if (!user || !validId) return

    try {
      await createInteraction(
        user.id,
        validId,
        'rate',
        rating
      )
      setRated(true)
    } catch (error) {
      console.error('Error rating movie:', error)
    }
  }

  // Get poster URL - either direct poster_url from API or construct from poster_path
  const posterUrl = movie && !posterError && (
    movie.poster_url || 
    (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null)
  )

  // Get backdrop URL - either direct backdrop_url from API or construct from backdrop_path
  const backdropUrl = movie && !backdropError && (
    movie.backdrop_url || 
    (movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null)
  )

  // Handle image loading events
  const handlePosterError = () => setPosterError(true)
  const handleBackdropError = () => setBackdropError(true)
  const handleImageLoad = () => setIsLoading(false)

  // Invalid ID state
  if (typeof id === 'string' && !validId) {
    return (
      <Layout title="Invalid Movie ID | MovieLens Recommender">
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-lg text-red-500 mb-4">Invalid movie ID format</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            Return to Home
          </button>
        </div>
      </Layout>
    )
  }

  // Loading state
  if (!movie && !movieError) {
    return (
      <Layout title="Loading... | MovieLens Recommender">
        <div className="flex justify-center items-center h-64">
          <div className="w-16 h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin"></div>
        </div>
      </Layout>
    )
  }

  // Error state
  if (movieError || !movie) {
    return (
      <Layout title="Error | MovieLens Recommender">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-red-500">Failed to load movie</p>
        </div>
      </Layout>
    )
  }

  // Ensure similar movies have valid IDs before rendering
  const validSimilarMovies = similarMovies?.filter((m: Movie) => m && isValidObjectId(m.id)) || [];

  return (
    <Layout title={`${movie.title} | MovieLens Recommender`} fullWidth>
      {/* Hero Banner */}
      <div className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[80vh] -mt-16">
        {/* Backdrop */}
        <div className="absolute inset-0 z-0">
          {isLoading && (
            <div className="absolute inset-0 bg-background-elevated animate-pulse" />
          )}
          
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={movie.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              onError={handleBackdropError}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="w-full h-full bg-background-elevated opacity-40">
              <MoviePlaceholder title={movie.title} />
            </div>
          )}
          {/* Gradient overlay - stronger on mobile for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30 sm:from-background sm:via-background/70 sm:to-background/20" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 pt-24 sm:pt-28 md:pt-36 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Movie Poster */}
            <div className="flex-shrink-0 w-32 sm:w-40 md:w-64 lg:w-80 mx-auto md:mx-0">
              <div className="relative aspect-[2/3] overflow-hidden rounded shadow-lg">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={movie.title}
                    fill
                    priority
                    className="object-cover"
                    onError={handlePosterError}
                  />
                ) : (
                  <MoviePlaceholder title={movie.title} />
                )}
              </div>
            </div>
            
            {/* Movie Info - adjusted spacing for mobile */}
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4">
                {movie.title}
              </h1>
              
              <div className="flex flex-wrap justify-center md:justify-start items-center text-text-secondary mb-3 sm:mb-4 text-xs sm:text-sm">
                {movie.year && <span className="mr-3">{movie.year}</span>}
                {movie.runtime && <span className="mr-3">{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>}
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 w-full md:w-auto md:mt-0">
                  {movie.genres.map((genre: string, i: number) => (
                    <span key={i} className="inline-block bg-background-lighter px-2 py-1 rounded text-xs">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons - touch-friendly */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 mb-4 sm:mb-6">
                <button 
                  onClick={() => setShowVideoPlayer(true)} 
                  className="flex items-center gap-1 sm:gap-2 bg-white text-black px-3 sm:px-5 py-2 rounded-md hover:bg-white/90 transition touch-manipulation text-sm sm:text-base"
                >
                  <FaPlay />
                  <span>Play</span>
                </button>
                
                <button className="flex items-center gap-1 sm:gap-2 bg-background-lighter hover:bg-background-elevated px-3 sm:px-4 py-2 rounded-md transition touch-manipulation text-sm sm:text-base">
                  <FaPlus />
                  <span>My List</span>
                </button>
                
                <button
                  onClick={() => handleRating(0)}
                  className="flex items-center gap-1 sm:gap-2 bg-background-lighter hover:bg-background-elevated px-3 sm:px-4 py-2 rounded-md transition touch-manipulation text-sm sm:text-base"
                >
                  <FaStar className="text-yellow-500" />
                  <span>Rate</span>
                </button>
              </div>
              
              {/* Overview - responsive text sizing */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Overview</h3>
                <p className="text-text-secondary text-sm sm:text-base">
                  {movie.overview || "No overview available for this movie."}
                </p>
              </div>
              
              {/* Rating component */}
              {user && (
                <div className="mt-2 sm:mt-4">
                  <div className="flex items-center justify-center md:justify-start">
                    <ReactStars
                      count={5}
                      onChange={handleRating}
                      size={24}
                      activeColor="#0ea5e9"
                      isHalf={false}
                    />
                    <span className="ml-2 text-sm">
                      {rated ? "Thanks for rating!" : "Rate this movie"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Similar Movies - using our MovieRow component */}
      {validSimilarMovies && validSimilarMovies.length > 0 && (
        <div className="py-6 sm:py-8 md:py-10 bg-background">
          <div className="main-container">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">More Like This</h2>
            <MovieRow
              title=""
              movies={validSimilarMovies}
              size="medium"
            />
          </div>
        </div>
      )}
      
      {/* Video Player */}
      <VideoPlayer 
        isOpen={showVideoPlayer} 
        onClose={() => setShowVideoPlayer(false)}
        movieTitle={movie.title}
      />
    </Layout>
  )
}

// Video player component (placeholder)
const VideoPlayer = ({ isOpen, onClose, movieTitle }: { isOpen: boolean, onClose: () => void, movieTitle: string }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/95 z-50 animate-fade-in">
      <div className="absolute top-4 right-4">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-background/50 hover:bg-background flex items-center justify-center text-white transition touch-manipulation"
        >
          <FaTimes size={18} />
        </button>
      </div>
      
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full h-[40vh] sm:h-[50vh] md:h-[60vh] bg-background-lighter rounded">
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            <div className="text-center p-4">
              <p className="text-lg sm:text-xl mb-2">Video player placeholder for</p>
              <h3 className="text-xl sm:text-2xl font-bold text-text-primary">{movieTitle}</h3>
              <p className="mt-4 text-xs sm:text-sm">In a real application, this would be a video player component.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsPage