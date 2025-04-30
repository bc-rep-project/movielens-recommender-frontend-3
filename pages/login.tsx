import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'

const Login = () => {
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const router = useRouter()

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  return (
    <Layout title="Sign In | MovieLens Recommender">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to MovieLens Recommender</h1>
        <p className="text-gray-600 text-center mb-8">
          Sign in to get personalized movie recommendations
        </p>
        
        <Auth
          supabaseClient={supabaseClient}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={['google', 'github']}
          redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
        />
      </div>
    </Layout>
  )
}

export default Login 