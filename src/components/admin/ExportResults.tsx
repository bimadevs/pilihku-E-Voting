'use client'

import { utils, writeFile } from 'xlsx'

interface ExportResultsProps {
  results: Array<{
    candidate_number: number
    ketua_name: string
    wakil_name: string
    vote_count: number
  }>
  totalVotes: number
}

export function ExportResults({ results, totalVotes }: ExportResultsProps) {
  function handleExport() {
    // Format data untuk excel
    const data = results.map(result => ({
      'Nomor Urut': result.candidate_number,
      'Nama Ketua': result.ketua_name,
      'Nama Wakil': result.wakil_name,
      'Jumlah Suara': result.vote_count,
      'Persentase': `${((result.vote_count / totalVotes) * 100).toFixed(1)}%`
    }))

    // Buat workbook baru
    const ws = utils.json_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Hasil Voting')

    // Download file
    writeFile(wb, 'hasil-voting-osis.xlsx')
  }

  return (
    <button
      onClick={handleExport}
      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
    >
      Export ke Excel
    </button>
  )
} 