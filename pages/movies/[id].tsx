import { useRouter } from 'next/router'
import { useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import ReactStars from 'react-rating-stars-component'
import { useUser } from '@supabase/auth-helpers-react'
import Layout from '../../components/Layout'
import MovieCard from '../../components/MovieCard'
import { getMovie, getSimilarMovies, createInteraction } from '../../utils/api'

const MovieDetailsPage = () => {
  const router = useRouter()
  const { id } = router.query
  const user = useUser()
  const [rated, setRated] = useState(false)
  const [posterError, setPosterError] = useState(false)
  const [backdropError, setBackdropError] = useState(false)

  // Fetch movie details
  const { data: movie, error: movieError } = useSWR(
    id ? `movie-${id}` : null,
    () => id ? getMovie(id as string) : null
  )

  // Fetch similar movies
  const { data: similarMovies, error: similarError } = useSWR(
    id ? `similar-movies-${id}` : null,
    () => id ? getSimilarMovies(id as string, 5) : null
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

  // Default image URLs for fallback
  const fallbackPosterUrl = '/images/movie-placeholder.jpg'
  const fallbackBackdropUrl = '/images/backdrop-placeholder.jpg'

  // Get poster URL - either direct poster_url from API or construct from poster_path
  const posterUrl = !posterError && movie && (
    movie.poster_url || 
    (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null)
  )

  // Get backdrop URL - either direct backdrop_url from API or construct from backdrop_path
  const backdropUrl = !backdropError && movie && (
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
    <Layout title={`${movie.title} | MovieLens Recommender`}>
      {/* Backdrop Image Section */}
      {backdropUrl && (
        <div className="relative w-full h-64 md:h-80 -mt-6 mb-6 overflow-hidden">
          <Image
            src={backdropUrl}
            alt={`${movie.title} backdrop`}
            fill
            className="object-cover opacity-50"
            onError={handleBackdropError}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80" />
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row md:space-x-8">
            {/* Movie Poster */}
            <div className="md:w-1/4 mb-6 md:mb-0">
              <div className="relative aspect-[2/3] w-full max-w-xs mx-auto overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={posterUrl || fallbackPosterUrl}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover"
                  onError={handlePosterError}
                  priority
                />
              </div>
            </div>

            {/* Movie Details */}
            <div className="md:w-3/4">
              <h1 className="text-3xl font-bold text-gray-900">{movie.title}</h1>
              
              {movie.year && (
                <p className="mt-2 text-gray-600">{movie.year}</p>
              )}
              
              <div className="mt-4 flex flex-wrap gap-2">
                {movie.genres.map((genre: string, index: number) => (
                  <span 
                    key={index} 
                    className="inline-block bg-secondary-100 rounded-full px-3 py-1 text-sm font-semibold text-secondary-800"
                  >
                    {genre}
                  </span>
                ))}
              </div>
              
              {user && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-2">Rate this movie</h2>
                  <div className="flex items-center">
                    <ReactStars
                      count={5}
                      onChange={handleRating}
                      size={30}
                      activeColor="#0ea5e9"
                      isHalf={false}
                    />
                    {rated && (
                      <span className="ml-4 text-green-600">Thank you for rating!</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Movies Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Similar Movies</h2>
          
          {!similarMovies ? (
            <p>Loading similar movies...</p>
          ) : similarError ? (
            <p className="text-red-500">Error loading similar movies</p>
          ) : similarMovies.similar_items.length === 0 ? (
            <p>No similar movies found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {similarMovies.similar_items.map((item: any) => (
                <MovieCard 
                  key={item.movie.id || item.movie._id} 
                  movie={{
                    id: item.movie.id || item.movie._id,
                    title: item.movie.title,
                    genres: item.movie.genres,
                    poster_url: item.movie.poster_url,
                    poster_path: item.movie.poster_path
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default MovieDetailsPage 