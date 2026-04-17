'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const handleAuthCallback = async () => {
      try {
        // Listen for auth state changes - Supabase will automatically process the hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return

            console.log('Auth event:', event)
            console.log('Session:', session?.user?.email)

            if (event === 'SIGNED_IN' && session?.user) {
              console.log('User signed in successfully:', session.user.email)
              toast.success('Signed in successfully')
              router.push('/dashboard')
              subscription?.unsubscribe()
            } else if (event === 'SIGNED_OUT' || !session?.user) {
              // After a short delay to allow Supabase to process the hash
              setTimeout(() => {
                if (!isMounted) return
                const { data: { session: currentSession } } = supabase.auth.getSession()
                if (!currentSession?.user) {
                  const errorMsg = 'Authentication failed - no valid session'
                  console.error(errorMsg)
                  setError(errorMsg)
                  toast.error('Authentication failed')
                  setTimeout(() => router.push('/'), 2000)
                  subscription?.unsubscribe()
                }
              }, 500)
            }
          }
        )

        // Cleanup
        return () => {
          isMounted = false
          subscription?.unsubscribe()
        }
      } catch (error: any) {
        if (!isMounted) return
        const errorMsg = error.message || 'Authentication failed'
        console.error('Auth callback error:', error)
        setError(errorMsg)
        toast.error(errorMsg)
        await supabase.auth.signOut()
        setTimeout(() => router.push('/'), 2000)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-light dark:bg-bg-dark">
      <div className="text-center">
        {error ? (
          <>
            <p className="font-mono text-red-500 mb-4">&gt; error: {error}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-mono text-primary">&gt; authenticating...</p>
          </>
        )}
      </div>
    </div>
  )
}
