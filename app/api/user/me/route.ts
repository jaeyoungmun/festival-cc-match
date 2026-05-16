import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user/me
// 현재 로그인 유저의 프로필 반환
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  // character_preference 컬럼 마이그레이션이 미적용된 환경에서도 동작하도록 폴백한다.
  const withPref = await supabase
    .from('profiles')
    .select('instagram_id, gender, email, character, character_preference')
    .eq('id', user.id)
    .maybeSingle()

  if (withPref.error && withPref.error.code !== '42703') {
    console.error('[user/me]', withPref.error)
    return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 })
  }

  if (withPref.data) {
    return NextResponse.json(withPref.data)
  }

  // 42703 (undefined_column) → character_preference 없이 재조회
  const base = await supabase
    .from('profiles')
    .select('instagram_id, gender, email, character')
    .eq('id', user.id)
    .maybeSingle()

  if (base.error || !base.data) {
    console.error('[user/me]', base.error)
    return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json({ ...base.data, character_preference: null })
}
