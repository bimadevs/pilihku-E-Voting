'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/auth'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Target,
  Sparkles,
  ArrowRight,
  User,
  Check,
  Lock,
  ChevronRight,
  Info,
  Users
} from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import BrandLogo from '@/components/BrandLogo'
import toast from 'react-hot-toast'

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

interface Voter {
  id: string
  nis: string
  full_name: string
  class: string
  has_voted: boolean
}

type TabType = 'visi' | 'misi' | 'program'

interface CandidateTheme {
  primary: string
  primaryHover: string
  text: string
  textDark: string
  border: string
  ring: string
  shadow: string
  badgeBg: string
  badgeBorder: string
  wakilTag: string
  accentNumberBg: string
}

const CANDIDATE_THEMES: CandidateTheme[] = [
  // Paslon 1: Royal Blue
  {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    text: 'text-blue-600',
    textDark: 'text-blue-700',
    border: 'border-blue-600',
    ring: 'ring-blue-600/15',
    shadow: 'shadow-blue-600/20',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    wakilTag: 'bg-blue-700/85',
    accentNumberBg: 'bg-blue-100 text-blue-700',
  },
  // Paslon 2: Vibrant Purple
  {
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    text: 'text-purple-600',
    textDark: 'text-purple-700',
    border: 'border-purple-600',
    ring: 'ring-purple-600/15',
    shadow: 'shadow-purple-600/20',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
    wakilTag: 'bg-purple-700/85',
    accentNumberBg: 'bg-purple-100 text-purple-700',
  },
  // Paslon 3: Emerald Green
  {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    text: 'text-emerald-600',
    textDark: 'text-emerald-800',
    border: 'border-emerald-600',
    ring: 'ring-emerald-600/15',
    shadow: 'shadow-emerald-600/20',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    wakilTag: 'bg-emerald-700/85',
    accentNumberBg: 'bg-emerald-100 text-emerald-800',
  },
  // Paslon 4: Warm Amber / Orange
  {
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    text: 'text-amber-600',
    textDark: 'text-amber-900',
    border: 'border-amber-600',
    ring: 'ring-amber-600/15',
    shadow: 'shadow-amber-600/20',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    wakilTag: 'bg-amber-700/85',
    accentNumberBg: 'bg-amber-100 text-amber-900',
  },
  // Paslon 5: Rose / Crimson
  {
    primary: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    text: 'text-rose-600',
    textDark: 'text-rose-800',
    border: 'border-rose-600',
    ring: 'ring-rose-600/15',
    shadow: 'shadow-rose-600/20',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    wakilTag: 'bg-rose-700/85',
    accentNumberBg: 'bg-rose-100 text-rose-800',
  },
]

function getCandidateTheme(candidateNumber: number, index: number): CandidateTheme {
  const targetIndex = (candidateNumber > 0 ? candidateNumber - 1 : index) % CANDIDATE_THEMES.length
  return CANDIDATE_THEMES[targetIndex]
}

function parseLines(text?: string): string[] {
  if (!text) return []
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[-*•\d.]+\s*/, ''))
}

