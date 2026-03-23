'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        if (!session?.user) {
          console.log('No session found, redirecting to login')
          router.push('/')
          return
        }

        console.log('Session found for user:', session.user.email)

        // Check admin status with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_superadmin, is_matrix_admin')
            .eq('id', session.user.id)
            .single()

          clearTimeout(timeoutId)

          if (profileError?.code === 'PGRST116') {
            // Profile doesn't exist - user not authorized
            console.log('Profile not found - user not authorized')
            toast.error('You do not have permission to access this application')
            await supabase.auth.signOut()
            router.push('/')
            return
          }

          if (profileError) {
            console.error('Profile fetch error:', profileError)
            throw profileError
          }

          if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
            console.log('User is not an admin')
            toast.error('You do not have permission to access this application')
            await supabase.auth.signOut()
            router.push('/')
            return
          }

          console.log('User is authorized, redirecting to dashboard')
          toast.success('Signed in successfully')
          router.push('/dashboard')
        } catch (error: any) {
          clearTimeout(timeoutId)
          if (error.name === 'AbortError') {
            console.error('Profile check timeout')
            toast.error('Authorization check timed out')
          } else {
            console.error('Profile check error:', error)
            throw error
          }
          router.push('/')
        }
      } catch (error: any) {
        console.error('Auth callback error:', error)
        toast.error('Authentication failed')
        await supabase.auth.signOut()
        router.push('/')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-light dark:bg-bg-dark">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-mono text-primary">&gt; authenticating...</p>
      </div>
    </div>
  )
}
