'use client'

import { useState, useEffect, ReactNode } from 'react'
import { supabaseClient } from '@/lib/auth'
import Image from 'next/image'
import { LoadingSpinner } from '@/app/components/loading-spinner'
import { ConfirmVoteModal } from '@/app/components/confirm-vote-modal'
import { VotingHeader } from '@/app/components/voting-header'
import { CandidateCard } from '@/app/components/candidate-card'
import { toast } from 'react-hot-toast'

interface Candidate {
  program_kerja: ReactNode
  id: string
  candidate_number: number
  ketua_name: string
  wakil_name: string
  visi: string
  misi: string
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
  const [success, setSuccess] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [stats, setStats] = useState({ totalVoters: 0, votedCount: 0 })

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
      const { data, error } = await supabaseClient
        .from('candidates')
        .select('*')
        .order('candidate_number')

      if (error) throw error
      setCandidates(data || [])
    } catch (error) {
      console.error('Error:', error)
      setError('Gagal memuat data kandidat')
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

      setSuccess(true)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VotingHeader 
        totalVoters={stats.totalVoters}
        votedCount={stats.votedCount}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Selamat Datang, {voter.full_name}
          </h1>
          <p className="text-gray-600">
            Kelas: {voter.class}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-28 mt-10">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden transition-all
                ${selectedCandidate === candidate.id 
                  ? 'ring-2 ring-blue-500 transform scale-105' 
                  : 'hover:shadow-lg cursor-pointer'}`}
              onClick={() => setSelectedCandidate(candidate.id)}
            >
              <div className="bg-blue-600 text-white py-2 px-4">
                <h2 className="text-xl font-semibold text-center">
                  Paslon {candidate.candidate_number}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4">
                <div className="space-y-2">
                  <div className="aspect-square relative rounded-lg overflow-hidden">
                    {candidate.ketua_photo_url ? (
                      <Image
                        src={candidate.ketua_photo_url}
                        alt={candidate.ketua_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Photo</span>
                      </div>
                    )}
                  </div>
                  <p className="text-center font-medium">{candidate.ketua_name}</p>
                  <p className="text-center text-sm text-gray-500">Calon Ketua</p>
                </div>

                <div className="space-y-2">
                  <div className="aspect-square relative rounded-lg overflow-hidden">
                    {candidate.wakil_photo_url ? (
                      <Image
                        src={candidate.wakil_photo_url}
                        alt={candidate.wakil_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Photo</span>
                      </div>
                    )}
                  </div>
                  <p className="text-center font-medium">{candidate.wakil_name}</p>
                  <p className="text-center text-sm text-gray-500">Calon Wakil</p>
                </div>
              </div>

              <div className="p-4 border-t">
                <div className="mb-4">
                  <h3 className="font-semibold text-blue-600 mb-2">Visi:</h3>
                  <p className="text-sm text-gray-600">{candidate.visi}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">Misi:</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {candidate.misi}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-600 mb-2">Program Kerja:</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {candidate.program_kerja}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex items-center">
                <div className="w-6 h-6 border-2 rounded-full mr-3 flex items-center justify-center">
                  {selectedCandidate === candidate.id && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  )}
                </div>
                <span className="text-sm font-medium">
                  Pilih Paslon {candidate.candidate_number}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!selectedCandidate || loading}
              className={`w-full py-3 px-4 rounded-md text-white font-medium
                ${!selectedCandidate || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {loading ? <LoadingSpinner /> : 'Konfirmasi Pilihan'}
            </button>
          </div>
        </div>

        <ConfirmVoteModal
          isOpen={showConfirmModal}
          candidate={candidates.find(c => c.id === selectedCandidate) || null}
          onConfirm={handleVote}
          onCancel={() => setShowConfirmModal(false)}
        />
      </div>
    </div>
  )
}
