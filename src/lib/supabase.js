import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase URL or Anon Key not found. Please check your .env file.')
}

// Custom fetch with a 10-second timeout to prevent hanging
const fetchWithTimeout = (url, options = {}) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timeout))
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        global: { fetch: fetchWithTimeout },
        auth: { persistSession: true, autoRefreshToken: true },
    }
)

// Helper: quickly test if the Supabase project is reachable (3s timeout)
export async function testConnection() {
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        const res = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: { apikey: supabaseAnonKey },
            signal: controller.signal,
        })
        clearTimeout(timeout)
        return res.ok
    } catch {
        return false
    }
}
