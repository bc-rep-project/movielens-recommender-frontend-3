import { useState, useEffect } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { FaPlay, FaInfoCircle } from 'react-icons/fa'
import Layout from '../components/Layout'
import MovieCard from '../components/MovieCard'
import MoviePlaceholder from '../components/MoviePlaceholder'
import { getMovies, getPopularMovies, getUserRecommendations } from '../utils/api'
import { Movie } from '../types/common'

// MovieRow component props
interface MovieRowProps {
  title: string;
  movies: Movie[] | null | undefined;
  viewMoreLink?: string;
  isLoading: boolean;
  error: any;
}

// MovieRow component for horizontal scrolling
const MovieRow = ({ title, movies, viewMoreLink, isLoading, error }: MovieRowProps) => {
  if (isLoading) return <div className="h-[210px] bg-background-lighter rounded animate-pulse"></div>
  if (error) return <p className="text-text-secondary">Error loading movies</p>
  if (!movies?.length) return null

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        {viewMoreLink && (
          <Link href={viewMoreLink} className="text-sm text-text-secondary hover:text-text-primary">
            View More
          </Link>
        )}
      </div>
      <div className="movies-row">
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
    </section>
  )
}

// Hero Banner component props
interface HeroBannerProps {
  movie: Movie;
}

// Hero Banner component
const HeroBanner = ({ movie }: HeroBannerProps) => {
  if (!movie) return null;
  
  const [backdropError, setBackdropError] = useState(false);
  const backdropUrl = !backdropError && (movie.backdrop_url || 
    (movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null));
  
  const handleBackdropError = () => {
    setBackdropError(true);
  };
  
  return (
    <div className="relative w-full h-[70vh] mb-10 -mt-16">
      {/* Backdrop Image */}
      <div className="absolute inset-0 z-0">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            priority
            className="object-cover"
            onError={handleBackdropError}
          />
        ) : (
          <div className="w-full h-full bg-background-elevated">
            <MoviePlaceholder title={movie.title} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full max-w-screen-lg mx-auto px-4 pb-20">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          {movie.title}
        </h1>
        <p className="text-lg text-white max-w-xl mb-6 drop-shadow">
          {movie.genres.join(' • ')}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link 
            href={`/movies/${movie.id}`}
            className="flex items-center bg-white text-black px-6 py-2 rounded font-medium hover:bg-white/90 transition-colors"
          >
            <FaPlay className="mr-2" />
            Play
          </Link>
          <Link 
            href={`/movies/${movie.id}`}
            className="flex items-center bg-background-elevated/80 text-white px-6 py-2 rounded font-medium hover:bg-background-elevated transition-colors"
          >
            <FaInfoCircle className="mr-2" />
            More Info
          </Link>
        </div>
      </div>
    </div>
  );
};

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

  // Fetch movies for hero banner (use popular movies for now)
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  
  useEffect(() => {
    if (popularMovies?.length > 0) {
      // Select a random movie from popular movies for hero banner
      const randomIndex = Math.floor(Math.random() * popularMovies.length);
      setHeroMovie(popularMovies[randomIndex]);
    }
  }, [popularMovies]);

  const isLoading = !popularMovies && !popularError;
  const hasRecommendations = userRecommendations?.length > 0;

  return (
    <Layout title="Home | NetflixLens" fullWidth>
      {/* Hero Banner */}
      {heroMovie && <HeroBanner movie={heroMovie} />}

      <div className="main-container pb-16">
        {/* User recommendations */}
        {user && hasRecommendations && (
          <MovieRow
            title="Recommended for You"
            movies={userRecommendations}
            viewMoreLink="/recommendations"
            isLoading={!userRecommendations && !recommendationsError && user !== null}
            error={recommendationsError}
          />
        )}

        {/* Popular movies */}
        <MovieRow
          title="Popular on NetflixLens"
          movies={popularMovies}
          isLoading={isLoading}
          error={popularError}
        />

        {/* Recent movies */}
        <MovieRow
          title="New Releases"
          movies={recentMovies}
          isLoading={!recentMovies && !recentError}
          error={recentError}
        />

        {/* Genres Sections */}
        {popularMovies && (
          <>
            <MovieRow
              title="Action & Adventure"
              movies={popularMovies.filter((movie: any) => 
                movie.genres.some((genre: string) => ['Action', 'Adventure'].includes(genre))
              )}
              isLoading={isLoading}
              error={popularError}
            />
            
            <MovieRow
              title="Comedy"
              movies={popularMovies.filter((movie: any) => 
                movie.genres.includes('Comedy')
              )}
              isLoading={isLoading}
              error={popularError}
            />
          </>
        )}
      </div>
    </Layout>
  )
}

export default Home 