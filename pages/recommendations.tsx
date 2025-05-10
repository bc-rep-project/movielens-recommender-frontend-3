import { useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@supabase/auth-helpers-react'
import useSWR from 'swr'
import Layout from '../components/Layout'
import MovieCard from '../components/MovieCard'
import { getUserRecommendations } from '../utils/api'
import { FaInfoCircle } from 'react-icons/fa'
import { Movie } from '../types/common'

const RecommendationsPage = () => {
  const router = useRouter()
  const user = useUser()
  const [filter, setFilter] = useState<string>('all')

  // Redirect if not logged in
  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/login')
    }
    return (
      <Layout title="Recommendations | NetflixLens">
        <div className="flex justify-center items-center h-[50vh]">
          <div className="w-16 h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin"></div>
        </div>
      </Layout>
    )
  }

  // Fetch recommendations - with properly typed fetcher function
  const { data: recommendations, error } = useSWR<Movie[]>(
    user ? `user-recommendations-${user.id}` : null,
    // Use properly typed fetcher function that matches SWR's expectations
    (key: string) => {
      return getUserRecommendations();
    },
    { revalidateOnFocus: false }
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

  return (
    <Layout title="Your Recommendations | NetflixLens">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Recommendations</h1>
          
          {/* Genre filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-background-lighter text-text-primary border border-border rounded py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-primary-600"
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
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-16 h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-background-lighter rounded-lg">
            <FaInfoCircle className="mx-auto text-primary-600 text-4xl mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load recommendations</h3>
            <p className="text-text-secondary mb-4">Sorry, we couldn't load your movie recommendations at this time.</p>
            <button 
              onClick={() => router.reload()}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : !filteredRecommendations?.length ? (
          <div className="text-center py-12">
            {filter === 'all' ? (
              <>
                <h3 className="text-xl font-bold mb-2">No recommendations yet</h3>
                <p className="text-text-secondary mb-6">
                  Start rating movies or browse the catalog to get personalized recommendations.
                </p>
                <button
                  onClick={() => router.push('/movies')}
                  className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 transition"
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
                  className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 transition"
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
                  <section key={genre} className="mb-8">
                    <h2 className="text-xl font-bold mb-4">{genre}</h2>
                    <div className="movies-row">
                      {genreMovies.map((movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={{
                            id: movie.id,
                            title: movie.title,
                            genres: movie.genres,
                            poster_url: movie.poster_url,
                            poster_path: movie.poster_path,
                            year: movie.year
                          }}
                          size="medium"
                        />
                      ))}
                    </div>
                  </section>
                )
              })
            ) : (
              // If filter is applied, show filtered movies in a grid
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredRecommendations.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={{
                      id: movie.id,
                      title: movie.title,
                      genres: movie.genres,
                      poster_url: movie.poster_url,
                      poster_path: movie.poster_path,
                      year: movie.year
                    }}
                    size="medium"
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