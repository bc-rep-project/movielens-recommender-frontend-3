import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';
import MoviePlaceholder from './MoviePlaceholder';
import { Movie } from '../types/common';

interface HeroBannerProps {
  movie: Movie;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ movie }) => {
  if (!movie) return null;
  
  const [backdropError, setBackdropError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get backdrop URL - either direct backdrop_url from API or construct from backdrop_path
  const backdropUrl = !backdropError && (
    movie.backdrop_url || 
    (movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null)
  );
  
  const handleBackdropError = () => {
    setBackdropError(true);
  };
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] mb-6 sm:mb-10 -mt-16">
      {/* Backdrop Image */}
      <div className="absolute inset-0 z-0">
        {isLoading && (
          <div className="absolute inset-0 bg-background-elevated animate-pulse" />
        )}
        
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            onError={handleBackdropError}
            onLoad={handleImageLoad}
          />
        ) : (
          <div className="w-full h-full bg-background-elevated">
            <MoviePlaceholder title={movie.title} />
          </div>
        )}
        
        {/* Gradient overlay - darker on mobile for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 sm:from-background sm:via-background/70 sm:to-background/30" />
      </div>
      
      {/* Content - adjust positioning and font sizes for mobile */}
      <div className="relative z-10 flex flex-col justify-end h-full max-w-screen-lg mx-auto px-4 pb-8 sm:pb-12 md:pb-20">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg line-clamp-2">
          {movie.title}
        </h1>
        
        <p className="text-sm sm:text-base md:text-lg text-white max-w-xl mb-4 sm:mb-6 drop-shadow line-clamp-2 sm:line-clamp-3">
          {movie.genres?.join(' • ')}
        </p>
        
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <Link 
            href={`/movies/${movie.id}`}
            className="flex items-center bg-white text-black px-4 sm:px-6 py-2 rounded font-medium hover:bg-white/90 transition-colors touch-manipulation"
          >
            <FaPlay className="mr-2" />
            <span className="text-sm sm:text-base">Play</span>
          </Link>
          
          <Link 
            href={`/movies/${movie.id}`}
            className="flex items-center bg-background-elevated/80 text-white px-4 sm:px-6 py-2 rounded font-medium hover:bg-background-elevated transition-colors touch-manipulation"
          >
            <FaInfoCircle className="mr-2" />
            <span className="text-sm sm:text-base">More Info</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner; 