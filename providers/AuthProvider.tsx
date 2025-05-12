import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { User } from '../types/common'

// Define types for auth context
type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (email: string, password: string) => Promise<boolean>
}

// Create a context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  login: async () => false,
  logout: async () => {},
  register: async () => false,
})

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabaseUser = useUser()
  const supabase = useSupabaseClient()
  const router = useRouter()
  
  // Convert Supabase user to our app User type
  const user: User | null = supabaseUser ? {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
  } : null

  const isAuthenticated = !!user
  
  // Check auth status on first load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true)
        // Nothing to do here as useUser() already gives us the authenticated user
        // Just set loading to false after a small delay for smoother UX
        const delay = setTimeout(() => {
          setIsLoading(false)
        }, 500)
        
        return () => clearTimeout(delay)
      } catch (error) {
        console.error('Error checking auth status:', error)
        setError('Session verification failed')
        setIsLoading(false)
      }
    }
    
    checkAuthStatus()
  }, [supabaseUser])
  
  // Login with email and password
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setError(error.message)
        setIsLoading(false)
        return false
      }
      
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred during login')
      setIsLoading(false)
      return false
    }
  }
  
  // Logout
  const logout = async (): Promise<void> => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        setError(error.message)
      } else {
        // Redirect to home page after logout
        router.push('/')
      }
    } catch (error) {
      console.error('Logout error:', error)
      setError('An unexpected error occurred during logout')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Register with email and password
  const register = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        setError(error.message)
        setIsLoading(false)
        return false
      }
      
      // Success, but user may need to confirm email
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Registration error:', error)
      setError('An unexpected error occurred during registration')
      setIsLoading(false)
      return false
    }
  }
  
  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      error,
      login,
      logout,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext) 