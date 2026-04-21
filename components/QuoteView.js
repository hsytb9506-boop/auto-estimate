import { useState } from 'react'
import { exportExcel } from '../lib/api'
import { exportPDF } from '../lib/export'

const fmt = (n) => Math.round(n || 0).toLocaleString()

export default function QuoteView({ quote, domainName, onEdit }) {
  const [exporting, setExporting] = useState(false)

  const matTotal = quote.items?.reduce((s, i) => s + (i.amount || 0), 0) || 0
  const labor    = matTotal * (quote.labor_pct || 0) / 100
  const expense  = matTotal * (quote.expense_pct || 0) / 100
  const mgmt     = matTotal * (quote.management_pct || 0) / 100
  const profit   = matTotal * (quote.profit_pct || 0) / 100
  const subtotal = matTotal + labor + expense + mgmt + profit
  const tax      = subtotal * (quote.tax_pct || 10) / 100
  const total    = subtotal + tax

  // 공종별 그룹핑
  const grouped = (quote.items || []).reduce((acc, item) => {
    const key = item.category_name || '기타'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const handleExcel = async () => {
    setExporting(true)
    try { await exportExcel(quote.id, quote.quote_number) }
    finally { setExporting(false) }
  }

  return (
    <div className="space-y-4">
      {/* 액션 버튼 */}
      <div className="flex gap-2 justify-end flex-wrap">
        <button onClick={onEdit} className="btn-secondary text-sm">✏️ 수정</button>
        <button onClick={handleExcel} disabled={exporting}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          {exporting ? '처리중...' : '📊 엑셀 저장'}
        </button>
        <button onClick={() => exportPDF(quote, domainName)}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          📄 PDF 출력
        </button>
      </div>

      {/* 견적서 본문 */}
      <div className="card print:shadow-none" id="quote-print">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{domainName} 견적서</h2>
          <p className="text-gray-400 text-sm mt-1">{quote.quote_number}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-6 border-t border-b border-gray-200 py-4">
          <div><span className="text-gray-500 w-20 inline-block">현장명</span><strong>{quote.field_name}</strong></div>
          <div><span className="text-gray-500 w-20 inline-block">거래처</span><strong>{quote.client_name}</strong></div>
          <div><span className="text-gray-500 w-20 inline-block">공사명</span><strong>{quote.work_name}</strong></div>
          <div><span className="text-gray-500 w-20 inline-block">견적일자</span><strong>{quote.quote_date}</strong></div>
        </div>

        {/* 품목 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-3 py-2 text-center w-8">No</th>
                <th className="px-3 py-2 text-left">공종</th>
                <th className="px-3 py-2 text-left">품목명</th>
                <th className="px-3 py-2 text-left">규격</th>
                <th className="px-3 py-2 text-center w-12">단위</th>
                <th className="px-3 py-2 text-right w-16">수량</th>
                <th className="px-3 py-2 text-right w-24">단가</th>
                <th className="px-3 py-2 text-right w-28">금액</th>
                <th className="px-3 py-2 text-left w-24">비고</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([catName, catItems]) => (
                <>
                  <tr key={`cat-${catName}`} className="bg-blue-50">
                    <td colSpan={9} className="px-3 py-1.5 font-semibold text-blue-800 text-xs">
                      【 {catName} 】
                    </td>
                  </tr>
                  {catItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-center text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-3 py-2 text-gray-600">{item.category_name}</td>
                      <td className="px-3 py-2 font-medium">{item.item_name}</td>
                      <td className="px-3 py-2 text-gray-500">{item.spec}</td>
                      <td className="px-3 py-2 text-center">{item.unit}</td>
                      <td className="px-3 py-2 text-right">
                        {item.is_weight_based
                          ? `${item.quantity}본×${item.length_m}m`
                          : item.quantity?.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">{fmt(item.unit_price)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(item.amount)}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{item.note}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* 합계 */}
        <div className="mt-6 flex justify-end">
          <table className="text-sm w-72">
            <tbody className="divide-y divide-gray-100">
              {[
                ['자재비 합계', matTotal],
                [`노무비 (${quote.labor_pct}%)`, labor],
                [`경비 (${quote.expense_pct}%)`, expense],
                [`일반관리비 (${quote.management_pct}%)`, mgmt],
                [`이윤 (${quote.profit_pct}%)`, profit],
              ].map(([l, v]) => (
                <tr key={l}>
                  <td className="py-1.5 text-gray-600 text-right pr-4">{l}</td>
                  <td className="py-1.5 text-right font-medium">{fmt(v)}원</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300">
                <td className="py-2 text-right pr-4 font-semibold">공급가액</td>
                <td className="py-2 text-right font-bold text-blue-700">{fmt(subtotal)}원</td>
              </tr>
              <tr>
                <td className="py-1.5 text-gray-600 text-right pr-4">부가세 ({quote.tax_pct}%)</td>
                <td className="py-1.5 text-right font-medium">{fmt(tax)}원</td>
              </tr>
              <tr className="bg-gray-800 text-white">
                <td className="py-3 px-3 font-bold text-right rounded-bl-lg">최종 합계</td>
                <td className="py-3 px-3 font-bold text-right text-xl rounded-br-lg">{fmt(total)}원</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
