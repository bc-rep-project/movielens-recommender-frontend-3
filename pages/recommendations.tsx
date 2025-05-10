import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@supabase/auth-helpers-react'
import useSWR from 'swr'
import Layout from '../components/Layout'
import MovieCard from '../components/MovieCard'
import { getUserRecommendations } from '../utils/api'

const RecommendationsPage = () => {
  const router = useRouter()
  const user = useUser()

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      router.push('/login')
    }
  }, [user, router])

  // Fetch user recommendations
  const { data: recommendations, error } = useSWR(
    user ? `user-recommendations-${user.id}` : null,
    () => user ? getUserRecommendations(undefined, 20) : null
  )

  const isLoading = !recommendations && !error && user !== null

  // Loading state
  if (isLoading) {
    return (
      <Layout title="Loading... | MovieLens Recommender">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading your recommendations...</p>
        </div>
      </Layout>
    )
  }

  // No recommendations yet
  if (recommendations?.length === 0) {
    return (
      <Layout title="Recommendations | MovieLens Recommender">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Your Recommendations</h1>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-lg">
              You don't have any recommendations yet. Try rating some movies to get started!
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Explore Movies
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // Error state
  if (error) {
    return (
      <Layout title="Error | MovieLens Recommender">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Your Recommendations</h1>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-lg text-red-500">
              Sorry, there was an error loading your recommendations.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Recommendations | MovieLens Recommender">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Recommendations</h1>
        <p className="text-gray-600">
          Here are movie recommendations based on your ratings and viewing history.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations?.map((movie: any) => (
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
      </div>
    </Layout>
  )
}

export default RecommendationsPage 