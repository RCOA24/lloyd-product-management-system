import type { ProductSummaryReport } from '../api'

function escapeCsv(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function exportProductSummaryCsv(
  report: ProductSummaryReport,
  generatedAt: Date,
): void {
  const rows: Array<[string, string, string | number]> = [
    ['Summary', 'Total products', report.totalProducts],
    ['Summary', 'Active products', report.activeProducts],
    ['Summary', 'Inactive products', report.inactiveProducts],
    ...report.productsByCategory.map(
      (item): [string, string, number] => ['Category', item.name, item.count],
    ),
    ...report.productsByDosageForm.map(
      (item): [string, string, number] => ['Dosage form', item.name, item.count],
    ),
  ]
  const csv = [
    ['Section', 'Name', 'Count'],
    ...rows,
  ]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = generatedAt.toISOString().slice(0, 10)

  link.href = url
  link.download = `product-summary-${date}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
