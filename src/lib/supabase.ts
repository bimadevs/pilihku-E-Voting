import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''

if (!supabaseUrl && process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

