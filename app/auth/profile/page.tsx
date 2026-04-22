'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ProfileForm() {
  const router = useRouter()
  const email = useSearchParams().get('email') ?? ''
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [instagramId, setInstagramId] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다'); return }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다'); return }
    if (!instagramId) { setError('인스타그램 ID를 입력해주세요'); return }
    if (!gender) { setError('성별을 선택해주세요'); return }

    setLoading(true); setError('')

    // 1. Supabase Auth 비밀번호 업데이트
    const { error: pwError } = await supabase.auth.updateUser({ password })
    if (pwError) {
      setLoading(false)
      setError('비밀번호 설정에 실패했습니다')
      return
    }

    // 2. 프로필 저장
    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instagram_id: instagramId,
        gender,
        department: department || null,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '프로필 저장에 실패했습니다')
      return
    }

    router.replace('/feed')
  }

  const ready = password.length >= 8 && password === passwordConfirm && !!instagramId && !!gender

  return (
    <main className="min-h-screen t-page flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, var(--accent-glow), transparent 65%)' }} />

      <div className="relative w-full" style={{ maxWidth: 360 }}>
        <div className="text-center mb-8 anim-fade-up">
          <div className="text-4xl mb-3">🌸</div>
          <h1 className="font-bold t-accent-text" style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.9rem' }}>
            프로필 설정
          </h1>
          <p className="text-sm t-sub mt-1">마지막 단계예요! 거의 다 왔어요</p>
        </div>

        <form onSubmit={handleSubmit}
          className="t-card t-card-shadow rounded-3xl p-7 space-y-5 anim-fade-up anim-delay-1">

          {/* 비밀번호 */}
          <div className="space-y-1.5">
            <Label className="t-text text-sm font-medium">
              비밀번호 설정 <span style={{ color: 'var(--accent-from)' }}>*</span>
            </Label>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} placeholder="8자 이상"
                value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                className="rounded-xl bg-transparent t-text h-12 pr-12"
                style={{ borderColor: 'var(--border)' }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            <Input type={showPw ? 'text' : 'password'} placeholder="비밀번호 확인"
              value={passwordConfirm} onChange={e => { setPasswordConfirm(e.target.value); setError('') }}
              className="rounded-xl bg-transparent t-text h-12"
              style={{
                borderColor: passwordConfirm && password !== passwordConfirm
                  ? '#ef4444' : 'var(--border)',
              }} />
            {passwordConfirm && password !== passwordConfirm && (
              <p className="text-xs text-red-400">비밀번호가 일치하지 않아요</p>
            )}
          </div>

          {/* 구분선 */}
          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* 인스타 ID */}
          <div className="space-y-1.5">
            <Label className="t-text text-sm font-medium">
              인스타그램 ID <span style={{ color: 'var(--accent-from)' }}>*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm t-muted">@</span>
              <Input type="text" placeholder="your_instagram"
                value={instagramId} onChange={e => setInstagramId(e.target.value.replace(/^@/, ''))}
                className="pl-7 rounded-xl bg-transparent t-text h-12"
                style={{ borderColor: 'var(--border)' }} />
            </div>
            <p className="text-xs t-muted">
              반드시 <span className="font-medium" style={{ color: 'var(--accent-from)' }}>공개 계정</span>으로 설정해주세요
            </p>
          </div>

          {/* 성별 */}
          <div className="space-y-1.5">
            <Label className="t-text text-sm font-medium">
              성별 <span style={{ color: 'var(--accent-from)' }}>*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[{ value: 'male', label: '남자', emoji: '🙋‍♂️' }, { value: 'female', label: '여자', emoji: '🙋‍♀️' }].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setGender(opt.value as 'male' | 'female')}
                  className="py-4 rounded-2xl flex flex-col items-center gap-1 transition-all"
                  style={{
                    border: `2px solid ${gender === opt.value ? 'var(--accent-from)' : 'var(--border)'}`,
                    background: gender === opt.value ? 'var(--accent-soft)' : 'var(--bg-card-hover)',
                  }}>
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm font-medium t-text">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 학과 선택 */}
          <div className="space-y-1.5">
            <Label className="t-text text-sm font-medium">
              학과 <span className="t-muted font-normal text-xs">(선택)</span>
            </Label>
            <Input type="text" placeholder="ex. 경영학과"
              value={department} onChange={e => setDepartment(e.target.value)}
              className="rounded-xl bg-transparent t-text h-12"
              style={{ borderColor: 'var(--border)' }} />
          </div>

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}

          <button type="submit" disabled={loading || !ready}
            className="w-full font-semibold transition-all active:scale-95"
            style={{
              height: 48, borderRadius: 14, fontSize: 15,
              background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
              color: 'var(--accent-text)',
              opacity: (!ready || loading) ? 0.45 : 1,
              boxShadow: ready ? 'var(--shadow-btn)' : 'none',
            }}>
            {loading ? '저장 중...' : '시작하기 🎉'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return <Suspense><ProfileForm /></Suspense>
}
