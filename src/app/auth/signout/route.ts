import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server' // <-- Impor 'NextRequest'
import { cookies } from 'next/headers'

// --- PERBAIKAN: Tambahkan tipe 'NextRequest' ke parameter 'req' ---
export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createClient()

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
    await fetch(`/api/revalidate?path=/&type=layout`, {
      method: 'POST',
    })
  }

  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
}

async function revalidatePath(path: string, type: string) {
  try {
    await fetch(`/api/revalidate?path=${path}&type=${type}`, {
      method: 'POST',
    })
  } catch (error) {
    console.error('Failed to revalidate:', error)
  }
}
