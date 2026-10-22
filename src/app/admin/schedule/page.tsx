'use client'

import React, { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/auth'
import { showAdminToast } from '@/app/admin/components/AdminToast'
import { ConfirmationDialog } from '../voters/components/ConfirmationDialog'
import { 
  CalendarClock, 
  Calendar, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Zap, 
  ShieldAlert,
  Loader2,
  Sparkles
} from 'lucide-react'

interface VotingSchedule {
  id: string
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<VotingSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Status computation
  const [scheduleState, setScheduleState] = useState<'live' | 'upcoming' | 'closed' | 'none'>('none')
  const [timeRemaining, setTimeRemaining] = useState('')

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
        .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116') {
          setSchedule(null)
          setStartTime('')
          setEndTime('')
          return
        }
        throw error
      }

      setSchedule(data || null)
      if (data) {
        // Convert to local datetime format for input (YYYY-MM-DDTHH:mm)
        const s = new Date(data.start_time)
        const e = new Date(data.end_time)
        setStartTime(formatToLocalInputValue(s))
        setEndTime(formatToLocalInputValue(e))
      }
    } catch (err: any) {
      console.error('Error fetching schedule:', err)
      showAdminToast('Gagal Mengambil Jadwal', 'error', err?.message)
    } finally {
      setLoading(false)
    }
  }

  function formatToLocalInputValue(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Countdown and status tick
  useEffect(() => {
    if (!schedule) {
      setScheduleState('none')
      return
    }

    function evaluate() {
      const now = Date.now()
      const start = new Date(schedule!.start_time).getTime()
      const end = new Date(schedule!.end_time).getTime()

      if (now < start) {
        setScheduleState('upcoming')
        const diff = start - now
        const h = Math.floor(diff / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeRemaining(`${h}j ${m}m ${s}d menuju pembukaan`)
      } else if (now >= start && now <= end) {
        setScheduleState('live')
        const diff = end - now
        const h = Math.floor(diff / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeRemaining(`${h}j ${m}m ${s}d menuju penutupan`)
      } else {
        setScheduleState('closed')
        setTimeRemaining('Waktu pemilihan telah berakhir')
      }
    }

    evaluate()
    const interval = setInterval(evaluate, 1000)
    return () => clearInterval(interval)
  }, [schedule])

  // Quick preset buttons
  function applyPreset(type: 'today_school' | 'open_now' | 'tomorrow' | 'full_day') {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

    if (type === 'today_school') {
      // Hari ini 07:30 s/d 13:00
      setStartTime(`${todayStr}T07:30`)
      setEndTime(`${todayStr}T13:00`)
      showAdminToast('Preset Diterapkan', 'info', 'Jadwal diatur: Hari ini 07:30 - 13:00')
    } else if (type === 'open_now') {
      // Sekarang s/d 15:00
      const currentHours = pad(now.getHours())
      const currentMinutes = pad(now.getMinutes())
      setStartTime(`${todayStr}T${currentHours}:${currentMinutes}`)
      setEndTime(`${todayStr}T15:00`)
      showAdminToast('Preset Diterapkan', 'info', 'Jadwal diatur: Buka Sekarang s/d 15:00')
    } else if (type === 'tomorrow') {
      // Besok 08:00 s/d 14:00
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`
      setStartTime(`${tomorrowStr}T08:00`)
      setEndTime(`${tomorrowStr}T14:00`)
      showAdminToast('Preset Diterapkan', 'info', 'Jadwal diatur: Besok 08:00 - 14:00')
    } else if (type === 'full_day') {
      // 24 Jam Penuh
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const currentHours = pad(now.getHours())
      const currentMinutes = pad(now.getMinutes())
      const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`
      setStartTime(`${todayStr}T${currentHours}:${currentMinutes}`)
      setEndTime(`${tomorrowStr}T${currentHours}:${currentMinutes}`)
      showAdminToast('Preset Diterapkan', 'info', 'Jadwal diatur: 24 Jam Penuh')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (!startTime || !endTime) {
        throw new Error('Waktu mulai dan waktu selesai wajib ditentukan')
      }

      const start = new Date(startTime)
      const end = new Date(endTime)

      if (end <= start) {
        throw new Error('Waktu selesai harus lebih lambat dari waktu mulai')
      }

      // Deactivate existing schedule if creating new
      if (!schedule) {
        await supabaseClient
          .from('voting_schedule')
          .update({ is_active: false })
          .eq('is_active', true)
      }

      if (schedule) {
        const { error } = await supabaseClient
          .from('voting_schedule')
          .update({
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          })
          .eq('id', schedule.id)

        if (error) throw error
        showAdminToast('Jadwal Diperbarui', 'success', 'Waktu pemungutan suara berhasil diubah.')
      } else {
        const { error } = await supabaseClient.from('voting_schedule').insert({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          is_active: true,
        })

        if (error) throw error
        showAdminToast('Jadwal Diaktifkan', 'success', 'Bilik suara kini memiliki jadwal aktif.')
      }

      await fetchSchedule()
    } catch (err: any) {
      console.error('Error saving schedule:', err)
      showAdminToast('Gagal Menyimpan Jadwal', 'error', err?.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleResetSchedule() {
    setResetting(true)
    try {
      const { error } = await supabaseClient
        .from('voting_schedule')
        .update({ is_active: false })
        .eq('is_active', true)

      if (error) throw error

      showAdminToast('Jadwal Dinonaktifkan', 'success', 'Bilik suara pemilih saat ini ditutup.')
      setSchedule(null)
      setStartTime('')
      setEndTime('')
      setIsConfirmOpen(false)
    } catch (err: any) {
      console.error('Error resetting schedule:', err)
      showAdminToast('Gagal Reset Jadwal', 'error', err?.message)
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Memuat konfigurasi jadwal...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Jadwal Pemilihan OSIS
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            Voting Window
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Atur jendela waktu pemungutan suara. Siswa hanya dapat login dan mencoblos selama periode aktif.
        </p>
      </div>

      {/* Visual Status Hero Banner */}
      {scheduleState === 'live' ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-emerald-500/30 text-white p-6 sm:p-7 shadow-xl shadow-slate-900/10 relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              TPS Digital Sedang Berlangsung (LIVE)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Bilik Suara Terbuka untuk Pemilih
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Status: <span className="font-mono font-bold text-amber-300">{timeRemaining}</span>.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap gap-x-6 gap-y-1 font-mono">
            <span>Mulai: {new Date(schedule!.start_time).toLocaleString('id-ID')}</span>
            <span>Selesai: {new Date(schedule!.end_time).toLocaleString('id-ID')}</span>
          </div>
        </div>
      ) : scheduleState === 'upcoming' ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 border border-amber-500/30 text-white p-6 sm:p-7 shadow-xl">
          <div className="flex items-center gap-2.5 mb-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Jadwal Pemilihan Terdaftar (Menunggu Pembukaan)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Bilik Suara Akan Dibuka Otomatis
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Hitung Mundur: <span className="font-mono font-bold text-amber-300">{timeRemaining}</span>.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap gap-x-6 gap-y-1 font-mono">
            <span>Mulai: {new Date(schedule!.start_time).toLocaleString('id-ID')}</span>
            <span>Selesai: {new Date(schedule!.end_time).toLocaleString('id-ID')}</span>
          </div>
        </div>
      ) : scheduleState === 'closed' ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 text-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Sesi Pemilihan Telah Berakhir
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Waktu Pemungutan Suara Telah Ditutup</h2>
          <p className="text-xs text-slate-400 mt-1">
            Siswa tidak dapat lagi mengirimkan suara. Anda dapat memperbarui jadwal atau melihat rekapitulasi.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 text-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <CalendarClock className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Belum Ada Jadwal Aktif
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Bilik Suara Digital Sedang Ditutup</h2>
          <p className="text-xs text-slate-400 mt-1">
            Tentukan waktu mulai dan selesai pemilihan di bawah ini untuk membuka akses pencoblosan bagi siswa.
          </p>
        </div>
      )}

      {/* Schedule Configuration Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Konfigurasi Waktu Pemilihan</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan preset waktu cepat atau tentukan tanggal dan jam secara spesifik sesuai rundown OSIS.
          </p>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
            Pintasan Waktu Cepat (Quick Presets)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => applyPreset('today_school')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all"
            >
              <span className="text-xs font-bold text-slate-800 block">Hari Ini (Sekolah)</span>
              <span className="text-[11px] text-slate-500">07:30 - 13:00 WIB</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('open_now')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all"
            >
              <span className="text-xs font-bold text-slate-800 block">Buka Sekarang</span>
              <span className="text-[11px] text-slate-500">s/d 15:00 Sore</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('tomorrow')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-left transition-all"
            >
              <span className="text-xs font-bold text-slate-800 block">Besok Pagi</span>
              <span className="text-[11px] text-slate-500">08:00 - 14:00 WIB</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('full_day')}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all"
            >
              <span className="text-xs font-bold text-slate-800 block">24 Jam Penuh</span>
              <span className="text-[11px] text-slate-500">1 Hari Penuh</span>
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Waktu Mulai Pemilihan (WIB)</span>
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>Waktu Selesai Pemilihan (WIB)</span>
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3">
            <span className="text-xs text-slate-400">
              Zona waktu dihitung otomatis mengikuti waktu lokal Indonesia (WIB).
            </span>

            <div className="flex items-center gap-3">
              {schedule && (
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                >
                  Reset / Tutup Jadwal
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Jadwal...</span>
                  </>
                ) : (
                  <span>{schedule ? 'Perbarui Jadwal' : 'Aktifkan Jadwal Pemilihan'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog for Reset Schedule */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleResetSchedule}
        title="Reset & Tutup Jadwal Pemilihan"
        message="Apakah Anda yakin ingin menonaktifkan jadwal pemilihan ini? Bilik suara digital akan ditutup secara instan sehingga siswa tidak dapat lagi melakukan voting."
        type="schedule_reset"
        confirmText="Ya, Tutup Jadwal"
      />
    </div>
  )
}
