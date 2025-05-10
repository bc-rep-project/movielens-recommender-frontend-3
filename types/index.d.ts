// Movie interface that can be used throughout the application
export interface Movie {
  id: string;
  title: string;
  genres: string[];
  poster_url?: string;
  poster_path?: string;
  backdrop_url?: string;
  backdrop_path?: string;
  year?: number;
  overview?: string;
  runtime?: number;
  tmdb_id?: number;
}

// User interface
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

// Rating interface
export interface Rating {
  id: string;
  userId: string;
  movieId: string;
  value: number;
  timestamp: string;
}

// Recommendation interface
export interface Recommendation {
  movie: Movie;
  score: number;
}

// Common response interfaces
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  size: number;
}