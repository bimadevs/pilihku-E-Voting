'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { supabaseClient } from '@/lib/auth'
import { showAdminToast } from '@/app/admin/components/AdminToast'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
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
  Filler,
} from 'chart.js'
import { utils, writeFile } from 'xlsx'
import { 
  BarChart3, 
  Download, 
  Printer, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Trophy, 
  Users, 
  Vote, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Search, 
  ArrowUpDown, 
  Check, 
  PieChart, 
  Activity,
  Layers,
  Sparkles,
  User,
  ShieldCheck
} from 'lucide-react'

// Register ChartJS
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

interface CandidateResult {
  candidateId: string
  candidateNumber: number
  ketuaName: string
  wakilName: string
  ketuaPhotoUrl?: string | null
  wakilPhotoUrl?: string | null
  photoUrl?: string | null
  ketuaClass?: string | null
  wakilClass?: string | null
  voteCount: number
  percentage: number
}

const CANDIDATE_THEMES = [
  {
    badge: 'bg-blue-600 text-white',
    text: 'text-blue-400',
    bar: 'bg-blue-500',
    border: 'border-blue-500/50',
  },
  {
    badge: 'bg-purple-600 text-white',
    text: 'text-purple-400',
    bar: 'bg-purple-500',
    border: 'border-purple-500/50',
  },
  {
    badge: 'bg-emerald-600 text-white',
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
    border: 'border-emerald-500/50',
  },
  {
    badge: 'bg-amber-600 text-white',
    text: 'text-amber-400',
    bar: 'bg-amber-500',
    border: 'border-amber-500/50',
  },
  {
    badge: 'bg-rose-600 text-white',
    text: 'text-rose-400',
    bar: 'bg-rose-500',
    border: 'border-rose-500/50',
  },
]

interface VotingStats {
  totalVoters: number
  votedCount: number
  notVotedCount: number
  votingPercentage: number
  candidateResults: CandidateResult[]
  votingHistory: {
    hour: string
    count: number
  }[]
}

interface ClassStat {
  className: string
  totalStudents: number
  votedCount: number
  notVotedCount: number
  percentage: number
}

