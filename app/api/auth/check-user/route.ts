import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/auth/check-user
// Body: { email: string }
// 해당 이메일로 가입된 프로필이 있는지 확인
// Response: { exists: boolean }
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const { email } = body ?? {}

  if (!email) {
    return NextResponse.json({ error: '이메일이 필요합니다' }, { status: 400 })
  }

  const svc = await createServiceClient()

  const { data } = await svc
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  return NextResponse.json({ exists: !!data })
}
