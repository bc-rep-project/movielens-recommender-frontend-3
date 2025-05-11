import { useState, ChangeEvent, FormEvent, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import axios from 'axios'
import { login } from '../utils/api'
import { useResponsive } from '../utils/device'
import { FaSpinner, FaUser, FaLock, FaExclamationCircle } from 'react-icons/fa'

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
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const validateField = (name: string, value: string): string => {
    if (!value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }
    
    if (name === 'email' && !/\S+@\S+\.\S+/.test(value)) {
      return 'Please enter a valid email address';
    }
    
    return '';
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({...prev, [name]: ''}))
    }
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    
    // Validate all fields
    const errors: {[key: string]: string} = {}
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        errors[key] = error;
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true)
    setFormSubmitted(true)

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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="auth-page-container min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background-elevated to-background"
      >
        <div className="auth-form-wrapper max-w-md w-full space-y-8 bg-background-lighter p-8 rounded-lg shadow-2xl backdrop-blur-sm bg-opacity-95">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-primary-600 mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-center mb-6">
              Sign in to get personalized movie recommendations
            </p>
          </motion.div>
          
          <div className="mb-6">
            <div className="inline-flex w-full rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setUseCustomForm(true)}
                className={`px-4 py-3 text-sm font-medium rounded-l-lg flex-1 sm:flex-auto transition-all duration-200 ${
                  useCustomForm
                    ? 'bg-primary-600 text-white shadow-inner'
                    : 'bg-background-elevated text-gray-300 hover:bg-background-lighter hover:text-white'
                }`}
              >
                Email Login
              </button>
              <button
                type="button"
                onClick={() => setUseCustomForm(false)}
                className={`px-4 py-3 text-sm font-medium rounded-r-lg flex-1 sm:flex-auto transition-all duration-200 ${
                  !useCustomForm
                    ? 'bg-primary-600 text-white shadow-inner'
                    : 'bg-background-elevated text-gray-300 hover:bg-background-lighter hover:text-white'
                }`}
              >
                Social Login
              </button>
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {useCustomForm ? (
              <motion.div
                key="custom-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center"
                  >
                    <FaExclamationCircle className="mr-3 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="form-field relative">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-4 w-4 text-gray-500" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-3 border ${fieldErrors.email ? 'border-red-500 bg-red-900/10' : 'border-gray-700 bg-background focus:border-primary-500'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white transition-all duration-200`}
                        placeholder="your@email.com"
                        autoComplete="email"
                      />
                    </div>
                    <AnimatePresence>
                      {fieldErrors.email && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-red-500 text-xs mt-1 flex items-center"
                        >
                          <FaExclamationCircle className="mr-1" />
                          {fieldErrors.email}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="form-field relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-4 w-4 text-gray-500" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-3 border ${fieldErrors.password ? 'border-red-500 bg-red-900/10' : 'border-gray-700 bg-background focus:border-primary-500'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white transition-all duration-200`}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>
                    <AnimatePresence>
                      {fieldErrors.password && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-red-500 text-xs mt-1 flex items-center"
                        >
                          <FaExclamationCircle className="mr-1" />
                          {fieldErrors.password}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 bg-background-elevated border-gray-700 rounded focus:ring-primary-500 focus:border-primary-500 text-primary-600"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm">
                      <a href="#" className="font-medium text-primary-500 hover:text-primary-400 transition-colors">
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  <div>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full px-5 py-3 text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 font-semibold shadow-md ${
                        loading ? 'opacity-80 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Signing In...
                        </span>
                      ) : 'Sign In'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="auth-ui"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="py-2"
              >
                <Auth
                  supabaseClient={supabaseClient}
                  appearance={{ 
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: '#d03434',
                          brandAccent: '#b81d24',
                          inputBorder: '#333333',
                          inputBackground: '#141414',
                          inputText: '#ffffff',
                          inputPlaceholder: '#666666',
                          messageText: '#ffffff',
                          messageTextDanger: '#ff8383',
                          anchorTextColor: '#d03434',
                          dividerBackground: '#333333'
                        }
                      }
                    }
                  }}
                  theme="dark"
                  providers={['google', 'github']}
                  redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="mt-8 text-center border-t border-gray-700 pt-6"
          >
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-primary-500 hover:text-primary-400 transition-colors">
                Sign up now
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  )
}

export default Login 