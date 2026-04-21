// PDF 출력 유틸리티 (jsPDF + AutoTable)
export const exportPDF = (quote, domainName) => {
  try {
    const { jsPDF } = require('jspdf')
    const autoTable = require('jspdf-autotable').default

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // 한글 폰트 없이 기본 출력 (실제 배포 시 폰트 추가 필요)
    doc.setFontSize(18)
    doc.text(`${domainName} 견적서`, 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.text(`현장명: ${quote.field_name}`, 14, 35)
    doc.text(`거래처: ${quote.client_name}`, 14, 41)
    doc.text(`공사명: ${quote.work_name}`, 14, 47)
    doc.text(`견적번호: ${quote.quote_number}`, 140, 35)
    doc.text(`견적일자: ${quote.quote_date}`, 140, 41)

    const tableData = quote.items.map((item, idx) => [
      idx + 1,
      item.category_name,
      item.item_name,
      item.spec,
      item.unit,
      item.quantity?.toLocaleString(),
      item.unit_price?.toLocaleString(),
      item.amount?.toLocaleString(),
      item.note,
    ])

    autoTable(doc, {
      startY: 55,
      head: [['#', '공종', '품목', '규격', '단위', '수량', '단가', '금액', '비고']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [31, 78, 121], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 22 },
        2: { cellWidth: 35 },
        3: { cellWidth: 22 },
        4: { cellWidth: 10 },
        5: { cellWidth: 15, halign: 'right' },
        6: { cellWidth: 18, halign: 'right' },
        7: { cellWidth: 20, halign: 'right' },
        8: { cellWidth: 25 },
      },
    })

    const finalY = doc.lastAutoTable.finalY + 5
    const mat = quote.items.reduce((s, i) => s + (i.amount || 0), 0)
    const labor = mat * quote.labor_pct / 100
    const expense = mat * quote.expense_pct / 100
    const mgmt = mat * quote.management_pct / 100
    const profit = mat * quote.profit_pct / 100
    const subtotal = mat + labor + expense + mgmt + profit
    const tax = subtotal * quote.tax_pct / 100
    const total = subtotal + tax

    const summaryRows = [
      ['자재비 합계', mat],
      [`노무비 (${quote.labor_pct}%)`, labor],
      [`경비 (${quote.expense_pct}%)`, expense],
      [`일반관리비 (${quote.management_pct}%)`, mgmt],
      [`이윤 (${quote.profit_pct}%)`, profit],
      ['공급가액', subtotal],
      [`부가세 (${quote.tax_pct}%)`, tax],
      ['합  계', total],
    ]

    autoTable(doc, {
      startY: finalY,
      body: summaryRows.map(([l, v]) => [l, v.toLocaleString() + '원']),
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: 95 },
    })

    doc.save(`견적서_${quote.quote_number}.pdf`)
  } catch (e) {
    alert('PDF 생성 중 오류가 발생했습니다. 브라우저 인쇄 기능을 이용해주세요.')
    window.print()
  }
}
