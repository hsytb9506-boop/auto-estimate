import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Home() {
  const router = useRouter()



  return (
    <>
      <Head><title>자동 견적 시스템</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col items-center justify-center px-4">
        <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 text-center">
          🏗 자동 견적 시스템
        </h1>
        <p className="text-slate-300 mb-12 text-center">견적 분야를 선택하세요</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* 건축 */}
          <button
            onClick={() => router.push('/architecture')}
            className="group bg-white/10 hover:bg-blue-600 border border-white/20 hover:border-blue-500
              rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="text-5xl mb-4">🏛</div>
            <h2 className="text-white text-2xl font-bold mb-2">건축 견적서</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              철골 · 판넬 · H빔 · 각파이프<br/>
              후레싱 · 창호 · 내장 · 철거
            </p>
            <div className="mt-4 text-blue-300 text-sm font-medium group-hover:text-white transition-colors">
              견적 작성 →
            </div>
          </button>

          {/* 토목 */}
          <button
            onClick={() => router.push('/civil')}
            className="group bg-white/10 hover:bg-green-600 border border-white/20 hover:border-green-500
              rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="text-5xl mb-4">🚜</div>
            <h2 className="text-white text-2xl font-bold mb-2">토목 견적서</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              토공사 · 배수 · 콘크리트<br/>
              포장 · 옹벽 · 구조물 · 철거
            </p>
            <div className="mt-4 text-green-300 text-sm font-medium group-hover:text-white transition-colors">
              견적 작성 →
            </div>
          </button>
        </div>

        <p className="text-slate-500 text-xs mt-8">
          건축과 토목은 완전히 분리된 독립 시스템입니다
        </p>
      </div>
    </>
  )
}
