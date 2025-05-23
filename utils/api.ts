import axios from 'axios'
import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Debug API URL to help troubleshoot backend connection issues
console.log(`API URL configured as: ${API_URL}`)

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
    // Get session from Supabase
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
      // Debug auth token (only showing first and last few characters for security)
      if (process.env.NODE_ENV === 'development') {
        const tokenPreview = `${session.access_token.substring(0, 5)}...${session.access_token.substring(session.access_token.length - 5)}`
        console.debug(`Adding auth token to request: ${tokenPreview}`)
      }
    } else {
      console.warn('No authentication token available for request to:', config.url)
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

    // Log detailed error information
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`API Error ${error.response.status} for ${originalRequest?.url}:`, 
          error.response.data, 
          'Headers:', error.response.headers
        )
      } else if (error.request) {
        console.error('No response received:', error.request)
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('Authentication error 401 - attempting to refresh token')
      // Attempt to refresh the token
      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError || !data.session) {
          // Redirect to login if refresh fails
          if (typeof window !== 'undefined') {
            console.error('Token refresh failed, redirecting to login')
            window.location.href = '/login'
          }
          return Promise.reject(error)
        }
        
        console.log('Token refreshed successfully, retrying request')
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
    } else if (error.response?.status === 403) {
      console.error('Permission denied (403) - user may not have proper permissions')
      // For 403 errors, we could handle them gracefully here
      // Optionally redirect to login or show a permission error message
    } else if (error.response?.status === 404) {
      console.error('Resource not found (404) - check ID formats and endpoints')
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
    console.debug(`Fetching movies from ${API_URL}/api/movies with page=${page}, limit=${limit}`)
    const skip = (page - 1) * limit
    const response = await api.get(`/movies?skip=${skip}&limit=${limit}`)
    console.debug(`Received ${response.data?.length || 0} movies from API`)
    return response.data
  } catch (error) {
    console.error('Error fetching movies:', error)
    if (axios.isAxiosError(error)) {
      console.error('API Response:', error.response?.data)
      console.error('Status:', error.response?.status)
    }
    throw new Error(handleApiError(error, 'Failed to fetch movies'))
  }
}

export const getMovie = async (id: string) => {
  try {
  const response = await api.get(`/movies/${id}`)
  return response.data
  } catch (error) {
    console.error(`Error fetching movie ${id}:`, error)
    throw new Error(handleApiError(error, 'Failed to fetch movie details'))
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
    // Extract recommendations array from response
    const data = response.data
    
    // If it's already an array, return it
    if (Array.isArray(data)) {
      return data
    }
    
    // If it's an object with 'recommendations' property, return that
    if (data && Array.isArray(data.recommendations)) {
      return data.recommendations
    }
    
    // Return empty array as fallback
    console.warn(`Unexpected response format from user recommendations API: ${JSON.stringify(data)}`)
    return []
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
    // Extract recommendations array from response
    const data = response.data
    
    // If it's already an array, return it
    if (Array.isArray(data)) {
      return data
    }
    
    // If it's an object with 'recommendations' property, return that
    if (data && Array.isArray(data.recommendations)) {
      return data.recommendations
    }
    
    // Return empty array as fallback
    console.warn(`Unexpected response format from popular movies API: ${JSON.stringify(data)}`)
    return []
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

// Function to verify authentication status
export const verifyAuth = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      return { isAuthenticated: false };
    }
    
    // Verify the token with the backend
    try {
      const response = await api.get('/auth/verify');
      return { 
        isAuthenticated: true, 
        user: response.data.user
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return { isAuthenticated: false, error };
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false, error };
  }
};

export default api 