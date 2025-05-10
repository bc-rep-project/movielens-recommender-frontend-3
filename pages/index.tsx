import { useState, useEffect } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import useSWR from 'swr'
import Layout from '../components/Layout'
import MovieCard from '../components/MovieCard'
import { getMovies, getPopularMovies, getUserRecommendations } from '../utils/api'

const Home = () => {
  const user = useUser()
  
  // Fetch popular movies
  const { data: popularMovies, error: popularError } = useSWR(
    'popular-movies',
    () => getPopularMovies(10)
  )
  
  // Fetch user recommendations if user is logged in
  const { data: userRecommendations, error: recommendationsError } = useSWR(
    user ? `user-recommendations-${user.id}` : null,
    () => user ? getUserRecommendations(undefined, 10) : null
  )
  
  // Fetch recent movies
  const { data: recentMovies, error: recentError } = useSWR(
    'recent-movies',
    () => getMovies(1, 10)
  )

  const isLoading = !popularMovies && !popularError;
  const hasRecommendations = userRecommendations?.length > 0;

  return (
    <Layout title="Home | MovieLens Recommender">
      <div className="space-y-10">
        {user && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {user ? `Welcome${user.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}!` : 'Welcome!'}
            </h2>
          </div>
        )}

        {/* User recommendations */}
        {user && hasRecommendations && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Your Recommendations</h2>
              <a 
                href="/recommendations" 
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {userRecommendations?.map((movie: any) => (
                <MovieCard 
                  key={movie.id} 
                  movie={{
                    id: movie.id,
                    title: movie.title,
                    genres: movie.genres,
                    poster_url: movie.poster_url,
                    poster_path: movie.poster_path
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Popular movies */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Popular Movies</h2>
          </div>
          {isLoading ? (
            <p>Loading...</p>
          ) : popularError ? (
            <p>Error loading popular movies</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {popularMovies?.map((movie: any) => (
                <MovieCard 
                  key={movie.id} 
                  movie={{
                    id: movie.id,
                    title: movie.title,
                    genres: movie.genres,
                    poster_url: movie.poster_url,
                    poster_path: movie.poster_path
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent movies */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Movies</h2>
          </div>
          {!recentMovies ? (
            <p>Loading...</p>
          ) : recentError ? (
            <p>Error loading recent movies</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {recentMovies?.map((movie: any) => (
                <MovieCard 
                  key={movie.id} 
                  movie={{
                    id: movie.id,
                    title: movie.title,
                    genres: movie.genres,
                    poster_url: movie.poster_url,
                    poster_path: movie.poster_path
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}

export default Home 