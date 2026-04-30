import { createClient } from '@supabase/supabase-js'

// Custom fetch with a 15s timeout so Supabase calls never hang forever
const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 15000)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(id))
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { global: { fetch: fetchWithTimeout } }
)

// Cached auth state — updated by AuthProvider and onAuthStateChange
export let cachedUserId: string | undefined = undefined
export let cachedAccessToken: string | undefined = undefined

export function setCachedAuth(userId?: string, accessToken?: string) {
  cachedUserId = userId
  cachedAccessToken = accessToken
}

supabase.auth.onAuthStateChange((_event, session) => {
  cachedUserId = session?.user?.id
  cachedAccessToken = session?.access_token ?? undefined
})

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
