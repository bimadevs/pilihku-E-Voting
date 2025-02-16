'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FaVoteYea, FaUserShield, FaCheckCircle, FaUsers, FaHandshake } from 'react-icons/fa'
import { BsGraphUp } from 'react-icons/bs'
import { Loader2 } from 'lucide-react'
import { supabaseClient } from '@/lib/auth'

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

export default function HomePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'visi' | 'misi' | 'program kerja'>('visi')
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null)

  useEffect(() => {
    fetchCandidates()
  }, [])

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section - Made More Engaging */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Suaramu Masa Depan Sekolah Kita
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-xl text-gray-600 sm:text-2xl max-w-3xl mx-auto"
            >
              Berpartisipasilah dalam pemilihan OSIS dengan jujur dan bijaksana untuk membangun sekolah yang lebih baik
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 md:text-lg transition-all duration-200 shadow-sm hover:shadow"
              >
                <FaVoteYea className="mr-2" />
                Mulai Voting
              </Link>
              {/* <Link
                href="/admin/login"
                className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 md:text-lg transition-all duration-200"
              >
                <FaUserShield className="mr-2" />
                Login Admin
              </Link> */}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Candidates Section - Now with Educational Context */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center hidden mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Kandidat OSIS
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Kenali calon pemimpin masa depan sekolah kita. Setiap kandidat membawa visi dan misi 
            untuk kemajuan bersama.
          </p>
        </div>

        {isLoadingCandidates ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-8 h-8 text-blue-500" />
            </motion.div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center hidden py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600">Belum ada kandidat yang terdaftar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {candidates.map((candidate) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Candidate Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3">
                  <h3 className="text-lg font-semibold text-white text-center">
                    Paslon {candidate.candidate_number}
                  </h3>
                </div>

                {/* Candidate Info */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Ketua */}
                    <div className="text-center">
                      <div className="aspect-square relative w-24 h-24 mx-auto rounded-xl overflow-hidden shadow-md mb-2">
                        <Image
                          src={candidate.ketua_photo_url || ''}
                          alt={candidate.ketua_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h4 className="font-medium text-gray-900">{candidate.ketua_name}</h4>
                      <p className="text-sm text-gray-500">Calon Ketua OSIS • {candidate.ketua_class}</p>
                    </div>

                    {/* Wakil */}
                    <div className="text-center">
                      <div className="aspect-square relative w-24 h-24 mx-auto rounded-xl overflow-hidden shadow-md mb-2">
                        <Image
                          src={candidate.wakil_photo_url || ''}
                          alt={candidate.wakil_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h4 className="font-medium text-gray-900">{candidate.wakil_name}</h4>
                      <p className="text-sm text-gray-500">Calon Wakil OSIS • {candidate.wakil_class}</p>
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

      {/* Why Voting Matters Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Mengapa Suaramu Penting?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Setiap suara memiliki makna dalam membangun masa depan sekolah kita
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <FaCheckCircle className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Integritas</h3>
            <p className="text-gray-600">
              Voting jujur mencerminkan karakter dan integritas kita sebagai siswa yang bertanggung jawab
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <FaUsers className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Representasi</h3>
            <p className="text-gray-600">
              Pemimpin yang kita pilih akan mewakili aspirasi dan kebutuhan seluruh siswa
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <FaHandshake className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Perubahan</h3>
            <p className="text-gray-600">
              Suaramu adalah langkah pertama menuju perubahan positif di sekolah kita
            </p>
          </motion.div>
        </div>
      </section>

      {/* Voting Guide Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Panduan Voting yang Baik
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Tips memilih pemimpin yang tepat untuk sekolah kita
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Kenali Kandidat",
                desc: "Pelajari visi, misi, dan program kerja setiap kandidat"
              },
              {
                step: "2",
                title: "Analisis Program",
                desc: "Nilai kesesuaian program dengan kebutuhan sekolah"
              },
              {
                step: "3",
                title: "Pilih Berdasarkan Merit",
                desc: "Pilih berdasarkan kemampuan dan track record"
              },
              {
                step: "4",
                title: "Jaga Kerahasiaan",
                desc: "Rahasiakan pilihanmu dan hormati pilihan orang lain"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-100 rounded-full opacity-50" />
                <span className="text-5xl font-bold text-blue-100 absolute right-4 top-2">
                  {item.step}
                </span>
                <h3 className="text-xl font-semibold mb-2 relative z-10">{item.title}</h3>
                <p className="text-gray-600 relative z-10">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer with Call to Action */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Siap Memberikan Suaramu?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Setiap suara berarti untuk masa depan sekolah kita
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 md:text-lg transition-all duration-200 shadow-sm hover:shadow"
          >
            <FaVoteYea className="mr-2" />
            Mulai Voting Sekarang
          </Link>
          
          {/* Credit Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
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
        </div>
      </div>
    </div>
  )
}
