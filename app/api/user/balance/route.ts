import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user/balance
// 현재 로그인 유저의 리롤 잔여 횟수 반환
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('reroll_balance')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('[user/balance]', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }

  return NextResponse.json({ balance: data.balance })
}
