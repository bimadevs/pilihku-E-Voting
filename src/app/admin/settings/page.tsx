'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

interface Settings {
  id?: string
  announcement_time: string | null
  winner_id: string | null
}

interface VotingResult {
  candidate_id: string
  ketua_name: string
  wakil_name: string
  vote_count: number
  percentage: number
}

export default function SettingsPage() {
  const [announcementTime, setAnnouncementTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [votingResults, setVotingResults] = useState<VotingResult[]>([])
  const [winnerId, setWinnerId] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
    fetchVotingResults()
  }, [])

  async function fetchVotingResults() {
    try {
      // Fetch votes count
      const { data: votesData, error: votesError } = await supabaseClient
        .from('votes')
        .select(`
          candidate_id,
          candidates (
            id,
            ketua_name,
            wakil_name
          )
        `)

      if (votesError) throw votesError

      // Calculate results
      const results = votesData.reduce((acc: any, vote: any) => {
        const candidateId = vote.candidate_id
        if (!acc[candidateId]) {
          acc[candidateId] = {
            candidate_id: candidateId,
            ketua_name: vote.candidates.ketua_name,
            wakil_name: vote.candidates.wakil_name,
            vote_count: 0
          }
        }
        acc[candidateId].vote_count++
        return acc
      }, {})

      // Convert to array and calculate percentages
      const totalVotes = Object.values(results).reduce((sum: any, result: any) => sum + result.vote_count, 0)
      const resultsArray = Object.values(results).map((result: any) => ({
        ...result,
        percentage: ((result.vote_count / (totalVotes as number)) * 100).toFixed(2)
      }))

      // Sort by vote count
      const sortedResults = resultsArray.sort((a: any, b: any) => b.vote_count - a.vote_count)
      setVotingResults(sortedResults)

      // Automatically set winner as the candidate with most votes
      if (sortedResults.length > 0) {
        setWinnerId(sortedResults[0].candidate_id)
      }

    } catch (error) {
      console.error('Error fetching results:', error)
      toast.error('Gagal memuat hasil voting')
    }
  }

  async function fetchSettings() {
    try {
      const { data: existingData, error: checkError } = await supabaseClient
        .from('settings')
        .select('*')

      if (checkError) throw checkError

      if (!existingData || existingData.length === 0) {
        const { data: newData, error: insertError } = await supabaseClient
          .from('settings')
          .insert([{
            announcement_time: null,
            winner_id: null
          }])
          .select()
          .single()

        if (insertError) throw insertError

        if (newData) {
          setSettingsId(newData.id)
          setAnnouncementTime('')
        }
      } else {
        const data = existingData[0]
        setSettingsId(data.id)
        if (data.announcement_time) {
          setAnnouncementTime(new Date(data.announcement_time).toISOString().slice(0, 16))
        } else {
          setAnnouncementTime('')
        }
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error)
      toast.error('Gagal memuat pengaturan')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!settingsId) {
        toast.error('ID Settings tidak ditemukan')
        return
      }

      if (!winnerId) {
        toast.error('Belum ada hasil voting')
        return
      }

      const settingsData = {
        announcement_time: announcementTime ? new Date(announcementTime).toISOString() : null,
        winner_id: winnerId
      }

      const { error: updateError } = await supabaseClient
        .from('settings')
        .update(settingsData)
        .eq('id', settingsId)

      if (updateError) throw updateError

      toast.success('Pengaturan berhasil disimpan')
      await fetchSettings()
    } catch (error: any) {
      console.error('Error in handleSubmit:', error)
      toast.error(error.message || 'Gagal menyimpan pengaturan')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!confirm('Apakah Anda yakin ingin mereset waktu pengumuman?')) return
    
    setLoading(true)
    try {
      const { error } = await supabaseClient
        .from('settings')
        .update({
          announcement_time: null,
          winner_id: null
        })
        .eq('id', settingsId)

      if (error) throw error

      setAnnouncementTime('')
      toast.success('Pengaturan berhasil direset')
      await fetchSettings()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal mereset pengaturan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">
            Pengaturan Pengumuman Pemenang
          </h1>

          {/* Tampilkan hasil voting */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Hasil Voting Saat Ini</h2>
            <div className="space-y-4">
              {votingResults.map((result, index) => (
                <div 
                  key={result.candidate_id}
                  className={`p-4 rounded-xl ${index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {result.ketua_name} & {result.wakil_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {result.vote_count} suara ({result.percentage}%)
                      </p>
                    </div>
                    {index === 0 && (
                      <span className="text-blue-600 text-sm font-medium">
                        Pemenang Sementara
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waktu Pengumuman Pemenang
              </label>
              <input
                type="datetime-local"
                value={announcementTime}
                onChange={(e) => setAnnouncementTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Pengumuman akan otomatis menampilkan pemenang berdasarkan jumlah suara terbanyak
              </p>
            </div>

            {/* Tampilkan pengaturan saat ini */}
            {announcementTime && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600">
                  Waktu pengumuman: {' '}
                  <span className="font-medium">
                    {(() => {
                      const date = new Date(announcementTime)
                      // Tambah 7 jam untuk waktu Indonesia
                      date.setHours(date.getHours() + 7)
                      return date.toLocaleString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    })()}
                  </span>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !announcementTime}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl 
                       hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 
                       focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 
                       disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                'Simpan Pengaturan'
              )}
            </button>
          </form>

          {/* Tambahkan tombol reset setelah form */}
          {announcementTime && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleReset}
                disabled={loading || !announcementTime}
                className="w-full bg-red-100 text-red-600 py-3 px-4 rounded-xl 
                         hover:bg-red-200 transition-all duration-200 font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset Waktu Pengumuman
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 