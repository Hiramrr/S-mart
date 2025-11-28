import { createClient } from '@supabase/supabase-js'

/**
 * URL del proyecto de Supabase.
 * @type {string}
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
/**
 * Llave anónima pública de Supabase.
 * @type {string}
 */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
/**
 * URL de redirección después del inicio de sesión.
 * @type {string}
 */
const redirectUrl = import.meta.env.VITE_REDIRECT_URL || window.location.origin

/**
 * Instancia del cliente de Supabase.
 *
 * @see https://supabase.com/docs/reference/javascript/create-client
 *
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    redirectTo: redirectUrl
  }
})
