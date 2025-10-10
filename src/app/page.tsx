'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FaVoteYea, FaUserShield, FaCheckCircle, FaUsers, FaHandshake, FaChartBar, FaLock, FaUserCheck, FaCheckDouble, FaRocket, FaInstagram, FaFacebook, FaTwitter, FaEnvelope, FaPhone, FaWhatsapp } from 'react-icons/fa'
import { BsGraphUp, BsShieldCheck, BsClock, BsPeople } from 'react-icons/bs'
import { Loader2 } from 'lucide-react'
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

interface VotingStats {
  totalVoters: number
  totalVotes: number
  participationRate: number
  candidateResults: {
    candidate: Candidate
    voteCount: number
    percentage: number
  }[]
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function HomePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true)
  const [votingStats, setVotingStats] = useState<VotingStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'visi' | 'misi' | 'program kerja'>('visi')
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null)
  const [settings, setSettings] = useState<{
    announcement_time: string | null,
    winner_id: string | null
  }>({
    announcement_time: null,
    winner_id: null
  })
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  useEffect(() => {
    if (message) {
      toast.error(message)
    }
  }, [message])

  useEffect(() => {
    fetchCandidates()
    fetchSettings()
    fetchVotingStats()
  }, [])

  async function fetchVotingStats() {
    try {
      setIsLoadingStats(true)

      // Ambil total pemilih
      const { data: votersData, error: votersError } = await supabaseClient
        .from('voters')
        .select('id, has_voted')

      if (votersError) throw votersError

      // Ambil data kandidat
      const { data: candidatesData, error: candidatesError } = await supabaseClient
        .from('candidates')
        .select('*')
        .order('candidate_number')

      if (candidatesError) throw candidatesError

      // Ambil data votes dengan join ke candidates
      const { data: votesData, error: votesError } = await supabaseClient
        .from('votes')
        .select(`
          id,
          candidate_id,
          candidates (*)
        `)

      if (votesError) throw votesError

      const totalVoters = votersData?.length || 0
      const totalVotes = votesData?.length || 0
      const participationRate = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0

      // Hitung hasil per kandidat
      const candidateResults = candidatesData?.map(candidate => {
        const voteCount = votesData?.filter(vote => vote.candidate_id === candidate.id).length || 0
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0

        return {
          candidate,
          voteCount,
          percentage
        }
      }).sort((a, b) => b.voteCount - a.voteCount) || []

      setVotingStats({
        totalVoters,
        totalVotes,
        participationRate,
        candidateResults
      })
    } catch (error) {
      console.error('Error fetching voting stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

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
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || "Gagal memuat pengaturan")
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
      console.error('Error:', error)
      setError('Gagal memuat data kandidat')
    } finally {
      setIsLoadingCandidates(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 overflow-x-hidden">
      {/* Steps Section - Premium Modern Design */}
      <section className="py-24 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-pink-600/30"></div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse animation-delay-4000"></div>
          <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>

          {/* Floating Particles */}
          <div className="absolute top-40 right-1/4 w-4 h-4 bg-white/40 rounded-full animate-bounce shadow-lg"></div>
          <div className="absolute bottom-40 left-1/4 w-6 h-6 bg-indigo-300/50 rounded-full animate-bounce animation-delay-1000 shadow-lg"></div>
          <div className="absolute top-1/2 left-10 w-3 h-3 bg-purple-300/60 rounded-full animate-bounce animation-delay-2000 shadow-lg"></div>
          <div className="absolute top-1/3 right-10 w-5 h-5 bg-pink-300/40 rounded-full animate-bounce animation-delay-3000 shadow-lg"></div>
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-300/50 rounded-full animate-bounce animation-delay-1500 shadow-lg"></div>
        </div>

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center mb-20"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-white/20 to-white/5 backdrop-blur-xl rounded-3xl mb-8 border border-white/30 shadow-2xl"
              whileHover={{ scale: 1.15, rotate: 15 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaVoteYea className="w-12 h-12 text-white drop-shadow-lg" />
            </motion.div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 text-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100">
              Cara Voting
            </h2>
            <p className="text-xl sm:text-2xl text-indigo-100 max-w-full mx-auto leading-relaxed font-light">
              Ikuti langkah-langkah mudah berikut untuk memberikan suaramu dengan aman dan terpercaya
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                step: "1",
                title: "Login",
                desc: "Masuk menggunakan NIS yang telah terdaftar di sistem",
                icon: <FaLock className="w-8 h-8" />,
                color: "from-indigo-500 via-blue-500 to-cyan-500"
              },
              {
                step: "2",
                title: "Pilih Kandidat",
                desc: "Pelajari profil setiap kandidat dengan seksama",
                icon: <FaUserCheck className="w-8 h-8" />,
                color: "from-purple-500 via-pink-500 to-rose-500"
              },
              {
                step: "3",
                title: "Konfirmasi",
                desc: "Pastikan pilihanmu sudah sesuai sebelum submit",
                icon: <FaCheckDouble className="w-8 h-8" />,
                color: "from-emerald-500 via-green-500 to-teal-500"
              },
              {
                step: "4",
                title: "Selesai",
                desc: "Suaramu telah tersimpan dengan aman di sistem",
                icon: <FaRocket className="w-8 h-8" />,
                color: "from-orange-500 via-red-500 to-pink-500"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="group"
              >
                <div className="relative">
                  {/* Enhanced Connection Line */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-white/40 to-transparent z-10">
                      <motion.div
                        className="h-full bg-gradient-to-r from-white via-blue-200 to-purple-200 rounded-full shadow-lg"
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        transition={{ delay: (index + 1) * 0.4, duration: 1.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                      />
                    </div>
                  )}

                  <motion.div
                    className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/30 hover:bg-white/15 transition-all duration-700 transform hover:-translate-y-3 hover:scale-108 hover:rotate-1 relative overflow-hidden shadow-2xl hover:shadow-[0_35px_60px_-12px_rgba(255,255,255,0.3)]"
                    whileHover={{
                      boxShadow: "0 35px 60px -12px rgba(255, 255, 255, 0.4)"
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                    }}
                  >
                    {/* Premium Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-15 transition-opacity duration-700 rounded-3xl blur-sm`}></div>

                    {/* Step Number with Enhanced Design */}
                    <motion.div
                      className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl ring-2 ring-white/20`}
                      whileHover={{ rotate: 360, scale: 1.15 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      <span className="text-3xl font-black text-white drop-shadow-lg">{item.step}</span>
                    </motion.div>

                    {/* Modern Icon */}
                    <motion.div
                      className="flex items-center justify-center h-20 mb-6 text-white drop-shadow-lg"
                      whileHover={{ scale: 1.3, rotate: 15 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {item.icon}
                    </motion.div>

                    {/* Premium Content */}
                    <div className="text-center relative z-10">
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-200 transition-all duration-500 drop-shadow-lg">
                        {item.title}
                      </h3>
                      <p className="text-indigo-100 leading-relaxed group-hover:text-white transition-colors duration-500 font-light text-lg">
                        {item.desc}
                      </p>
                    </div>

                    {/* Advanced Hover Effects */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"
                      initial={false}
                    />
                    <motion.div
                      className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Premium Call to Action */}
          <motion.div
            className="text-center mt-20"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            transition={{ delay: 1.0 }}
          >
            <motion.div
              className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-xl rounded-3xl px-10 py-5 border border-white/30 shadow-2xl hover:shadow-[0_20px_40px_-12px_rgba(255,255,255,0.3)]"
              whileHover={{ scale: 1.08, backgroundColor: "rgba(255, 255, 255, 0.2)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full shadow-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-white font-semibold text-lg drop-shadow-lg">Sistem voting tersedia 24/7</span>
              <motion.div
                className="w-2 h-2 bg-white/60 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hero Section - Modern and Dynamic */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-10"></div>
          <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-full mx-auto py-20 px-4 sm:py-32 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 break-words leading-relaxed text-balance">
              Suaramu Untuk
              <br />
              Masa Depan Sekolah
            </h1>
            <motion.p
              className="mt-4 text-xl text-gray-600 sm:text-2xl max-w-full mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Berpartisipasilah dalam pemilihan OSIS dengan jujur dan bijaksana untuk membangun sekolah yang lebih baik
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-2xl hover:shadow-3xl"
              >
                <FaVoteYea className="mr-2 text-xl" />
                Mulai Voting
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Winner Announcement & Voting Results Section */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 sm:space-y-12 overflow-hidden">
        {/* Winner Announcement */}
        <WinnerAnnouncement />

          {/* Voting Results - Only show when announcement is active */}
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl sm:rounded-4xl p-4 sm:p-8 shadow-2xl hover:shadow-3xl transition-shadow duration-300 leading-relaxed">
            <motion.div
              className="text-center mb-8 sm:mb-12"
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                <FaChartBar className="inline-block mr-2 sm:mr-3 text-blue-600 text-xl sm:text-2xl" />
                Hasil Voting
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Hasil perolehan suara setiap kandidat
              </p>
            </motion.div>

            {isLoadingStats ? (
              <div className="min-h-[200px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : votingStats ? (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="space-y-6"
              >
                {votingStats.candidateResults.map((result, index) => (
                  <motion.div
                    key={result.candidate.id}
                    variants={fadeInUp}
                    className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200"
                  >
                    <div className="p-4 sm:p-6 lg:p-8">
                      {/* Mobile Layout - Stack vertically */}
                      <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:gap-8 lg:space-y-0">
                        {/* Candidate Info - Mobile Optimized */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 flex-shrink-0">
                          {/* Number Badge */}
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl font-bold text-white ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                              'bg-gradient-to-r from-orange-400 to-orange-600'
                            }`}>
                            #{result.candidate.candidate_number}
                          </div>

                          {/* Photos and Names */}
                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Photos */}
                            <div className="flex gap-3 sm:gap-4">
                              <div className="text-center">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 relative rounded-lg sm:rounded-xl overflow-hidden shadow-md">
                                  <Image
                                    src={result.candidate.ketua_photo_url || '/placeholder-image.webp'}
                                    alt={result.candidate.ketua_name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 font-medium">Ketua</p>
                              </div>
                              <div className="text-center">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 relative rounded-lg sm:rounded-xl overflow-hidden shadow-md">
                                  <Image
                                    src={result.candidate.wakil_photo_url || '/placeholder-image.webp'}
                                    alt={result.candidate.wakil_name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 font-medium">Wakil</p>
                              </div>
                            </div>

                            {/* Names and Classes */}
                            <div className="text-center sm:text-left">
                              <h4 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                                {result.candidate.ketua_name} & {result.candidate.wakil_name}
                              </h4>
                              <p className="text-sm sm:text-base text-gray-600 mt-1">
                                {result.candidate.ketua_class} • {result.candidate.wakil_class}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Vote Stats - Mobile Optimized */}
                        <div className="flex-1 w-full">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 sm:gap-4">
                              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {result.voteCount}
                              </span>
                              <span className="text-base sm:text-lg text-gray-600">suara</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xl sm:text-2xl font-bold text-blue-600">
                                {result.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar - Enhanced for Mobile */}
                          <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                index === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                  'bg-gradient-to-r from-purple-500 to-purple-600'
                                }`}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${result.percentage}%` }}
                              transition={{ duration: 1.5, delay: index * 0.2 }}
                              viewport={{ once: true }}
                            />
                          </div>

                          {/* Winner Badge - Mobile Positioned */}
                          {index === 0 && result.voteCount > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              transition={{ delay: 0.5, type: "spring" }}
                              className="flex justify-center lg:justify-end mt-4 lg:mt-0"
                            >
                              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg">
                                🏆 TERDEPAN
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Refresh Notice */}
                <motion.div
                  className="text-center mt-8"
                  variants={fadeInUp}
                >
                  <p className="text-sm text-gray-500">
                    Data diperbarui secara real-time • Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <p className="text-gray-600">Belum ada data voting tersedia</p>
              </div>
            )}
          </section>
        </div>



      {/* Candidates Section - Enhanced Design */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden overflow-x-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center mb-20"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-6"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaUsers className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
              Kandidat OSIS
            </h2>
            <p className="text-xl text-gray-600 max-w-full mx-auto">
              Kenali calon pemimpin masa depan sekolah kita dengan visi, misi, dan program kerja yang inspiratif
            </p>
          </motion.div>

          {isLoadingCandidates ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Memuat data kandidat...</p>
              </div>
            </div>
          ) : candidates.length === 0 ? (
            <motion.div
              className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg"
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-xl text-gray-600">Belum ada kandidat yang terdaftar</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
              {candidates.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  variants={fadeInUp}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="group"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-4xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
                    {/* Header with Gradient */}
                    <div className={`relative px-8 py-6 ${index % 2 === 0
                      ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600'
                      : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600'
                      }`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <span className="text-2xl font-bold text-white">#{candidate.candidate_number}</span>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white">Paslon {candidate.candidate_number}</h3>
                            <p className="text-blue-100">Calon Ketua & Wakil Ketua OSIS</p>
                          </div>
                        </div>
                        <motion.div
                          className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <FaHandshake className="w-8 h-8 text-white" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="p-8">
                      {/* Candidate Photos - Mobile Responsive */}
                      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 mb-8">
                        {/* Ketua */}
                        <motion.div
                          className="text-center group/photo"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="relative">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ring-4 ring-white group-hover/photo:ring-blue-200 transition-all duration-300">
                              <Image
                                src={candidate.ketua_photo_url || '/placeholder-image.webp'}
                                alt={candidate.ketua_name}
                                fill
                                className="object-cover max-w-full group-hover/photo:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-xs font-bold">K</span>
                            </div>
                          </div>
                          <h4 className="font-bold text-gray-900 text-base sm:text-lg mt-3 sm:mt-4 group-hover/photo:text-blue-600 transition-colors">
                            {candidate.ketua_name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-500 font-medium">{candidate.ketua_class}</p>
                          <p className="text-xs text-blue-600 font-semibold mt-1">Calon Ketua</p>
                        </motion.div>

                        {/* Connector - Responsive */}
                        <div className="flex items-center">
                          <div className="w-8 h-0.5 sm:w-12 sm:h-0.5 bg-gradient-to-r from-blue-300 to-indigo-300 relative rotate-90 sm:rotate-0">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
                          </div>
                        </div>

                        {/* Wakil */}
                        <motion.div
                          className="text-center group/photo"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="relative">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ring-4 ring-white group-hover/photo:ring-indigo-200 transition-all duration-300">
                              <Image
                                src={candidate.wakil_photo_url || '/placeholder-image.webp'}
                                alt={candidate.wakil_name}
                                fill
                                className="object-cover max-w-full group-hover/photo:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-xs font-bold">W</span>
                            </div>
                          </div>
                          <h4 className="font-bold text-gray-900 text-base sm:text-lg mt-3 sm:mt-4 group-hover/photo:text-indigo-600 transition-colors">
                            {candidate.wakil_name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-500 font-medium">{candidate.wakil_class}</p>
                          <p className="text-xs text-indigo-600 font-semibold mt-1">Calon Wakil</p>
                        </motion.div>
                      </div>

                      {/* Enhanced Tabs */}
                      <div className="mb-6">
                        <div className="flex bg-gray-100 rounded-2xl p-1">
                          {(['visi', 'misi', 'program kerja'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === tab
                                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                            >
                              {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Enhanced Content */}
                      <div className="min-h-[120px]">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`${candidate.id}-${activeTab}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6"
                          >
                            {(() => {
                              const currentText = activeTab === 'visi' ? candidate.visi : activeTab === 'misi' ? candidate.misi : candidate.program_kerja
                              const shouldShowButton = currentText.length > 100

                              return (
                                <>
                                  <div className={`text-gray-700 leading-relaxed ${shouldShowButton && expandedCandidate !== candidate.id ? 'line-clamp-4' : ''}`}>
                                    {currentText}
                                  </div>

                                  {shouldShowButton && (
                                    <motion.button
                                      onClick={() => setExpandedCandidate(
                                        expandedCandidate === candidate.id ? null : candidate.id
                                      )}
                                      className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                      whileHover={{ x: 5 }}
                                      transition={{ type: "spring", stiffness: 300 }}
                                    >
                                      {expandedCandidate === candidate.id ? 'Lihat lebih sedikit' : 'Lihat selengkapnya'}
                                      <motion.span
                                        className="ml-1"
                                        animate={{ rotate: expandedCandidate === candidate.id ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                      >
                                        ↓
                                      </motion.span>
                                    </motion.button>
                                  )}
                                </>
                              )
                            })()}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* CTA Section */}
      {/* <section className="py-20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <div className="px-6 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-relaxed">
                Siap Memberikan Suaramu?
              </h2>
              <p className="text-blue-100 mb-8 text-lg sm:text-xl leading-relaxed">
                Setiap suara menentukan masa depan sekolah kita
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-2xl text-blue-600 bg-white hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaVoteYea className="mr-2" />
                Mulai Voting Sekarang
              </Link>
            </div>
          </motion.div>
        </div>
      </section> */}

      {/* Footer - Modern & Professional Design */}
      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-indigo-600/20"></div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Brand Section */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center mb-4">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <FaVoteYea className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Pilihku E-Voting
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6 text-base">
                Sistem voting elektronik modern untuk pemilihan OSIS yang aman, transparan, dan dapat dipercaya.
                Memberikan pengalaman voting yang mudah dan terjamin keamanannya.
              </p>
              <div className="flex space-x-4">
                <motion.a
                  href="https://instagram.com/biimaa_jo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  whileHover={{ y: -2 }}
                  aria-label="Follow us on Instagram"
                >
                  <FaInstagram className="w-5 h-5 text-white" />
                </motion.a>
                <motion.a
                  href="https://wa.me/6282254044783"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  whileHover={{ y: -2 }}
                  aria-label="Follow us on Facebook"
                >
                  <FaWhatsapp className="w-5 h-5 text-white" />
                </motion.a>
                {/* <motion.a
                  href="#"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  whileHover={{ y: -2 }}
                  aria-label="Follow us on Twitter"
                >
                  <FaTwitter className="w-5 h-5 text-white" />
                </motion.a> */}
              </div>
            </motion.div>

            {/* Support & Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="text-lg font-semibold mb-4 text-white">Support & Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <FaEnvelope className="w-4 h-4 mr-3 text-blue-400" />
                  <span className="text-sm">bimaj0206@gmail.com</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <FaPhone className="w-4 h-4 mr-3 text-green-400" />
                  <span className="text-sm">+62 822-5404-4783</span>
                </li>
                <li className="flex items-start text-gray-300">
                  <FaUserShield className="w-4 h-4 mr-3 mt-0.5 text-purple-400" />
                  <span className="text-sm leading-relaxed">
                    Sistem terenkripsi dan aman untuk privasi data Anda
                  </span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <motion.div
            className="border-t border-gray-700/50 mt-12 pt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Pilihku E-Voting. All rights reserved.
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <span>Built with</span>
                <motion.span
                  className="mx-1 text-red-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ❤️
                </motion.span>
                <span>by</span>
                <Link
                  href="https://instagram.com/biimaa_jo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
                  aria-label="Visit BimaDev's Instagram"
                >
                  BimaDev
                </Link>
              </div>
            </div>
            <motion.div
              className="mt-6 flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <FaLock className="w-3 h-3" />
                <span>SSL Encrypted • GDPR Compliant • Real-time Security</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
