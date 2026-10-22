'use client'

import React, { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/auth'
import { showAdminToast } from '@/app/admin/components/AdminToast'
import { ConfirmationDialog } from '../voters/components/ConfirmationDialog'
import { 
  Trophy, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Loader2,
  Lock
} from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [announcementTime, setAnnouncementTime] = useState('')

  // Dialog konfirmasi reset
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  // Status timer pengumuman
  const [announcementStatus, setAnnouncementStatus] = useState<'live' | 'upcoming' | 'none'>('none')
  const [countdownText, setCountdownText] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const { data: existingData, error: settingsError } = await supabaseClient
        .from('settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      if (settingsError) throw settingsError

      let currentSettingsId: string | null = null
      let dbAnnouncementTime = ''

      if (!existingData || existingData.length === 0) {
        // Buat baris initial settings jika belum ada
        const { data: created, error: insertError } = await supabaseClient
          .from('settings')
          .insert([{ announcement_time: null, winner_id: null }])
          .select()
          .single()

        if (insertError) throw insertError
        if (created) {
          currentSettingsId = created.id
        }
      } else {
        const item = existingData[0]
        currentSettingsId = item.id
        if (item.announcement_time) {
          const d = new Date(item.announcement_time)
          const pad = (n: number) => String(n).padStart(2, '0')
          dbAnnouncementTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }
      }

      setSettingsId(currentSettingsId)
      setAnnouncementTime(dbAnnouncementTime)
    } catch (err: any) {
      console.error('Error fetching settings:', err)
      showAdminToast('Gagal Memuat Pengaturan', 'error', err?.message)
    } finally {
      setLoading(false)
    }
  }

  // Countdown timer for announcement
  useEffect(() => {
    if (!announcementTime) {
      setAnnouncementStatus('none')
      return
    }

    function checkAnnouncement() {
      const target = new Date(announcementTime).getTime()
      const now = Date.now()

      if (now >= target) {
        setAnnouncementStatus('live')
        setCountdownText('Pengumuman telah dipublikasikan dan dapat dilihat oleh seluruh siswa di portal.')
      } else {
        setAnnouncementStatus('upcoming')
        const diff = target - now
        const h = Math.floor(diff / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setCountdownText(`Pengumuman akan rilis otomatis dalam ${h}j ${m}m ${s}d`)
      }
    }

    checkAnnouncement()
    const interval = setInterval(checkAnnouncement, 1000)
    return () => clearInterval(interval)
  }, [announcementTime])

  // Quick preset announcement times
  function setQuickAnnouncement(type: 'now' | 'tonight' | 'tomorrow_morning') {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

    if (type === 'now') {
      const curH = pad(now.getHours())
      const curM = pad(now.getMinutes())
      setAnnouncementTime(`${todayStr}T${curH}:${curM}`)
      showAdminToast('Waktu Diatur', 'info', 'Pengumuman dibuka sekarang.')
    } else if (type === 'tonight') {
      setAnnouncementTime(`${todayStr}T19:00`)
      showAdminToast('Waktu Diatur', 'info', 'Pengumuman dijadwalkan malam ini pukul 19:00 WIB.')
    } else if (type === 'tomorrow_morning') {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`
      setAnnouncementTime(`${tomStr}T08:00`)
      showAdminToast('Waktu Diatur', 'info', 'Pengumuman dijadwalkan besok pagi pukul 08:00 WIB.')
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (!settingsId) {
        throw new Error('ID Pengaturan tidak valid')
      }

      // 1. Tentukan pemenang murni dan otomatis berdasarkan suara terbanyak di database
      const { data: votesData, error: votesError } = await supabaseClient
        .from('votes')
        .select('candidate_id')

      if (votesError) throw votesError

      const tally: Record<string, number> = {}
      votesData?.forEach((v) => {
        if (v.candidate_id) {
          tally[v.candidate_id] = (tally[v.candidate_id] || 0) + 1
        }
      })

      const sortedCandidates = Object.entries(tally).sort((a, b) => b[1] - a[1])
      const automaticWinnerId = sortedCandidates.length > 0 ? sortedCandidates[0][0] : null

      // 2. Simpan waktu pengumuman beserta winner_id otomatis
      const payload = {
        announcement_time: announcementTime ? new Date(announcementTime).toISOString() : null,
        winner_id: automaticWinnerId,
      }

      const { error } = await supabaseClient.from('settings').update(payload).eq('id', settingsId)
      if (error) throw error

      showAdminToast('Pengaturan Disimpan', 'success', 'Jadwal publikasi pengumuman berhasil disimpan.')
      fetchSettings()
    } catch (err: any) {
      console.error('Error saving settings:', err)
      showAdminToast('Gagal Menyimpan', 'error', err?.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleResetSettings() {
    try {
      if (!settingsId) return
      const { error } = await supabaseClient
        .from('settings')
        .update({
          announcement_time: null,
          winner_id: null,
        })
        .eq('id', settingsId)

      if (error) throw error

      showAdminToast('Pengaturan Direset', 'success', 'Jadwal pengumuman telah dinonaktifkan.')
      setAnnouncementTime('')
      setIsResetConfirmOpen(false)
    } catch (err: any) {
      console.error('Reset error:', err)
      showAdminToast('Gagal Reset', 'error', err?.message)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Memuat pengaturan pengumuman...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pengaturan Publikasi Pengumuman
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-600" />
            Pengumuman Siswa
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Atur jadwal peluncuran hasil resmi pemilihan kepada siswa. Pemenang ditentukan secara murni dan otomatis oleh sistem dari perolehan suara terbanyak.
        </p>
      </div>

      {/* System Integrity & Democratic Guarantee Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-blue-100 text-blue-700 mt-0.5 flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-bold text-blue-950">
            Integritas Asas Pemilihan: Pemenang Ditentukan 100% Otomatis
          </h4>
          <p className="text-xs text-blue-900/80 leading-relaxed">
            Demi menjaga keadilan dan keabsahan hasil voting, sistem secara otomatis menetapkan pasangan calon dengan suara terbanyak sah sebagai pemenang. Admin tidak dapat memilih atau mengubah pemenang secara manual. Halaman ini hanya digunakan untuk mengontrol kapan pengumuman dibuka kepada publik.
          </p>
        </div>
      </div>

      {/* Announcement Status Banner */}
      {announcementStatus === 'live' ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-emerald-500/30 text-white p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Pengumuman Sedang Ditayangkan ke Publik
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Hasil Pemilihan Telah Terbuka untuk Siswa</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">{countdownText}</p>
        </div>
      ) : announcementStatus === 'upcoming' ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 border border-amber-500/30 text-white p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Pengumuman Dijadwalkan
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Hitung Mundur Peluncuran Pemenang</h2>
          <p className="text-xs sm:text-sm text-amber-200 mt-1 font-mono">{countdownText}</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 text-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Pengumuman Masih Ditutup
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Pemenang Belum Dipublikasikan</h2>
          <p className="text-xs text-slate-400 mt-1">
            Tentukan jadwal rilis hasil pemilihan di bawah ini agar siswa dapat melihat hasil dan perayaan di portal resmi.
          </p>
        </div>
      )}

      {/* Main Form: Announcement Schedule */}
      <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Jadwal Rilis Pengumuman ke Siswa
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tentukan waktu buka pengumuman otomatis atau buka langsung saat sidang pleno perhitungan suara selesai.
          </p>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Pintasan Waktu Cepat
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setQuickAnnouncement('now')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Rilis Sekarang Juga
            </button>
            <button
              type="button"
              onClick={() => setQuickAnnouncement('tonight')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Malam Ini (19:00 WIB)
            </button>
            <button
              type="button"
              onClick={() => setQuickAnnouncement('tomorrow_morning')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Besok Pagi (08:00 WIB)
            </button>
          </div>
        </div>

        {/* Input datetime */}
        <div className="max-w-md pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Tanggal & Waktu Rilis Pengumuman (WIB)</span>
          </label>
          <input
            type="datetime-local"
            value={announcementTime}
            onChange={(e) => setAnnouncementTime(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
          />
          <span className="text-[11px] text-slate-400 block mt-1">
            Kosongkan input ini jika ingin menutup pengumuman sementara.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-100">
          {settingsId && (
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors self-start sm:self-auto"
            >
              Reset / Tutup Pengumuman
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan Pengaturan...</span>
                </>
              ) : (
                <span>Simpan & Terapkan Jadwal</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Dialog for Reset */}
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetSettings}
        title="Reset & Tutup Pengumuman"
        message="Apakah Anda yakin ingin menutup pengumuman pemenang? Halaman pengumuman di sisi siswa akan ditutup kembali."
        type="reset"
        confirmText="Ya, Tutup Pengumuman"
      />
    </div>
  )
}
