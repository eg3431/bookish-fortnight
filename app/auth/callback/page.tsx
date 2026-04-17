'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// Don't prerender this page - it's a dynamic auth callback
export const dynamic = 'force-dynamic'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Give Supabase time to process the hash fragment
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Get the session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          toast.error('Authentication failed')
          router.push('/')
          return
        }

        if (!session?.user) {
          console.log('No session found')
          toast.error('No active session')
          router.push('/')
          return
        }

        console.log('Authenticated as:', session.user.email)
        toast.success('Signed in successfully')
        router.push('/dashboard')
      } catch (error: any) {
        console.error('Auth callback error:', error)
        toast.error('Authentication failed')
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
