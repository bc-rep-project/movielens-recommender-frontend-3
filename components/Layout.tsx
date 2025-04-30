import React, { ReactNode } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { FaSearch, FaUser, FaSignOutAlt, FaHome } from 'react-icons/fa'

type LayoutProps = {
  children: ReactNode
  title?: string
}

const Layout = ({ children, title = 'MovieLens Recommender' }: LayoutProps) => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('query')
    if (query) {
      router.push(`/search?query=${encodeURIComponent(query.toString())}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Movie recommendation system built with Next.js and FastAPI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-primary-600">
                  MovieLens
                </Link>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link href="/" className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  router.pathname === '/' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300'
                }`}>
                  <FaHome className="mr-1" />
                  Home
                </Link>
                <Link href="/recommendations" className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                  router.pathname === '/recommendations' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300'
                }`}>
                  Recommendations
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <form onSubmit={handleSearch} className="mr-4">
                <div className="relative">
                  <input
                    type="text"
                    name="query"
                    placeholder="Search movies..."
                    className="w-64 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <FaSearch className="text-gray-400" />
                  </button>
                </div>
              </form>
              {user ? (
                <div className="flex items-center">
                  <Link href="/profile" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-500">
                    <FaUser className="mr-1" />
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-500"
                  >
                    <FaSignOutAlt className="mr-1" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link href="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-gray-500">
              &copy; {new Date().getFullYear()} MovieLens Recommender
            </div>
            <div className="flex space-x-4">
              <a href="https://github.com/yourusername/movielens-recommender" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-500">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 