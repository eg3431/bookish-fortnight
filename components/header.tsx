'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, LogOut, BarChart2, Star } from 'lucide-react'
import { useAuth } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const Header = () => {
  const { theme, setTheme } = useTheme()
  const { user, session } = useAuth()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`hidden md:inline-flex items-center text-xs font-mono px-3 py-1.5 rounded-lg border transition ${
        pathname === href
          ? 'border-primary text-primary bg-primary bg-opacity-10'
          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-bg-dark font-bold">HF</span>
            </div>
            <span className="hidden md:inline font-mono font-bold neon-text">&gt; humor_flavor_chain</span>
          </Link>

          {/* Nav links */}
          {session && (
            <nav className="flex items-center space-x-2">
              {navLink('/dashboard', '⚡ Flavors')}
              {navLink('/admin', '📊 Admin Stats')}
              {navLink('/rate', '⭐ Rate Captions')}
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
              <span className="hidden md:block text-xs font-mono text-gray-500 dark:text-gray-400 max-w-[140px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
