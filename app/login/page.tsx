// 이 페이지는 비활성화되었습니다 (/auth/signup 으로 통합)
export default function Page() {
  return null;
}

/*
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
      ...
    </main>
  )
}
*/
