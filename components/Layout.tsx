import React, { ReactNode, useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { FaSearch, FaUser, FaSignOutAlt, FaHome, FaBell, FaCaretDown, FaUserAlt, FaBars, FaTimes, FaFilm, FaListUl, FaHeart } from 'react-icons/fa'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setShowSearch(false)
  }, [router.pathname])

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
    }
  }

  const toggleSearch = () => {
    setShowSearch(!showSearch)
    if (!showSearch && searchInputRef.current) {
      // Focus input after it becomes visible
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
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
          isScrolled || isMobileMenuOpen ? 'bg-background shadow-lg' : 'bg-transparent bg-gradient-to-b from-background/80 to-transparent'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo and desktop navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center z-20">
              <Logo className="h-8 w-auto text-primary-600" />
                </Link>
            
            {/* Desktop navigation */}
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
          
          {/* Right side icons - search and user */}
          <div className="flex items-center space-x-2 md:space-x-4 z-20">
            {/* Mobile search button */}
            <button 
              onClick={toggleSearch} 
              className="p-2 text-text-secondary hover:text-white transition"
              aria-label="Search"
            >
              <FaSearch className="text-lg" />
            </button>
            
            {/* Desktop search form */}
            <form 
              onSubmit={handleSearch} 
              className={`${showSearch ? 'block absolute top-0 left-0 w-full p-3 bg-background z-50' : 'hidden md:block'}`}
            >
              <div className="relative max-w-md mx-auto">
                  <input
                  ref={searchInputRef}
                    type="text"
                    placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="py-2 px-4 pl-10 w-full bg-background-lighter/80 focus:bg-background-lighter text-text-primary rounded-sm text-sm border-none focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all"
                />
                <FaSearch className="absolute left-3 top-3 text-text-secondary text-sm" />
                
                {/* Close button for mobile search */}
                {showSearch && (
                  <button 
                    type="button" 
                    onClick={toggleSearch}
                    className="absolute right-3 top-3 text-text-secondary"
                  >
                    <FaTimes />
                  </button>
                )}
                </div>
              </form>
            
              {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center hover:opacity-80 transition focus:outline-none touch-manipulation"
                  aria-label="User menu"
                >
                  <div className="h-8 w-8 rounded-sm bg-primary-600 flex items-center justify-center text-white">
                    <FaUserAlt size={14} />
                  </div>
                </button>
                
                {isProfileOpen && (
                  <div 
                    ref={profileMenuRef}
                    className="absolute right-0 mt-2 py-2 w-48 bg-background-elevated rounded shadow-xl z-20"
                  >
                    <Link href="/profile" className="flex items-center px-4 py-3 text-sm hover:bg-background-lighter">
                      <FaUser className="mr-3 text-text-secondary" /> Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                      className="w-full text-left flex items-center px-4 py-3 text-sm text-red-500 hover:bg-background-lighter"
                    >
                      <FaSignOutAlt className="mr-3" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="bg-primary-600 text-white px-4 py-1.5 text-sm font-medium rounded hover:bg-primary-700 transition touch-manipulation"
              >
                Sign In
              </Link>
            )}
            
            {/* Mobile menu toggle button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden text-text-secondary hover:text-white transition touch-manipulation"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div 
          ref={mobileMenuRef}
          className={`fixed inset-0 bg-background z-10 transition-transform duration-300 ease-in-out transform ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          } md:hidden pt-16`}
        >
          <nav className="h-full flex flex-col">
            <ul className="flex-1 p-4 space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="flex items-center py-3 px-4 rounded hover:bg-background-lighter text-lg transition"
                >
                  <FaHome className="mr-3 text-text-secondary" /> 
                  <span>Home</span>
                </Link>
              </li>
              
              {user && (
                <li>
                  <Link 
                    href="/recommendations" 
                    className="flex items-center py-3 px-4 rounded hover:bg-background-lighter text-lg transition"
                  >
                    <FaHeart className="mr-3 text-text-secondary" /> 
                    <span>My Recommendations</span>
                  </Link>
                </li>
              )}
              
              <li>
                <Link 
                  href="/movies" 
                  className="flex items-center py-3 px-4 rounded hover:bg-background-lighter text-lg transition"
                >
                  <FaFilm className="mr-3 text-text-secondary" /> 
                  <span>Movies</span>
                </Link>
              </li>
              
              {user && (
                <li>
                  <Link 
                    href="/watchlist" 
                    className="flex items-center py-3 px-4 rounded hover:bg-background-lighter text-lg transition"
                  >
                    <FaListUl className="mr-3 text-text-secondary" /> 
                    <span>My List</span>
                  </Link>
                </li>
              )}
            </ul>
            
            {user ? (
              <div className="p-4 border-t border-border">
                <Link 
                  href="/profile" 
                  className="flex items-center py-3 px-4 rounded hover:bg-background-lighter text-lg transition"
                >
                  <FaUser className="mr-3 text-text-secondary" /> 
                  <span>Profile</span>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center py-3 px-4 rounded hover:bg-background-lighter text-lg text-primary-600 transition"
                >
                  <FaSignOutAlt className="mr-3" /> 
                  <span>Sign Out</span>
                  </button>
                </div>
              ) : (
              <div className="p-4 border-t border-border">
                <Link 
                  href="/login"
                  className="w-full block text-center bg-primary-600 text-white py-3 px-4 rounded font-medium hover:bg-primary-700 transition"
                >
                  Sign In
                </Link>
              </div>
              )}
          </nav>
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