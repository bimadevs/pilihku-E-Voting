'use client'

import { useState, useEffect, useRef } from 'react'
import { supabaseClient } from '@/lib/auth'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useReactToPrint } from 'react-to-print'
import Papa from 'papaparse'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

// Definisi interface untuk PrintOptions
interface PrintOptions {
  documentTitle?: string
  onBeforeGetContent?: () => Promise<void>
  removeAfterPrint?: boolean
  pageStyle?: string
  copyStyles?: boolean
  suppressErrors?: boolean
  print?: (printIframe: HTMLIFrameElement) => void
}

// Registrasi komponen ChartJS yang dibutuhkan
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface VotingStats {
  totalVoters: number
  votedCount: number
  notVotedCount: number
  votingPercentage: number
  candidateResults: {
    candidateNumber: number
    ketuaName: string
    wakilName: string
    voteCount: number
    percentage: number
  }[]
}

export default function ResultsPage() {
  const printRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState<VotingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchVotingResults()

    // Set up real-time subscription
    const votesSubscription = supabaseClient
      .channel('votes-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        fetchVotingResults()
      })
      .subscribe()

    return () => {
      votesSubscription.unsubscribe()
    }
  }, [])

  async function fetchVotingResults() {
    try {
      // Fetch total voters and their status
      const { data: voters, error: votersError } = await supabaseClient
        .from('voters')
        .select('has_voted')

      if (votersError) throw votersError

      // Fetch all candidates
      const { data: candidates, error: candidatesError } = await supabaseClient
        .from('candidates')
        .select('*')
        .order('candidate_number')

      if (candidatesError) throw candidatesError

      // Fetch votes with candidate details
      const { data: votes, error: votesError } = await supabaseClient
        .from('votes')
        .select('candidate_id')

      if (votesError) throw votesError

      // Calculate statistics
      const totalVoters = voters.length
      const votedCount = voters.filter(v => v.has_voted).length
      const notVotedCount = totalVoters - votedCount
      const votingPercentage = (votedCount / totalVoters) * 100

      // Count votes for each candidate
      const voteCounts = new Map()
      votes.forEach(vote => {
        voteCounts.set(vote.candidate_id, (voteCounts.get(vote.candidate_id) || 0) + 1)
      })

      // Prepare candidate results
      const candidateResults = candidates.map(candidate => ({
        candidateNumber: candidate.candidate_number,
        ketuaName: candidate.ketua_name,
        wakilName: candidate.wakil_name,
        voteCount: voteCounts.get(candidate.id) || 0,
        percentage: votedCount > 0 ? ((voteCounts.get(candidate.id) || 0) / votedCount) * 100 : 0
      }))

      setStats({
        totalVoters,
        votedCount,
        notVotedCount,
        votingPercentage,
        candidateResults
      })
    } catch (error) {
      console.error('Error fetching results:', error)
      setError('Gagal memuat hasil voting')
    } finally {
      setLoading(false)
    }
  }

  // Handle print
  const handlePrint = useReactToPrint({
    documentTitle: 'Hasil Pemilihan OSIS',
    pageStyle: `
      @media print {
        @page {
          size: landscape;
          margin: 20mm;
        }
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    `,
  })

  // Handle download CSV
  const handleDownloadCSV = () => {
    if (!stats) return

    const csvData = [
      // Header row
      ['Statistik Pemilihan OSIS'],
      [''],
      ['Statistik Umum'],
      ['Total Pemilih', stats.totalVoters],
      ['Sudah Memilih', stats.votedCount],
      ['Belum Memilih', stats.notVotedCount],
      ['Persentase Partisipasi', `${stats.votingPercentage.toFixed(1)}%`],
      [''],
      ['Hasil Per Kandidat'],
      ['Nomor Urut', 'Ketua', 'Wakil', 'Jumlah Suara', 'Persentase'],
      ...stats.candidateResults.map(result => [
        result.candidateNumber,
        result.ketuaName,
        result.wakilName,
        result.voteCount,
        `${result.percentage.toFixed(1)}%`
      ])
    ]

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `hasil_pemilihan_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>
  if (!stats) return null

  const barChartData = {
    labels: stats.candidateResults.map(r => `Paslon ${r.candidateNumber}`),
    datasets: [
      {
        label: 'Jumlah Suara',
        data: stats.candidateResults.map(r => r.voteCount),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
      },
    ],
  }

  const doughnutData = {
    labels: ['Sudah Memilih', 'Belum Memilih'],
    datasets: [
      {
        data: [stats.votedCount, stats.notVotedCount],
        backgroundColor: ['#4CAF50', '#ff9800'],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header dengan tombol aksi */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Hasil Pemilihan</h1>
          
          <div className="flex space-x-4">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download CSV
            </button>
            {/* <button
              onClick={(e) => handlePrint()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Cetak
            </button> */}
          </div>
        </div>

        {/* Konten yang bisa di-print */}
        <div ref={printRef} className="space-y-8">
          {/* Statistik Utama */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-600 mb-2">Total Pemilih</h3>
              <p className="text-3xl font-bold">{stats.totalVoters}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-600 mb-2">Sudah Memilih</h3>
              <p className="text-3xl font-bold text-green-600">{stats.votedCount}</p>
              <p className="text-sm text-gray-500">
                {stats.votingPercentage.toFixed(1)}% partisipasi
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-600 mb-2">Belum Memilih</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.notVotedCount}</p>
            </div>
          </div>

          {/* Grafik */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Perolehan Suara</h3>
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Partisipasi Pemilih</h3>
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Tabel Detail */}
          <div className="bg-white rounded-lg shadow overflow-hidden print:shadow-none">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nomor Paslon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ketua
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wakil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Suara
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Persentase
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.candidateResults.map((result) => (
                  <tr key={result.candidateNumber}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Paslon {result.candidateNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.ketuaName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.wakilName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.voteCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Watermark untuk print */}
          <div className="hidden print:block text-center text-gray-400 text-sm mt-8">
            Dicetak pada {new Date().toLocaleString('id-ID')}
          </div>
        </div>
      </div>
    </div>
  )
} 