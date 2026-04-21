import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Layout({ children, title = '' }) {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('user')
      if (u) setUser(JSON.parse(u))
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const isArch = router.pathname.startsWith('/architecture')
  const isCivil = router.pathname.startsWith('/civil')
  const isAdmin = router.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/" className="font-bold text-gray-800 text-lg">
                🏗 자동견적
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <Link href="/architecture"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${isArch ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  🏛 건축
                </Link>
                <Link href="/civil"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${isCivil ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  🚜 토목
                </Link>
                {user?.is_admin && (
                  <Link href="/admin"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${isAdmin ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                    ⚙️ 관리자
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-gray-500 hidden sm:block">
                    {user.is_admin ? '👑' : '👤'} {user.username}
                  </span>
                  <button onClick={logout}
                    className="text-sm text-gray-500 hover:text-red-500 transition-colors">
                    로그아웃
                  </button>
                </>
              ) : (
                <Link href="/login" className="text-sm text-blue-600 hover:underline">
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 하단 탭 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50">
        <Link href="/architecture"
          className={`flex-1 flex flex-col items-center py-2 text-xs
            ${isArch ? 'text-blue-600' : 'text-gray-500'}`}>
          <span className="text-lg">🏛</span>건축
        </Link>
        <Link href="/civil"
          className={`flex-1 flex flex-col items-center py-2 text-xs
            ${isCivil ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="text-lg">🚜</span>토목
        </Link>
        {user?.is_admin && (
          <Link href="/admin"
            className={`flex-1 flex flex-col items-center py-2 text-xs
              ${isAdmin ? 'text-purple-600' : 'text-gray-500'}`}>
            <span className="text-lg">⚙️</span>관리
          </Link>
        )}
      </div>

      <main className="max-w-screen-xl mx-auto px-4 py-6 pb-20 md:pb-6">
        {title && <h1 className="text-xl font-bold text-gray-800 mb-4">{title}</h1>}
        {children}
      </main>
    </div>
  )
}
