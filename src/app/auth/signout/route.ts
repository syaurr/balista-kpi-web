import { createClient } from '../../../utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const supabase = createClient()

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
}