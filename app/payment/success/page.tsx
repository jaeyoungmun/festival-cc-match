'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Status = 'loading' | 'success' | 'error'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [rerolls, setRerolls] = useState(0)

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey')
    const orderId    = searchParams.get('orderId')
    const amount     = searchParams.get('amount')
    const packageId  = searchParams.get('packageId')

    if (!paymentKey || !orderId || !amount || !packageId) {
      setStatus('error'); return
    }

    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
        packageId,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRerolls(data.rerollsGranted)
          setStatus('success')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full t-accent-bg animate-pulse" />
        <p className="text-sm t-muted">결제 확인 중...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="w-full text-center space-y-5" style={{ maxWidth: 360 }}>
        <div className="text-6xl">😥</div>
        <div>
          <p className="font-bold t-text mb-1" style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.4rem' }}>
            결제 확인에 실패했어요
          </p>
          <p className="text-sm t-sub">고객센터에 문의해주세요</p>
        </div>
        <button onClick={() => router.replace('/feed')}
          className="w-full font-semibold transition-all active:scale-95"
          style={{
            height: 52, borderRadius: 14, fontSize: 15,
            background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
            color: 'var(--accent-text)',
            boxShadow: 'var(--shadow-btn)',
          }}>
          피드로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="w-full text-center space-y-6 anim-fade-up" style={{ maxWidth: 360 }}>
      {/* 성공 아이콘 */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{
            background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
            boxShadow: 'var(--shadow-btn)',
          }}>
          ✨
        </div>
        <h1 className="font-bold t-accent-text"
          style={{ fontFamily: "'Gaegu', cursive", fontSize: '2rem' }}>
          충전 완료!
        </h1>
        <p className="text-sm t-sub">리롤이 충전됐어요</p>
      </div>

      {/* 충전 내역 카드 */}
      <div className="t-card t-card-shadow rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm t-sub">충전된 리롤</p>
          <p className="font-bold t-accent-text"
            style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.4rem' }}>
            +{rerolls}회
          </p>
        </div>
        <div style={{ height: 1, background: 'var(--border)' }} />
        <p className="text-xs t-muted text-center">
          이제 더 많은 인연을 만날 수 있어요 💕
        </p>
      </div>

      <button onClick={() => router.replace('/feed')}
        className="w-full font-semibold transition-all active:scale-95"
        style={{
          height: 52, borderRadius: 14, fontSize: 15,
          background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
          color: 'var(--accent-text)',
          boxShadow: 'var(--shadow-btn)',
        }}>
        인연 찾으러 가기 →
      </button>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen t-page flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, var(--accent-glow), transparent 65%)' }} />
      <div className="relative w-full flex justify-center">
        <Suspense fallback={
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full t-accent-bg animate-pulse" />
            <p className="text-sm t-muted">로딩 중...</p>
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  )
}
