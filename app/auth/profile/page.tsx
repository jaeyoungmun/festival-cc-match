'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ProfilePage() {
  const router = useRouter()
  const [instagramId, setInstagramId] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!instagramId) { setError('인스타그램 ID를 입력해주세요'); return }
    if (!gender) { setError('성별을 선택해주세요'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instagram_id: instagramId,
        gender,
        department: department || null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }

    router.push('/feed')
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
          <div className="text-5xl mb-4">🌸</div>
          <h1 className="text-3xl font-bold mb-2"
            style={{
              fontFamily: "'Gaegu', cursive",
              background: 'linear-gradient(135deg, #ec4899, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            프로필 설정
          </h1>
          <p className="text-sm text-gray-500" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            이성에게 보여질 정보예요
          </p>
        </div>

        <form onSubmit={handleSubmit}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl shadow-pink-100 space-y-6">

          {/* 인스타 ID */}
          <div className="space-y-2">
            <Label htmlFor="instagram" className="text-gray-700 font-medium text-sm">
              인스타그램 ID <span className="text-pink-400">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <Input
                id="instagram"
                type="text"
                placeholder="your_instagram"
                value={instagramId}
                onChange={e => setInstagramId(e.target.value.replace(/^@/, ''))}
                className="pl-7 rounded-xl border-pink-100 focus:border-pink-300 bg-white/80"
                required
              />
            </div>
            <p className="text-xs text-gray-400" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
              반드시 <span className="text-pink-400 font-medium">공개 계정</span>으로 설정해주세요
            </p>
          </div>

          {/* 성별 선택 */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium text-sm">
              성별 <span className="text-pink-400">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'male', label: '남자', emoji: '🙋‍♂️' },
                { value: 'female', label: '여자', emoji: '🙋‍♀️' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value as 'male' | 'female')}
                  className="py-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all"
                  style={{
                    borderColor: gender === opt.value ? '#ec4899' : '#e5e7eb',
                    background: gender === opt.value ? 'rgba(244,114,182,0.08)' : 'white',
                  }}>
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm font-medium text-gray-700"
                    style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 학과 (선택) */}
          <div className="space-y-2">
            <Label htmlFor="department" className="text-gray-700 font-medium text-sm">
              학과 <span className="text-gray-300 font-normal">(선택)</span>
            </Label>
            <Input
              id="department"
              type="text"
              placeholder="ex. 경영학과"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="rounded-xl border-pink-100 focus:border-pink-300 bg-white/80"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || !instagramId || !gender}
            className="w-full rounded-xl h-12 font-semibold text-white"
            style={{
              background: instagramId && gender
                ? 'linear-gradient(135deg, #ec4899, #a855f7)'
                : '#e5e7eb',
              boxShadow: instagramId && gender ? '0 4px 20px rgba(168,85,247,0.3)' : 'none',
            }}>
            {loading ? '저장 중...' : '시작하기 🎉'}
          </Button>
        </form>
      </div>
    </main>
  )
}