export default function ResultsPage() {
  const [stats, setStats] = useState<VotingStats | null>(null)
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'table'>('overview')
  const [isPresenterMode, setIsPresenterMode] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Class table filters
  const [classSearch, setClassSearch] = useState('')
  const [sortField, setSortField] = useState<keyof ClassStat>('className')
  const [sortAsc, setSortAsc] = useState(true)

  // Set mounted and clock
  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fullscreen management for presenter mode
  const enterPresenterMode = async () => {
    setIsPresenterMode(true)
    try {
      const docEl = document.documentElement as any
      if (docEl.requestFullscreen) {
        if (!document.fullscreenElement) {
          await docEl.requestFullscreen()
        }
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen()
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen mode not permitted by browser:', err)
    }
  }

  const exitPresenterMode = async () => {
    setIsPresenterMode(false)
    try {
      const doc = document as any
      if (document.fullscreenElement) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen()
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen()
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen()
        }
      }
    } catch (err) {
      console.warn('Exit fullscreen failed:', err)
    }
  }

  // Prevent background scrolling when presenter mode is active
  useEffect(() => {
    if (isPresenterMode) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isPresenterMode])

  // Sync with browser native fullscreen changes (e.g. user presses hardware ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsPresenterMode(false)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Presenter mode ESC listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isPresenterMode) {
        exitPresenterMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPresenterMode])

  const formattedDate = useMemo(() => {
    if (!currentTime) return ''
    return currentTime.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [currentTime])

  const formattedTime = useMemo(() => {
    if (!currentTime) return ''
    return (
      currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB'
    )
  }, [currentTime])

  const presenterGridCols = useMemo(() => {
    const count = stats?.candidateResults.length || 0
    if (count <= 1) return 'grid-cols-1 max-w-xl mx-auto'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
    if (count === 3) return 'grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto'
    return 'grid-cols-2 lg:grid-cols-4 max-w-[1700px] mx-auto'
  }, [stats?.candidateResults.length])

  async function fetchResults(isManual = false) {
    if (isManual) setRefreshing(true)
    try {
      // 1. Fetch total voters
      const { data: votersData, error: votersError } = await supabaseClient
        .from('voters')
        .select('id, class, has_voted')

      if (votersError) throw votersError

      const totalVoters = votersData?.length || 0
      const votedCount = votersData?.filter((v) => v.has_voted).length || 0
      const notVotedCount = Math.max(0, totalVoters - votedCount)
      const votingPercentage = totalVoters > 0 ? Number(((votedCount / totalVoters) * 100).toFixed(1)) : 0

      // 2. Fetch candidates
      const { data: candidatesData, error: candidatesError } = await supabaseClient
        .from('candidates')
        .select('*')
        .order('candidate_number')

      if (candidatesError) throw candidatesError

      // 3. Fetch votes
      const { data: votesData, error: votesError } = await supabaseClient
        .from('votes')
        .select('candidate_id, created_at')

      if (votesError) throw votesError

      // Tally candidate votes
      const voteTally: Record<string, number> = {}
      const hourlyTally: Record<string, number> = {}

      votesData?.forEach((vote) => {
        voteTally[vote.candidate_id] = (voteTally[vote.candidate_id] || 0) + 1

        if (vote.created_at) {
          const date = new Date(vote.created_at)
          const hourKey = `${String(date.getHours()).padStart(2, '0')}:00`
          hourlyTally[hourKey] = (hourlyTally[hourKey] || 0) + 1
        }
      })

      const totalVotesCast = votesData?.length || 0
      const candidateResults: CandidateResult[] = (candidatesData || []).map((cand) => {
        const count = voteTally[cand.id] || 0
        const pct = totalVotesCast > 0 ? Number(((count / totalVotesCast) * 100).toFixed(1)) : 0
        return {
          candidateId: cand.id,
          candidateNumber: cand.candidate_number,
          ketuaName: cand.ketua_name,
          wakilName: cand.wakil_name,
          ketuaPhotoUrl: cand.ketua_photo_url,
          wakilPhotoUrl: cand.wakil_photo_url,
          photoUrl: cand.photo_url,
          ketuaClass: cand.ketua_class,
          wakilClass: cand.wakil_class,
          voteCount: count,
          percentage: pct,
        }
      })

      candidateResults.sort((a, b) => b.voteCount - a.voteCount)

      // Format hourly history
      const sortedHours = Object.keys(hourlyTally).sort()
      const votingHistory = sortedHours.map((hour) => ({
        hour,
        count: hourlyTally[hour],
      }))

      setStats({
        totalVoters,
        votedCount,
        notVotedCount,
        votingPercentage,
        candidateResults,
        votingHistory,
      })

      // 4. Compute class stats
      const classMap: Record<string, { total: number; voted: number }> = {}
      votersData?.forEach((v) => {
        const cls = v.class || 'Lainnya'
        if (!classMap[cls]) classMap[cls] = { total: 0, voted: 0 }
        classMap[cls].total += 1
        if (v.has_voted) classMap[cls].voted += 1
      })

      const computedClassStats: ClassStat[] = Object.keys(classMap).map((className) => {
        const item = classMap[className]
        const pct = item.total > 0 ? Number(((item.voted / item.total) * 100).toFixed(1)) : 0
        return {
          className,
          totalStudents: item.total,
          votedCount: item.voted,
          notVotedCount: item.total - item.voted,
          percentage: pct,
        }
      })

      setClassStats(computedClassStats)
    } catch (err: any) {
      console.error('Error fetching results:', err)
      showAdminToast('Gagal Memuat Hasil', 'error', err?.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchResults()
    const interval = setInterval(() => {
      fetchResults()
    }, 25000)
    return () => clearInterval(interval)
  }, [])

  // Export Excel
  function handleExportExcel() {
    if (!stats) return

    try {
      const candidateData = stats.candidateResults.map((r) => ({
        'Nomor Urut': `Paslon #${r.candidateNumber}`,
        'Ketua OSIS': r.ketuaName,
        'Wakil Ketua OSIS': r.wakilName,
        'Perolehan Suara': r.voteCount,
        'Persentase Suara': `${r.percentage}%`,
      }))

      const classData = classStats.map((c) => ({
        'Kelas': c.className,
        'Total Siswa': c.totalStudents,
        'Sudah Memilih': c.votedCount,
        'Belum Memilih': c.notVotedCount,
        'Tingkat Partisipasi': `${c.percentage}%`,
      }))

      const summaryData = [
        { 'Indikator': 'Total DPT Terdaftar', 'Jumlah': stats.totalVoters },
        { 'Indikator': 'Total Suara Masuk', 'Jumlah': stats.votedCount },
        { 'Indikator': 'Belum Memilih', 'Jumlah': stats.notVotedCount },
        { 'Indikator': 'Persentase Partisipasi', 'Jumlah': `${stats.votingPercentage}%` },
      ]

      const wb = utils.book_new()
      utils.book_append_sheet(wb, utils.json_to_sheet(candidateData), 'Hasil Paslon')
      utils.book_append_sheet(wb, utils.json_to_sheet(classData), 'Rekap Kelas')
      utils.book_append_sheet(wb, utils.json_to_sheet(summaryData), 'Ringkasan DPT')

      const dateStr = new Date().toISOString().split('T')[0]
      writeFile(wb, `rekapitulasi-pemilihan-osis-${dateStr}.xlsx`)

      showAdminToast('Excel Berhasil Diunduh', 'success', 'Berkas rekapitulasi siap dicetak.')
    } catch (err: any) {
      showAdminToast('Gagal Export', 'error', err?.message)
    }
  }

  // Print view
  function handlePrintReport() {
    window.print()
  }

  // Filtered and sorted class stats
  const filteredClassStats = useMemo(() => {
    return classStats
      .filter((c) => c.className.toLowerCase().includes(classSearch.toLowerCase()))
      .sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      })
  }, [classStats, classSearch, sortField, sortAsc])

  function toggleClassSort(field: keyof ClassStat) {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Mengkalkulasi suara masuk...</p>
      </div>
    )
  }

  if (!stats) return null

  // Chart configs
  const barChartData = {
    labels: stats.candidateResults.map((r) => `Paslon 0${r.candidateNumber}`),
    datasets: [
      {
        label: 'Perolehan Suara',
        data: stats.candidateResults.map((r) => r.voteCount),
        backgroundColor: [
          '#2563eb', // blue
          '#7c3aed', // purple
          '#059669', // emerald
          '#d97706', // amber
          '#e11d48', // rose
        ],
        borderRadius: 8,
      },
    ],
  }

  const doughnutData = {
    labels: ['Sudah Memilih', 'Belum Memilih'],
    datasets: [
      {
        data: [stats.votedCount, stats.notVotedCount],
        backgroundColor: ['#059669', '#cbd5e1'],
        borderWidth: 0,
      },
    ],
  }

  const lineChartData = {
    labels: stats.votingHistory.map((h) => h.hour),
    datasets: [
      {
        label: 'Suara per Jam',
        data: stats.votingHistory.map((h) => h.count),
        fill: true,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        tension: 0.35,
        pointBackgroundColor: '#2563eb',
      },
    ],
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hasil & Rekapitulasi Suara
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Polling
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Visualisasi perolehan suara sah, tingkat kehadiran per kelas, dan berita acara penghitungan suara.
          </p>
        </div>

        {/* Action Cluster */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => fetchResults(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Berita Acara</span>
          </button>

          <button
            type="button"
            onClick={enterPresenterMode}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Mode Layar Proyektor</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pemilih DPT</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono mt-3">
            {stats.totalVoters.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Daftar pemilih sah yang terdaftar</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Suara Masuk (Partisipasi)</span>
            <Vote className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">
              {stats.votedCount.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              {stats.votingPercentage}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Siswa telah menyalurkan hak suara</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Belum Menggunakan Hak</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono mt-3">
            {stats.notVotedCount.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Belum hadir di bilik suara digital</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Ringkasan & Grafik</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'classes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Partisipasi Per Kelas ({classStats.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'table'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tabel Audit Paslon</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Ringkasan & Grafik */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Leaderboard Podium Cards */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Klasemen Perolehan Suara Pasangan Calon
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {stats.candidateResults.map((candidate, idx) => {
                const isLeading = idx === 0 && candidate.voteCount > 0

                return (
                  <div
                    key={candidate.candidateId}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                      isLeading
                        ? 'border-blue-500/80 ring-2 ring-blue-500/10'
                        : 'border-slate-200/80'
                    }`}
                  >
                    {isLeading && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
                        <Trophy className="w-3 h-3 text-slate-950" />
                        <span>Unggul Sementara</span>
                      </div>
                    )}

                    <div>
                      {/* Top number */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                            isLeading ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          #{candidate.candidateNumber}
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Pasangan Calon {candidate.candidateNumber}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                            {candidate.ketuaName} & {candidate.wakilName}
                          </h4>
                        </div>
                      </div>

                      {/* Vote tally */}
                      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                        <div>
                          <span className="text-xs text-slate-500 font-medium">Perolehan Suara</span>
                          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                            {candidate.voteCount.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 font-medium">Persentase</span>
                          <div className="text-2xl font-extrabold text-blue-600 font-mono mt-0.5">
                            {candidate.percentage}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isLeading ? 'bg-blue-600' : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.max(2, candidate.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bar Chart: Suara Paslon (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Grafik Komparasi Suara Paslon</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Total suara sah per pasangan calon</p>
                </div>
              </div>
              <div className="h-64 sm:h-72">
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                      },
                      x: {
                        grid: { display: false },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Doughnut Chart: Turnout (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Rasio Kehadiran Pemilih</h4>
                <p className="text-xs text-slate-500 mt-0.5">Proporsi suara masuk vs belum memilih</p>
              </div>
              <div className="h-56 my-3 flex items-center justify-center">
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                      legend: { position: 'bottom' },
                    },
                  }}
                />
              </div>
              <div className="text-center text-xs text-slate-500">
                Tingkat Partisipasi Total: <strong className="text-slate-900">{stats.votingPercentage}%</strong>
              </div>
            </div>
          </div>

          {/* Line Chart: Voting Flow Trend */}
          {stats.votingHistory.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Tren Suara Masuk per Jam</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Arus pemungutan suara sepanjang jam pemilihan</p>
                </div>
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="h-64 sm:h-72">
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                      },
                      x: {
                        grid: { display: false },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Analisis Per Kelas */}
      {activeTab === 'classes' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Partisipasi Berdasarkan Kelas</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring kehadiran siswa di bilik suara per masing-masing rombongan belajar.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                placeholder="Cari kelas..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800"
                    onClick={() => toggleClassSort('className')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kelas</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800"
                    onClick={() => toggleClassSort('totalStudents')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Total Siswa</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800"
                    onClick={() => toggleClassSort('votedCount')}
                  >
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <span>Sudah Memilih</span>
                      <ArrowUpDown className="w-3 h-3 text-emerald-500" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800"
                    onClick={() => toggleClassSort('notVotedCount')}
                  >
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <span>Belum Memilih</span>
                      <ArrowUpDown className="w-3 h-3 text-amber-500" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800"
                    onClick={() => toggleClassSort('percentage')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Partisipasi (%)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClassStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ditemukan data kelas.
                    </td>
                  </tr>
                ) : (
                  filteredClassStats.map((stat) => (
                    <tr key={stat.className} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{stat.className}</td>
                      <td className="py-3 px-4 font-mono">{stat.totalStudents}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">{stat.votedCount}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{stat.notVotedCount}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                stat.percentage >= 80
                                  ? 'bg-emerald-500'
                                  : stat.percentage >= 50
                                  ? 'bg-blue-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, stat.percentage)}%` }}
                            />
                          </div>
                          <span className="font-mono font-semibold text-slate-800">{stat.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td className="py-3 px-4 text-slate-900">Total Keseluruhan</td>
                  <td className="py-3 px-4 font-mono text-slate-900">
                    {filteredClassStats.reduce((acc, c) => acc + c.totalStudents, 0)}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-600">
                    {filteredClassStats.reduce((acc, c) => acc + c.votedCount, 0)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {filteredClassStats.reduce((acc, c) => acc + c.notVotedCount, 0)}
                  </td>
                  <td className="py-3 px-4 font-mono text-blue-600">{stats.votingPercentage}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Tabel Audit Paslon */}
      {activeTab === 'table' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Tabel Rekapitulasi Suara Paslon
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">No. Urut</th>
                  <th className="py-3 px-4">Nama Calon Ketua</th>
                  <th className="py-3 px-4">Nama Calon Wakil</th>
                  <th className="py-3 px-4">Perolehan Suara</th>
                  <th className="py-3 px-4">Persentase</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.candidateResults.map((cand, idx) => {
                  const isTop = idx === 0 && cand.voteCount > 0
                  return (
                    <tr key={cand.candidateId} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        Paslon 0{cand.candidateNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{cand.ketuaName}</td>
                      <td className="py-3.5 px-4 text-slate-700">{cand.wakilName}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {cand.voteCount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">{cand.percentage}%</td>
                      <td className="py-3.5 px-4">
                        {isTop ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            Unggul
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode Presenter / Layar Proyektor (Full Screen Broadcast Arena Portaled to Document Body) */}
      {isPresenterMode && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] w-screen h-screen h-[100dvh] m-0 p-4 sm:p-6 lg:p-7 bg-slate-950 text-white select-none overflow-hidden flex flex-col justify-between animate-in fade-in-0 duration-200">
          {/* 1. Header Broadcast */}
          <header className="flex-shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Live Broadcast Badge */}
              <div className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-xs font-extrabold tracking-wider flex items-center gap-2 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>LIVE BROADCAST</span>
              </div>

              <div>
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-blue-400 block">
                  PilihKu • Sidang Pleno Rekapitulasi Suara Resmi
                </span>
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                  Penghitungan Suara Pemilihan Ketua & Wakil OSIS
                </h2>
              </div>
            </div>

            {/* Center Live Clock */}
            <div className="hidden md:flex flex-col items-center px-4 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {formattedDate || 'Waktu Sidang Pleno'}
              </span>
              <div className="text-lg lg:text-xl font-black font-mono tracking-wider text-white">
                {formattedTime || '--:--:-- WIB'}
              </div>
            </div>

            {/* Action Exit Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchResults(true)}
                disabled={refreshing}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl transition-colors"
                title="Segarkan Data Real-Time"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>

              <button
                type="button"
                onClick={exitPresenterMode}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                <span>Keluar Layar <span className="hidden sm:inline text-slate-400 font-mono">(ESC)</span></span>
              </button>
            </div>
          </header>

          {/* 2. Turnout Telemetry Strip */}
          <section className="flex-shrink-0 my-2 sm:my-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-center">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Daftar Pemilih Tetap (DPT)
                </span>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-white mt-0.5">
                  {stats.totalVoters.toLocaleString('id-ID')} <span className="text-xs font-sans font-semibold text-slate-400">Siswa</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                  Total Suara Masuk (Sah)
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-emerald-400">
                    {stats.votedCount.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    {stats.votingPercentage}%
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 block">
                  Belum Menggunakan Hak
                </span>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-slate-300 mt-0.5">
                  {stats.notVotedCount.toLocaleString('id-ID')} <span className="text-xs font-sans font-semibold text-slate-400">Siswa</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Status Kuorum Pemilihan
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider mt-1 border ${
                  stats.votingPercentage >= 50
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {stats.votingPercentage >= 50 ? 'Kuorum Sah Tercapai' : 'Proses Menuju Kuorum'}
                </span>
              </div>
            </div>

            {/* High-Contrast Progress Bar */}
            <div className="w-full h-2.5 sm:h-3 bg-slate-950 rounded-full overflow-hidden border border-white/10 mt-3 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(2, stats.votingPercentage))}%` }}
              />
            </div>
          </section>

          {/* 3. Center Stage: Candidate Arena */}
          <main className="flex-1 min-h-0 flex flex-col justify-center my-1 sm:my-2">
            <div className={`grid ${presenterGridCols} gap-4 sm:gap-5 lg:gap-6 h-full w-full items-stretch`}>
              {stats.candidateResults.map((cand, idx) => {
                const isLeading = idx === 0 && cand.voteCount > 0
                const theme = CANDIDATE_THEMES[(cand.candidateNumber - 1) % CANDIDATE_THEMES.length] || CANDIDATE_THEMES[0]

                return (
                  <div
                    key={cand.candidateId}
                    className={`h-full rounded-2xl sm:rounded-3xl border flex flex-col justify-between p-4 sm:p-5 lg:p-6 relative overflow-hidden transition-all duration-300 ${
                      isLeading
                        ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/40 border-amber-500/80 ring-2 ring-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-900/90 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Leader Ribbon */}
                    {isLeading && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-bl-2xl flex items-center gap-1.5 shadow-md z-10">
                        <Trophy className="w-3.5 h-3.5 text-slate-950" />
                        <span>Unggul Sementara</span>
                      </div>
                    )}

                    {/* Card Top: Number & Header */}
                    <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm sm:text-base shadow-sm ${theme.badge}`}>
                        0{cand.candidateNumber}
                      </div>
                      <div>
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Pasangan Calon #{cand.candidateNumber}
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-white line-clamp-1 leading-snug">
                          {cand.ketuaName} & {cand.wakilName}
                        </h3>
                      </div>
                    </div>

                    {/* Card Middle: Dual Official Photos & Roster */}
                    <div className="flex-1 min-h-0 flex items-center justify-center my-2 sm:my-3">
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full h-full max-h-[220px] sm:max-h-[260px] lg:max-h-[280px]">
                        {/* Calon Ketua */}
                        <div className="flex flex-col items-center justify-center h-full p-2 rounded-xl bg-slate-950/40 border border-white/5">
                          <div className="w-16 h-20 sm:w-20 sm:h-24 lg:w-24 lg:h-32 rounded-xl overflow-hidden bg-slate-800 border-2 border-white/15 relative shadow-md flex-shrink-0">
                            {cand.ketuaPhotoUrl || cand.photoUrl ? (
                              <img
                                src={cand.ketuaPhotoUrl || cand.photoUrl || ''}
                                alt={cand.ketuaName}
                                className="w-full h-full object-cover object-top"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                                <User className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-wider mt-1.5 sm:mt-2">
                            Calon Ketua
                          </span>
                          <h4 className="text-[11px] sm:text-xs lg:text-sm font-bold text-white text-center line-clamp-1 mt-0.5">
                            {cand.ketuaName}
                          </h4>
                          {cand.ketuaClass && (
                            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded mt-0.5">
                              {cand.ketuaClass}
                            </span>
                          )}
                        </div>

                        {/* Calon Wakil */}
                        <div className="flex flex-col items-center justify-center h-full p-2 rounded-xl bg-slate-950/40 border border-white/5">
                          <div className="w-16 h-20 sm:w-20 sm:h-24 lg:w-24 lg:h-32 rounded-xl overflow-hidden bg-slate-800 border-2 border-white/15 relative shadow-md flex-shrink-0">
                            {cand.wakilPhotoUrl || cand.photoUrl ? (
                              <img
                                src={cand.wakilPhotoUrl || cand.photoUrl || ''}
                                alt={cand.wakilName}
                                className="w-full h-full object-cover object-top"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                                <User className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-purple-400 uppercase tracking-wider mt-1.5 sm:mt-2">
                            Calon Wakil
                          </span>
                          <h4 className="text-[11px] sm:text-xs lg:text-sm font-bold text-white text-center line-clamp-1 mt-0.5">
                            {cand.wakilName}
                          </h4>
                          {cand.wakilClass && (
                            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded mt-0.5">
                              {cand.wakilClass}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom: Big Telemetry Figures */}
                    <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3 sm:p-4 mt-auto">
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Perolehan Suara
                          </span>
                          <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-mono tracking-tight leading-none mt-1">
                            {cand.voteCount.toLocaleString('id-ID')}
                          </div>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Suara Sah</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Persentase
                          </span>
                          <div className={`text-2xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight leading-none mt-1 ${theme.text}`}>
                            {cand.percentage}%
                          </div>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">dari total suara</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 sm:h-2.5 bg-slate-800 rounded-full overflow-hidden mt-2.5 sm:mt-3">
                        <div
                          className={`h-full ${theme.bar} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.max(2, cand.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </main>

          {/* 4. Footer Broadcast Bar */}
          <footer className="flex-shrink-0 pt-2.5 sm:pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs text-slate-400 gap-1 sm:gap-0 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SISTEM INTEGRITAS E-VOTING PILIHKU • TALLY TERVERIFIKASI REAL-TIME</span>
            </div>
            <div className="hidden md:block text-slate-400">
              Berita Acara Resmi Penghitungan Suara Pemilihan Ketua & Wakil OSIS
            </div>
            <div className="text-slate-400">
              Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/20 font-mono text-[10px] text-white">ESC</kbd> untuk keluar
            </div>
          </footer>
        </div>,
        document.body
      )}
    </div>
  )
}
