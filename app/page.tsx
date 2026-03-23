'use client'

import React from 'react'
import { LoginForm } from '@/components'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && session) {
      router.push('/dashboard')
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-mono text-primary">&gt; loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary rounded flex items-center justify-center">
              <span className="text-bg-dark font-bold text-lg">HF</span>
            </div>
          </div>
          <h1 className="text-3xl font-mono font-bold neon-text">&gt; humor_flavor_chain</h1>
          <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">&gt; admin access only</p>
        </div>

        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-surface-dark">
          <LoginForm />
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400 font-mono space-y-1">
          <p>&gt; superadmin or matrix_admin required</p>
          <p>&gt; authorized access only</p>
        </div>
      </div>
    </div>
  )
}
