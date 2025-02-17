'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Loader2, Clock, Users, ChartBar, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ConfirmationDialog } from '../voters/components/ConfirmationDialog'

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

  // Tambahkan state untuk dialog konfirmasi
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'reset' as 'reset' | 'save',
    id: '',
    count: 0
  })

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
    setConfirmDialog({
      isOpen: true,
      type: 'reset',
      id: '',
      count: 0
    })
  }

  async function handleConfirmReset() {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Pengaturan Pengumuman
            </h1>
            <p className="mt-2 text-gray-600">
              Atur waktu pengumuman pemenang dan pantau hasil voting
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {votingResults.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <ChartBar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Kandidat Terdepan</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {votingResults[0].ketua_name}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Suara</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {votingResults.reduce((sum, result) => sum + result.vote_count, 0)} Suara
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status Pengumuman</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {announcementTime ? 'Terjadwal' : 'Belum Diatur'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Hasil Voting Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Hasil Voting Saat Ini
            </h2>
            <div className="space-y-4">
              {votingResults.map((result, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={result.candidate_id}
                  className={`p-4 rounded-xl transition-all duration-200 ${
                    index === 0 
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        )}
                        <p className="font-medium text-gray-900">
                          {result.ketua_name} & {result.wakil_name}
                        </p>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${result.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600 min-w-[90px]">
                            {result.vote_count} suara
                          </span>
                          <span className="text-sm font-medium text-blue-600 min-w-[60px]">
                            {result.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Form Pengaturan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Pengaturan Waktu Pengumuman
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
                <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Pengumuman akan otomatis menampilkan pemenang pada waktu yang ditentukan
                </p>
              </div>

              {announcementTime && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      Waktu pengumuman diatur pada:{' '}
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
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium
                           hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                           focus:ring-offset-2 transition-all duration-200 disabled:opacity-50
                           disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : (
                    'Simpan Pengaturan'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100
                           hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500
                           focus:ring-offset-2 transition-all duration-200 disabled:opacity-50
                           disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>

      {/* Tambahkan ConfirmationDialog di akhir sebelum penutup div terakhir */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmReset}
        title="Reset Pengaturan"
        message="Anda yakin ingin mereset waktu pengumuman? Tindakan ini akan menghapus waktu pengumuman yang telah diatur dan pemenang yang telah ditentukan."
        type="reset"
        count={0}
      />
    </div>
  )
} 