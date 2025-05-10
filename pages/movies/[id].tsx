import { useRouter } from 'next/router'
import { useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import ReactStars from 'react-rating-stars-component'
import { useUser } from '@supabase/auth-helpers-react'
import Layout from '../../components/Layout'
import MovieCard from '../../components/MovieCard'
import MoviePlaceholder from '../../components/MoviePlaceholder'
import { getMovie, getSimilarMovies, createInteraction } from '../../utils/api'
import { FaPlay, FaPlus, FaStar, FaChevronDown, FaTimes } from 'react-icons/fa'
import { Movie } from '../../types/common'

const MovieDetailsPage = () => {
  const router = useRouter()
  const { id } = router.query
  const user = useUser()
  const [rated, setRated] = useState(false)
  const [posterError, setPosterError] = useState(false)
  const [backdropError, setBackdropError] = useState(false)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)

  // Fetch movie details
  const { data: movie, error: movieError } = useSWR<Movie>(
    id ? `movie-${id}` : null,
    (key: string) => getMovie(id as string)
  )

  // Fetch similar movies
  const { data: similarMovies, error: similarError } = useSWR<Movie[]>(
    id ? `similar-movies-${id}` : null,
    (key: string) => getSimilarMovies(id as string, 5)
  )

  // Handle movie rating
  const handleRating = async (rating: number) => {
    if (!user || !id) return

    try {
      await createInteraction(
        user.id,
        id as string,
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

  // Handle image loading errors
  const handlePosterError = () => setPosterError(true)
  const handleBackdropError = () => setBackdropError(true)

  // Loading state
  if (!movie && !movieError) {
    return (
      <Layout title="Loading... | MovieLens Recommender">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading...</p>
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

  return (
    <Layout title={`${movie.title} | MovieLens Recommender`} fullWidth>
      {/* Hero Banner */}
      <div className="relative min-h-[80vh] -mt-16">
        {/* Backdrop */}
        <div className="absolute inset-0 z-0">
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={movie.title}
              fill
              priority
              className="object-cover"
              onError={handleBackdropError}
            />
          ) : (
            <div className="w-full h-full bg-background-elevated opacity-40">
              <MoviePlaceholder title={movie.title} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 pt-36 pb-16 px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Movie Poster */}
            <div className="flex-shrink-0 w-48 md:w-64 lg:w-80 mx-auto md:mx-0">
              <div className="relative aspect-[2/3] overflow-hidden rounded">
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
            
            {/* Movie Info */}
            <div className="flex-grow">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {movie.title}
              </h1>
              
              <div className="flex flex-wrap items-center text-text-secondary mb-4 text-sm">
                {movie.year && <span className="mr-3">{movie.year}</span>}
                {movie.runtime && <span className="mr-3">{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>}
                <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                  {movie.genres.map((genre: string, i: number) => (
                    <span key={i} className="inline-block bg-background-lighter px-2 py-1 rounded">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <button 
                  onClick={() => setShowVideoPlayer(true)} 
                  className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-md hover:bg-white/90 transition"
                >
                  <FaPlay />
                  <span>Play</span>
                </button>
                
                <button className="flex items-center gap-2 bg-background-lighter hover:bg-background-elevated px-4 py-2 rounded-md transition">
                  <FaPlus />
                  <span>My List</span>
                </button>
                
                <button
                  onClick={() => handleRating(0)}
                  className="flex items-center gap-2 bg-background-lighter hover:bg-background-elevated px-4 py-2 rounded-md transition"
                >
                  <FaStar className="text-yellow-500" />
                  <span>Rate</span>
                </button>
              </div>
              
              {/* Overview */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Overview</h3>
                <p className="text-text-secondary">{movie.overview}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Similar Movies */}
      {similarMovies && similarMovies.length > 0 && (
        <div className="py-10 bg-background">
          <div className="main-container">
            <h2 className="text-2xl font-bold mb-6">More Like This</h2>
            <div className="movies-row">
              {similarMovies.map((item: Movie) => (
                <MovieCard
                  key={item.id}
                  movie={{
                    id: item.id,
                    title: item.title,
                    genres: item.genres,
                    poster_url: item.poster_url,
                    poster_path: item.poster_path,
                    year: item.year
                  }}
                  size="medium"
                />
              ))}
            </div>
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
          className="w-10 h-10 rounded-full bg-background/50 hover:bg-background flex items-center justify-center text-white transition"
        >
          <FaTimes size={18} />
        </button>
      </div>
      
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full h-[60vh] bg-background-lighter rounded">
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            <div className="text-center">
              <p className="text-xl mb-2">Video player placeholder for</p>
              <h3 className="text-2xl font-bold text-text-primary">{movieTitle}</h3>
              <p className="mt-4 text-sm">In a real application, this would be a video player component.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsPage