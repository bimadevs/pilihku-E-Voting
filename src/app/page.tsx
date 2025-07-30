'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FaVoteYea, FaUserShield, FaCheckCircle, FaUsers, FaHandshake, FaChartBar } from 'react-icons/fa'
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      {/* Hero Section - Modern and Dynamic */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-10"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto py-20 px-4 sm:py-32 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
              Suaramu Untuk
              <br />
              Masa Depan Sekolah
            </h1>
            <motion.p 
              className="mt-4 text-xl text-gray-600 sm:text-2xl max-w-3xl mx-auto"
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
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaVoteYea className="mr-2 text-xl" />
                Mulai Voting
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Winner Announcement Section */}
      {settings?.announcement_time && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <WinnerAnnouncement 
            announcementTime={settings.announcement_time} 
          />
        </div>
      )}

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Fitur Unggulan
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Platform e-voting modern dengan berbagai fitur canggih
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: <BsShieldCheck className="w-8 h-8" />,
                title: "Keamanan Terjamin",
                description: "Sistem voting yang aman dengan enkripsi data"
              },
              {
                icon: <BsClock className="w-8 h-8" />,
                title: "Real-time Updates",
                description: "Pantau hasil voting secara langsung"
              },
              {
                icon: <BsPeople className="w-8 h-8" />,
                title: "User Friendly",
                description: "Antarmuka yang mudah digunakan"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                variants={fadeInUp}
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Candidates Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Kandidat OSIS
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Kenali calon pemimpin masa depan sekolah kita
            </p>
          </motion.div>

          {isLoadingCandidates ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <p className="text-gray-600">Belum ada kandidat yang terdaftar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {candidates.map((candidate) => (
                <motion.div
                  key={candidate.id}
                  variants={fadeInUp}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                    <h3 className="text-xl font-semibold text-white text-center">
                      Paslon {candidate.candidate_number}
                    </h3>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      {/* Ketua */}
                      <div className="text-center">
                        <div className="aspect-square relative w-32 h-32 mx-auto rounded-xl overflow-hidden shadow-md mb-4">
                          <Image
                            src={candidate.ketua_photo_url || ''}
                            alt={candidate.ketua_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <h4 className="font-medium text-gray-900 text-lg">{candidate.ketua_name}</h4>
                        <p className="text-sm text-gray-500">Calon Ketua • {candidate.ketua_class}</p>
                      </div>

                      {/* Wakil */}
                      <div className="text-center">
                        <div className="aspect-square relative w-32 h-32 mx-auto rounded-xl overflow-hidden shadow-md mb-4">
                          <Image
                            src={candidate.wakil_photo_url || ''}
                            alt={candidate.wakil_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <h4 className="font-medium text-gray-900 text-lg">{candidate.wakil_name}</h4>
                        <p className="text-sm text-gray-500">Calon Wakil • {candidate.wakil_class}</p>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                      <div className="flex space-x-4">
                        {(['visi', 'misi', 'program kerja'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                              activeTab === tab
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mt-4">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`text-sm text-gray-600 ${
                            expandedCandidate === candidate.id ? '' : 'line-clamp-3'
                          }`}
                        >
                          {activeTab === 'visi' && candidate.visi}
                          {activeTab === 'misi' && candidate.misi}
                          {activeTab === 'program kerja' && candidate.program_kerja}
                        </motion.div>
                      </AnimatePresence>
                      
                      <button
                        onClick={() => setExpandedCandidate(
                          expandedCandidate === candidate.id ? null : candidate.id
                        )}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {expandedCandidate === candidate.id ? 'Lihat lebih sedikit' : 'Lihat selengkapnya'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Cara Voting
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Ikuti langkah-langkah berikut untuk memberikan suaramu
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                step: "1",
                title: "Login",
                desc: "Masuk menggunakan NIS yang telah terdaftar"
              },
              {
                step: "2",
                title: "Pilih Kandidat",
                desc: "Pelajari profil setiap kandidat dengan seksama"
              },
              {
                step: "3",
                title: "Konfirmasi",
                desc: "Pastikan pilihanmu sudah sesuai"
              },
              {
                step: "4",
                title: "Selesai",
                desc: "Suaramu telah tersimpan dengan aman"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-200"
              >
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-6xl font-bold text-blue-100 absolute right-4 top-2 group-hover:scale-110 transition-transform duration-200">
                  {item.step}
                </span>
                <h3 className="text-xl font-semibold mb-3 relative z-10">{item.title}</h3>
                <p className="text-gray-600 relative z-10">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl overflow-hidden shadow-xl"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <div className="px-6 py-12 md:p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                Siap Memberikan Suaramu?
              </h2>
              <p className="text-blue-100 mb-8 text-lg">
                Setiap suara menentukan masa depan sekolah kita
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl text-blue-600 bg-white hover:bg-blue-50 transform hover:scale-105 transition-all duration-200"
              >
                <FaVoteYea className="mr-2" />
                Mulai Voting Sekarang
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="https://instagram.com/biimaa_jo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Build by{' '}
              <span className="font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-indigo-600 hover:to-blue-600">
                BimaDev
              </span>
            </motion.span>
          </Link>
        </div>
      </footer>
    </div>
  )
}
