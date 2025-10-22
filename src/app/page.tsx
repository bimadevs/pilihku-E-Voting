'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes'
import { supabaseClient } from '@/lib/auth'
import StepsSection from '@/components/home/StepsSection'
import HeroSection from '@/components/home/HeroSection'
import VotingResultsSection from '@/components/home/VotingResultsSection'
import CandidatesSection from '@/components/home/CandidatesSection'
import Footer from '@/components/home/Footer'
import { Candidate, TabType } from '@/components/home/types'

export default function HomePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('visi')
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  // Use real-time voting hook
  const { votingStats, isLoading: isLoadingStats } = useRealtimeVotes()

  useEffect(() => {
    if (message) {
      toast.error(message)
    }
  }, [message])

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
      toast.error('Gagal memuat data kandidat')
    } finally {
      setIsLoadingCandidates(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 overflow-x-hidden">
      <HeroSection />
      <StepsSection />
      <VotingResultsSection votingStats={votingStats} isLoadingStats={isLoadingStats} />
      <CandidatesSection
        candidates={candidates}
        isLoadingCandidates={isLoadingCandidates}
        activeTab={activeTab}
        expandedCandidate={expandedCandidate}
        onTabChange={setActiveTab}
        onExpandToggle={setExpandedCandidate}
      />
      <Footer />
    </div>
  )
}
