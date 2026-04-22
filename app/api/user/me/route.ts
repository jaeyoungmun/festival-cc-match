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

  const { data, error } = await supabase
    .from('profiles')
    .select('instagram_id, department, gender, email, is_visible')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[user/me]', error)
    return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json(data)
}
