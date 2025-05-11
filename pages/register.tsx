import { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import axios from 'axios'
import { useUser } from '@supabase/auth-helpers-react'
import { register } from '../utils/api'
import { FaSpinner, FaUser, FaLock, FaExclamationCircle, FaUserAlt, FaCheck } from 'react-icons/fa'

const Register = () => {
  const router = useRouter()
  const user = useUser()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Redirect if user is already logged in
  if (user) {
    router.push('/')
    return null
  }

  const validateField = (name: string, value: string, allValues: typeof formData): string => {
    if (!value.trim() && name !== 'full_name') {
      return `${name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
    }
    
    if (name === 'email' && !/\S+@\S+\.\S+/.test(value)) {
      return 'Please enter a valid email address';
    }
    
    if (name === 'password' && value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    
    if (name === 'confirmPassword' && value !== allValues.password) {
      return 'Passwords do not match';
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
    setLoading(true)

    // Validate all fields
    const errors: {[key: string]: string} = {}
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value, formData);
      if (error) {
        errors[key] = error;
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      // Submit registration to backend API
      await register(formData.email, formData.password, formData.full_name)

      setSuccess(true)
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
      })
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle different error responses
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          setError('User with this email already exists')
        } else if (error.response?.data?.detail) {
          setError(error.response.data.detail)
        } else {
          setError('Registration failed. Please try again.')
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
    <Layout title="Sign Up | MovieLens Recommender">
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
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-primary-600 mb-2">Join MovieLens</h1>
            <p className="text-gray-400 text-center mb-6">
              Sign up to get personalized movie recommendations
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-900/30 border border-green-500/50 text-white px-6 py-8 rounded-lg text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
                  <FaCheck className="text-green-500 text-2xl" />
                </div>
                <h3 className="font-bold text-xl mb-2">Registration Successful!</h3>
                <p className="mb-4">Your account has been created.</p>
                <p className="text-sm text-gray-300">Redirecting to login page...</p>
                <motion.div 
                  className="w-full h-1 bg-gray-800 mt-4 rounded overflow-hidden" 
                  style={{ position: 'relative' }}
                >
                  <motion.div 
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
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

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="form-field relative">
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">
                      Full Name <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUserAlt className="h-4 w-4 text-gray-500" />
                      </div>
                      <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-3 border border-gray-700 bg-background focus:border-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white transition-all duration-200"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="form-field relative">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
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
                      Password <span className="text-red-500">*</span>
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
                        placeholder="Minimum 6 characters"
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

                  <div className="form-field relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-4 w-4 text-gray-500" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-3 border ${fieldErrors.confirmPassword ? 'border-red-500 bg-red-900/10' : 'border-gray-700 bg-background focus:border-primary-500'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white transition-all duration-200`}
                        placeholder="Retype your password"
                      />
                    </div>
                    <AnimatePresence>
                      {fieldErrors.confirmPassword && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-red-500 text-xs mt-1 flex items-center"
                        >
                          <FaExclamationCircle className="mr-1" />
                          {fieldErrors.confirmPassword}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-6">
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
                          Creating Account...
                        </span>
                      ) : 'Create Account'}
                    </motion.button>
                  </div>
                </form>
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
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary-500 hover:text-primary-400 transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  )
}

export default Register 