import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@supabase/auth-helpers-react'
import useSWR from 'swr'
import Layout from '../components/Layout'
import MovieCard from '../components/MovieCard'
import { getUserRecommendations } from '../utils/api'
import { FaInfoCircle, FaExclamationTriangle, FaSignInAlt } from 'react-icons/fa'
import { Movie } from '../types/common'
import { useResponsive } from '../utils/device'

const RecommendationsPage = () => {
  const router = useRouter()
  const user = useUser()
  const [filter, setFilter] = useState<string>('all')
  const [apiErrorDetails, setApiErrorDetails] = useState<string | null>(null)
  const { isMobile } = useResponsive()

  // Log authentication status for debugging
  useEffect(() => {
    console.log('User authentication status:', user ? 'logged in' : 'not logged in');
    if (user) {
      console.log('User ID:', user.id);
    }
  }, [user]);

  // Redirect if not logged in
  if (!user) {
    if (typeof window !== 'undefined') {
      console.log('No user found, redirecting to login page');
      router.push('/login?returnUrl=/recommendations');
    }
    return (
      <Layout title="Recommendations | MovieLens Recommender">
        <div className="flex flex-col justify-center items-center h-[50vh]">
          <div className="w-16 h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin mb-4"></div>
          <p className="text-text-secondary">Checking authentication status...</p>
        </div>
      </Layout>
    )
  }

  // Fetch recommendations - with properly typed fetcher function
  const { data: recommendations, error } = useSWR<Movie[]>(
    user ? `user-recommendations-${user.id}` : null,
    // Use properly typed fetcher function that matches SWR's expectations
    (key: string) => {
      return getUserRecommendations().catch(error => {
        // Extract error details
        let errorMsg = 'Failed to load recommendations';
        
        if (error.response) {
          const status = error.response.status;
          if (status === 401 || status === 403) {
            errorMsg = 'Your session may have expired. Please log in again.';
            console.error('Authentication error loading recommendations:', {
              status,
              data: error.response.data
            });
          } else {
            errorMsg = `Server error (${status}): ${error.response.data?.detail || error.response.statusText || 'Unknown error'}`;
            console.error('API error loading recommendations:', {
              status,
              data: error.response.data,
              config: {
                url: error.config?.url,
                method: error.config?.method,
                hasAuthHeader: !!error.config?.headers?.Authorization
              }
            });
          }
        } else if (error.request) {
          errorMsg = 'No response from server. The API may be down or unreachable.';
          console.error('Network error loading recommendations - no response received');
        } else {
          errorMsg = error.message || 'An unexpected error occurred';
          console.error('Error loading recommendations:', error);
        }
        
        setApiErrorDetails(errorMsg);
        throw error;
      });
    },
    { 
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache results for 1 minute
      shouldRetryOnError: false // Don't retry on 401/403 errors
    }
  )

  const isLoading = !recommendations && !error

  // Filter recommendations by selected genre if a filter is active
  const filteredRecommendations = filter === 'all' 
    ? recommendations 
    : recommendations?.filter((movie) => 
        movie.genres.includes(filter)
      )

  // Extract unique genres from all recommendations with proper type handling
  const allGenres: string[] = recommendations 
    ? Array.from(new Set(recommendations.flatMap(movie => movie.genres)))
    : []

  // Debug logging for errors
  useEffect(() => {
    if (error) {
      console.error('Error in Recommendations Page:', error);
    }
  }, [error]);

  // Check if error is auth related
  const isAuthError = error && 
    (error.response?.status === 401 || error.response?.status === 403);

  return (
    <Layout title="Your Recommendations | MovieLens Recommender">
      <div className="space-y-6 md:space-y-8 px-4 md:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Your Recommendations</h1>
          
          {/* Genre filter - only show if we have recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="relative w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none bg-background-lighter text-text-primary border border-border rounded-lg py-2 pl-4 pr-10 w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-primary-600"
              >
                <option value="all">All Genres</option>
                {allGenres.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8 md:py-12">
            <div className="w-12 h-12 md:w-16 md:h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 md:p-6 text-center bg-background-lighter rounded-lg">
            {isAuthError ? (
              <FaExclamationTriangle className="mx-auto text-yellow-500 text-3xl md:text-4xl mb-3 md:mb-4" />
            ) : (
              <FaInfoCircle className="mx-auto text-primary-600 text-3xl md:text-4xl mb-3 md:mb-4" />
            )}
            <h3 className="text-lg font-medium mb-2">
              {isAuthError ? 'Authentication Problem' : 'Failed to load recommendations'}
            </h3>
            <p className="text-text-secondary mb-4">
              {apiErrorDetails || 'Sorry, we couldn\'t load your movie recommendations at this time.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isAuthError ? (
                <button 
                  onClick={() => router.push('/login?returnUrl=/recommendations')}
                  className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  <FaSignInAlt />
                  <span>Log In Again</span>
                </button>
              ) : (
                <button 
                  onClick={() => router.reload()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => router.push('/movies')}
                className="bg-background px-4 py-2 rounded-lg hover:bg-background-elevated transition"
              >
                Browse Movies Instead
              </button>
            </div>
          </div>
        ) : !filteredRecommendations?.length ? (
          <div className="text-center py-8 md:py-12">
            {filter === 'all' ? (
              <>
                <h3 className="text-xl font-bold mb-2">No recommendations yet</h3>
                <p className="text-text-secondary mb-6">
                  Start rating movies or browse the catalog to get personalized recommendations.
                </p>
                <button
                  onClick={() => router.push('/movies')}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Browse Movies
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2">No {filter} movies found</h3>
                <p className="text-text-secondary mb-4">
                  We couldn't find any {filter} movies in your recommendations.
                </p>
                <button
                  onClick={() => setFilter('all')}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Show All Recommendations
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Group movies by genre if no filter is applied */}
            {filter === 'all' ? (
              allGenres.map((genre) => {
                // Add null check for recommendations
                const genreMovies = recommendations?.filter((movie) => 
                  movie.genres.includes(genre)
                ) || [];
                
                if (genreMovies.length === 0) return null;
                
                return (
                  <section key={genre} className="mb-6 md:mb-8">
                    <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">{genre}</h2>
                    <div className="flex overflow-x-auto pb-4 space-x-3 md:space-x-4 no-scrollbar">
                      {genreMovies.map((movie) => (
                        <div key={movie.id} className="flex-none w-36 sm:w-48 md:w-56">
                          <MovieCard
                            movie={movie}
                            size={isMobile ? "small" : "medium"}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })
            ) : (
              // If filter is applied, show filtered movies in a grid
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {filteredRecommendations.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    size={isMobile ? "small" : "medium"}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default RecommendationsPage