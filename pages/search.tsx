import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import Layout from '../components/Layout'
import MovieCard from '../components/MovieCard'
import { searchMovies } from '../utils/api'
import { FaSearch, FaInfoCircle } from 'react-icons/fa'
import { useResponsive } from '../utils/device'
import { Movie } from '../types/common'

const SearchPage = () => {
  const router = useRouter()
  const { q } = router.query
  const [searchQuery, setSearchQuery] = useState('')
  const { isMobile } = useResponsive()

  // Set the search input value when the URL query parameter changes
  useEffect(() => {
    if (q && typeof q === 'string') {
      setSearchQuery(q)
    }
  }, [q])

  // Fetch search results - with properly typed fetcher
  const { data: searchResults, error } = useSWR<Movie[]>(
    q ? `search-${q}` : null,
    // Correctly typed fetcher function
    (key: string) => {
      const query = key.replace('search-', '')
      return searchMovies(query)
    },
    { revalidateOnFocus: false }
  )

  const isLoading = q && !searchResults && !error
  const hasResults = searchResults && searchResults.length > 0

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <Layout title={q ? `Search Results: ${q} | NetflixLens` : 'Search | NetflixLens'}>
      <div className="space-y-8 px-4 md:px-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">
            {q ? `${isMobile ? '' : 'Search Results: '}${isMobile ? 'Results: ' : ''}"${q}"` : 'Search'}
          </h1>
          
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
        
        {/* Search results */}
        {!q ? (
          <div className="text-center py-8 md:py-12">
            <FaSearch className="mx-auto text-4xl text-text-secondary mb-4" />
            <h3 className="text-xl font-bold mb-2">Enter a search term</h3>
            <p className="text-text-secondary">
              Search for movies by title, genre, or year
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: isMobile ? 6 : 12 }).map((_, i) => (
              <div key={i} className="h-48 md:h-60 bg-background-lighter rounded animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 md:p-6 text-center bg-background-lighter rounded-lg">
            <FaInfoCircle className="mx-auto text-primary-600 text-4xl mb-4" />
            <h3 className="text-lg font-medium mb-2">Error searching movies</h3>
            <p className="text-text-secondary mb-4">Sorry, we encountered an error while searching. Please try again.</p>
            <button 
              onClick={() => router.reload()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : !hasResults ? (
          <div className="text-center py-8 md:py-12">
            <FaInfoCircle className="mx-auto text-4xl text-text-secondary mb-4" />
            <h3 className="text-xl font-bold mb-2">No results found</h3>
            <p className="text-text-secondary mb-4">
              We couldn't find any movies matching "{q}". Try a different search term.
            </p>
            <button
              onClick={() => router.push('/movies')}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Browse All Movies
            </button>
          </div>
        ) : (
          <>
            <p className="text-text-secondary mb-4">
              Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{q}"
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {searchResults.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  size={isMobile ? "small" : "medium"}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default SearchPage