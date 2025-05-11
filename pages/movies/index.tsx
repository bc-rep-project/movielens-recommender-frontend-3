import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import Layout from '../../components/Layout'
import MovieCard from '../../components/MovieCard'
import { getMovies } from '../../utils/api'
import { FaSearch, FaChevronLeft, FaChevronRight, FaInfoCircle } from 'react-icons/fa'
import { Movie } from '../../types/common'
import { useResponsive } from '../../utils/device'

// Movies per page
const MOVIES_PER_PAGE = 24

const MoviesPage = () => {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const { isMobile } = useResponsive()

  // Log API URL for debugging
  useEffect(() => {
    console.log(`API URL for movies: ${process.env.NEXT_PUBLIC_API_URL}/api/movies`);
  }, []);

  // Fetch movies with pagination
  const { data: movies, error } = useSWR<Movie[]>(
    `movies-page-${page}`,
    (key: string) => getMovies(page, MOVIES_PER_PAGE).catch(error => {
      // Extract and store detailed error information
      let errorMsg = 'Failed to load movies';
      
      if (error.response) {
        errorMsg = `Error ${error.response.status}: ${error.response.statusText || 'Server error'}`;
        console.error('API Error loading movies:', {
          status: error.response.status,
          data: error.response.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            hasAuthHeader: !!error.config?.headers?.Authorization
          }
        });
      } else if (error.request) {
        errorMsg = 'No response from server. The API may be down or unreachable.';
        console.error('Network error loading movies - no response received');
      } else {
        errorMsg = error.message || 'An unexpected error occurred';
        console.error('Error loading movies:', error);
      }
      
      setErrorDetails(errorMsg);
      throw error;
    }),
    { 
      revalidateOnFocus: false,
      dedupingInterval: 60000 // Cache results for 1 minute
    }
  )

  const isLoading = !movies && !error

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Pagination handlers
  const goToPreviousPage = () => {
    if (page > 1) setPage(page - 1)
  }

  const goToNextPage = () => {
    setPage(page + 1)
  }

  // Debug log when there's an error
  useEffect(() => {
    if (error) {
      console.error('Error in Movies Page:', error);
    }
  }, [error]);

  return (
    <Layout title="Browse Movies | MovieLens Recommender">
      <div className="space-y-6 md:space-y-8 px-4 md:px-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Browse Movies</h1>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2 pl-10 pr-4 w-full md:w-64 bg-background-lighter text-text-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-600"
            />
            <FaSearch className="absolute left-3 top-3 text-text-secondary" />
            <button
              type="submit"
              className="md:hidden mt-2 py-2 px-4 bg-primary-600 text-white rounded-lg w-full"
            >
              Search
            </button>
          </form>
        </div>
        
        {/* Movies grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: isMobile ? 6 : 12 }).map((_, i) => (
              <div key={i} className="h-48 md:h-60 bg-background-lighter rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 md:p-6 text-center bg-background-lighter rounded-lg">
            <FaInfoCircle className="mx-auto text-primary-600 text-3xl md:text-4xl mb-3 md:mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load movies</h3>
            <p className="text-text-secondary mb-4">
              {errorDetails || 'Sorry, we couldn\'t load the movies at this time.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => router.reload()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Try Again
              </button>
              {error.response?.status === 401 || error.response?.status === 403 ? (
                <button 
                  onClick={() => router.push('/login')}
                  className="bg-background px-4 py-2 rounded-lg hover:bg-background-elevated transition"
                >
                  Go to Login
                </button>
              ) : null}
            </div>
          </div>
        ) : !movies?.length ? (
          <div className="text-center py-8 md:py-12">
            <h3 className="text-xl font-bold mb-2">No movies found</h3>
            <p className="text-text-secondary mb-4">
              We couldn't find any movies. Please try again later.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  size={isMobile ? "small" : "medium"}
                />
              ))}
            </div>
            
            {/* Pagination */}
            <div className="mt-6 md:mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={page === 1}
                  className={`p-2 rounded-full ${
                    page === 1
                      ? 'bg-background-lighter text-text-tertiary cursor-not-allowed'
                      : 'bg-background-lighter text-text-primary hover:bg-background-elevated'
                  }`}
                  aria-label="Previous page"
                >
                  <FaChevronLeft size={16} />
                </button>
                <span className="px-4 py-2 rounded-lg bg-background-lighter text-text-primary">
                  Page {page}
                </span>
                <button
                  onClick={goToNextPage}
                  className="p-2 rounded-full bg-background-lighter text-text-primary hover:bg-background-elevated"
                  aria-label="Next page"
                >
                  <FaChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default MoviesPage