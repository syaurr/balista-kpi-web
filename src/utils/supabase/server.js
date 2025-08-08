import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Ini adalah satu-satunya fungsi yang akan kita gunakan di semua file sisi server.
// Perhatikan bahwa ia tidak lagi menerima argumen 'cookies()'.
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        // CATATAN: Bagian 'set' dan 'remove' sengaja dikosongkan
        // karena kita tidak akan memodifikasi cookies di Server Component.
        // Ini adalah pola yang aman untuk mencegah error.
        set(name, value, options) {},
        remove(name, options) {},
      },
    }
  )
}