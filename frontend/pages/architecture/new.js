import { useRouter } from 'next/router'
import { useState } from 'react'
import Layout from '../../components/Layout'
import QuoteEditor from '../../components/QuoteEditor'
import { createQuote, getDomains } from '../../lib/api'

export default function NewArchitectureQuote() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const q = await createQuote(payload)
      router.push(`/architecture/${q.id}`)
    } catch (e) {
      alert('저장 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout title="🏛 건축 견적서 작성">
      <div className="mb-3">
        <button onClick={() => router.push('/architecture')}
          className="text-sm text-gray-500 hover:text-gray-700">
          ← 목록으로
        </button>
      </div>
      <QuoteEditor
        domain="architecture"
        domainId={1}
        onSave={handleSave}
        saving={saving}
      />
    </Layout>
  )
}
