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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Pengaturan Pengumuman
            </h1>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto">
              Atur waktu pengumuman pemenang dan pantau hasil voting secara real-time
            </p>
          </div>

          {/* Hasil Voting Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Hasil Voting Saat Ini
            </h2>
            <div className="grid gap-4 sm:gap-6">
              {votingResults.map((result, index) => (
                <div 
                  key={result.candidate_id}
                  className={`p-6 rounded-xl transition-all duration-200 ${
                    index === 0 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-lg text-gray-900">
                        {result.ketua_name} & {result.wakil_name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {result.vote_count} suara
                        </span>
                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                        <span className="text-sm font-medium text-blue-600">
                          {result.percentage}%
                        </span>
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Pemenang Sementara
                      </span>
                    )}
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pengaturan Waktu Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Atur Waktu Pengumuman
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waktu Pengumuman Pemenang
                </label>
                <input
                  type="datetime-local"
                  value={announcementTime}
                  onChange={(e) => setAnnouncementTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 
                           focus:border-transparent transition-all duration-200"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Pengumuman akan otomatis menampilkan pemenang berdasarkan jumlah suara terbanyak
                </p>
              </div>

              {/* Current Settings Display */}
              {announcementTime && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg 
                        className="w-4 h-4 text-blue-600" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Waktu pengumuman diatur pada:
                      </p>
                      <p className="text-lg font-semibold text-blue-800 mt-1">
                        {(() => {
                          const date = new Date(announcementTime)
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
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading || !announcementTime}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 
                           rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all 
                           duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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

                {announcementTime && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="flex-1 bg-red-50 text-red-600 py-3 px-4 rounded-xl hover:bg-red-100 
                             transition-all duration-200 font-medium disabled:opacity-50 
                             disabled:cursor-not-allowed"
                  >
                    Reset Pengaturan
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 