'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/auth'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

export default function VotePage() {
  const [voter, setVoter] = useState<Voter | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [stats, setStats] = useState({ totalVoters: 0, votedCount: 0 })
  const [activeTab, setActiveTab] = useState<'visi' | 'misi'>('visi')
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true)

  useEffect(() => {
    loadVoterData()
    fetchCandidates()
    fetchVotingStats()
  }, [])

  function loadVoterData() {
    const voterCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('voter='))
    
    if (voterCookie) {
      const voterData = JSON.parse(voterCookie.split('=')[1])
      setVoter(voterData)
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

  async function fetchVotingStats() {
    try {
      const { data: votersData } = await supabaseClient
        .from('voters')
        .select('has_voted')
      
      const totalVoters = votersData?.length || 0
      const votedCount = votersData?.filter(v => v.has_voted)?.length || 0
      
      setStats({ totalVoters, votedCount })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function handleVote() {
    if (!selectedCandidate || !voter) return

    setLoading(true)
    setError('')

    try {
      // 1. Catat suara
      const { error: voteError } = await supabaseClient
        .from('votes')
        .insert([
          {
            voter_id: voter.id,
            candidate_id: selectedCandidate
          }
        ])

      if (voteError) throw voteError

      // 2. Update status pemilih
      const { error: updateError } = await supabaseClient
        .from('voters')
        .update({ has_voted: true })
        .eq('id', voter.id)

      if (updateError) throw updateError

      // Redirect ke halaman sukses setelah voting
      window.location.href = '/vote/success'

    } catch (error) {
      console.error('Error submitting vote:', error)
      setError('Gagal melakukan voting')
    } finally {
      setLoading(false)
    }
  }

  if (!voter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col space-y-2">
            <h1 className="text-xl font-bold text-gray-900">
              Selamat Datang, {voter.full_name}
            </h1>
            <p className="text-sm text-gray-600">
              Kelas: {voter.class}
            </p>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(stats.votedCount / stats.totalVoters) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {stats.votedCount} dari {stats.totalVoters} siswa telah memilih
            </p>
          </div>
        </div>
      </header>

      {/* Candidates List */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {isLoadingCandidates ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-8 h-8 text-blue-500" />
            </motion.div>
            <p className="mt-4 text-gray-600">Memuat data kandidat...</p>
          </div>
        ) : candidates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm p-8"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg 
                className="w-8 h-8 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Belum Ada Kandidat
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              Mohon maaf, saat ini belum ada kandidat yang terdaftar. 
              Silakan coba lagi nanti ketika periode pendaftaran kandidat telah dibuka.
            </p>
            <div className="mt-6 bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
              <p className="text-center">
                Periode pendaftaran kandidat akan dibuka segera.
                Pantau terus untuk informasi selanjutnya.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 mb-20 gap-4">
            {candidates.map((candidate) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                className={`${
                  selectedCandidate === candidate.id
                    ? 'bg-blue-50 ring-2 ring-blue-500 shadow-blue-100'
                    : 'bg-white hover:shadow-md'
                } rounded-xl shadow-sm overflow-hidden transition-all duration-200 cursor-pointer`}
                onClick={() => setSelectedCandidate(candidate.id)}
              >
                {/* Candidate Number */}
                <div className={`px-4 py-2 ${
                  selectedCandidate === candidate.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}>
                  <h2 className="text-lg font-semibold text-white text-center">
                    Paslon {candidate.candidate_number}
                  </h2>
                </div>

                {/* Candidate Photos */}
                <div className="grid grid-cols-2 gap-4 p-4">
                  {/* Ketua */}
                  <div className="space-y-2">
                    <div className={`aspect-square relative rounded-lg overflow-hidden ${
                      selectedCandidate === candidate.id
                        ? 'ring-4 ring-white shadow-lg'
                        : 'bg-gray-100'
                    }`}>
                      {candidate.ketua_photo_url ? (
                        <Image
                          src={candidate.ketua_photo_url}
                          alt={candidate.ketua_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 40vw, 25vw"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400">No Photo</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`font-medium ${
                        selectedCandidate === candidate.id
                          ? 'text-blue-900'
                          : 'text-gray-900'
                      }`}>{candidate.ketua_name}</p>
                      <p className={`text-sm ${
                        selectedCandidate === candidate.id
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }`}>Calon Ketua</p>
                    </div>
                  </div>

                  {/* Wakil */}
                  <div className="space-y-2">
                    <div className={`aspect-square relative rounded-lg overflow-hidden ${
                      selectedCandidate === candidate.id
                        ? 'ring-4 ring-white shadow-lg'
                        : 'bg-gray-100'
                    }`}>
                      {candidate.wakil_photo_url ? (
                        <Image
                          src={candidate.wakil_photo_url}
                          alt={candidate.wakil_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 40vw, 25vw"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400">No Photo</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`font-medium ${
                        selectedCandidate === candidate.id
                          ? 'text-blue-900'
                          : 'text-gray-900'
                      }`}>{candidate.wakil_name}</p>
                      <p className={`text-sm ${
                        selectedCandidate === candidate.id
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }`}>Calon Wakil</p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className={`px-4 border-t ${
                  selectedCandidate === candidate.id
                    ? 'border-blue-200'
                    : 'border-gray-100'
                }`}>
                  <div className="flex space-x-4 -mb-px">
                    {(['visi', 'misi'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveTab(tab)
                        }}
                        className={`py-3 border-b-2 text-sm font-medium transition-colors ${
                          activeTab === tab
                            ? selectedCandidate === candidate.id
                              ? 'border-blue-600 text-blue-700'
                              : 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`text-sm ${
                        selectedCandidate === candidate.id
                          ? 'text-blue-900'
                          : 'text-gray-600'
                      }`}
                    >
                      {activeTab === 'visi' && candidate.visi.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                      {activeTab === 'misi' && candidate.misi.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Selection Indicator */}
                <div className={`p-4 flex items-center ${
                  selectedCandidate === candidate.id
                    ? 'bg-blue-100'
                    : 'bg-gray-50'
                }`}>
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedCandidate === candidate.id
                      ? 'border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedCandidate === candidate.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 bg-blue-500 rounded-full"
                      />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    selectedCandidate === candidate.id
                      ? 'text-blue-700'
                      : 'text-gray-600'
                  }`}>
                    Pilih Paslon {candidate.candidate_number}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-20">
        <div className="max-w-7xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowConfirmModal(true)}
            disabled={!selectedCandidate || loading}
            className={`w-full py-3 px-4 rounded-xl text-white font-medium
              ${!selectedCandidate || loading
                ? 'bg-gray-300'
                : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Memproses...
              </span>
            ) : (
              'Konfirmasi Pilihan'
            )}
          </motion.button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">
              Konfirmasi Pilihan
            </DialogTitle>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Info Paslon yang Dipilih */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-center mb-4">
                  <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Paslon {candidates.find(c => c.id === selectedCandidate)?.candidate_number}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Ketua */}
                  <div className="space-y-2 text-center">
                    <div className="aspect-square relative w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md">
                      <Image
                        src={candidates.find(c => c.id === selectedCandidate)?.ketua_photo_url || ''}
                        alt="Foto Ketua"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Calon Ketua</h3>
                      <p className="text-sm text-gray-700">
                        {candidates.find(c => c.id === selectedCandidate)?.ketua_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {candidates.find(c => c.id === selectedCandidate)?.ketua_class}
                      </p>
                    </div>
                  </div>

                  {/* Wakil */}
                  <div className="space-y-2 text-center">
                    <div className="aspect-square relative w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md">
                      <Image
                        src={candidates.find(c => c.id === selectedCandidate)?.wakil_photo_url || ''}
                        alt="Foto Wakil"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Calon Wakil</h3>
                      <p className="text-sm text-gray-700">
                        {candidates.find(c => c.id === selectedCandidate)?.wakil_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {candidates.find(c => c.id === selectedCandidate)?.wakil_class}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Peringatan */}
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                <p className="text-sm text-yellow-700 text-center">
                  Apakah Anda yakin dengan pilihan Anda? 
                  <br />
                  <span className="font-medium">Pilihan tidak dapat diubah setelah dikonfirmasi.</span>
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleVote}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    'Ya, Konfirmasi'
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
