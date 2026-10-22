'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/auth'
import { 
  Users, 
  Vote, 
  Clock, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  CalendarClock, 
  UserCheck, 
  Trophy, 
  BarChart3, 
  RefreshCw, 
  ExternalLink,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface DashboardStats {
  totalVoters: number
  votedCount: number
  notVotedCount: number
  votingPercentage: number
  totalCandidates: number
  lockedDevicesCount: number
}

interface CandidateStanding {
  id: string
  candidate_number: number
  ketua_name: string
  wakil_name: string
  ketua_photo_url?: string
  wakil_photo_url?: string
  votes: number
  percentage: number
}

interface ActiveSchedule {
  id: string
  start_time: string
  end_time: string
  is_active: boolean
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalVoters: 0,
    votedCount: 0,
    notVotedCount: 0,
    votingPercentage: 0,
    totalCandidates: 0,
    lockedDevicesCount: 0,
  })
  const [standings, setStandings] = useState<CandidateStanding[]>([])
  const [schedule, setSchedule] = useState<ActiveSchedule | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [scheduleStatus, setScheduleStatus] = useState<'live' | 'upcoming' | 'closed' | 'none'>('none')

  async function fetchDashboardData(isManual = false) {
    if (isManual) setRefreshing(true)
    try {
      // 1. Total voters
      const { count: totalVoters } = await supabaseClient
        .from('voters')
        .select('*', { count: 'exact', head: true })

      // 2. Voted voters
      const { count: votedCount } = await supabaseClient
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .eq('has_voted', true)

      // 3. Candidates
      const { data: candidatesData } = await supabaseClient
        .from('candidates')
        .select('*')
        .order('candidate_number')

      // 4. Raw votes count
      const { data: votesData } = await supabaseClient
        .from('votes')
        .select('candidate_id')

      // 5. Active schedule
      const { data: scheduleData } = await supabaseClient
        .from('voting_schedule')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      // 6. Device locks
      const { count: lockedDevices } = await supabaseClient
        .from('voted_devices')
        .select('*', { count: 'exact', head: true })

      const totalV = totalVoters ?? 0
      const votedV = votedCount ?? 0
      const notVotedV = Math.max(0, totalV - votedV)
      const percentage = totalV > 0 ? Number(((votedV / totalV) * 100).toFixed(1)) : 0

      setStats({
        totalVoters: totalV,
        votedCount: votedV,
        notVotedCount: notVotedV,
        votingPercentage: percentage,
        totalCandidates: candidatesData?.length || 0,
        lockedDevicesCount: lockedDevices ?? 0,
      })

      // Hitung perolehan suara paslon
      const voteTally: Record<string, number> = {}
      votesData?.forEach((v) => {
        voteTally[v.candidate_id] = (voteTally[v.candidate_id] || 0) + 1
      })

      const totalCastVotes = votesData?.length || 0
      const calculatedStandings: CandidateStanding[] = (candidatesData || []).map((c) => {
        const count = voteTally[c.id] || 0
        const pct = totalCastVotes > 0 ? Number(((count / totalCastVotes) * 100).toFixed(1)) : 0
        return {
          id: c.id,
          candidate_number: c.candidate_number,
          ketua_name: c.ketua_name,
          wakil_name: c.wakil_name,
          ketua_photo_url: c.ketua_photo_url,
          wakil_photo_url: c.wakil_photo_url,
          votes: count,
          percentage: pct,
        }
      })

      calculatedStandings.sort((a, b) => b.votes - a.votes)
      setStandings(calculatedStandings)
      setSchedule(scheduleData || null)

      // Evaluasi status jadwal
      if (!scheduleData) {
        setScheduleStatus('none')
      } else {
        const now = Date.now()
        const start = new Date(scheduleData.start_time).getTime()
        const end = new Date(scheduleData.end_time).getTime()

        if (now < start) {
          setScheduleStatus('upcoming')
        } else if (now >= start && now <= end) {
          setScheduleStatus('live')
        } else {
          setScheduleStatus('closed')
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // Poll data setiap 25 detik
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 25000)
    return () => clearInterval(interval)
  }, [])

  // Timer countdown
  useEffect(() => {
    if (!schedule) return

    function tick() {
      const now = Date.now()
      const start = new Date(schedule!.start_time).getTime()
      const end = new Date(schedule!.end_time).getTime()

      let target = 0
      if (now < start) {
        target = start - now
      } else if (now >= start && now <= end) {
        target = end - now
      } else {
        setTimeRemaining('Waktu Habis')
        return
      }

      const hours = Math.floor(target / (1000 * 60 * 60))
      const minutes = Math.floor((target % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((target % (1000 * 60)) / 1000)

      setTimeRemaining(`${hours}j ${minutes}m ${seconds}d`)
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [schedule])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Menghubungkan ke Ruang Kontrol...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome & Control Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pusat Kendali Pemilihan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              Live OSIS
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pantau arus suara masuk, kehadiran siswa, dan integritas pemungutan suara secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
          </button>

          <Link
            href="/admin/results"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Ruang Rekapitulasi</span>
          </Link>
        </div>
      </div>

      {/* Hero Status Banner: Election Window & Quorum */}
      {scheduleStatus === 'live' ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-blue-900/50 text-white p-6 sm:p-7 shadow-xl shadow-slate-900/10 relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.04] pointer-events-none" 
            style={{ 
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '20px 20px' 
            }} 
          />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Pemungutan Suara Sedang Berlangsung
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Bilik Suara Digital Terbuka untuk Seluruh Siswa
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Siswa dapat login dengan NIS di bilik suara portal resmi. Waktu penutupan tersisa{' '}
                <span className="font-mono font-bold text-amber-300">{timeRemaining}</span> sebelum sistem ditutup otomatis.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 sm:p-5 min-w-[260px] flex flex-col justify-center">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-medium text-slate-400">Partisipasi Saat Ini</span>
                <span className="text-2xl font-extrabold text-emerald-400">{stats.votingPercentage}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, stats.votingPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
                <span>{stats.votedCount} Suara Masuk</span>
                <span>Target: {stats.totalVoters} DPT</span>
              </div>
            </div>
          </div>
        </div>
      ) : scheduleStatus === 'upcoming' ? (
        <div className="rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-100 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Jadwal Pemilihan Terdaftar</p>
              <h3 className="text-base font-bold text-white mt-0.5">Pemungutan Suara Belum Dimulai</h3>
              <p className="text-xs text-amber-200/80 mt-1">
                Bilik suara akan dibuka otomatis dalam <span className="font-mono font-bold text-white">{timeRemaining}</span>.
              </p>
            </div>
          </div>
          <Link
            href="/admin/schedule"
            className="px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors self-start sm:self-auto"
          >
            Ubah Jadwal
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <CalendarClock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Pemilihan</p>
              <h3 className="text-base font-bold text-white mt-0.5">Tidak Ada Jadwal Pemilihan yang Sedang Aktif</h3>
              <p className="text-xs text-slate-400 mt-1">
                Bilik suara pemilih saat ini ditutup. Buka menu jadwal untuk mengaktifkan sesi pemilihan.
              </p>
            </div>
          </div>
          <Link
            href="/admin/schedule"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors self-start sm:self-auto shadow-sm"
          >
            Atur Jadwal Sekarang
          </Link>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total DPT */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total DPT Terdaftar
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {stats.totalVoters.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-slate-500 mt-1">Siswa berhak memberikan suara</p>
          </div>
        </div>

        {/* Card 2: Suara Masuk */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Suara Masuk
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Vote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
                {stats.votedCount.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                {stats.votingPercentage}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Siswa telah mencoblos</p>
          </div>
        </div>

        {/* Card 3: Belum Memilih */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Belum Memilih
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {stats.notVotedCount.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-slate-500 mt-1">Menunggu kehadiran di TPS digital</p>
          </div>
        </div>

        {/* Card 4: Paslon Terdaftar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Kandidat Paslon
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {stats.totalCandidates}
            </span>
            <p className="text-xs text-slate-500 mt-1">Pasangan calon Ketua & Wakil</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Standings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Live Candidate Standings */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Perolehan Suara Kandidat Terkini
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Peringkat real-time berdasarkan suara sah yang masuk ke sistem
              </p>
            </div>
            <Link
              href="/admin/results"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group"
            >
              <span>Detail Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {standings.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Belum ada kandidat paslon yang terdaftar di database.
              </div>
            ) : (
              standings.map((c, index) => {
                const isLeading = index === 0 && c.votes > 0
                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isLeading
                        ? 'bg-blue-50/50 border-blue-200/80 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200/60 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Number badge */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${
                            isLeading
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          #{c.candidate_number}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {c.ketua_name} & {c.wakil_name}
                          </p>
                          {isLeading && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                              <Trophy className="w-3 h-3 text-amber-500" />
                              Memimpin Perolehan Suara
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vote Count & Percentage */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-extrabold text-slate-900 font-mono">
                          {c.votes.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">suara</span>
                        <div className="text-xs font-bold text-blue-600">{c.percentage}%</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLeading ? 'bg-blue-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(2, c.percentage)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Quick Actions & Security */}
        <div className="lg:col-span-5 space-y-5">
          {/* Action Hub */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Pintasan Aksi Panitia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <Link
                href="/admin/candidates"
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex flex-col group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2.5">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                  Kelola Paslon
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Tambah / edit profil & visi misi</span>
              </Link>

              <Link
                href="/admin/voters"
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all flex flex-col group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">
                  Kelola DPT
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Import Excel & reset kunci HP</span>
              </Link>

              <Link
                href="/admin/schedule"
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-amber-400 hover:bg-amber-50/40 transition-all flex flex-col group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2.5">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600">
                  Atur Jadwal
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Buka / tutup jendela pemilihan</span>
              </Link>

              <Link
                href="/admin/settings"
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all flex flex-col group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2.5">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                  Pengumuman
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Atur countdown & pemenang</span>
              </Link>
            </div>
          </div>

          {/* Device Security & Anti-Fraud Card */}
          <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Integritas & Anti-Kecurangan
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Sistem mencatat sidik jari digital perangkat untuk mencegah satu perangkat (smartphone/laptop) digunakan oleh lebih dari satu siswa.
            </p>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-slate-300">Perangkat Terkunci</span>
              </div>
              <span className="text-sm font-bold text-white font-mono">
                {stats.lockedDevicesCount} Unit
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
