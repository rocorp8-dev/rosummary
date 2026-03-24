import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Use request origin so it works in any environment (local + production)
  const origin = req.nextUrl.origin
  return NextResponse.redirect(new URL('/auth/login', origin), { status: 303 })
}
