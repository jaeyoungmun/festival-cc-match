'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Profile = { id: string; instagram_id: string; department: string | null }
type FeedState = 'loading' | 'card' | 'empty' | 'error' | 'no_rerolls'

export default function FeedPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [balance, setBalance] = useState(0)
  const [state, setState] = useState<FeedState>('loading')
  const [flipped, setFlipped] = useState(false)
  const [cardKey, setCardKey] = useState(0)

  const fetchBalance = useCallback(async () => {
    const res = await fetch('/api/user/balance')
    if (res.ok) { const d = await res.json(); setBalance(d.balance ?? 0) }
  }, [])

  const fetchNext = useCallback(async () => {
    setState('loading'); setFlipped(false)
    const res = await fetch('/api/feed/next')
    const data = await res.json()
    if (!res.ok) { setState('error'); return }
    if (data.empty) { setState('empty'); return }
    setProfile(data.profile); setCardKey(k => k + 1); setState('card')
  }, [])

  useEffect(() => { fetchBalance(); fetchNext() }, [fetchBalance, fetchNext])

  async function handleReroll() {
    if (balance <= 0) { setState('no_rerolls'); return }
    const res = await fetch('/api/feed/reroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_profile_id: profile?.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (data.code === 'NO_REROLLS_LEFT') { setState('no_rerolls'); return }
      setState('error'); return
    }
    setBalance(data.remaining)
    fetchNext()
  }

  return (
    <main className="min-h-screen t-page flex flex-col">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 10%, var(--accent-glow), transparent 60%)' }} />

      {/* 헤더 */}
      <header className="relative flex items-center justify-between px-6 pt-10 pb-4">
        <div>
          <h1 className="font-bold t-accent-text" style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.6rem' }}>
            축제 인연 찾기
          </h1>
          <p className="text-xs t-muted mt-0.5">오늘 축제에서 누군가를 만나보세요 🎪</p>
        </div>
        <button onClick={() => router.push('/mypage')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all t-badge"
          style={{ border: '1px solid var(--border)' }}>
          <span className="text-lg">👤</span>
        </button>
      </header>

      {/* 리롤 잔여 뱃지 */}
      <div className="relative flex justify-center mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium t-badge"
          style={{
            border: '1px solid var(--border-accent)',
            color: balance > 0 ? 'var(--accent-from)' : 'var(--text-muted)',
          }}>
          <span>✨</span>
          <span>리롤 {balance}회 남음</span>
        </div>
      </div>

      {/* 메인 */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-8">

        {state === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full t-accent-bg animate-pulse" />
            <p className="text-sm t-muted">인연을 찾는 중...</p>
          </div>
        )}

        {state === 'card' && profile && (
          <div key={cardKey} className="w-full max-w-sm anim-fade-up">
            {/* 카드 */}
            <div className="relative rounded-3xl overflow-hidden cursor-pointer select-none t-card t-card-shadow"
              style={{ minHeight: 380 }}
              onClick={() => setFlipped(f => !f)}>
              {/* 상단 accent 라인 */}
              <div className="absolute top-0 left-0 right-0 h-1 t-accent-bg" />

              <div className="flex flex-col items-center justify-center p-10 h-full" style={{ minHeight: 380 }}>
                {!flipped ? (
                  <div className="flex flex-col items-center gap-5 anim-fade-up">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                      style={{ background: 'var(--accent-soft)', border: '2px solid var(--border-accent)' }}>
                      🌸
                    </div>
                    <div className="text-center">
                      <p className="text-xs t-muted mb-2 tracking-widest uppercase">instagram</p>
                      <p className="font-bold t-accent-text mb-1"
                        style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.8rem', wordBreak: 'break-all' }}>
                        @{profile.instagram_id}
                      </p>
                      {profile.department && (
                        <p className="text-sm t-sub mt-1">{profile.department}</p>
                      )}
                    </div>
                    <p className="text-xs t-muted">탭해서 인스타로 이동</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-5 anim-fade-up">
                    <div className="text-5xl">💌</div>
                    <div className="text-center">
                      <p className="font-bold t-text mb-1"
                        style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.2rem' }}>
                        DM 보내볼까요?
                      </p>
                      <p className="text-sm t-sub">@{profile.instagram_id}</p>
                    </div>
                    <a href={`https://instagram.com/${profile.instagram_id}`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-8 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 t-accent-bg"
                      style={{ color: 'var(--accent-text)', boxShadow: 'var(--shadow-btn)' }}
                      onClick={e => e.stopPropagation()}>
                      인스타그램 열기 →
                    </a>
                    <button onClick={e => { e.stopPropagation(); setFlipped(false) }}
                      className="text-xs t-muted">돌아가기</button>
                  </div>
                )}
              </div>
            </div>

            {/* 리롤 버튼 */}
            <div className="mt-5">
              <button onClick={handleReroll}
                className="w-full py-4 rounded-2xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 t-card"
                style={{
                  border: `1px solid ${balance > 0 ? 'var(--border-accent)' : 'var(--border)'}`,
                  color: balance > 0 ? 'var(--accent-from)' : 'var(--text-muted)',
                }}>
                <span>🔀</span>
                <span>{balance > 0 ? '다른 사람 보기' : '리롤 충전하기'}</span>
              </button>
            </div>
          </div>
        )}

        {state === 'no_rerolls' && (
          <div className="w-full max-w-sm text-center space-y-5">
            <div className="text-6xl">🪙</div>
            <div>
              <p className="font-bold t-text mb-1"
                style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.3rem' }}>
                리롤을 모두 사용했어요
              </p>
              <p className="text-sm t-sub">패키지를 구매하고 더 많은 인연을 만나보세요</p>
            </div>
            <button onClick={() => router.push('/payment/select')}
              className="w-full py-4 rounded-2xl font-semibold t-accent-bg transition-all active:scale-95"
              style={{ color: 'var(--accent-text)', boxShadow: 'var(--shadow-btn)' }}>
              리롤 패키지 구경하기 ✨
            </button>
            <button onClick={() => setState('card')} className="text-sm t-muted">
              현재 카드 다시 보기
            </button>
          </div>
        )}

        {state === 'empty' && (
          <div className="text-center space-y-3">
            <div className="text-6xl">🎪</div>
            <p className="font-bold t-text" style={{ fontFamily: "'Gaegu', cursive", fontSize: '1.3rem' }}>
              모든 인연을 확인했어요!
            </p>
            <p className="text-sm t-sub">축제에서 직접 만나보는 건 어떨까요 😊</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">😥</div>
            <p className="text-sm t-sub">오류가 발생했어요</p>
            <button onClick={fetchNext}
              className="px-6 py-2 rounded-xl text-sm t-card t-sub"
              style={{ border: '1px solid var(--border)' }}>
              다시 시도
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
