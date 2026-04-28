'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function FailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message') ?? '결제가 취소되었거나 실패했어요'

  return (
    <div className="w-full text-center space-y-6 anim-fade-up" style={{ maxWidth: 360 }}>
      <div className="text-6xl">😓</div>
      <div>
        <h1 className="font-bold t-text mb-2"
          style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.8rem' }}>
          결제 실패
        </h1>
        <p className="text-sm t-sub leading-relaxed">{message}</p>
      </div>

      <div className="t-card t-card-shadow rounded-2xl p-4">
        <p className="text-xs t-muted leading-relaxed">
          결제가 완료되지 않았어요. 다시 시도하거나
          문제가 반복되면 고객센터에 문의해주세요.
        </p>
      </div>

      <div className="space-y-3">
        <button onClick={() => router.replace('/payment/select')}
          className="w-full font-semibold transition-all active:scale-95"
          style={{
            height: 52, borderRadius: 14, fontSize: 15,
            background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
            color: 'var(--accent-text)',
            boxShadow: 'var(--shadow-btn)',
          }}>
          다시 시도하기
        </button>
        <button onClick={() => router.replace('/feed')}
          className="w-full font-medium t-muted transition-all"
          style={{ height: 44, fontSize: 14 }}>
          피드로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <main className="min-h-screen t-page flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, var(--accent-glow), transparent 65%)' }} />
      <div className="relative w-full flex justify-center">
        <Suspense fallback={null}>
          <FailContent />
        </Suspense>
      </div>
    </main>
  )
}
