import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser, User } from '@supabase/auth-helpers-react'
import { verifyAuth } from '../utils/api'

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
  const supabase = useSupabaseClient()
  const user = useUser()
  const router = useRouter()
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Verify authentication with the backend
  const checkAuthStatus = async () => {
    if (!user) {
      setIsAuthenticated(false)
      setIsLoading(false)
      return
    }

    try {
      console.log('Verifying authentication with backend...')
      const authResult = await verifyAuth()
      setIsAuthenticated(authResult.isAuthenticated)
      console.log('Authentication verified:', authResult.isAuthenticated)
    } catch (err) {
      console.error('Error verifying authentication with backend:', err)
      setError('Failed to verify authentication with the backend')
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Check auth status when user changes
  useEffect(() => {
    checkAuthStatus()
  }, [user])

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return false
      }

      // Auth status will be updated by useEffect when user changes
      return true
    } catch (err: any) {
      setError(err?.message || 'Login failed')
      return false
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      router.push('/login')
    } catch (err: any) {
      setError(err?.message || 'Logout failed')
    }
  }

  // Register function
  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return false
      }

      return true
    } catch (err: any) {
      setError(err?.message || 'Registration failed')
      return false
    }
  }

  // Context value
  const value = {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    logout,
    register,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext) 