export default function VotePage() {
  const router = useRouter()
  const [voter, setVoter] = useState<Voter | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [stats, setStats] = useState({ totalVoters: 0, votedCount: 0 })
  const [activeTabs, setActiveTabs] = useState<Record<string, TabType>>({})
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function init() {
      // 1. Load Voter Data
      try {
        const voterCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('voter='))

        if (!voterCookie) {
          if (isMounted) {
            setVoter(null)
            setIsCheckingAuth(false)
          }
        } else {
          const parsedVoter: Voter = JSON.parse(decodeURIComponent(voterCookie.split('=')[1]))
          if (parsedVoter?.id) {
            const { data: latestVoter } = await supabaseClient
              .from('voters')
              .select('*')
              .eq('id', parsedVoter.id)
              .single()

            if (isMounted) {
              setVoter(latestVoter || parsedVoter)
              setIsCheckingAuth(false)
            }
          } else if (isMounted) {
            setVoter(parsedVoter)
            setIsCheckingAuth(false)
          }
        }
      } catch (err) {
        console.error('Gagal membaca sesi pemilih:', err)
        if (isMounted) {
          setVoter(null)
          setIsCheckingAuth(false)
        }
      }

      // 2. Fetch Candidates
      try {
        const { data, error } = await supabaseClient
          .from('candidates')
          .select('*')
          .order('candidate_number', { ascending: true })

        if (error) throw error
        if (isMounted) {
          setCandidates(data || [])
          const initialTabs: Record<string, TabType> = {}
          data?.forEach(c => {
            initialTabs[c.id] = 'visi'
          })
          setActiveTabs(initialTabs)
          setIsLoadingCandidates(false)
        }
      } catch (err) {
        console.error('Error fetching candidates:', err)
        if (isMounted) {
          setError('Gagal memuat daftar pasangan calon. Silakan muat ulang halaman.')
          setIsLoadingCandidates(false)
        }
      }

      // 3. Fetch Stats
      try {
        const { data: votersData } = await supabaseClient
          .from('voters')
          .select('has_voted')

        const totalVoters = votersData?.length || 0
        const votedCount = votersData?.filter(v => v.has_voted)?.length || 0

        if (isMounted) {
          setStats({ totalVoters, votedCount })
        }
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedCandidate = useMemo(() => {
    return candidates.find(c => c.id === selectedCandidateId) || null
  }, [candidates, selectedCandidateId])

  const selectedTheme = useMemo(() => {
    if (!selectedCandidate) return CANDIDATE_THEMES[0]
    const candidateIndex = candidates.findIndex(c => c.id === selectedCandidate.id)
    return getCandidateTheme(selectedCandidate.candidate_number, candidateIndex)
  }, [selectedCandidate, candidates])

  function handleTabChange(candidateId: string, tab: TabType) {
    setActiveTabs(prev => ({
      ...prev,
      [candidateId]: tab
    }))
  }

  async function handleVote() {
    if (!selectedCandidateId || !voter) return

    setLoading(true)
    setError(null)

    try {
      // 1. Simpan suara
      const { error: voteError } = await supabaseClient
        .from('votes')
        .insert([
          {
            voter_id: voter.id,
            candidate_id: selectedCandidateId
          }
        ])

      if (voteError) throw voteError

      // 2. Perbarui status has_voted pemilih
      const { error: updateError } = await supabaseClient
        .from('voters')
        .update({ has_voted: true })
        .eq('id', voter.id)

      if (updateError) throw updateError

      toast.success('Suara Anda berhasil dicatat!')
      setShowConfirmModal(false)

      // 3. Arahkan ke halaman sukses
      router.push('/vote/success')
    } catch (err: unknown) {
      console.error('Error submitting vote:', err)
      const errorMsg = (err instanceof Error) ? err.message : 'Gagal mengirim suara. Silakan coba kembali.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Hitung persentase partisipasi suara
  const turnoutPercentage = useMemo(() => {
    if (stats.totalVoters === 0) return 0
    return Math.round((stats.votedCount / stats.totalVoters) * 100)
  }, [stats])

  // --- STATE 1: SEDANG CEK SESI / AUTH ---
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 mb-4 animate-pulse">
          <Vote className="w-7 h-7" />
        </div>
        <p className="text-slate-900 font-semibold text-base">Menyiapkan Bilik Suara...</p>
        <p className="text-slate-500 text-sm mt-1">Memverifikasi kredensial pemilih Anda</p>
      </div>
    )
  }

  // --- STATE 2: BELUM LOGIN / SESI HILANG ---
  if (!voter) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Sesi Voting Tidak Ditemukan
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Untuk menjaga integritas dan kerahasiaan suara, Anda harus login terlebih dahulu menggunakan Nomor Induk Siswa (NIS) resmi.
          </p>
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <span>Login dengan NIS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors text-center"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // --- STATE 3: SUDAH PERNAH MEMILIH ---
  if (voter.has_voted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            Hak Suara Telah Digunakan
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Terima Kasih, {voter.full_name}!
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Anda telah berhasil memberikan suara dalam Pemilihan Ketua & Wakil Ketua OSIS. Setiap siswa hanya memiliki satu hak suara yang sah dan terlindungi kerahasiaannya.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Nama Siswa:</span>
              <span className="font-semibold text-slate-900">{voter.full_name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Kelas:</span>
              <span className="font-semibold text-slate-900">{voter.class}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 text-sm transition-colors text-center"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // --- STATE 4: BILIK SUARA AKTIF ---
  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* Sticky Modern App Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Top Row: Brand & Voter Info (Nama & Kelas Saja) */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="sm" variant="squircle" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    Pilih<span className="text-blue-600">Ku</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wide border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-none">Bilik Suara OSIS</p>
              </div>
            </div>

            {/* Info Pemilih: Hanya Nama dan Kelas (Tanpa Profil & NIS) */}
            <div className="text-right px-3.5 py-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/70 max-w-[180px] sm:max-w-xs">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {voter.full_name}
              </p>
              <p className="text-[11px] font-medium text-slate-500 truncate leading-none mt-0.5">
                Kelas: {voter.class}
              </p>
            </div>
          </div>

          {/* Turnout Progress Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${turnoutPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
              Partisipasi: <span className="font-semibold text-slate-800">{stats.votedCount}/{stats.totalVoters}</span> ({turnoutPercentage}%)
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-5 pb-32">
        {/* Banner Instruksi */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Tentukan Pemimpin OSIS Pilihanmu
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Kenali visi, misi, dan program kerja masing-masing pasangan calon. Setiap paslon memiliki nomor dan warna khusus untuk memudahkan Anda dalam menentukan pilihan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <p className="flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs font-semibold underline hover:text-red-900"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Candidate Feed */}
        {isLoadingCandidates ? (
          <div className="space-y-4">
            {[1, 2].map(n => (
              <div key={n} className="bg-white rounded-3xl p-5 border border-slate-200/80 animate-pulse">
                <div className="h-6 w-32 bg-slate-200 rounded-full mb-4" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="aspect-[4/5] bg-slate-200 rounded-xl" />
                  <div className="aspect-[4/5] bg-slate-200 rounded-xl" />
                </div>
                <div className="h-10 bg-slate-100 rounded-xl mb-3" />
                <div className="h-16 bg-slate-100 rounded-xl mb-4" />
                <div className="h-11 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Belum Ada Kandidat Terdaftar</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Panitia pemilihan belum menerbitkan daftar pasangan calon aktif. Silakan hubungi pembina atau panitia OSIS.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {candidates.map((candidate, index) => {
              const isSelected = selectedCandidateId === candidate.id
              const currentTab = activeTabs[candidate.id] || 'visi'
              const misiItems = parseLines(candidate.misi)
              const prokerItems = parseLines(candidate.program_kerja)
              const theme = getCandidateTheme(candidate.candidate_number, index)

              return (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  className={`relative rounded-3xl transition-all duration-200 cursor-pointer overflow-hidden border ${
                    isSelected
                      ? `bg-white ${theme.border} shadow-xl ${theme.shadow} ring-4 ${theme.ring}`
                      : 'bg-white border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Selection Glow Indicator */}
                  {isSelected && (
                    <div className={`h-1.5 w-full ${theme.primary}`} />
                  )}

                  <div className="p-4 sm:p-6">
                    {/* Header: Badge Nomor Khusus Warna Paslon & Status Seleksi */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${theme.primary} text-white font-bold text-xs sm:text-sm tracking-wide shadow-sm`}>
                        <Vote className="w-4 h-4" />
                        <span>PASLON {String(candidate.candidate_number).padStart(2, '0')}</span>
                      </div>

                      <div className="flex items-center">
                        {isSelected ? (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${theme.badgeBg} ${theme.textDark} text-xs font-bold border ${theme.badgeBorder}`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Terpilih
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 hover:text-slate-900">
                            Ketuk untuk Memilih
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dual Candidate Showcase: Ketua & Wakil */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
                      {/* Calon Ketua */}
                      <div className="flex flex-col">
                        <div className="aspect-[4/5] relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70 shadow-inner">
                          {candidate.ketua_photo_url ? (
                            <Image
                              src={candidate.ketua_photo_url}
                              alt={candidate.ketua_name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 45vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center bg-gradient-to-b from-slate-50 to-slate-100">
                              <User className="w-10 h-10 mb-1 opacity-40 text-slate-500" />
                              <span className="text-[11px] font-medium text-slate-400">Foto Ketua</span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold tracking-wider uppercase">
                            Ketua
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight line-clamp-1">
                            {candidate.ketua_name}
                          </h2>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Kelas: {candidate.ketua_class || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Calon Wakil */}
                      <div className="flex flex-col">
                        <div className="aspect-[4/5] relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70 shadow-inner">
                          {candidate.wakil_photo_url ? (
                            <Image
                              src={candidate.wakil_photo_url}
                              alt={candidate.wakil_name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 45vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center bg-gradient-to-b from-slate-50 to-slate-100">
                              <User className="w-10 h-10 mb-1 opacity-40 text-slate-500" />
                              <span className="text-[11px] font-medium text-slate-400">Foto Wakil</span>
                            </div>
                          )}
                          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md ${theme.wakilTag} backdrop-blur-xs text-white text-[10px] font-bold tracking-wider uppercase`}>
                            Wakil
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight line-clamp-1">
                            {candidate.wakil_name}
                          </h2>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Kelas: {candidate.wakil_class || '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Tab Switcher: Visi / Misi / Program Kerja */}
                    <div className="mt-2 border-t border-slate-100 pt-3">
                      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTabChange(candidate.id, 'visi')
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            currentTab === 'visi'
                              ? `bg-white ${theme.textDark} shadow-xs`
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visi</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTabChange(candidate.id, 'misi')
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            currentTab === 'misi'
                              ? `bg-white ${theme.textDark} shadow-xs`
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>Misi</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTabChange(candidate.id, 'program')
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            currentTab === 'program'
                              ? `bg-white ${theme.textDark} shadow-xs`
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Program</span>
                        </button>
                      </div>

                      {/* Tab Content Panel */}
                      <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed min-h-[90px]">
                        <AnimatePresence mode="wait">
                          {currentTab === 'visi' && (
                            <motion.div
                              key="visi"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                            >
                              <p className="italic text-slate-700">
                                “{candidate.visi || 'Visi belum diisi oleh kandidat.'}”
                              </p>
                            </motion.div>
                          )}

                          {currentTab === 'misi' && (
                            <motion.div
                              key="misi"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="space-y-2"
                            >
                              {misiItems.length > 0 ? (
                                misiItems.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-2.5">
                                    <span className={`flex-shrink-0 w-4 h-4 rounded-full ${theme.accentNumberBg} font-bold text-[10px] flex items-center justify-center mt-0.5`}>
                                      {idx + 1}
                                    </span>
                                    <span className="flex-1 text-slate-700">{item}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-500 italic">Misi belum diisi oleh kandidat.</p>
                              )}
                            </motion.div>
                          )}

                          {currentTab === 'program' && (
                            <motion.div
                              key="program"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="space-y-2"
                            >
                              {prokerItems.length > 0 ? (
                                prokerItems.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-2.5">
                                    <span className="flex-shrink-0 w-4 h-4 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center mt-0.5">
                                      <Sparkles className="w-2.5 h-2.5" />
                                    </span>
                                    <span className="flex-1 text-slate-700">{item}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-500 italic">Program kerja belum diisi oleh kandidat.</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Bottom Card Action Button */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCandidateId(candidate.id)
                        }}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                          isSelected
                            ? `${theme.primary} text-white shadow-md ${theme.shadow}`
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Paslon Ini Telah Dipilih</span>
                          </>
                        ) : (
                          <>
                            <span>Pilih Paslon {String(candidate.candidate_number).padStart(2, '0')}</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Action Dock (Thumb-Zone Optimized) */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-3 sm:p-4 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {selectedCandidate ? (
            <>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className={`w-11 h-11 rounded-2xl ${selectedTheme.primary} text-white font-bold text-base flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {String(selectedCandidate.candidate_number).padStart(2, '0')}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-[11px] font-bold ${selectedTheme.text} uppercase tracking-wider block`}>
                    Paslon Pilihan Anda
                  </span>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {selectedCandidate.ketua_name} & {selectedCandidate.wakil_name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={loading}
                className={`w-full sm:w-auto px-6 py-3.5 ${selectedTheme.primary} ${selectedTheme.primaryHover} active:scale-[0.99] text-white font-bold rounded-xl shadow-lg ${selectedTheme.shadow} flex items-center justify-center gap-2 text-sm sm:text-base transition-all`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Lanjutkan Konfirmasi Suara</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>Pilih salah satu kartu paslon di atas untuk melanjutkan hak suara.</span>
              </div>
              <button
                disabled
                className="hidden sm:inline-flex px-5 py-3 bg-slate-100 text-slate-400 font-semibold rounded-xl text-sm cursor-not-allowed border border-slate-200/60"
              >
                Belum Ada Pilihan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Bottom-Sheet Modal Konfirmasi Suara */}
      <DialogPrimitive.Root open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
          <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200/90 max-h-[88vh] overflow-y-auto outline-none">
            {/* Mobile Handle Bar */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 sm:hidden" />

            {/* Header Dialog */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <DialogPrimitive.Title className="text-lg sm:text-xl font-bold text-slate-900">
                Konfirmasi Pilihan Suara
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs sm:text-sm text-slate-500 mt-1">
                Pastikan pilihan Anda sudah benar sebelum dikirimkan secara permanen.
              </DialogPrimitive.Description>
            </div>

            {selectedCandidate && (
              <div className="space-y-4">
                {/* Snapshot Paslon Terpilih */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                  <div className="text-center mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${selectedTheme.primary} text-white text-xs font-bold tracking-wide`}>
                      <Vote className="w-3.5 h-3.5" />
                      PASLON {String(selectedCandidate.candidate_number).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Calon Ketua */}
                    <div className="text-center space-y-1.5">
                      <div className="aspect-square relative w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm">
                        {selectedCandidate.ketua_photo_url ? (
                          <Image
                            src={selectedCandidate.ketua_photo_url}
                            alt={selectedCandidate.ketua_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User className="w-8 h-8 opacity-40" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Calon Ketua
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                          {selectedCandidate.ketua_name}
                        </h3>
                        <p className="text-[11px] text-slate-500">{selectedCandidate.ketua_class}</p>
                      </div>
                    </div>

                    {/* Calon Wakil */}
                    <div className="text-center space-y-1.5">
                      <div className="aspect-square relative w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm">
                        {selectedCandidate.wakil_photo_url ? (
                          <Image
                            src={selectedCandidate.wakil_photo_url}
                            alt={selectedCandidate.wakil_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User className="w-8 h-8 opacity-40" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold ${selectedTheme.text} uppercase tracking-wider block`}>
                          Calon Wakil
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                          {selectedCandidate.wakil_name}
                        </h3>
                        <p className="text-[11px] text-slate-500">{selectedCandidate.wakil_class}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Peringatan Integritas Suara */}
                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Pilihan Bersifat Permanen & Rahasia</p>
                      <p className="text-amber-800/90 mt-0.5">
                        Setelah Anda menekan tombol konfirmasi, hak suara Anda langsung dikunci dan tidak dapat diubah kembali.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={loading}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Periksa Kembali
                  </button>

                  <button
                    type="button"
                    onClick={handleVote}
                    disabled={loading}
                    className={`w-full sm:flex-1 py-3 px-4 rounded-xl ${selectedTheme.primary} ${selectedTheme.primaryHover} active:scale-[0.99] text-white font-bold text-sm shadow-md ${selectedTheme.shadow} transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Suara...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Ya, Kirim Suara Saya</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
