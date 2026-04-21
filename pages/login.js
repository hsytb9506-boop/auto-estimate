import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { login } from '../lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await login(form)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify({
        username: data.username, is_admin: data.is_admin
      }))
      router.push('/')
    } catch {
      setError('아이디 또는 비밀번호가 틀렸습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>로그인 - 자동 견적 시스템</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700
        flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">🏗 자동견적</h1>
          <p className="text-gray-400 text-sm text-center mb-6">로그인하여 시작하세요</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
              <input
                type="text" value={form.username}
                onChange={e => setForm(f => ({...f, username: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="아이디 입력" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password" value={form.password}
                onChange={e => setForm(f => ({...f, password: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호 입력" required />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <p className="font-medium mb-1">기본 계정</p>
            <p>관리자: admin / admin1234</p>
            <p>일반: user / user1234</p>
          </div>
        </div>
      </div>
    </>
  )
}
