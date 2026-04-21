import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth/verify-code
// Body: { email: string, token: string }
// OTP 코드 검증 → 세션 발급
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const { email, token } = body ?? {}

  if (!email || !token) {
    return NextResponse.json({ error: '이메일과 코드가 필요합니다' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error || !data.session) {
    return NextResponse.json({ error: '코드가 올바르지 않거나 만료되었습니다' }, { status: 400 })
  }

  // 프로필 존재 여부 확인 → 이미 가입한 유저면 피드로
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user!.id)
    .maybeSingle()

  return NextResponse.json({
    success: true,
    hasProfile: !!profile,
  })
}
