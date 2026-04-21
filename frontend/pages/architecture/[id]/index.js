import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import QuoteView from '../../../components/QuoteView'
import { getQuote } from '../../../lib/api'

export default function ArchitectureQuoteDetail() {
  const router = useRouter()
  const { id } = router.query
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getQuote(id).then(setQuote).catch(() => router.push('/login')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <Layout><div className="text-center py-20 text-gray-400">불러오는 중...</div></Layout>
  if (!quote) return <Layout><div className="text-center py-20 text-gray-400">견적서를 찾을 수 없습니다</div></Layout>

  return (
    <Layout title={`🏛 ${quote.field_name || '건축 견적서'}`}>
      <div className="mb-3">
        <button onClick={() => router.push('/architecture')}
          className="text-sm text-gray-500 hover:text-gray-700">
          ← 목록으로
        </button>
      </div>
      <QuoteView
        quote={quote}
        domainName="건축"
        onEdit={() => router.push(`/architecture/${id}/edit`)}
      />
    </Layout>
  )
}
