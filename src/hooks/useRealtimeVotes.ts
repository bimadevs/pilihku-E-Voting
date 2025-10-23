import { useEffect, useState, useCallback, useRef } from 'react'
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
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const totalVotersRef = useRef(0)

  const updateVotingStats = useCallback((votersData: any[], candidatesData: Candidate[], votesData: any[]) => {
    const totalVotes = votesData.length
    const participationRate = totalVotersRef.current > 0 ? (totalVotes / totalVotersRef.current) * 100 : 0

    // Hitung hasil per kandidat berdasarkan data votes yang sebenarnya
    const candidateResults = candidatesData.map(candidate => {
      const voteCount = votesData.filter(vote => vote.candidate_id === candidate.id).length
      const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0

      return {
        candidate,
        voteCount,
        percentage
      }
    }).sort((a, b) => b.voteCount - a.voteCount)

    setVotingStats({
      totalVoters: totalVotersRef.current,
      totalVotes,
      participationRate,
      candidateResults
    })
  }, [setVotingStats, totalVotersRef])

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Ambil semua data yang diperlukan untuk perhitungan yang akurat
      const [votersResponse, candidatesResponse, votesResponse] = await Promise.all([
        supabase.from('voters').select('id, has_voted'),
        supabase.from('candidates').select('*').order('candidate_number'),
        supabase.from('votes').select('id, candidate_id')
      ])

      if (votersResponse.error) throw votersResponse.error
      if (candidatesResponse.error) throw candidatesResponse.error
      if (votesResponse.error) throw votesResponse.error

      const votersData = votersResponse.data || []
      const candidatesData = candidatesResponse.data || []
      const votesData = votesResponse.data || []

      totalVotersRef.current = votersData.length
      setCandidates(candidatesData)

      // Hitung initial stats dengan data yang akurat
      updateVotingStats(votersData, candidatesData, votesData)

    } catch (error) {
      console.error('Error fetching initial data:', error)
      setError('Gagal memuat data voting')
    } finally {
      setIsLoading(false)
    }
  }, [updateVotingStats])

  useEffect(() => {
    // Initial fetch
    fetchInitialData()

    // Set up real-time subscriptions dengan optimistic updates
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

          if (payload.eventType === 'INSERT' && payload.new) {
            // Optimistic update: langsung tambah vote count tanpa fetch ulang
            setVotingStats(prev => {
              if (!prev) return prev

              const newTotalVotes = prev.totalVotes + 1
              const newParticipationRate = totalVotersRef.current > 0 ? (newTotalVotes / totalVotersRef.current) * 100 : 0

              // Update candidate results
              const updatedCandidateResults = prev.candidateResults.map(result => {
                if (result.candidate.id === payload.new.candidate_id) {
                  const newVoteCount = result.voteCount + 1
                  const newPercentage = newTotalVotes > 0 ? (newVoteCount / newTotalVotes) * 100 : 0

                  return {
                    ...result,
                    voteCount: newVoteCount,
                    percentage: newPercentage
                  }
                }
                return result
              }).sort((a, b) => b.voteCount - a.voteCount)

              return {
                ...prev,
                totalVotes: newTotalVotes,
                participationRate: newParticipationRate,
                candidateResults: updatedCandidateResults
              }
            })
          }

          else if (payload.eventType === 'DELETE' && payload.old) {
            // Optimistic update: kurangi vote count
            setVotingStats(prev => {
              if (!prev) return prev

              const newTotalVotes = Math.max(0, prev.totalVotes - 1)
              const newParticipationRate = totalVotersRef.current > 0 ? (newTotalVotes / totalVotersRef.current) * 100 : 0

              const updatedCandidateResults = prev.candidateResults.map(result => {
                if (result.candidate.id === payload.old.candidate_id) {
                  const newVoteCount = Math.max(0, result.voteCount - 1)
                  const newPercentage = newTotalVotes > 0 ? (newVoteCount / newTotalVotes) * 100 : 0

                  return {
                    ...result,
                    voteCount: newVoteCount,
                    percentage: newPercentage
                  }
                }
                return result
              }).sort((a, b) => b.voteCount - a.voteCount)

              return {
                ...prev,
                totalVotes: newTotalVotes,
                participationRate: newParticipationRate,
                candidateResults: updatedCandidateResults
              }
            })
          }

          else if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            // Handle vote changes (misalnya jika candidate_id berubah)
            if (payload.new.candidate_id !== payload.old.candidate_id) {
              setVotingStats(prev => {
                if (!prev) return prev

                const newTotalVotes = prev.totalVotes // Total tetap sama, hanya perpindahan vote
                const newParticipationRate = totalVotersRef.current > 0 ? (newTotalVotes / totalVotersRef.current) * 100 : 0

                const updatedCandidateResults = prev.candidateResults.map(result => {
                  let newVoteCount = result.voteCount

                  // Kurangi dari candidate lama
                  if (result.candidate.id === payload.old.candidate_id) {
                    newVoteCount = Math.max(0, result.voteCount - 1)
                  }
                  // Tambah ke candidate baru
                  else if (result.candidate.id === payload.new.candidate_id) {
                    newVoteCount = result.voteCount + 1
                  }

                  const newPercentage = newTotalVotes > 0 ? (newVoteCount / newTotalVotes) * 100 : 0

                  return {
                    ...result,
                    voteCount: newVoteCount,
                    percentage: newPercentage
                  }
                }).sort((a, b) => b.voteCount - a.voteCount)

                return {
                  ...prev,
                  totalVotes: newTotalVotes,
                  participationRate: newParticipationRate,
                  candidateResults: updatedCandidateResults
                }
              })
            }
          }
        }
      )
      .subscribe()

    const votersChannel = supabase
      .channel('voters-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'voters'
        },
        (payload) => {
          console.log('Voters table changed:', payload)

          if (payload.eventType === 'UPDATE') {
            // Optimistic update untuk voter status
            if (payload.new?.has_voted && !payload.old?.has_voted) {
              setVotingStats(prev => {
                if (!prev) return prev

                const newTotalVotes = prev.totalVotes + 1
                const newParticipationRate = totalVotersRef.current > 0 ? (newTotalVotes / totalVotersRef.current) * 100 : 0

                return {
                  ...prev,
                  totalVotes: newTotalVotes,
                  participationRate: newParticipationRate
                }
              })
            }
            // Handle jika has_voted diubah dari true ke false (jarang terjadi)
            else if (payload.old?.has_voted && !payload.new?.has_voted) {
              setVotingStats(prev => {
                if (!prev) return prev

                const newTotalVotes = Math.max(0, prev.totalVotes - 1)
                const newParticipationRate = totalVotersRef.current > 0 ? (newTotalVotes / totalVotersRef.current) * 100 : 0

                return {
                  ...prev,
                  totalVotes: newTotalVotes,
                  participationRate: newParticipationRate
                }
              })
            }
          }
          else if (payload.eventType === 'INSERT') {
            // Update total voters count
            totalVotersRef.current = totalVotersRef.current + 1

            setVotingStats(prev => {
              if (!prev) return prev

              const newTotalVoters = totalVotersRef.current
              const newParticipationRate = newTotalVoters > 0 ? (prev.totalVotes / newTotalVoters) * 100 : 0

              return {
                ...prev,
                totalVoters: newTotalVoters,
                participationRate: newParticipationRate
              }
            })
          }
          else if (payload.eventType === 'DELETE') {
            // Update total voters count
            totalVotersRef.current = Math.max(0, totalVotersRef.current - 1)

            setVotingStats(prev => {
              if (!prev) return prev

              const newTotalVoters = totalVotersRef.current
              const newParticipationRate = newTotalVoters > 0 ? (prev.totalVotes / newTotalVoters) * 100 : 0

              return {
                ...prev,
                totalVoters: newTotalVoters,
                participationRate: newParticipationRate
              }
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(votesChannel)
      supabase.removeChannel(votersChannel)
    }
  }, [fetchInitialData, updateVotingStats])

  return {
    votingStats,
    isLoading,
    error,
    refetch: fetchInitialData
  }
}

