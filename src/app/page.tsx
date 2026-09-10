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
  CheckCircle
} from 'lucide-react'
import { supabaseClient } from '@/lib/auth'
import WinnerAnnouncement from '@/components/WinnerAnnouncement'
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
  
  // Independent tab and expansion per candidate
  const [candidateTabs, setCandidateTabs] = useState<Record<string, 'visi' | 'misi' | 'program kerja'>>({})
  const [expandedCandidates, setExpandedCandidates] = useState<Record<string, boolean>>({})

  const [settings, setSettings] = useState<{ 
    announcement_time: string | null,
    winner_id: string | null 
  }>({ 
    announcement_time: null,
    winner_id: null
  })

  useEffect(() => {
    fetchCandidates()
    fetchSettings()
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

  function getActiveTab(candidateId: string): 'visi' | 'misi' | 'program kerja' {
    return candidateTabs[candidateId] || 'visi'
  }

  function setActiveTab(candidateId: string, tab: 'visi' | 'misi' | 'program kerja') {
    setCandidateTabs(prev => ({ ...prev, [candidateId]: tab }))
  }

  function toggleExpanded(candidateId: string) {
    setExpandedCandidates(prev => ({ ...prev, [candidateId]: !prev[candidateId] }))
  }

  function renderFormattedContent(text: string) {
    if (!text || !text.trim()) {
      return <p className="text-slate-400 italic text-sm">Informasi belum diisi.</p>
    }

    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)

    if (lines.length > 1) {
      return (
        <ol className="space-y-1.5 text-slate-700 text-sm list-decimal list-inside leading-relaxed">
          {lines.map((line, idx) => {
            const cleanText = line.replace(/^(\d+[\.\)]\s*|[-•*]\s*)/, '')
            return (
              <li key={idx} className="pl-1">
                <span>{cleanText || line}</span>
              </li>
            )
          })}
        </ol>
      )
    }

    return (
      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
        {text}
      </p>
    )
  }

  const currentYear = new Date().getFullYear()
  const currentPeriod = `${currentYear}/${currentYear + 1}`

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

            {/* Authoritative Headline (NO gradient text) */}
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
                href="#kandidat"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-all duration-150 border border-slate-200/80"
              >
                <Users className="w-5 h-5 text-slate-500" />
                <span>Lihat Profil Paslon</span>
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

        {/* Winner Announcement / Live Countdown (if configured) */}
        {settings?.announcement_time && (
          <section id="pengumuman" className="py-10 bg-slate-100/70 border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <WinnerAnnouncement announcementTime={settings.announcement_time} />
            </div>
          </section>
        )}

        {/* Tata Cara Pemilihan (Electoral Workflow) */}
        <section id="tata-cara" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
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
                  className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-6 relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center">
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
        <section id="kandidat" className="py-16 sm:py-24 bg-slate-50">
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
                  const activeTab = getActiveTab(candidate.id)
                  const isExpanded = !!expandedCandidates[candidate.id]

                  return (
                    <article
                      key={candidate.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
                    >
                      {/* Ballot Top Header Bar */}
                      <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Surat Suara Resmi
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold text-xs">
                          PASLON {String(candidate.candidate_number).padStart(2, '0')}
                        </div>
                      </div>

                      <div className="p-5 sm:p-6 flex-1 flex flex-col">
                        {/* Dual Portrait Layout (Ketua & Wakil) */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 pb-6 border-b border-slate-100">
                          {/* Calon Ketua */}
                          <div className="flex flex-col">
                            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 mb-3 shadow-xs">
                              {candidate.ketua_photo_url ? (
                                <Image
                                  src={candidate.ketua_photo_url}
                                  alt={candidate.ketua_name}
                                  fill
                                  sizes="(max-width: 640px) 45vw, 250px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                  <User className="w-10 h-10 mb-1" />
                                  <span className="text-[10px] text-slate-400">Foto Ketua</span>
                                </div>
                              )}
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/85 text-white text-[10px] font-semibold backdrop-blur-xs">
                                Calon Ketua
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                              {candidate.ketua_name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {candidate.ketua_class}
                            </p>
                          </div>

                          {/* Calon Wakil */}
                          <div className="flex flex-col">
                            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 mb-3 shadow-xs">
                              {candidate.wakil_photo_url ? (
                                <Image
                                  src={candidate.wakil_photo_url}
                                  alt={candidate.wakil_name}
                                  fill
                                  sizes="(max-width: 640px) 45vw, 250px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                  <User className="w-10 h-10 mb-1" />
                                  <span className="text-[10px] text-slate-400">Foto Wakil</span>
                                </div>
                              )}
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/85 text-white text-[10px] font-semibold backdrop-blur-xs">
                                Calon Wakil
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                              {candidate.wakil_name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {candidate.wakil_class}
                            </p>
                          </div>
                        </div>

                        {/* Segmented Manifesto Controller */}
                        <div className="mt-5">
                          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
                            {(['visi', 'misi', 'program kerja'] as const).map((tab) => {
                              const isActive = activeTab === tab
                              return (
                                <button
                                  key={tab}
                                  type="button"
                                  onClick={() => setActiveTab(candidate.id, tab)}
                                  className={`flex-1 py-1.5 px-2 rounded-lg capitalize transition-all ${
                                    isActive 
                                      ? 'bg-white text-slate-900 shadow-xs font-bold' 
                                      : 'hover:text-slate-900 text-slate-500'
                                  }`}
                                >
                                  {tab}
                                </button>
                              )
                            })}
                          </div>

                          {/* Tab Content Body */}
                          <div className="mt-4 bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                            <div className={isExpanded ? '' : 'max-h-24 overflow-hidden relative'}>
                              {activeTab === 'visi' && renderFormattedContent(candidate.visi)}
                              {activeTab === 'misi' && renderFormattedContent(candidate.misi)}
                              {activeTab === 'program kerja' && renderFormattedContent(candidate.program_kerja)}
                              
                              {!isExpanded && (
                                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleExpanded(candidate.id)}
                              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 active:text-blue-800"
                            >
                              <span>{isExpanded ? 'Tutup rincian' : 'Lihat selengkapnya'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Asas Pemilihan Umum Sekolah (LUBER JURDIL) */}
        <section className="py-14 sm:py-20 bg-white border-y border-slate-200/80">
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
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-center flex flex-col justify-center"
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
            <div className="mt-8">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold rounded-xl text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 shadow-md transition-all"
              >
                <Vote className="w-5 h-5 text-blue-600" />
                <span>Masuk ke Bilik Suara Sekarang</span>
              </Link>
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
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
          >
            <span>Pilih Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
