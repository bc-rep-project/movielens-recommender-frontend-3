import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import MovieCard from './MovieCard'
import { Movie } from '../types/common'

interface MovieRowProps {
  title: string
  movies?: Movie[]
  viewMoreLink?: string
  isLoading?: boolean
  error?: any
  size?: 'small' | 'medium' | 'large'
}

const MovieRow: React.FC<MovieRowProps> = ({ 
  title, 
  movies, 
  viewMoreLink, 
  isLoading = false, 
  error = null,
  size = 'medium'
}) => {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check arrow visibility based on scroll position
  const checkArrows = () => {
    if (!sliderRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current
    setShowLeftArrow(scrollLeft > 20)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20)
  }

  useEffect(() => {
    const slider = sliderRef.current
    if (slider) {
      slider.addEventListener('scroll', checkArrows)
      // Initial check
      checkArrows()
    }
    
    return () => {
      if (slider) {
        slider.removeEventListener('scroll', checkArrows)
      }
    }
  }, [movies])

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return
    
    const slider = sliderRef.current
    const scrollAmount = slider.clientWidth * 0.75
    
    if (direction === 'left') {
      slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else {
      slider.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }
  
  // Touch/drag handlers for mobile swipe
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true)
    
    if ('touches' in e) {
      // Touch event
      setStartX(e.touches[0].pageX)
    } else {
      // Mouse event
      setStartX(e.pageX)
    }
    
    if (sliderRef.current) {
      setScrollLeft(sliderRef.current.scrollLeft)
    }
  }
  
  const handleDragEnd = () => {
    setIsDragging(false)
  }
  
  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !sliderRef.current) return
    
    e.preventDefault()
    
    let currentX = 0
    if ('touches' in e) {
      // Touch event
      currentX = e.touches[0].pageX
    } else {
      // Mouse event
      currentX = e.pageX
    }
    
    const walk = (currentX - startX) * 2 // Multiply for faster scrolling
    sliderRef.current.scrollLeft = scrollLeft - walk
  }

  // Render movie placeholders while loading
  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <div 
        key={`skeleton-${index}`} 
        className={`
          ${size === 'small' ? 'w-28 h-40 sm:w-32 sm:h-48' : ''}
          ${size === 'medium' ? 'w-36 h-52 sm:w-40 sm:h-60' : ''}
          ${size === 'large' ? 'w-40 h-60 sm:w-48 sm:h-72' : ''}
          bg-background-lighter animate-pulse rounded-sm flex-shrink-0 mx-1
        `}
      />
    ))
  }

  // If error occurred
  if (error) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-text-primary">{title}</h2>
        </div>
        <div className="p-4 bg-red-900/20 rounded-md">
          <p className="text-red-400">Error loading movies: {error.message || 'Something went wrong'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8 movie-row">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-text-primary">{title}</h2>
        
        {viewMoreLink && !isLoading && movies && movies.length > 0 && (
          <Link 
            href={viewMoreLink} 
            className="text-text-secondary hover:text-text-primary text-sm transition"
          >
            View All
          </Link>
        )}
      </div>
      
      <div className="relative group">
        {/* Left scroll button */}
        {!isMobile && showLeftArrow && (
          <button 
            onClick={() => scroll('left')} 
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background-lighter/90 text-white p-2 rounded-full shadow-lg transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <FaChevronLeft size={20} />
          </button>
        )}
        
        {/* Movie slider */}
        <div 
          ref={sliderRef}
          className={`
            flex overflow-x-auto scrollbar-hide space-x-2 py-2
            ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          `}
          onMouseDown={isMobile ? handleDragStart : undefined}
          onMouseUp={isMobile ? handleDragEnd : undefined}
          onMouseLeave={isMobile ? handleDragEnd : undefined}
          onMouseMove={isMobile ? handleDragMove : undefined}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          onTouchMove={handleDragMove}
        >
          {isLoading ? (
            renderSkeletons()
          ) : movies && movies.length > 0 ? (
            movies.map((movie) => (
              <div key={movie.id} className="flex-shrink-0 px-1">
                <MovieCard movie={movie} size={size} />
              </div>
            ))
          ) : (
            <div className="py-8 px-4 text-text-secondary italic">
              No movies available
            </div>
          )}
        </div>
        
        {/* Right scroll button */}
        {!isMobile && showRightArrow && (
          <button 
            onClick={() => scroll('right')} 
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background-lighter/90 text-white p-2 rounded-full shadow-lg transform translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <FaChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

export default MovieRow 