export function useRealtimeClassStats() {
  const [classStats, setClassStats] = useState<ClassStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [votersData, setVotersData] = useState<any[]>([])

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: voters, error } = await supabase
        .from('voters')
        .select('id, class, has_voted')
        .order('class')

      if (error) throw error

      setVotersData(voters || [])

      // Update class stats
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
    fetchInitialData()

    // Set up real-time subscription dengan optimistic updates
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
          console.log('Voters table changed for class stats:', payload)

          if (payload.eventType === 'INSERT' && payload.new) {
            // Optimistic update: tambah voter baru
            setVotersData(prev => {
              const newData = [...prev, payload.new]
              // Update class stats
              const classMap = new Map<string, { total: number; voted: number }>()

              newData.forEach(voter => {
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
              return newData
            })
          }
          else if (payload.eventType === 'UPDATE' && payload.new) {
            // Optimistic update: update voter yang ada
            setVotersData(prev => {
              const newData = prev.map(voter =>
                voter.id === payload.new.id ? payload.new : voter
              )
              // Update class stats
              const classMap = new Map<string, { total: number; voted: number }>()

              newData.forEach(voter => {
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
              return newData
            })
          }
          else if (payload.eventType === 'DELETE' && payload.old) {
            // Optimistic update: hapus voter
            setVotersData(prev => {
              const newData = prev.filter(voter => voter.id !== payload.old.id)
              // Update class stats
              const classMap = new Map<string, { total: number; voted: number }>()

              newData.forEach(voter => {
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
              return newData
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(votersChannel)
    }
  }, [fetchInitialData])

  return {
    classStats,
    isLoading,
    error,
    refetch: fetchInitialData
  }
}
