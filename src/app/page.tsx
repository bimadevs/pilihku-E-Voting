'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Vote, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  User, 
  ArrowRight, 
  School, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Search,
  CheckCircle,
  BarChart3,
  Award,
  TrendingUp,
  BookOpen,
  Quote,
  Sparkles
} from 'lucide-react'
import { supabaseClient } from '@/lib/auth'
import WinnerAnnouncement from '@/components/WinnerAnnouncement'
import CandidateDetailModal from '@/app/components/CandidateDetailModal'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

interface Candidate {
  id: string
  candidate_number: number
  ketua_name: string
  wakil_name: string
  ketua_class: string
  wakil_class: string
  visi: string
  misi: string
  program_kerja: string
  ketua_photo_url?: string
  wakil_photo_url?: string
}

interface CandidateResult {
  candidate_id: string
  candidate_number: number
  ketua_name: string
  wakil_name: string
  ketua_class: string
  wakil_class: string
  ketua_photo_url?: string
  wakil_photo_url?: string
  voteCount: number
  percentage: number
}

interface VotingStats {
  totalVoters: number
  votedCount: number
  notVotedCount: number
  votingPercentage: number
  candidateResults: CandidateResult[]
}

function SearchParamsHandler() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  useEffect(() => {
    if (message) {
      toast.error(message)
    }
  }, [message])

  return null
}

