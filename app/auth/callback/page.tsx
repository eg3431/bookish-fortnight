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
        
        // For now, allow all authenticated users - can add role check via env var later
        console.log('User authenticated, redirecting to dashboard')
        toast.success('Signed in successfully')
        router.push('/dashboard')
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
