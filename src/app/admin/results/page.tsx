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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header dengan efek gradient */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Hasil Pemilihan
          </h1>
          
          <div className="flex space-x-4">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
          </div>
        </div>

        {/* Konten yang bisa di-print */}
        <div ref={printRef} className="space-y-10">
          {/* Statistik Utama dengan Card Modern */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-600">Total Pemilih</h3>
                  <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalVoters}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-600">Sudah Memilih</h3>
                  <p className="text-4xl font-bold text-green-600 mt-2">{stats.votedCount}</p>
                  <p className="text-sm font-medium text-green-500 mt-1">
                    {stats.votingPercentage.toFixed(1)}% partisipasi
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-600">Belum Memilih</h3>
                  <p className="text-4xl font-bold text-orange-600 mt-2">{stats.notVotedCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grafik dengan Card Modern */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Perolehan Suara</h3>
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        display: false
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Partisipasi Pemilih</h3>
              <Doughnut
                data={{
                  ...doughnutData,
                  datasets: [{
                    ...doughnutData.datasets[0],
                    backgroundColor: ['#10B981', '#FB923C']
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        font: {
                          size: 12
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Tabel Detail Modern */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800">Detail Hasil Pemilihan</h3>
            </div>
            <div className="overflow-x-auto">
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
                    <tr key={result.candidateNumber} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        Paslon {result.candidateNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {result.ketuaName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {result.wakilName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                        {result.voteCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${result.percentage}%` }}></div>
                          </div>
                          <span className="text-gray-700">{result.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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