export default function HomePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true)
  
  // Modal state for candidate details
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState<Candidate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [settings, setSettings] = useState<{ 
    announcement_time: string | null,
    winner_id: string | null 
  }>({ 
    announcement_time: null,
    winner_id: null
  })

  const [votingStats, setVotingStats] = useState<VotingStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    fetchCandidates()
    fetchSettings()
    fetchVotingStats()

    // Realtime subscription untuk update suara masuk
    const channel = supabaseClient
      .channel('realtime-votes-homepage')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        () => {
          fetchVotingStats()
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [])

  async function fetchSettings() {
    try {
      const { data: allSettings, error: fetchError } = await supabaseClient
        .from('settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      if (fetchError) throw fetchError

      if (!allSettings || allSettings.length === 0) {
        setSettings({
          announcement_time: null,
          winner_id: null
        })
        return
      }

      const latestSettings = allSettings[0]
      setSettings({
        announcement_time: latestSettings.announcement_time,
        winner_id: latestSettings.winner_id
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      const msg = error instanceof Error ? error.message : 'Gagal memuat pengaturan'
      toast.error(msg)
    }
  }

  async function fetchCandidates() {
    try {
      setIsLoadingCandidates(true)
      const { data, error } = await supabaseClient
        .from('candidates')
        .select('*')
        .order('candidate_number')

      if (error) throw error
      setCandidates(data || [])
    } catch (error) {
      console.error('Error fetching candidates:', error)
      toast.error('Gagal memuat data kandidat')
    } finally {
      setIsLoadingCandidates(false)
    }
  }

  async function fetchVotingStats() {
    try {
      setIsLoadingStats(true)

      // 1. Data Pemilih (DPT)
      const { data: votersData } = await supabaseClient
        .from('voters')
        .select('has_voted')

      const totalVoters = votersData?.length || 0
      const votedCount = votersData?.filter(v => v.has_voted).length || 0
      const notVotedCount = Math.max(0, totalVoters - votedCount)
      const votingPercentage = totalVoters > 0 ? Number(((votedCount / totalVoters) * 100).toFixed(1)) : 0

      // 2. Data Kandidat
      const { data: candidatesData } = await supabaseClient
        .from('candidates')
        .select('*')
        .order('candidate_number')

      // 3. Data Suara Masuk
      const { data: votesData } = await supabaseClient
        .from('votes')
        .select('candidate_id')

      const totalVotes = votesData?.length || 0
      const voteCounts: Record<string, number> = {}
      votesData?.forEach(v => {
        if (v.candidate_id) {
          voteCounts[v.candidate_id] = (voteCounts[v.candidate_id] || 0) + 1
        }
      })

      const candidateResults: CandidateResult[] = (candidatesData || []).map(cand => {
        const count = voteCounts[cand.id] || 0
        const percentage = totalVotes > 0 ? Number(((count / totalVotes) * 100).toFixed(1)) : 0
        return {
          candidate_id: cand.id,
          candidate_number: cand.candidate_number,
          ketua_name: cand.ketua_name,
          wakil_name: cand.wakil_name,
          ketua_class: cand.ketua_class,
          wakil_class: cand.wakil_class,
          ketua_photo_url: cand.ketua_photo_url,
          wakil_photo_url: cand.wakil_photo_url,
          voteCount: count,
          percentage
        }
      }).sort((a, b) => b.voteCount - a.voteCount)

      setVotingStats({
        totalVoters,
        votedCount,
        notVotedCount,
        votingPercentage,
        candidateResults
      })
    } catch (err) {
      console.error('Error fetching voting stats:', err)
    } finally {
      setIsLoadingStats(false)
    }
  }

  function getProkerHighlights(text: string, count: number = 2): string[] {
    if (!text || !text.trim()) return []
    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line.replace(/^(\d+[\.\)]\s*|[-•*]\s*)/, '').trim())
      .filter(Boolean)
      .slice(0, count)
  }

  const currentYear = new Date().getFullYear()
  const currentPeriod = `${currentYear}/${currentYear + 1}`
  const isAnnouncementConcluded = settings?.announcement_time 
    ? new Date(settings.announcement_time).getTime() <= new Date().getTime() 
    : false

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>

      {/* Official Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand & Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-800 transition-colors shrink-0">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  PilihKu
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                  OSIS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none">
                Sistem E-Voting Resmi
              </p>
            </div>
          </Link>

          {/* Quick Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#tata-cara" className="hover:text-blue-600 transition-colors">
              Tata Cara
            </a>
            <a href="#kandidat" className="hover:text-blue-600 transition-colors">
              Paslon Kandidat
            </a>
            <a href="#hasil-voting" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Hasil Voting</span>
            </a>
            {settings?.announcement_time && (
              <a href="#pengumuman" className="hover:text-blue-600 transition-colors">
                Jadwal Hasil
              </a>
            )}
          </nav>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/80 mr-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Bilik Suara Aktif
            </div>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-xs hover:shadow-sm"
            >
              <Vote className="w-4 h-4" />
              <span>Masuk NIS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* School Election Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-200/80 mb-6"
            >
              <School className="w-4 h-4 text-blue-600" />
              <span>Pemilihan Ketua & Wakil Ketua OSIS • Periode {currentPeriod}</span>
            </motion.div>

            {/* Authoritative Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight"
            >
              Suara Berintegritas untuk Pemimpin Masa Depan Sekolah
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
            >
              Wujudkan demokrasi sekolah yang jujur, adil, dan transparan. Kenali visi misi setiap pasangan calon dan berikan suaramu secara sah melalui sistem digital.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto"
            >
              <Link
                href="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md transition-all duration-150"
              >
                <Vote className="w-5 h-5" />
                <span>Mulai Memilih Sekarang</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <a
                href="#hasil-voting"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-all duration-150 border border-slate-200/80"
              >
                <BarChart3 className="w-5 h-5 text-slate-500" />
                <span>Lihat Hasil Voting</span>
              </a>
            </motion.div>

            {/* Core Election Guarantees */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto"
            >
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    1 Siswa 1 Suara
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Validasi ketat dengan NIS terdaftar, mencegah duplikasi pemilihan.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Kerahasiaan Terjamin
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilihan suara dienkripsi tanpa keterkaitan identitas pemilih.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Perhitungan Akurat
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hasil rekapitulasi otomatis dan transparan bagi seluruh sekolah.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Winner Announcement / Live Countdown / Pop-up Trigger */}
        {settings?.announcement_time && (
          <section id="pengumuman" className="py-10 bg-slate-100/70 border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <WinnerAnnouncement 
                announcementTime={settings.announcement_time} 
                winnerId={settings.winner_id}
              />
            </div>
          </section>
        )}

        {/* HASIL VOTING (PEROLEHAN SUARA PEMILU) */}
        <section id="hasil-voting" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border bg-blue-50 text-blue-700 border-blue-200/80">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>
                  {isAnnouncementConcluded 
                    ? 'Hasil Resmi Pemilihan Ditetapkan' 
                    : 'Rekapitulasi Suara Berjalan (Real-time)'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Hasil Perolehan Suara
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                Transparansi perolehan suara pasangan calon dan rekapitulasi partisipasi pemilih
              </p>
            </div>

            {isLoadingStats ? (
              <div className="min-h-[220px] flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-500">Memuat rekapitulasi suara...</p>
              </div>
            ) : votingStats ? (
              <div className="space-y-10">
                {/* 3 Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {/* Suara Masuk */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Suara Masuk
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                        {votingStats.votedCount}
                      </span>
                      <span className="text-xs font-semibold text-blue-600">
                        ({votingStats.votingPercentage}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Dari total {votingStats.totalVoters} pemilih terdaftar
                    </p>
                  </div>

                  {/* Partisipasi Pemilih */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Partisipasi Siswa
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-emerald-600 tabular-nums">
                        {votingStats.votingPercentage}%
                      </span>
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {votingStats.votedCount} siswa telah menggunakan hak suara
                    </p>
                  </div>

                  {/* Belum Memilih */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Belum Memilih
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-slate-700 tabular-nums">
                        {votingStats.notVotedCount}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Siswa
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Daftar pemilih yang belum verifikasi suara
                    </p>
                  </div>
                </div>

                {/* Perolehan Suara Per Pasangan Calon */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-5 sm:p-8">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Rincian Perolehan Suara Paslon
                    </h3>
                    <span className="text-xs font-medium text-slate-500">
                      Total Suara Sah: <span className="font-bold text-slate-800">{votingStats.votedCount}</span>
                    </span>
                  </div>

                  {votingStats.candidateResults.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 text-sm">
                      Belum ada data perolehan suara.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {votingStats.candidateResults.map((result, idx) => {
                        const isTopCandidate = idx === 0 && votingStats.votedCount > 0
                        return (
                          <div 
                            key={result.candidate_id}
                            className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              {/* Paslon Identity */}
                              <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-black text-sm flex items-center justify-center shrink-0">
                                  {String(result.candidate_number).padStart(2, '0')}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900 text-base">
                                      {result.ketua_name} & {result.wakil_name}
                                    </h4>
                                    {isTopCandidate && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                        <Award className="w-3 h-3 text-amber-500" />
                                        <span>{isAnnouncementConcluded ? 'Pemenang Terpilih' : 'Suara Terbanyak'}</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    Ketua: {result.ketua_class} • Wakil: {result.wakil_class}
                                  </p>
                                </div>
                              </div>

                              {/* Vote Numbers */}
                              <div className="flex items-baseline sm:items-end flex-row sm:flex-col justify-between sm:justify-center gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                <span className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
                                  {result.voteCount} <span className="text-xs font-semibold text-slate-500">Suara</span>
                                </span>
                                <span className="text-xs font-bold text-blue-600 tabular-nums">
                                  {result.percentage}%
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200/60">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ${
                                  isTopCandidate 
                                    ? 'bg-blue-600 shadow-xs' 
                                    : 'bg-slate-400'
                                }`}
                                style={{ width: `${Math.max(result.percentage, 2)}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Tata Cara Pemilihan (Electoral Workflow) */}
        <section id="tata-cara" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Tata Cara Pemungutan Suara
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                Empat langkah ringkas dan aman untuk menyalurkan hak suara secara sah
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  icon: <User className="w-5 h-5 text-blue-600" />,
                  title: 'Otentikasi NIS',
                  desc: 'Akses menu voting dan masukkan Nomor Induk Siswa (NIS) yang terdaftar pada DPT.'
                },
                {
                  step: '02',
                  icon: <Search className="w-5 h-5 text-blue-600" />,
                  title: 'Pelajari Paslon',
                  desc: 'Bandingkan visi, misi, dan program kerja unggulan dari setiap pasangan calon.'
                },
                {
                  step: '03',
                  icon: <Vote className="w-5 h-5 text-blue-600" />,
                  title: 'Tentukan Pilihan',
                  desc: 'Masuk ke bilik suara dan pilih nomor urut kandidat yang paling sesuai hati nuranimu.'
                },
                {
                  step: '04',
                  icon: <CheckCircle className="w-5 h-5 text-blue-600" />,
                  title: 'Konfirmasi Suara',
                  desc: 'Pastikan pilihanmu tepat sebelum konfirmasi akhir. Suara langsung terekam ke sistem.'
                }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 relative flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                        {item.icon}
                      </div>
                      <span className="font-mono text-2xl font-black text-slate-300">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Candidate Showcase Section (Mobile Optimized Ballot Cards) */}
        <section id="kandidat" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Daftar Pasangan Calon
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                Ketahui visi, misi, dan program kerja calon Ketua & Wakil Ketua OSIS
              </p>
            </div>

            {isLoadingCandidates ? (
              <div className="min-h-[280px] flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-500">Memuat data pasangan calon...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="max-w-md mx-auto text-center py-12 px-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Belum Ada Paslon Terdaftar</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Panitia pemilihan belum menerbitkan daftar pasangan calon untuk periode ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {candidates.map((candidate) => {
                  const prokerHighlights = getProkerHighlights(candidate.program_kerja, 2)

                  return (
                    <article
                      key={candidate.id}
                      className="group bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col"
                    >
                      {/* Ballot Top Header Bar */}
                      <div className="bg-slate-900 px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Surat Suara Resmi
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white font-mono font-black text-xs tracking-wider shadow-xs">
                          PASLON {String(candidate.candidate_number).padStart(2, '0')}
                        </div>
                      </div>

                      <div className="p-5 sm:p-7 flex-1 flex flex-col">
                        {/* Dual Portrait Layout (Ketua & Wakil) */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-5 pb-6 border-b border-slate-100">
                          {/* Calon Ketua */}
                          <div className="flex flex-col">
                            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 mb-3 shadow-xs">
                              {candidate.ketua_photo_url ? (
                                <Image
                                  src={candidate.ketua_photo_url}
                                  alt={candidate.ketua_name}
                                  fill
                                  sizes="(max-width: 640px) 45vw, 250px"
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                  <User className="w-10 h-10 mb-1 text-slate-400" />
                                  <span className="text-[11px] font-medium text-slate-400">Foto Ketua</span>
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                                  Calon Ketua
                                </span>
                              </div>
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                              {candidate.ketua_name}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">
                              Kelas: <span className="text-slate-700">{candidate.ketua_class}</span>
                            </p>
                          </div>

                          {/* Calon Wakil */}
                          <div className="flex flex-col">
                            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 mb-3 shadow-xs">
                              {candidate.wakil_photo_url ? (
                                <Image
                                  src={candidate.wakil_photo_url}
                                  alt={candidate.wakil_name}
                                  fill
                                  sizes="(max-width: 640px) 45vw, 250px"
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                  <User className="w-10 h-10 mb-1 text-slate-400" />
                                  <span className="text-[11px] font-medium text-slate-400">Foto Wakil</span>
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500 text-amber-950 text-[10px] font-extrabold tracking-wider uppercase shadow-xs">
                                  Calon Wakil
                                </span>
                              </div>
                            </div>
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                              {candidate.wakil_name}
                            </h4>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">
                              Kelas: <span className="text-slate-700">{candidate.wakil_class}</span>
                            </p>
                          </div>
                        </div>

                        {/* Visi Spotlight Cardlet */}
                        <div className="mt-5 bg-slate-50/90 rounded-2xl p-4 border border-slate-100">
                          <div className="flex items-center gap-2 mb-1.5 text-blue-700">
                            <Quote className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                              Visi Kepemimpinan
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed italic line-clamp-2">
                            &ldquo;{candidate.visi || 'Visi belum diisi oleh pasangan calon.'}&rdquo;
                          </p>
                        </div>

                        {/* Program Unggulan Preview */}
                        <div className="mt-4 flex-1 flex flex-col justify-start">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Sorotan Program Kerja
                          </span>
                          <div className="space-y-1.5">
                            {prokerHighlights.length > 0 ? (
                              prokerHighlights.map((proker, pIdx) => (
                                <div 
                                  key={pIdx}
                                  className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50/60 hover:bg-slate-100/80 px-3 py-2 rounded-xl border border-slate-100/80 transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="line-clamp-1 font-medium">{proker}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic py-1">
                                Program kerja lengkap dapat ditinjau melalui tombol detail.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card Action Footer */}
                        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCandidateForModal(candidate)
                              setIsModalOpen(true)
                            }}
                            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span>Visi, Misi & Proker</span>
                          </button>

                          <Link
                            href="/auth/login"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-xs hover:shadow-sm"
                          >
                            <Vote className="w-4 h-4" />
                            <span>Pilih Paslon</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {/* Interactive Candidate Detail Modal */}
            <CandidateDetailModal
              candidate={selectedCandidateForModal}
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false)
                setSelectedCandidateForModal(null)
              }}
            />
          </div>
        </section>

        {/* Asas Pemilihan Umum Sekolah (LUBER JURDIL) */}
        <section className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Asas Pemilihan Umum Siswa
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
                PilihKu mengadopsi prinsip pemilihan nasional demi menjamin kepemimpinan sekolah yang bermartabat
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
              {[
                { title: 'Langsung', desc: 'Diberikan langsung tanpa diwakilkan siapapun' },
                { title: 'Umum', desc: 'Berlaku bagi seluruh siswa sekolah yang berhak' },
                { title: 'Bebas', desc: 'Bebas memilih sesuai nurani tanpa paksaan' },
                { title: 'Rahasia', desc: 'Pilihan suara terjaga dan tidak dapat dilacak' },
                { title: 'Jujur', desc: 'Sistem audit bebas dari intervensi atau kecurangan' },
                { title: 'Adil', desc: 'Setiap paslon memiliki kesempatan setara' }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/70 text-center flex flex-col justify-center shadow-xs"
                >
                  <span className="font-extrabold text-sm sm:text-base text-blue-700 block">
                    {item.title}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-16 sm:py-20 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Siap Menentukan Arah Kepengurusan OSIS Baru?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Setiap suara menentukan program kerja, aspirasi, dan kemajuan kegiatan siswa satu tahun ke depan.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold rounded-xl text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 shadow-md transition-all"
              >
                <Vote className="w-5 h-5 text-blue-600" />
                <span>Masuk ke Bilik Suara Sekarang</span>
              </Link>
              <a
                href="#hasil-voting"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 transition-all"
              >
                <BarChart3 className="w-5 h-5 text-slate-400" />
                <span>Lihat Perolehan Suara</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Mobile Quick Vote Floating Bar */}
      <div className="sm:hidden fixed bottom-4 inset-x-4 z-30">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-slate-800">
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Vote className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Pemilihan OSIS</p>
              <p className="text-[10px] text-slate-400 leading-tight">Gunakan hak suaramu</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href="#hasil-voting"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Hasil</span>
            </a>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
            >
              <span>Vote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Official Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-10 pb-24 sm:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-700 text-white flex items-center justify-center shrink-0">
              <Vote className="w-3.5 h-3.5" />
            </div>
            <span>
              &copy; {currentYear} PilihKu E-Voting. Komisi Pemilihan OSIS Sekolah.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="https://instagram.com/biimaa_jo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800 transition-colors"
            >
              Built by <span className="font-semibold text-slate-700">BimaDev</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
