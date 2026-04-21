import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import {
  getCategories, getItems, getPercentages, updatePercentage,
  updatePrice, getPriceHistory, createItem, updateItem, deleteItem,
  createCategory, bulkUpdatePrices
} from '../../lib/api'

const fmt = (n) => Math.round(n || 0).toLocaleString()

export default function AdminPage() {
  const router = useRouter()
  const [domain, setDomain] = useState('architecture')
  const [section, setSection] = useState('prices')  // prices | percentages | items | history
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [percentages, setPercentages] = useState([])
  const [selectedCat, setSelectedCat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [historyItem, setHistoryItem] = useState(null)
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState({})

  // 관리자 체크
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user.is_admin) router.push('/')
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cats, itms, pcts] = await Promise.all([
        getCategories(domain),
        getItems(domain, null, false),
        getPercentages(domain),
      ])
      setCategories(cats)
      setItems(itms)
      setPercentages(pcts)
      if (cats.length && !selectedCat) setSelectedCat(cats[0].id)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    setSelectedCat(null)
    loadData()
  }, [domain])

  // 단가 인라인 수정
  const [editPrices, setEditPrices] = useState({})
  const handlePriceChange = (itemId, val) => {
    setEditPrices(p => ({ ...p, [itemId]: val }))
  }
  const handlePriceSave = async (item) => {
    const newPrice = parseFloat(editPrices[item.id])
    if (isNaN(newPrice)) return
    setSaving(s => ({ ...s, [item.id]: true }))
    try {
      await updatePrice(item.id, { price: newPrice, note: '관리자 수정' })
      setItems(its => its.map(i => i.id === item.id ? { ...i, current_price: newPrice } : i))
      setEditPrices(p => { const n = { ...p }; delete n[item.id]; return n })
    } finally {
      setSaving(s => ({ ...s, [item.id]: false }))
    }
  }

  // 퍼센트 수정
  const [editPcts, setEditPcts] = useState({})
  const handlePctSave = async (pct) => {
    const val = parseFloat(editPcts[pct.id] ?? pct.percent)
    await updatePercentage(pct.id, { percent: val })
    setPercentages(ps => ps.map(p => p.id === pct.id ? { ...p, percent: val } : p))
    setEditPcts(p => { const n = { ...p }; delete n[pct.id]; return n })
  }

  // 단가 이력 조회
  const loadHistory = async (item) => {
    setHistoryItem(item)
    const data = await getPriceHistory(item.id)
    setHistory(data)
    setSection('history')
  }

  // CSV 일괄 업로드
  const handleCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const lines = ev.target.result.split('\n').slice(1) // 헤더 제거
      const updates = []
      for (const line of lines) {
        const [id, , , , price] = line.split(',').map(s => s.trim())
        if (id && price) updates.push({ item_id: parseInt(id), price: parseFloat(price) })
      }
      if (!updates.length) { alert('유효한 데이터가 없습니다'); return }
      if (!confirm(`${updates.length}개 항목 단가를 일괄 업데이트하시겠습니까?`)) return
      await bulkUpdatePrices(updates)
      alert('일괄 업데이트 완료!')
      loadData()
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // 새 품목 추가
  const [newItem, setNewItem] = useState(null)
  const handleAddItem = async () => {
    if (!newItem?.name) return
    await createItem({
      category_id: selectedCat,
      name: newItem.name,
      spec: newItem.spec || '',
      unit: newItem.unit || '식',
      initial_price: parseFloat(newItem.price) || 0,
    })
    setNewItem(null)
    loadData()
  }

  const filteredItems = items.filter(item => {
    const matchSearch = search === '' || [item.name, item.spec, item.category_name].some(s => s?.includes(search))
    const matchCat = !selectedCat || item.category_id === selectedCat
    return matchSearch && matchCat
  })

  const domainLabel = domain === 'architecture' ? '🏛 건축' : '🚜 토목'
  const domainColor = domain === 'architecture'
    ? { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' }
    : { bg: 'bg-green-600', light: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' }

  return (
    <Layout title="⚙️ 관리자 페이지">
      {/* 도메인 탭 */}
      <div className="flex gap-2 mb-4">
        {[['architecture', '🏛 건축 관리'], ['civil', '🚜 토목 관리']].map(([code, label]) => (
          <button key={code} onClick={() => setDomain(code)}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors
              ${domain === code
                ? code === 'architecture' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* 섹션 탭 */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {[
          ['prices', '💰 단가 수정'],
          ['percentages', '📊 노무비 설정'],
          ['items', '📦 품목 관리'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setSection(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${section === key
                ? `${domainColor.text} border-current`
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
        {section === 'history' && (
          <span className="px-4 py-2 text-sm font-medium border-b-2 border-purple-600 text-purple-600">
            📋 변경 이력
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">불러오는 중...</div>
      ) : (
        <>
          {/* ─── 단가 수정 ─── */}
          {section === 'prices' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="품목 검색..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <label className="flex items-center gap-2 cursor-pointer bg-gray-100
                  hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  📁 CSV 일괄 업로드
                  <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
                </label>
                <a href={`data:text/csv;charset=utf-8,id,category,name,spec,price\n${
                  items.map(i => `${i.id},${i.category_name},${i.name},${i.spec},${i.current_price}`).join('\n')
                }`}
                  download={`단가표_${domain}_${new Date().toISOString().split('T')[0]}.csv`}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  📥 CSV 다운로드
                </a>
              </div>

              {/* 카테고리 필터 */}
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setSelectedCat(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                    ${!selectedCat ? `${domainColor.bg} text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  전체
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${selectedCat === cat.id
                        ? `${domainColor.bg} text-white`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${domainColor.bg} text-white`}>
                      <th className="px-4 py-2.5 text-left">공종</th>
                      <th className="px-4 py-2.5 text-left">품목명</th>
                      <th className="px-4 py-2.5 text-left">규격</th>
                      <th className="px-4 py-2.5 text-center">단위</th>
                      <th className="px-4 py-2.5 text-left">공급처</th>
                      <th className="px-4 py-2.5 text-right w-36">현재 단가</th>
                      <th className="px-4 py-2.5 text-right w-40">수정 단가</th>
                      <th className="px-4 py-2.5 w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{item.category_name}</td>
                        <td className="px-4 py-2 font-medium">
                          {item.name}
                          {!item.is_active && <span className="ml-1 text-xs text-red-400">(비활성)</span>}
                          {item.is_weight_based && <span className="ml-1 text-xs text-blue-400">kg기준</span>}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{item.spec}</td>
                        <td className="px-4 py-2 text-center text-gray-500">{item.unit}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{item.supplier}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {fmt(item.current_price)}원
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={editPrices[item.id] ?? item.current_price}
                            onChange={e => handlePriceChange(item.id, e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-right text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            {editPrices[item.id] !== undefined && (
                              <button onClick={() => handlePriceSave(item)}
                                disabled={saving[item.id]}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                                  text-white text-xs px-2.5 py-1 rounded transition-colors">
                                {saving[item.id] ? '...' : '저장'}
                              </button>
                            )}
                            <button onClick={() => loadHistory(item)}
                              className="text-gray-400 hover:text-purple-600 text-xs px-1.5 py-1 rounded transition-colors">
                              이력
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400">
                💡 단가 수정 후 저장하면 변경 이력이 자동 저장됩니다. 기존 견적서 금액은 영향받지 않습니다.
              </p>
            </div>
          )}

          {/* ─── 노무비 설정 ─── */}
          {section === 'percentages' && (
            <div className="max-w-md">
              <div className={`${domainColor.light} border ${domainColor.border} rounded-xl p-4 mb-4`}>
                <p className="text-sm text-gray-600">
                  <strong>{domainLabel}</strong> 견적서의 기본 노무비/이율을 설정합니다.<br/>
                  새 견적서 작성 시 이 값이 자동으로 적용됩니다.
                </p>
              </div>
              <div className="card space-y-3">
                {percentages.map(pct => (
                  <div key={pct.id} className="flex items-center gap-3">
                    <label className="w-32 text-sm font-medium text-gray-700">{pct.name}</label>
                    <input
                      type="number" min="0" max="100" step="0.1"
                      value={editPcts[pct.id] ?? pct.percent}
                      onChange={e => setEditPcts(p => ({ ...p, [pct.id]: e.target.value }))}
                      className="w-24 border border-gray-300 rounded px-2 py-1.5 text-right text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-sm text-gray-500">%</span>
                    <button onClick={() => handlePctSave(pct)}
                      className={`${domainColor.bg} text-white text-xs px-3 py-1.5 rounded transition-colors ml-auto`}>
                      저장
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── 품목 관리 ─── */}
          {section === 'items' && (
            <div className="space-y-4">
              {/* 카테고리 선택 */}
              <div className="flex flex-wrap gap-1">
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors
                      ${selectedCat === cat.id
                        ? `${domainColor.bg} text-white`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* 새 품목 추가 폼 */}
              {selectedCat && (
                <div className="card">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">+ 새 품목 추가</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <input placeholder="품목명 *" value={newItem?.name || ''}
                      onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                      className="border border-gray-300 rounded px-2.5 py-1.5 text-sm col-span-2 md:col-span-1" />
                    <input placeholder="규격" value={newItem?.spec || ''}
                      onChange={e => setNewItem(n => ({ ...n, spec: e.target.value }))}
                      className="border border-gray-300 rounded px-2.5 py-1.5 text-sm" />
                    <input placeholder="단위" value={newItem?.unit || ''}
                      onChange={e => setNewItem(n => ({ ...n, unit: e.target.value }))}
                      className="border border-gray-300 rounded px-2.5 py-1.5 text-sm" />
                    <input placeholder="단가" type="number" value={newItem?.price || ''}
                      onChange={e => setNewItem(n => ({ ...n, price: e.target.value }))}
                      className="border border-gray-300 rounded px-2.5 py-1.5 text-sm" />
                    <button onClick={handleAddItem}
                      className={`${domainColor.bg} text-white text-sm font-medium px-4 py-1.5 rounded transition-colors`}>
                      추가
                    </button>
                  </div>
                </div>
              )}

              {/* 품목 목록 */}
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${domainColor.bg} text-white`}>
                      <th className="px-3 py-2.5 text-left">품목명</th>
                      <th className="px-3 py-2.5 text-left">규격</th>
                      <th className="px-3 py-2.5 text-center">단위</th>
                      <th className="px-3 py-2.5 text-right">현재 단가</th>
                      <th className="px-3 py-2.5 text-center">상태</th>
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.filter(i => !selectedCat || i.category_id === selectedCat).map(item => (
                      <tr key={item.id} className={`hover:bg-gray-50 ${!item.is_active ? 'opacity-50' : ''}`}>
                        <td className="px-3 py-2 font-medium">{item.name}</td>
                        <td className="px-3 py-2 text-gray-500">{item.spec}</td>
                        <td className="px-3 py-2 text-center">{item.unit}</td>
                        <td className="px-3 py-2 text-right">{fmt(item.current_price)}원</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs
                            ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {item.is_active ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={async () => {
                            await updateItem(item.id, { is_active: !item.is_active })
                            loadData()
                          }} className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">
                            {item.is_active ? '비활성화' : '활성화'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── 단가 이력 ─── */}
          {section === 'history' && historyItem && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setSection('prices')}
                  className="text-sm text-gray-500 hover:text-gray-700">← 단가 수정으로</button>
                <h3 className="font-semibold text-gray-800">
                  📋 단가 변경 이력 - {historyItem.name}
                  {historyItem.spec && <span className="text-gray-500 ml-2">{historyItem.spec}</span>}
                </h3>
              </div>
              <div className="card p-0 overflow-hidden">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">변경 이력이 없습니다</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-600 text-white">
                        <th className="px-4 py-2.5 text-left">변경 일시</th>
                        <th className="px-4 py-2.5 text-right">이전 단가</th>
                        <th className="px-4 py-2.5 text-right">변경 단가</th>
                        <th className="px-4 py-2.5 text-center">변경자</th>
                        <th className="px-4 py-2.5 text-left">메모</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.map(h => (
                        <tr key={h.id} className="hover:bg-purple-50">
                          <td className="px-4 py-2 text-gray-500">
                            {new Date(h.changed_at).toLocaleString('ko-KR')}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-500">{fmt(h.old_price)}원</td>
                          <td className="px-4 py-2 text-right font-semibold text-blue-700">{fmt(h.new_price)}원</td>
                          <td className="px-4 py-2 text-center">{h.changed_by}</td>
                          <td className="px-4 py-2 text-gray-500">{h.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
