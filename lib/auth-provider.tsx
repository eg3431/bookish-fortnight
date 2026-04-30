'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, setCachedAuth } from './supabase'
import { Session } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  isLoading: boolean
  user: any
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  user: null,
  isAdmin: false,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Set a timeout for session check
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        )

        const sessionPromise = supabase.auth.getSession()
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any

        setSession(session)
        setCachedAuth(session?.user?.id, session?.access_token ?? undefined)

        if (session) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            setUser(data)
            setIsAdmin(data?.is_superadmin || data?.is_matrix_admin)
          } catch (profileError) {
            console.warn('Could not fetch profile:', profileError)
            setUser(null)
            setIsAdmin(false)
          }
        }
      } catch (error) {
        console.error('Error getting session:', error)
        setSession(null)
        setUser(null)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setCachedAuth(session?.user?.id, session?.access_token ?? undefined)

        if (session) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            setUser(data)
            setIsAdmin(data?.is_superadmin || data?.is_matrix_admin)
          } catch (error) {
            console.error('Error fetching profile:', error)
            setUser(null)
            setIsAdmin(false)
          }
        } else {
          setUser(null)
          setIsAdmin(false)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, isLoading, user, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
