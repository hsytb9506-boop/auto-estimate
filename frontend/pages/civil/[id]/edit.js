import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Layout from '../../../components/Layout'
import QuoteEditor from '../../../components/QuoteEditor'
import { getQuote, updateQuote } from '../../../lib/api'

export default function EditCivilQuote() {
  const router = useRouter()
  const { id } = router.query
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    getQuote(id).then(data => { setQuote(data); setLoading(false) })
      .catch(() => router.push('/login'))
  }, [id])

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      await updateQuote(id, payload)
      router.push(`/civil/${id}`)
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.detail || e.message))
    } finally { setSaving(false) }
  }

  if (loading) return <Layout><div className="text-center py-20 text-gray-400">불러오는 중...</div></Layout>

  const initialRows = quote.items?.map(item => ({
    ...item, _id: item.id, is_weight_based: !!item.unit_weight,
  })) || []

  return (
    <Layout title="🚜 토목 견적서 수정">
      <div className="mb-3">
        <button onClick={() => router.push(`/civil/${id}`)} className="text-sm text-gray-500 hover:text-gray-700">
          ← 견적서로 돌아가기
        </button>
      </div>
      <QuoteEditor
        domain="civil" domainId={2}
        initial={{
          header: {
            field_name: quote.field_name, client_name: quote.client_name,
            work_name: quote.work_name, quote_date: quote.quote_date,
            tax_included: quote.tax_included, margin_rate: quote.margin_rate,
            note: quote.note, labor_pct: quote.labor_pct,
            expense_pct: quote.expense_pct, management_pct: quote.management_pct,
            profit_pct: quote.profit_pct, tax_pct: quote.tax_pct,
          },
          rows: initialRows,
        }}
        onSave={handleSave} saving={saving}
      />
    </Layout>
  )
}
