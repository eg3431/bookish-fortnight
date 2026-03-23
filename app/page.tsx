'use client'

import React, { useEffect } from 'react'
import { LoginForm } from '@/components'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (session && !isLoading) {
      router.push('/dashboard')
    }
  }, [session, isLoading, router])

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
          <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">&gt; prompt chain editor</p>
        </div>

        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-surface-dark">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-6">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-mono text-sm text-primary">&gt; initializing...</p>
            </div>
          ) : (
            <LoginForm />
          )}
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400 font-mono space-y-1">
          <p>&gt; google sso login</p>
          <p>&gt; powered by supabase</p>
        </div>
      </div>
    </div>
  )
}
