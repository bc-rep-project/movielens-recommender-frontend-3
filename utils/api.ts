import axios from 'axios'
import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create an axios instance with base URL
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Add request interceptor to add authentication token
api.interceptors.request.use(async (config) => {
  try {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  
  return config
  } catch (error) {
    console.error('Error getting auth session:', error)
    return config
  }
})

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Attempt to refresh the token
      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError || !data.session) {
          // Redirect to login if refresh fails
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }
        
        // Retry the original request with new token
        if (originalRequest && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`
          return axios(originalRequest)
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError)
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - API server may be down or unreachable')
      // You could show a toast or notification here
    }
    
    return Promise.reject(error)
  }
)

// Helper function to handle API errors
const handleApiError = (error: unknown, defaultMessage = 'An error occurred') => {
  if (axios.isAxiosError(error)) {
    // Return the error detail from API if available
    if (error.response?.data?.detail) {
      return error.response.data.detail
    }
    
    // Return appropriate message based on status code
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your data.'
      case 401:
        return 'Authentication required. Please log in.'
      case 403:
        return 'You don\'t have permission to access this resource.'
      case 404:
        return 'The requested resource was not found.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return defaultMessage
    }
  }
  
  return defaultMessage
}

// API endpoints with error handling
export const getMovies = async (page = 1, limit = 20) => {
  try {
  const skip = (page - 1) * limit
  const response = await api.get(`/movies?skip=${skip}&limit=${limit}`)
  return response.data
  } catch (error) {
    console.error('Error fetching movies:', error)
    throw new Error(handleApiError(error, 'Failed to fetch movies'))
  }
}

export const getMovie = async (id: string) => {
  // Validate ID format first - MongoDB ObjectId is 24 hex characters
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    console.error(`Invalid movie ID format: ${id}`);
    throw new Error('Invalid movie ID format');
  }

  try {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie ${id}:`, error);
    
    // Handle specific error cases
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Movie not found');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid movie ID format');
      }
      if (error.response?.status === 500) {
        throw new Error('Server error while fetching movie');
      }
    }
    
    throw new Error(handleApiError(error, 'Failed to fetch movie details'));
  }
}

export const searchMovies = async (query: string, page = 1, limit = 20) => {
  try {
  const skip = (page - 1) * limit
  const response = await api.get(`/movies/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`)
  return response.data
  } catch (error) {
    console.error(`Error searching movies with query "${query}":`, error)
    throw new Error(handleApiError(error, 'Failed to search movies'))
  }
}

export const createInteraction = async (userId: string, movieId: string, type = 'view', value?: number) => {
  try {
  const payload = {
    userId,
    movieId,
    type,
    ...(value !== undefined ? { value } : {})
  }
  
  const response = await api.post('/interactions', payload)
  return response.data
  } catch (error) {
    console.error(`Error creating interaction for movie ${movieId}:`, error)
    throw new Error(handleApiError(error, 'Failed to record your interaction'))
  }
}

export const getUserInteractions = async () => {
  try {
    const response = await api.get('/interactions/me')
    return response.data
  } catch (error) {
    console.error('Error fetching user interactions:', error)
    throw new Error(handleApiError(error, 'Failed to fetch your activity history'))
  }
}

export const getUserRecommendations = async (userId?: string, limit = 10) => {
  try {
    // userId is optional and ignored since it's included in the auth token
    const response = await api.get(`/recommendations/user?limit=${limit}`)
  return response.data
  } catch (error) {
    console.error('Error fetching user recommendations:', error)
    throw new Error(handleApiError(error, 'Failed to fetch recommendations'))
  }
}

export const getSimilarMovies = async (movieId: string, limit = 10) => {
  try {
  const response = await api.get(`/recommendations/item/${movieId}?limit=${limit}`)
  // The API can return either an array of movies or an object with similar_items property
  const data = response.data;
  
  // If it's already an array, return it
  if (Array.isArray(data)) {
    return data;
  }
  
  // If it's an object with similar_items, return that array
  if (data && Array.isArray(data.similar_items)) {
    return data.similar_items;
  }
  
  // If it's an object with a movies property, return that array (fallback for some API versions)
  if (data && Array.isArray(data.movies)) {
    return data.movies;
  }
  
  // Return an empty array as fallback
  console.warn(`Unexpected response format from similar movies API: ${JSON.stringify(data)}`);
  return [];
  } catch (error) {
    console.error(`Error fetching similar movies for ${movieId}:`, error)
    throw new Error(handleApiError(error, 'Failed to fetch similar movies'))
  }
}

export const getPopularMovies = async (limit = 10) => {
  try {
  const response = await api.get(`/recommendations/popular?limit=${limit}`)
  return response.data
  } catch (error) {
    console.error('Error fetching popular movies:', error)
    throw new Error(handleApiError(error, 'Failed to fetch popular movies'))
  }
}

// Auth-related functions
export const register = async (email: string, password: string, fullName?: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email,
      password,
      full_name: fullName || undefined
    })
    return response.data
  } catch (error) {
    console.error('Registration error:', error)
    throw new Error(handleApiError(error, 'Failed to register user'))
  }
}

export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    })
    return response.data
  } catch (error) {
    console.error('Login error:', error)
    throw new Error(handleApiError(error, 'Failed to login'))
  }
}

export default api 