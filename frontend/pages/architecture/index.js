import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout.js'
import { listQuotes, deleteQuote } from '../../lib/api.js'

const fmt = (n) => Math.round(n || 0).toLocaleString()

export default function ArchitectureIndex() {
  const router = useRouter()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const data = await listQuotes('architecture')
      setQuotes(data)
    } catch(() => {})
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" 견적을 삭제하시겠습니까?`)) return
    await deleteQuote(id)
    setQuotes(q => q.filter(x => x.id !== id))
  }

  const filtered = quotes.filter(q =>
    [q.field_name, q.client_name, q.work_name, q.quote_number]
      .some(s => s?.includes(search))
  )

  return (
    <Layout title="🏛 건축 견적서">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="현장명, 거래처, 공사명 검색..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <Link href="/architecture/new"
          className="btn-primary text-center whitespace-nowrap">
          + 새 견적서 작성
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">작성된 견적서가 없습니다</p>
          <Link href="/architecture/new" className="btn-primary inline-block mt-4">
            첫 견적서 작성하기
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="px-4 py-3 text-left">견적번호</th>
                  <th className="px-4 py-3 text-left">현장명</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">거래처</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">공사명</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">날짜</th>
                  <th className="px-4 py-3 text-right">자재비</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(q => (
                  <tr key={q.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{q.quote_number}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/architecture/${q.id}`} className="hover:text-blue-600">
                        {q.field_name || '-'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{q.client_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{q.work_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{q.quote_date || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmt(q.material_total)}원</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                        ${q.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'}`}>
                        {q.status === 'confirmed' ? '확정' : '작성중'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/architecture/${q.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs">보기</Link>
                        <Link href={`/architecture/${q.id}/edit`}
                          className="text-gray-500 hover:text-gray-700 text-xs">수정</Link>
                        <button onClick={() => handleDelete(q.id, q.field_name)}
                          className="text-red-400 hover:text-red-600 text-xs">삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  )
}
