import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

interface ClassStats {
  className: string
  totalStudents: number
  votedCount: number
  notVotedCount: number
  percentage: number
}

export function useRealtimeVotes() {
  const [votingStats, setVotingStats] = useState<VotingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVotingStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Ambil total pemilih
      const { data: votersData, error: votersError } = await supabase
        .from('voters')
        .select('id, has_voted')

      if (votersError) throw votersError

      // Ambil data kandidat
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('candidate_number')

      if (candidatesError) throw candidatesError

      // Ambil data votes dengan join ke candidates
      const { data: votesData, error: votesError } = await supabase
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
      setError('Gagal memuat data voting')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchVotingStats()

    // Set up real-time subscriptions
    const votesChannel = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'votes'
        },
        (payload) => {
          console.log('Votes table changed:', payload)
          // Refetch stats when votes change
          fetchVotingStats()
        }
      )
      .subscribe()

    const votersChannel = supabase
      .channel('voters-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'voters',
          filter: 'has_voted=eq.true'
        },
        (payload) => {
          console.log('Voters table changed:', payload)
          // Refetch stats when voter status changes
          fetchVotingStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(votesChannel)
      supabase.removeChannel(votersChannel)
    }
  }, [fetchVotingStats])

  return {
    votingStats,
    isLoading,
    error,
    refetch: fetchVotingStats
  }
}

export function useRealtimeClassStats() {
  const [classStats, setClassStats] = useState<ClassStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClassStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: voters, error } = await supabase
        .from('voters')
        .select('class, has_voted')
        .order('class')

      if (error) throw error

      const classMap = new Map<string, { total: number; voted: number }>()

      voters?.forEach(voter => {
        const currentClass = classMap.get(voter.class) || { total: 0, voted: 0 }
        classMap.set(voter.class, {
          total: currentClass.total + 1,
          voted: currentClass.voted + (voter.has_voted ? 1 : 0)
        })
      })

      const formattedStats = Array.from(classMap.entries()).map(([className, stats]) => ({
        className,
        totalStudents: stats.total,
        votedCount: stats.voted,
        notVotedCount: stats.total - stats.voted,
        percentage: stats.total === 0 ? 0 : Number(((stats.voted / stats.total) * 100).toFixed(2))
      }))

      setClassStats(formattedStats.sort((a, b) => a.className.localeCompare(b.className)))

    } catch (error) {
      console.error('Error fetching class stats:', error)
      setError('Gagal memuat statistik kelas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchClassStats()

    // Set up real-time subscription for voters table
    const votersChannel = supabase
      .channel('voters-class-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'voters'
        },
        (payload) => {
          console.log('Voters table changed:', payload)
          // Refetch class stats when voter data changes
          fetchClassStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(votersChannel)
    }
  }, [fetchClassStats])

  return {
    classStats,
    isLoading,
    error,
    refetch: fetchClassStats
  }
}
