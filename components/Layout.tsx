import React, { ReactNode, useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { FaSearch, FaUser, FaSignOutAlt, FaHome, FaBell, FaCaretDown, FaUserAlt } from 'react-icons/fa'
import Logo from './Logo'

type LayoutProps = {
  children: ReactNode
  title?: string
  description?: string
  fullWidth?: boolean
}

const Layout = ({ 
  children, 
  title = 'NetflixLens', 
  description = 'A Netflix-like movie recommendation platform',
  fullWidth = false
}: LayoutProps) => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header 
        className={`fixed top-0 w-full z-50 py-3 px-4 md:px-6 lg:px-12 transition-all duration-300 ${
          isScrolled ? 'bg-background' : 'bg-transparent bg-gradient-to-b from-background/80 to-transparent'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <Logo className="h-10 w-auto text-primary-600" />
            </Link>
            
            <nav className="hidden md:flex">
              <ul className="flex space-x-6 text-sm">
                <li>
                  <Link 
                    href="/" 
                    className={`hover:text-white transition ${
                      router.pathname === '/' ? 'font-medium text-white' : 'text-text-secondary'
                    }`}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/recommendations" 
                    className={`hover:text-white transition ${
                      router.pathname === '/recommendations' ? 'font-medium text-white' : 'text-text-secondary'
                    }`}
                  >
                    My Recommendations
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/movies" 
                    className={`hover:text-white transition ${
                      router.pathname === '/movies' ? 'font-medium text-white' : 'text-text-secondary'
                    }`}
                  >
                    Movies
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/watchlist" 
                    className={`hover:text-white transition ${
                      router.pathname === '/watchlist' ? 'font-medium text-white' : 'text-text-secondary'
                    }`}
                  >
                    My List
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-1 pl-8 pr-3 w-36 md:w-64 bg-background-lighter/80 focus:bg-background-lighter text-text-primary rounded-sm text-sm border-none focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all"
              />
              <FaSearch className="absolute left-2.5 top-2.5 text-text-secondary text-sm" />
            </form>
            
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center hover:opacity-80 transition focus:outline-none"
                >
                  <span className="hidden md:block mr-2 text-sm">{user.user_metadata?.name || user.email}</span>
                  <div className="h-8 w-8 rounded-sm bg-primary-600 flex items-center justify-center text-white">
                    <FaUserAlt size={14} />
                  </div>
                </button>
                
                {isProfileOpen && (
                  <div 
                    className="absolute right-0 mt-2 py-2 w-48 bg-background-elevated rounded shadow-xl z-20"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Link href="/profile" className="flex items-center px-4 py-2 text-sm hover:bg-background-lighter">
                      <FaUser className="mr-2" /> Profile
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-red-500 hover:bg-background-lighter"
                    >
                      <FaSignOutAlt className="mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="bg-primary-600 text-white px-4 py-1.5 text-sm font-medium rounded hover:bg-primary-700 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow z-10 pt-16">
        {fullWidth ? (
          children
        ) : (
          <div className="main-container py-6">
            {children}
          </div>
        )}
      </main>
      
      <footer className="bg-background-elevated py-6 mt-auto">
        <div className="main-container">
          <div className="text-center text-text-secondary text-sm">
            <p>© {new Date().getFullYear()} NetflixLens. All rights reserved.</p>
            <p className="mt-1">A Netflix-like movie recommendation platform</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout 