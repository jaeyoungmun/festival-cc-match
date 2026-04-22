'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Step = 'email' | 'login' | 'consent'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  // 1단계 — 이메일 입력 → 기존/신규 분기
  async function handleEmailNext(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setError('올바른 이메일을 입력해주세요'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/auth/check-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
    setStep(data.exists ? 'login' : 'consent')
  }

  // 2a단계 — 기존 유저: 비밀번호 로그인
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password) { setError('비밀번호를 입력해주세요'); return }
    setLoading(true); setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
      return
    }
    router.replace('/feed')
  }

  // 2b단계 — 신규 유저: 동의 후 OTP 발송
  async function handleConsentNext(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('동의가 필요합니다'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? '이메일 발송에 실패했습니다'); return }
    router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
  }

  return (
    <main className="min-h-screen t-page flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, var(--accent-glow), transparent 65%)' }} />

      <div className="relative w-full" style={{ maxWidth: 360 }}>

        {/* 로고 */}
        <div className="text-center mb-8 anim-fade-up">
          <button onClick={() => router.push('/')} className="text-4xl mb-3 block mx-auto">🎪</button>
          <h1 className="font-bold t-accent-text" style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.9rem' }}>
            축제 인연 찾기
          </h1>
          <p className="text-sm t-sub mt-1">
            {step === 'email'   && '학교 이메일로 시작해요'}
            {step === 'login'   && '비밀번호를 입력해주세요'}
            {step === 'consent' && '처음 오셨군요! 동의 후 가입해요'}
          </p>
        </div>

        {/* ── 1단계: 이메일 입력 ── */}
        {step === 'email' && (
          <form onSubmit={handleEmailNext}
            className="t-card t-card-shadow rounded-3xl p-7 space-y-5 anim-fade-up anim-delay-1">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="t-text text-sm font-medium">학교 이메일</Label>
              <Input id="email" type="email" placeholder="example@university.ac.kr"
                value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                className="rounded-xl bg-transparent t-text h-12"
                style={{ borderColor: 'var(--border)' }} autoFocus required />
              <p className="text-xs t-muted">.ac.kr 또는 .edu 이메일만 가능해요</p>
            </div>
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <button type="submit" disabled={loading || !email}
              className="w-full font-semibold transition-all active:scale-95"
              style={{
                height: 48, borderRadius: 14, fontSize: 15,
                background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
                color: 'var(--accent-text)',
                opacity: (!email || loading) ? 0.45 : 1,
                boxShadow: email ? 'var(--shadow-btn)' : 'none',
              }}>
              {loading ? '확인 중...' : '계속하기 →'}
            </button>
          </form>
        )}

        {/* ── 2a단계: 기존 유저 비밀번호 로그인 ── */}
        {step === 'login' && (
          <form onSubmit={handleLogin}
            className="t-card t-card-shadow rounded-3xl p-7 space-y-5 anim-fade-up">

            {/* 이메일 표시 */}
            <div className="flex items-center justify-between p-3 rounded-xl t-badge"
              style={{ border: '1px solid var(--border)' }}>
              <p className="text-sm t-text truncate">{email}</p>
              <button type="button" onClick={() => { setStep('email'); setPassword(''); setError('') }}
                className="text-xs t-muted ml-2 flex-shrink-0 underline underline-offset-2">
                변경
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="t-text text-sm font-medium">비밀번호</Label>
              <div className="relative">
                <Input id="password" type={showPw ? 'text' : 'password'} placeholder="비밀번호 입력"
                  value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                  className="rounded-xl bg-transparent t-text h-12 pr-12"
                  style={{ borderColor: 'var(--border)' }} autoFocus required />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg t-muted">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}

            <button type="submit" disabled={loading || !password}
              className="w-full font-semibold transition-all active:scale-95"
              style={{
                height: 48, borderRadius: 14, fontSize: 15,
                background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
                color: 'var(--accent-text)',
                opacity: (!password || loading) ? 0.45 : 1,
                boxShadow: password ? 'var(--shadow-btn)' : 'none',
              }}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        )}

        {/* ── 2b단계: 신규 유저 동의 ── */}
        {step === 'consent' && (
          <form onSubmit={handleConsentNext}
            className="t-card t-card-shadow rounded-3xl p-7 space-y-5 anim-fade-up">

            <div className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-accent)' }}>
              <span className="text-xl">👋</span>
              <div>
                <p className="text-xs font-semibold t-text">처음 오셨군요!</p>
                <p className="text-xs t-sub mt-0.5">이메일 인증 후 비밀번호를 설정해요</p>
              </div>
            </div>

            <div className="p-3 rounded-xl t-badge" style={{ border: '1px solid var(--border)' }}>
              <p className="text-xs t-muted mb-0.5">가입 이메일</p>
              <p className="text-sm font-medium t-text">{email}</p>
            </div>

            <label className="flex gap-3 p-4 rounded-2xl cursor-pointer transition-colors"
              style={{
                background: agreed ? 'var(--accent-soft)' : 'var(--bg-card-hover)',
                border: `1px solid ${agreed ? 'var(--border-accent)' : 'var(--border)'}`,
              }}>
              <div className="flex-shrink-0 mt-0.5">
                <input type="checkbox" className="sr-only" checked={agreed}
                  onChange={e => { setAgreed(e.target.checked); setError('') }} />
                <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: agreed ? 'var(--accent-from)' : 'var(--border)',
                    background: agreed
                      ? 'linear-gradient(135deg, var(--accent-from), var(--accent-to))'
                      : 'transparent',
                  }}>
                  {agreed && <span className="text-white font-bold" style={{ fontSize: 11 }}>✓</span>}
                </div>
              </div>
              <p className="text-xs t-sub leading-relaxed">
                <span className="font-semibold" style={{ color: 'var(--accent-from)' }}>
                  내 인스타그램 ID가 이성 회원에게 공개
                </span>됩니다.
                가입은 이에 동의하는 것으로 간주됩니다.{' '}
                <span className="font-medium t-text">반드시 공개 계정</span>으로 설정해주세요.
              </p>
            </label>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}

            <button type="submit" disabled={loading || !agreed}
              className="w-full font-semibold transition-all active:scale-95"
              style={{
                height: 48, borderRadius: 14, fontSize: 15,
                background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
                color: 'var(--accent-text)',
                opacity: (!agreed || loading) ? 0.45 : 1,
                boxShadow: agreed ? 'var(--shadow-btn)' : 'none',
              }}>
              {loading ? '전송 중...' : '인증 코드 받기 ✉️'}
            </button>

            <button type="button" onClick={() => { setStep('email'); setError('') }}
              className="w-full text-sm t-muted">
              ← 이메일 다시 입력
            </button>
          </form>
        )}

        <p className="text-center text-xs t-muted mt-6">
          로그인하면{' '}
          <span style={{ color: 'var(--accent-from)' }}>축제 인연 찾기</span>
          {' '}이용약관에 동의한 것으로 간주돼요
        </p>

      </div>
    </main>
  )
}
