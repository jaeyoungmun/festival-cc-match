'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyForm() {
  const router = useRouter()
  const email = useSearchParams().get('email') ?? ''
  const [resendCool, setResendCool] = useState(60)
  const [resendDone, setResendDone] = useState(false)

  useEffect(() => {
    if (resendCool <= 0) return
    const t = setTimeout(() => setResendCool(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCool])

  async function handleResend() {
    if (resendCool > 0) return
    await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setResendCool(60)
    setResendDone(true)
  }

  return (
    <main className="min-h-screen t-page flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, var(--accent-glow), transparent 65%)' }} />

      <div className="relative w-full text-center" style={{ maxWidth: 360 }}>

        {/* 아이콘 애니메이션 */}
        <div className="anim-fade-up mb-8">
          <div className="text-6xl mb-4" style={{ animation: 'float-up 3s ease-in-out infinite' }}>📨</div>
          <h1 className="font-bold t-accent-text mb-2"
            style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.9rem' }}>
            이메일을 확인해주세요
          </h1>
          <p className="text-sm t-sub leading-relaxed">
            <span className="font-medium" style={{ color: 'var(--accent-from)' }}>{email}</span>
            <br />으로 로그인 링크를 보냈어요
          </p>
        </div>

        {/* 안내 카드 */}
        <div className="t-card t-card-shadow rounded-3xl p-6 space-y-4 anim-fade-up anim-delay-1 text-left">
          {[
            { icon: '1️⃣', text: '이메일 받은 편지함을 열어주세요' },
            { icon: '2️⃣', text: '\'축제 인연 찾기\' 메일의 링크를 클릭해주세요' },
            { icon: '3️⃣', text: '자동으로 로그인돼요' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{step.icon}</span>
              <p className="text-sm t-sub">{step.text}</p>
            </div>
          ))}
        </div>

        {/* 재전송 */}
        <div className="mt-6 space-y-3 anim-fade-up anim-delay-2">
          {resendDone && (
            <p className="text-xs t-sub">✅ 다시 보냈어요! 받은 편지함을 확인해주세요</p>
          )}
          <button onClick={handleResend} disabled={resendCool > 0}
            className="text-sm font-medium transition-all"
            style={{ color: resendCool > 0 ? 'var(--text-muted)' : 'var(--accent-from)' }}>
            {resendCool > 0 ? `${resendCool}초 후 재전송 가능` : '이메일 다시 받기'}
          </button>
          <br />
          <button onClick={() => router.push('/auth/signup')}
            className="text-xs t-muted underline underline-offset-2">
            이메일 주소 변경하기
          </button>
        </div>

      </div>
    </main>
  )
}

export default function VerifyPage() {
  return <Suspense><VerifyForm /></Suspense>
}
