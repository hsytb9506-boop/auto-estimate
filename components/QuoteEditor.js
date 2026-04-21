import { useState, useEffect, useRef } from 'react'
import { getCategories, getItems, getPercentages } from '../lib/api'

const fmt = (n) => Math.round(n || 0).toLocaleString()
const num = (v) => parseFloat(v) || 0

export default function QuoteEditor({ domain, domainId, initial, onSave, saving }) {
  const domainColor = domain === 'architecture' ? 'blue' : 'green'
  const domainLabel = domain === 'architecture' ? '건축' : '토목'

  const [header, setHeader] = useState({
    field_name: '', client_name: '', work_name: '',
    quote_date: new Date().toISOString().split('T')[0],
    tax_included: true, margin_rate: 0, note: '',
    labor_pct: 0, expense_pct: 0, management_pct: 0,
    profit_pct: 0, tax_pct: 10,
    ...initial?.header,
  })

  const [rows, setRows] = useState(initial?.rows || [])
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [showItemPicker, setShowItemPicker] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [activeTab, setActiveTab] = useState('input')

  // 퍼센트 불러오기
  useEffect(() => {
    const load = async () => {
      const [cats, itms, pcts] = await Promise.all([
        getCategories(domain),
        getItems(domain),
        getPercentages(domain),
      ])
      setCategories(cats)
      setItems(itms)
      if (!initial) {
        const pMap = {}
        pcts.forEach(p => { pMap[p.name] = p.percent })
        setHeader(h => ({
          ...h,
          labor_pct: pMap['노무비'] || 0,
          expense_pct: pMap['경비'] || 0,
          management_pct: pMap['일반관리비'] || 0,
          profit_pct: pMap['이윤'] || 0,
          tax_pct: pMap['부가세'] || 10,
        }))
      }
      // 즐겨찾기 로드
      const fav = JSON.parse(localStorage.getItem(`fav_${domain}`) || '[]')
      setFavorites(fav)
    }
    load()
  }, [domain])

  // 최신 단가 불러오기
  const reloadPrices = () => {
    if (!confirm('현재 작성 중인 단가를 최신 단가로 교체하시겠습니까?\n(직접 수정한 단가는 덮어씌워집니다)')) return
    setRows(r => r.map(row => {
      if (!row.item_id) return row
      const found = items.find(i => i.id === row.item_id)
      if (!found) return row
      const unit_price = found.current_price || 0
      const amount = calcAmount(row, unit_price)
      return { ...row, unit_price, amount }
    }))
  }

  const calcAmount = (row, unit_price) => {
    if (row.is_weight_based && row.unit_weight) {
      const tw = num(row.unit_weight) * num(row.length_m) * num(row.quantity)
      return tw * num(unit_price)
    }
    return num(row.quantity) * num(unit_price)
  }

  // 품목 추가
  const addItem = (item) => {
    const unit_price = item.current_price || 0
    const newRow = {
      _id: Date.now() + Math.random(),
      item_id: item.id,
      category_name: item.category_name,
      item_name: item.name,
      spec: item.spec,
      unit: item.unit,
      quantity: 1,
      unit_price,
      amount: unit_price,
      is_weight_based: item.is_weight_based,
      unit_weight: item.unit_weight,
      length_m: item.is_weight_based ? 6 : null,
      total_weight: item.is_weight_based ? (item.unit_weight * 6 * 1) : null,
      price_per_kg: item.is_weight_based ? unit_price : null,
      note: '',
    }
    setRows(r => [...r, newRow])
  }

  const addBlankRow = () => {
    setRows(r => [...r, {
      _id: Date.now(),
      item_id: null, category_name: '', item_name: '',
      spec: '', unit: '식', quantity: 1,
      unit_price: 0, amount: 0,
      is_weight_based: false, unit_weight: null,
      length_m: null, total_weight: null,
      price_per_kg: null, note: '',
    }])
  }

  const updateRow = (idx, field, value) => {
    setRows(r => r.map((row, i) => {
      if (i !== idx) return row
      const updated = { ...row, [field]: value }
      // 중량 기반 자동 계산
      if (updated.is_weight_based) {
        const tw = num(updated.unit_weight) * num(updated.length_m) * num(updated.quantity)
        updated.total_weight = tw
        updated.amount = tw * num(updated.unit_price)
      } else {
        updated.amount = num(updated.quantity) * num(updated.unit_price)
      }
      return updated
    }))
  }

  const deleteRow = (idx) => setRows(r => r.filter((_, i) => i !== idx))

  const moveRow = (idx, dir) => {
    const newRows = [...rows]
    const target = idx + dir
    if (target < 0 || target >= newRows.length) return
    ;[newRows[idx], newRows[target]] = [newRows[target], newRows[idx]]
    setRows(newRows)
  }

  const toggleFavorite = (itemId) => {
    const updated = favorites.includes(itemId)
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId]
    setFavorites(updated)
    localStorage.setItem(`fav_${domain}`, JSON.stringify(updated))
  }

  // 합계 계산
  const matTotal = rows.reduce((s, r) => s + num(r.amount), 0)
  const labor = matTotal * num(header.labor_pct) / 100
  const expense = matTotal * num(header.expense_pct) / 100
  const mgmt = matTotal * num(header.management_pct) / 100
  const profit = matTotal * num(header.profit_pct) / 100
  const subtotal = matTotal + labor + expense + mgmt + profit
  const tax = subtotal * num(header.tax_pct) / 100
  const total = subtotal + tax

  const filteredItems = items.filter(item =>
    search === ''
      ? true
      : [item.name, item.spec, item.category_name].some(s => s?.includes(search))
  )

  const groupedItems = categories.reduce((acc, cat) => {
    const catItems = filteredItems.filter(i => i.category_id === cat.id)
    if (catItems.length) acc.push({ category: cat, items: catItems })
    return acc
  }, [])

  const handleSave = () => {
    const payload = {
      domain_id: domainId,
      ...header,
      items: rows.map((r, idx) => ({
        item_id: r.item_id || null,
        category_name: r.category_name,
        item_name: r.item_name,
        spec: r.spec,
        unit: r.unit,
        quantity: num(r.quantity),
        unit_price: num(r.unit_price),
        amount: num(r.amount),
        unit_weight: r.unit_weight ? num(r.unit_weight) : null,
        length_m: r.length_m ? num(r.length_m) : null,
        total_weight: r.total_weight ? num(r.total_weight) : null,
        price_per_kg: r.price_per_kg ? num(r.price_per_kg) : null,
        note: r.note,
        sort_order: idx,
      }))
    }
    onSave(payload)
  }

  const colorClass = {
    header: domain === 'architecture' ? 'bg-blue-600' : 'bg-green-600',
    tab: domain === 'architecture' ? 'border-blue-600 text-blue-600' : 'border-green-600 text-green-600',
    btn: domain === 'architecture' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700',
    light: domain === 'architecture' ? 'bg-blue-50' : 'bg-green-50',
  }

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex border-b border-gray-200">
        {['input', 'summary'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab
                ? colorClass.tab
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab === 'input' ? '📝 수량 입력' : '📊 견적 요약'}
          </button>
        ))}
      </div>

      {activeTab === 'input' && (
        <>
          {/* 기본 정보 */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">기본 정보</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: '현장명', key: 'field_name', span: 2 },
                { label: '거래처명', key: 'client_name', span: 2 },
                { label: '공사명', key: 'work_name', span: 2 },
                { label: '견적일자', key: 'quote_date', type: 'date', span: 1 },
                { label: '마진율(%)', key: 'margin_rate', type: 'number', span: 1 },
              ].map(f => (
                <div key={f.key} className={`col-span-${f.span}`}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={header[f.key] ?? ''}
                    onChange={e => setHeader(h => ({...h, [f.key]: e.target.value}))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
              <div className="col-span-2 flex items-center gap-2">
                <label className="text-xs text-gray-500">부가세</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={header.tax_included}
                    onChange={e => setHeader(h => ({...h, tax_included: e.target.checked}))}
                    className="rounded" />
                  <span className="text-sm">포함</span>
                </label>
              </div>
            </div>
          </div>

          {/* 노무비 퍼센트 */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">노무비 / 이율 설정</h3>
              <button onClick={reloadPrices}
                className="text-xs text-blue-600 hover:underline border border-blue-300
                  px-2 py-1 rounded">
                🔄 최신 단가 불러오기
              </button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: '노무비(%)', key: 'labor_pct' },
                { label: '경비(%)', key: 'expense_pct' },
                { label: '일반관리비(%)', key: 'management_pct' },
                { label: '이윤(%)', key: 'profit_pct' },
                { label: '부가세(%)', key: 'tax_pct' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  <input type="number" value={header[f.key] ?? 0} min="0" max="100"
                    onChange={e => setHeader(h => ({...h, [f.key]: e.target.value}))}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm
                      text-right focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
            </div>
          </div>

          {/* 품목 입력 테이블 */}
          <div className="card p-0 overflow-hidden">
            <div className={`${colorClass.header} text-white px-4 py-3 flex items-center justify-between`}>
              <span className="font-semibold">품목 입력 ({rows.length}개)</span>
              <div className="flex gap-2">
                <button onClick={() => setShowItemPicker(!showItemPicker)}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded transition-colors">
                  🔍 품목 선택
                </button>
                <button onClick={addBlankRow}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded transition-colors">
                  + 빈 행 추가
                </button>
              </div>
            </div>

            {/* 품목 선택 패널 */}
            {showItemPicker && (
              <div className={`${colorClass.light} border-b border-gray-200 p-3`}>
                <div className="flex gap-2 mb-2">
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="품목 검색..." autoFocus
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <button onClick={() => setShowItemPicker(false)}
                    className="text-gray-400 hover:text-gray-600 px-2">✕</button>
                </div>

                {/* 즐겨찾기 */}
                {favorites.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">⭐ 즐겨찾기</p>
                    <div className="flex flex-wrap gap-1">
                      {items.filter(i => favorites.includes(i.id)).map(item => (
                        <button key={item.id} onClick={() => addItem(item)}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800
                            text-xs px-2 py-1 rounded transition-colors">
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto space-y-2">
                  {groupedItems.map(({ category, items: catItems }) => (
                    <div key={category.id}>
                      <p className="text-xs font-semibold text-gray-600 bg-gray-100
                        px-2 py-1 rounded sticky top-0">{category.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {catItems.map(item => (
                          <div key={item.id} className="flex items-center gap-0.5">
                            <button onClick={() => addItem(item)}
                              className="bg-white hover:bg-blue-50 border border-gray-200
                                text-xs px-2 py-1 rounded transition-colors">
                              {item.name}
                              {item.spec && <span className="text-gray-400 ml-1">{item.spec}</span>}
                              <span className="text-blue-600 ml-1">{fmt(item.current_price)}원/{item.unit}</span>
                            </button>
                            <button onClick={() => toggleFavorite(item.id)}
                              className={`text-xs p-1 rounded
                                ${favorites.includes(item.id) ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}>
                              ★
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-2 py-2 w-8">#</th>
                    <th className="px-2 py-2 text-left w-24">공종</th>
                    <th className="px-2 py-2 text-left w-36">품목명</th>
                    <th className="px-2 py-2 text-left w-24">규격</th>
                    <th className="px-2 py-2 w-12">단위</th>
                    <th className="px-2 py-2 w-16 text-right">수량</th>
                    <th className="px-2 py-2 w-16 text-right">길이(m)</th>
                    <th className="px-2 py-2 w-20 text-right">단위중량</th>
                    <th className="px-2 py-2 w-20 text-right">총중량(kg)</th>
                    <th className="px-2 py-2 w-24 text-right">단가</th>
                    <th className="px-2 py-2 w-28 text-right">금액</th>
                    <th className="px-2 py-2 w-24">비고</th>
                    <th className="px-2 py-2 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-8 text-gray-400">
                        품목을 선택하거나 빈 행을 추가하세요
                      </td>
                    </tr>
                  ) : rows.map((row, idx) => (
                    <tr key={row._id || idx}
                      className={`hover:bg-gray-50 ${row.is_weight_based ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-2 py-1.5 text-center text-gray-400">{idx + 1}</td>
                      <td className="px-1 py-1">
                        <input value={row.category_name} onChange={e => updateRow(idx, 'category_name', e.target.value)}
                          className="table-input text-left w-full" />
                      </td>
                      <td className="px-1 py-1">
                        <input value={row.item_name} onChange={e => updateRow(idx, 'item_name', e.target.value)}
                          className="table-input text-left w-full font-medium" />
                      </td>
                      <td className="px-1 py-1">
                        <input value={row.spec} onChange={e => updateRow(idx, 'spec', e.target.value)}
                          className="table-input text-left w-full" />
                      </td>
                      <td className="px-1 py-1">
                        <input value={row.unit} onChange={e => updateRow(idx, 'unit', e.target.value)}
                          className="table-input text-center w-full" />
                      </td>
                      <td className="px-1 py-1">
                        <input type="number" value={row.quantity} min="0"
                          onChange={e => updateRow(idx, 'quantity', e.target.value)}
                          className="table-input w-full" />
                      </td>
                      <td className="px-1 py-1">
                        {row.is_weight_based ? (
                          <input type="number" value={row.length_m || ''} min="0"
                            onChange={e => updateRow(idx, 'length_m', e.target.value)}
                            className="table-input w-full" />
                        ) : <span className="text-gray-300 text-center block">-</span>}
                      </td>
                      <td className="px-1 py-1 text-right text-gray-500">
                        {row.is_weight_based ? `${row.unit_weight}` : '-'}
                      </td>
                      <td className="px-1 py-1 text-right text-gray-600">
                        {row.is_weight_based ? fmt(row.total_weight) : '-'}
                      </td>
                      <td className="px-1 py-1">
                        <input type="number" value={row.unit_price} min="0"
                          onChange={e => updateRow(idx, 'unit_price', e.target.value)}
                          className="table-input w-full" />
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold">
                        {fmt(row.amount)}
                      </td>
                      <td className="px-1 py-1">
                        <input value={row.note} onChange={e => updateRow(idx, 'note', e.target.value)}
                          className="table-input text-left w-full" />
                      </td>
                      <td className="px-1 py-1">
                        <div className="flex gap-0.5 justify-center">
                          <button onClick={() => moveRow(idx, -1)}
                            className="text-gray-300 hover:text-gray-500 px-1">↑</button>
                          <button onClick={() => moveRow(idx, 1)}
                            className="text-gray-300 hover:text-gray-500 px-1">↓</button>
                          <button onClick={() => deleteRow(idx)}
                            className="text-red-300 hover:text-red-500 px-1">✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                    <td colSpan={10} className="px-4 py-2 text-right">자재비 합계</td>
                    <td className="px-2 py-2 text-right text-blue-700">{fmt(matTotal)}원</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'summary' && (
        <div className="card max-w-lg mx-auto">
          <h3 className="font-bold text-lg text-gray-800 mb-4">📊 견적 요약</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {[
                ['자재비 합계', matTotal, false],
                [`노무비 (${header.labor_pct}%)`, labor, false],
                [`경비 (${header.expense_pct}%)`, expense, false],
                [`일반관리비 (${header.management_pct}%)`, mgmt, false],
                [`이윤 (${header.profit_pct}%)`, profit, false],
                ['공급가액', subtotal, true],
                [`부가세 (${header.tax_pct}%)`, tax, false],
                ['최종 합계', total, true],
              ].map(([label, val, bold]) => (
                <tr key={label} className={bold ? 'bg-gray-50' : ''}>
                  <td className={`py-2 px-3 ${bold ? 'font-bold' : ''}`}>{label}</td>
                  <td className={`py-2 px-3 text-right ${bold ? 'font-bold text-blue-700 text-base' : ''}`}>
                    {fmt(val)}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-3 pb-4">
        <button onClick={handleSave} disabled={saving}
          className={`${colorClass.btn} disabled:opacity-50 text-white font-semibold
            px-8 py-2.5 rounded-lg transition-colors`}>
          {saving ? '저장 중...' : '💾 견적서 저장'}
        </button>
      </div>
    </div>
  )
}
