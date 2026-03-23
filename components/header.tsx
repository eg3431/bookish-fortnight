'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const Header = () => {
  const { theme, setTheme } = useTheme()
  const { user, session } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-bg-dark font-bold">HF</span>
          </div>
          <span className="hidden md:inline font-mono font-bold neon-text">&gt; humor_flavor_chain</span>
        </Link>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark transition"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-primary" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {user && (
            <>
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className="text-right">
                  <p className="font-mono text-primary">{user.email}</p>
                  {(user.is_superadmin || user.is_matrix_admin) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark transition"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
