import { useState, ChangeEvent, FormEvent } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import axios from 'axios'
import { login } from '../utils/api'
import { useResponsive } from '../utils/device'

const Login = () => {
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const router = useRouter()
  const { isMobile } = useResponsive()
  const [useCustomForm, setUseCustomForm] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    try {
      // Login via backend API
      const response = await login(formData.email, formData.password)
      
      // Set the session in Supabase client
      const { session } = response
      if (session && session.access_token) {
        const { error } = await supabaseClient.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })
        
        if (error) {
          throw error
        }
        
        // Redirect to home page
        router.push('/')
      }
    } catch (error) {
      console.error('Login error:', error)
      
      // Handle different error responses
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setError('Invalid email or password')
        } else if (error.response?.data?.detail) {
          setError(error.response.data.detail)
        } else {
          setError('Login failed. Please try again.')
        }
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Sign In | MovieLens Recommender">
      <div className="max-w-md mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg my-4 sm:my-8">
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Welcome to MovieLens</h1>
        <p className="text-gray-600 text-center mb-6 sm:mb-8">
          Sign in to get personalized movie recommendations
        </p>
        
        <div className="mb-4 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm w-full sm:w-auto" role="group">
            <button
              type="button"
              onClick={() => setUseCustomForm(true)}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg flex-1 sm:flex-auto ${
                useCustomForm
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Email Login
            </button>
            <button
              type="button"
              onClick={() => setUseCustomForm(false)}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg flex-1 sm:flex-auto ${
                !useCustomForm
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Social Login
            </button>
          </div>
        </div>
        
        {useCustomForm ? (
          <div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-4 py-3 text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <Auth
            supabaseClient={supabaseClient}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            providers={['google', 'github']}
            redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
          />
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default Login 