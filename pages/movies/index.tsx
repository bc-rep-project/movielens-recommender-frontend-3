import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { getMovies } from '../../utils/api'
import MovieCard from '../../components/MovieCard'
import { Movie } from '../../types'

const Movies = () => {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log(`Fetching movies page ${page}`)
        const data = await getMovies(page)
        
        if (data && Array.isArray(data)) {
          console.log(`Received ${data.length} movies from backend`)
          
          if (data.length === 0) {
            setHasMore(false)
          } else {
            // If it's the first page, replace movies, otherwise append
            setMovies(prevMovies => page === 1 ? data : [...prevMovies, ...data])
          }
        } else {
          console.error('Invalid movie data format received:', data)
          setError('Failed to load movies. Received invalid data format.')
        }
      } catch (err) {
        console.error('Error fetching movies:', err)
        setError('Failed to load movies. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [page])

  const handleMovieClick = (movieId: string) => {
    // Validate movieId format before navigating
    if (movieId && movieId.length === 24) {
      console.log(`Navigating to movie details page for ID: ${movieId}`)
      router.push(`/movies/${movieId}`)
    } else {
      console.error(`Invalid movie ID format: ${movieId}`)
      setError(`Cannot open movie with invalid ID: ${movieId}`)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prevPage => prevPage + 1)
    }
  }

  return (
    <Layout title="Browse Movies">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Browse Movies</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
            <button 
              className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              onClick={() => { setError(null); setPage(1); }}
            >
              Try Again
            </button>
          </div>
        )}

        {movies.length === 0 && !loading && !error && (
          <div className="text-center py-10">
            <p className="text-gray-600">No movies found.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <MovieCard 
              key={movie.id || `movie-${movie.tmdb_id || Math.random()}`} 
              movie={movie} 
              onClick={() => handleMovieClick(movie.id)}
            />
          ))}
          
          {loading && Array(5).fill(0).map((_, index) => (
            <div key={`skeleton-${index}`} className="rounded-lg shadow-lg bg-gray-200 h-80 animate-pulse"></div>
          ))}
        </div>

        {hasMore && !loading && movies.length > 0 && (
          <div className="flex justify-center mt-8">
            <button 
              onClick={loadMore}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Load More
            </button>
          </div>
        )}

        {loading && movies.length > 0 && (
          <div className="flex justify-center mt-8">
            <p className="text-gray-600">Loading more movies...</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Movies 