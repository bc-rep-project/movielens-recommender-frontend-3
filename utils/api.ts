import axios from 'axios'
import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create an axios instance with base URL
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to add authentication token
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  
  return config
})

// API endpoints
export const getMovies = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit
  const response = await api.get(`/movies?skip=${skip}&limit=${limit}`)
  return response.data
}

export const getMovie = async (id: string) => {
  const response = await api.get(`/movies/${id}`)
  return response.data
}

export const searchMovies = async (query: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit
  const response = await api.get(`/movies/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`)
  return response.data
}

export const createInteraction = async (userId: string, movieId: string, type = 'view', value?: number) => {
  const payload = {
    userId,
    movieId,
    type,
    ...(value !== undefined ? { value } : {})
  }
  
  const response = await api.post('/interactions', payload)
  return response.data
}

export const getUserRecommendations = async (userId: string, limit = 10) => {
  const response = await api.get(`/recommendations/user/${userId}?limit=${limit}`)
  return response.data
}

export const getSimilarMovies = async (movieId: string, limit = 10) => {
  const response = await api.get(`/recommendations/item/${movieId}?limit=${limit}`)
  return response.data
}

export const getPopularMovies = async (limit = 10) => {
  const response = await api.get(`/recommendations/popular?limit=${limit}`)
  return response.data
}

export default api 