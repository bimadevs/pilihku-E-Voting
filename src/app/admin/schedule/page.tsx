'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/auth'
import { toast, Toaster } from 'react-hot-toast'
import { Loader2, Calendar, Trash2, AlertCircle } from 'lucide-react'

interface VotingSchedule {
  id: string
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
          >
            Reset Jadwal
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<VotingSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetchSchedule()
  }, [])

  async function fetchSchedule() {
    try {
      setLoading(true)
      const { data, error } = await supabaseClient
        .from('voting_schedule')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, this is okay
          setSchedule(null)
          setStartTime('')
          setEndTime('')
          return
        }
        throw error
      }

      setSchedule(data)
      if (data) {
        // Convert UTC to local time for input fields
        setStartTime(new Date(data.start_time).toISOString().slice(0, 16))
        setEndTime(new Date(data.end_time).toISOString().slice(0, 16))
      }
    } catch (error: any) {
      console.error('Error fetching schedule:', error)
      toast.error('Gagal mengambil data jadwal: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      // Validate dates
      const start = new Date(startTime)
      const end = new Date(endTime)

      if (end <= start) {
        toast.error('Waktu selesai harus lebih besar dari waktu mulai')
        return
      }

      // If there's an existing active schedule, deactivate it first
      if (!schedule) {
        // Deactivate any existing active schedules first
        await supabaseClient
          .from('voting_schedule')
          .update({ is_active: false })
          .eq('is_active', true)
      }

      if (schedule) {
        // Update existing schedule
        const { error } = await supabaseClient
          .from('voting_schedule')
          .update({
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          })
          .eq('id', schedule.id)

        if (error) throw error
      } else {
        // Create new schedule
        const { error } = await supabaseClient
          .from('voting_schedule')
          .insert({
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            is_active: true,
          })

        if (error) throw error
      }

      toast.success('Jadwal berhasil disimpan')
      await fetchSchedule()
    } catch (error: any) {
      console.error('Error saving schedule:', error)
      toast.error('Gagal menyimpan jadwal: ' + (error.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    try {
      setResetting(true)
      
      // Nonaktifkan semua jadwal
      const { error } = await supabaseClient
        .from('voting_schedule')
        .update({ is_active: false })
        .eq('is_active', true)

      if (error) throw error

      toast.success('Jadwal berhasil direset')
      setSchedule(null)
      setStartTime('')
      setEndTime('')
      setIsConfirmOpen(false)
    } catch (error: any) {
      console.error('Error resetting schedule:', error)
      toast.error('Gagal mereset jadwal: ' + (error.message || 'Unknown error'))
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-center" />
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleReset}
        title="Reset Jadwal Voting"
        message="Apakah Anda yakin ingin mereset jadwal voting? Tindakan ini akan menonaktifkan jadwal yang sedang berjalan."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Pengaturan Jadwal Voting
              </h1>
            </div>
            {schedule && (
              <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={resetting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 
                         rounded-xl hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 
                         focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 
                         disabled:cursor-not-allowed"
              >
                {resetting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Reset Jadwal
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="start-time"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Waktu Mulai
              </label>
              <input
                type="datetime-local"
                id="start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="end-time"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Waktu Selesai
              </label>
              <input
                type="datetime-local"
                id="end-time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-xl 
                       hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 
                       focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 
                       disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                'Simpan Jadwal'
              )}
            </button>
          </form>

          {schedule && (
            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Jadwal Saat Ini
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  Mulai:{' '}
                  {new Date(schedule.start_time).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
                <p>
                  Selesai:{' '}
                  {new Date(schedule.end_time).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
                <p className="mt-4 text-sm text-blue-600">
                  Status: {new Date() < new Date(schedule.start_time) 
                    ? 'Voting belum dimulai'
                    : new Date() > new Date(schedule.end_time)
                    ? 'Voting telah berakhir'
                    : 'Voting sedang berlangsung'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 