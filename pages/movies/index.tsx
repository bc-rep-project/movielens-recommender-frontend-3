import { useState } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import Layout from '../../components/Layout'
import MovieCard from '../../components/MovieCard'
import { getMovies } from '../../utils/api'
import { FaSearch, FaChevronLeft, FaChevronRight, FaInfoCircle } from 'react-icons/fa'
import { Movie } from '../../types/common'

// Movies per page
const MOVIES_PER_PAGE = 24

const MoviesPage = () => {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch movies with pagination
  const { data: movies, error } = useSWR<Movie[]>(
    `movies-page-${page}`,
    (key: string) => getMovies(page, MOVIES_PER_PAGE),
    { revalidateOnFocus: false }
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

  return (
    <Layout title="Browse Movies | NetflixLens">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Browse Movies</h1>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2 pl-10 pr-4 w-full md:w-64 bg-background-lighter text-text-primary rounded focus:outline-none focus:ring-1 focus:ring-primary-600"
            />
            <FaSearch className="absolute left-3 top-3 text-text-secondary" />
          </form>
        </div>
        
        {/* Movies grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-60 bg-background-lighter rounded animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-background-lighter rounded-lg">
            <FaInfoCircle className="mx-auto text-primary-600 text-4xl mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load movies</h3>
            <p className="text-text-secondary mb-4">Sorry, we couldn't load the movies at this time.</p>
            <button 
              onClick={() => router.reload()}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : !movies?.length ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">No movies found</h3>
            <p className="text-text-secondary mb-4">
              We couldn't find any movies. Please try again later.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((movie) => (
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
            
            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={page === 1}
                  className={`p-2 rounded-full ${
                    page === 1
                      ? 'bg-background-lighter text-text-tertiary cursor-not-allowed'
                      : 'bg-background-lighter text-text-primary hover:bg-background-elevated'
                  }`}
                >
                  <FaChevronLeft size={16} />
                </button>
                <span className="px-4 py-2 rounded bg-background-lighter text-text-primary">
                  Page {page}
                </span>
                <button
                  onClick={goToNextPage}
                  className="p-2 rounded-full bg-background-lighter text-text-primary hover:bg-background-elevated"
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