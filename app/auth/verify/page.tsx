'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Suspense } from 'react'

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCool, setResendCool] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // 재전송 쿨다운 타이머
  useEffect(() => {
    if (resendCool <= 0) return
    const t = setTimeout(() => setResendCool(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCool])

  function handleInput(idx: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...code]
    next[idx] = val.slice(-1)
    setCode(next)
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 6) { setError('6자리를 모두 입력해주세요'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token: fullCode }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? '코드가 올바르지 않습니다'); return }

    router.push('/auth/profile')
  }

  async function handleResend() {
    if (resendCool > 0) return
    await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setResendCool(60)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #fce7f3 50%, #ede9fe 100%)' }}>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #f472b6, transparent)' }} />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-3xl font-bold mb-2"
            style={{
              fontFamily: "'Gaegu', cursive",
              background: 'linear-gradient(135deg, #ec4899, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            코드 확인
          </h1>
          <p className="text-sm text-gray-500" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            <span className="font-medium text-pink-400">{email}</span>으로<br />
            6자리 코드를 보냈어요
          </p>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-pink-100 space-y-8">

          {/* 6자리 입력 박스 */}
          <div className="flex gap-2 justify-center">
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputRefs.current[idx] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className="w-11 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all"
                style={{
                  borderColor: digit ? '#ec4899' : '#e5e7eb',
                  background: digit ? 'rgba(244,114,182,0.06)' : 'white',
                  color: '#1f2937',
                  fontFamily: "'Gaegu', cursive",
                }}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || code.join('').length < 6}
            className="w-full rounded-xl h-12 font-semibold text-white"
            style={{
              background: code.join('').length === 6
                ? 'linear-gradient(135deg, #ec4899, #a855f7)'
                : '#e5e7eb',
              boxShadow: code.join('').length === 6 ? '0 4px 20px rgba(168,85,247,0.3)' : 'none',
            }}>
            {loading ? '확인 중...' : '인증하기 ✨'}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCool > 0}
            className="w-full text-xs text-center transition-colors"
            style={{ color: resendCool > 0 ? '#d1d5db' : '#a855f7' }}>
            {resendCool > 0 ? `${resendCool}초 후 재전송 가능` : '코드 다시 받기'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
