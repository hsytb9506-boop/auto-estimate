import { useRouter } from 'next/router'
import { useState } from 'react'
import Layout from '../../components/Layout'
import QuoteEditor from '../../components/QuoteEditor'
import { createQuote } from '../../lib/api'

export default function NewCivilQuote() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const q = await createQuote(payload)
      router.push(`/civil/${q.id}`)
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.detail || e.message))
    } finally { setSaving(false) }
  }

  return (
    <Layout title="🚜 토목 견적서 작성">
      <div className="mb-3">
        <button onClick={() => router.push('/civil')} className="text-sm text-gray-500 hover:text-gray-700">
          ← 목록으로
        </button>
      </div>
      <QuoteEditor domain="civil" domainId={2} onSave={handleSave} saving={saving} />
    </Layout>
  )
}
