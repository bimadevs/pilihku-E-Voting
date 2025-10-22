'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabaseClient } from '@/lib/auth'
import { useRealtimeVotes, useRealtimeClassStats } from '@/hooks/useRealtimeVotes'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { toast, Toaster } from 'react-hot-toast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { motion } from 'framer-motion'
import { Download, Printer, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react'
import { utils } from 'xlsx'
import { writeFile } from 'xlsx'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
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
  votingHistory?: {
    hour: string
    count: number
  }[]
}

interface ClassStats {
  className: string
  totalStudents: number
  votedCount: number
  notVotedCount: number
  percentage: number
}

// Custom Toast Component
const CustomToast = ({ message, type }: { message: string, type: 'success' | 'error' | 'info' }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <Clock className="w-5 h-5 text-red-500" />,
    info: <TrendingUp className="w-5 h-5 text-blue-500" />
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${bgColors[type]}`}>
      {icons[type]}
      <span className="text-gray-700">{message}</span>
    </div>
  )
}

// Fungsi helper untuk menampilkan toast
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.custom((t: { visible: boolean }) => (
    <CustomToast message={message} type={type} />
  ), {
    duration: 3000,
    position: 'top-center'
  })
}

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [classFilter, setClassFilter] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ClassStats
    direction: 'asc' | 'desc'
  }>({
    key: 'className',
    direction: 'asc'
  })

  // Use real-time hooks
  const { votingStats: rawVotingStats, isLoading: votingLoading, error: votingError } = useRealtimeVotes()
  const { classStats: rawClassStats, isLoading: classLoading, error: classError } = useRealtimeClassStats()

  // Transform voting stats to match admin page format
  const stats: VotingStats | null = rawVotingStats ? {
    totalVoters: rawVotingStats.totalVoters,
    votedCount: rawVotingStats.totalVotes, // Using totalVotes as votedCount for admin display
    notVotedCount: rawVotingStats.totalVoters - rawVotingStats.totalVotes,
    votingPercentage: rawVotingStats.participationRate,
    candidateResults: rawVotingStats.candidateResults.map(result => ({
      candidateNumber: result.candidate.candidate_number,
      ketuaName: result.candidate.ketua_name,
      wakilName: result.candidate.wakil_name,
      voteCount: result.voteCount,
      percentage: result.percentage
    })),
    votingHistory: [] // We'll keep this empty for now since we don't have hourly data in the hook
  } : null

  const classStats = rawClassStats

  const loading = votingLoading || classLoading
  const error = votingError || classError

  const handleCSVDownload = () => {
    if (!stats) return

    try {
      // Data voting per kandidat
      const candidateData = stats.candidateResults.map(result => ({
        'Nomor Urut': result.candidateNumber,
        'Nama Ketua': result.ketuaName,
        'Nama Wakil': result.wakilName,
        'Jumlah Suara': result.voteCount,
        'Persentase': `${result.percentage.toFixed(1)}%`
      }))

      // Data statistik per kelas
      const classData = classStats.map(stat => ({
        'Kelas': stat.className,
        'Total Siswa': stat.totalStudents,
        'Sudah Memilih': stat.votedCount,
        'Belum Memilih': stat.notVotedCount,
        'Persentase Partisipasi': `${stat.percentage}%`
      }))

      // Data ringkasan
      const summaryData = [{
        'Total Pemilih': stats.totalVoters,
        'Sudah Memilih': stats.votedCount,
        'Belum Memilih': stats.notVotedCount,
        'Persentase Partisipasi': `${stats.votingPercentage.toFixed(1)}%`
      }]

      // Buat workbook baru
      const wb = utils.book_new()

      // Tambahkan semua sheet
      utils.book_append_sheet(wb, utils.json_to_sheet(candidateData), 'Hasil Voting')
      utils.book_append_sheet(wb, utils.json_to_sheet(classData), 'Statistik Kelas')
      utils.book_append_sheet(wb, utils.json_to_sheet(summaryData), 'Ringkasan')

      // Download file
      const date = new Date().toISOString().split('T')[0]
      writeFile(wb, `hasil-pemilihan-${date}.xlsx`)

      toast.success('Data berhasil diexport')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Gagal mengexport data')
    }
  }

  // Fungsi untuk sorting
  const handleSort = (key: keyof ClassStats) => {
    setSortConfig({
      key,
      direction: 
        sortConfig.key === key && sortConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    })
  }

  // Filter dan sort data
  const filteredAndSortedClassStats = useMemo(() => {
    let filtered = classStats
    
    // Apply filter
    if (classFilter) {
      filtered = classStats.filter(stat => 
        stat.className.toLowerCase().includes(classFilter.toLowerCase())
      )
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1
      }
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1
    })
  }, [classStats, classFilter, sortConfig])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-50 p-4 rounded-lg text-red-600">{error}</div>
    </div>
  )
  
  if (!stats) return null

  const barChartData = {
    labels: stats.candidateResults.map(r => `Paslon ${r.candidateNumber}`),
    datasets: [{
      label: 'Jumlah Suara',
      data: stats.candidateResults.map(r => r.voteCount),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderRadius: 8,
    }]
  }

  const doughnutData = {
    labels: ['Sudah Memilih', 'Belum Memilih'],
    datasets: [{
      data: [stats.votedCount, stats.notVotedCount],
      backgroundColor: ['#10B981', '#FB923C'],
      borderWidth: 0,
    }]
  }

  const votingTrendData = {
    labels: stats.votingHistory?.map(h => h.hour) || [],
    datasets: [{
      label: 'Jumlah Voting per Jam',
      data: stats.votingHistory?.map(h => h.count) || [],
      fill: true,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    }]
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            Dashboard Hasil Pemilihan
          </motion.h1>
          <p className="mt-2 text-gray-600">
            Real-time monitoring hasil pemilihan OSIS
          </p>

          {/* Real-time indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 mt-4"
          >
            <motion.div
              className="w-3 h-3 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm text-gray-500">
              Data diperbarui secara real-time • Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}
            </span>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCSVDownload}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Data
          </motion.button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center">
              <Users className="w-12 h-12 text-blue-600 bg-blue-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Pemilih</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVoters}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center">
              <CheckCircle className="w-12 h-12 text-green-600 bg-green-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Sudah Memilih</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.votedCount}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({isNaN(stats.votingPercentage) ? '0' : stats.votingPercentage.toFixed(1)}%)
                  </span>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center">
              <Clock className="w-12 h-12 text-orange-600 bg-orange-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Belum Memilih</p>
                <p className="text-2xl font-bold text-gray-900">{stats.notVotedCount}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'details', 'trends'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activeTab === 'overview' && (
              <>
                <div className="bg-white p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">Perolehan Suara</h3>
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
                <div className="bg-white p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">Partisipasi Pemilih</h3>
                  <Doughnut
                    data={doughnutData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        }
                      },
                      cutout: '60%'
                    }}
                  />
                </div>
              </>
            )}

            {activeTab === 'trends' && (
              <div className="col-span-2 bg-white p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Tren Voting per Jam</h3>
                <Line
                  data={votingTrendData}
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
                          color: 'rgba(0, 0, 0, 0.05)',
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
            )}

            {activeTab === 'details' && (
              <div className="col-span-2">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nomor Urut
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ketua
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Wakil
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Perolehan Suara
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Persentase
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.candidateResults.map((result) => (
                        <tr key={result.candidateNumber}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Paslon {result.candidateNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.ketuaName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.wakilName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.voteCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistik Per Kelas */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Statistik Per Kelas</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="classFilter" className="text-sm text-gray-600">
                Cari Kelas:
              </label>
              <input
                id="classFilter"
                type="text"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                placeholder="Cari kelas..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'className', label: 'Kelas' },
                      { key: 'totalStudents', label: 'Total Siswa' },
                      { key: 'votedCount', label: 'Sudah Memilih' },
                      { key: 'notVotedCount', label: 'Belum Memilih' },
                      { key: 'percentage', label: 'Persentase' }
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key as keyof ClassStats)}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {sortConfig.key === key && (
                            <span>
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedClassStats.map((stat) => (
                    <tr key={stat.className} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stat.className}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stat.totalStudents}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {stat.votedCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {stat.notVotedCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${stat.totalStudents === 0 ? 0 : stat.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900">
                            {stat.totalStudents === 0 ? '0%' : `${stat.percentage}%`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Footer untuk menampilkan total */}
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {filteredAndSortedClassStats.reduce((sum, stat) => sum + stat.totalStudents, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {filteredAndSortedClassStats.reduce((sum, stat) => sum + stat.votedCount, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {filteredAndSortedClassStats.reduce((sum, stat) => sum + stat.notVotedCount, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {(() => {
                        const totalStudents = filteredAndSortedClassStats.reduce((sum, stat) => sum + stat.totalStudents, 0)
                        const totalVoted = filteredAndSortedClassStats.reduce((sum, stat) => sum + stat.votedCount, 0)
                        return totalStudents === 0 ? '0%' : `${((totalVoted / totalStudents) * 100).toFixed(1)}%`
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
