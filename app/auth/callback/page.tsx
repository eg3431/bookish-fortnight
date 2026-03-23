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
        // Get the session after OAuth callback
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Check if user is admin
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_superadmin, is_matrix_admin')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
            console.error('Profile fetch error:', profileError)
            // Create profile if it doesn't exist
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                is_superadmin: false,
                is_matrix_admin: false,
              })

            if (insertError) {
              console.error('Profile creation error:', insertError)
            }

            toast.error('You do not have permission to access this application')
            await supabase.auth.signOut()
            router.push('/')
            return
          }

          if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
            toast.error('You do not have permission to access this application')
            await supabase.auth.signOut()
            router.push('/')
            return
          }

          toast.success('Signed in successfully')
          router.push('/dashboard')
        } else {
          router.push('/')
        }
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
