'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { Clock, Award, CheckCircle2, User } from 'lucide-react'
import { supabaseClient } from '@/lib/auth'

interface WinnerAnnouncementProps {
  announcementTime: string | null
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export default function WinnerAnnouncement({ announcementTime }: WinnerAnnouncementProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [showWinner, setShowWinner] = useState(false)
  const [winner, setWinner] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(true)

  useEffect(() => {
    if (!announcementTime) {
      setIsAnnouncementActive(false)
      return
    }

    checkAnnouncementStatus()
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const announcementDate = new Date(announcementTime)
      const distance = announcementDate.getTime() - now

      if (distance <= 0) {
        clearInterval(timer)
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        })
        fetchWinner()
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [announcementTime])

  async function checkAnnouncementStatus() {
    try {
      const { data: candidates, error: candidatesError } = await supabaseClient
        .from('candidates')
        .select('id')

      if (candidatesError) throw candidatesError

      const { data: settings, error: settingsError } = await supabaseClient
        .from('settings')
        .select('announcement_time, winner_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (settingsError) throw settingsError

      if (!candidates?.length || !settings?.announcement_time || !settings?.winner_id) {
        setIsAnnouncementActive(false)
        setShowWinner(false)
        setShowConfetti(false)
        return
      }

      setIsAnnouncementActive(true)
    } catch (error: any) {
      console.error('Error checking announcement status:', error.message)
      setIsAnnouncementActive(false)
    }
  }

  async function fetchWinner() {
    try {
      const { data: settings, error: settingsError } = await supabaseClient
        .from('settings')
        .select('winner_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (settingsError) throw settingsError

      if (!settings?.winner_id) {
        setIsAnnouncementActive(false)
        return
      }

      const { data: winnerData, error: winnerError } = await supabaseClient
        .from('candidates')
        .select('*')
        .eq('id', settings.winner_id)
        .maybeSingle()

      if (winnerError) throw winnerError

      if (winnerData) {
        setWinner(winnerData)
        setShowWinner(true)
        setShowConfetti(true)
      } else {
        setIsAnnouncementActive(false)
      }
    } catch (error: any) {
      console.error('Error fetching winner:', error.message)
      setIsAnnouncementActive(false)
    }
  }

  function getCurrentPeriod() {
    const currentYear = new Date().getFullYear()
    return `${currentYear}/${currentYear + 1}`
  }

  if (!isAnnouncementActive) {
    return null
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {showConfetti && (
        <Confetti 
          numberOfPieces={160} 
          recycle={false} 
          gravity={0.15}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 50, pointerEvents: 'none' }}
        />
      )}

      <AnimatePresence mode="wait">
        {!showWinner ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100/70">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Hitung Mundur Pengumuman Hasil
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Hasil perolehan suara resmi akan diumumkan secara serentak
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200/80 w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Periode Pemilihan {getCurrentPeriod()}
              </div>
            </div>

            <div className="pt-6">
              {timeRemaining ? (
                <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto text-center">
                  {[
                    { label: 'Hari', value: timeRemaining.days },
                    { label: 'Jam', value: timeRemaining.hours },
                    { label: 'Menit', value: timeRemaining.minutes },
                    { label: 'Detik', value: timeRemaining.seconds }
                  ].map((unit, index) => (
                    <div 
                      key={index}
                      className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 sm:p-4"
                    >
                      <span className="block text-2xl sm:text-4xl font-bold text-slate-900 tabular-nums">
                        {String(unit.value).padStart(2, '0')}
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider mt-1 block">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  Menyiapkan waktu pengumuman...
                </div>
              )}
            </div>
          </motion.div>
        ) : winner ? (
          <motion.div
            key="winner"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border-2 border-blue-600/20 shadow-md p-6 sm:p-10 text-center relative overflow-hidden"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Hasil Resmi Pemilihan Ditetapkan
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pasangan Calon Terpilih
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-md mx-auto">
              Ketua dan Wakil Ketua OSIS Periode {getCurrentPeriod()}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-8 max-w-lg mx-auto">
              {/* Ketua */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
                <div className="aspect-[3/4] relative w-full max-w-[140px] mx-auto rounded-lg overflow-hidden bg-slate-200 mb-3 border border-slate-300/60">
                  {winner.ketua_photo_url ? (
                    <Image
                      src={winner.ketua_photo_url}
                      alt={winner.ketua_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Ketua OSIS
                </div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-0.5 line-clamp-1">
                  {winner.ketua_name}
                </h3>
                <p className="text-xs text-slate-500">{winner.ketua_class}</p>
              </div>

              {/* Wakil */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
                <div className="aspect-[3/4] relative w-full max-w-[140px] mx-auto rounded-lg overflow-hidden bg-slate-200 mb-3 border border-slate-300/60">
                  {winner.wakil_photo_url ? (
                    <Image
                      src={winner.wakil_photo_url}
                      alt={winner.wakil_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Wakil Ketua OSIS
                </div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-0.5 line-clamp-1">
                  {winner.wakil_name}
                </h3>
                <p className="text-xs text-slate-500">{winner.wakil_class}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500">
              Paslon Nomor Urut <span className="font-bold text-slate-700">{winner.candidate_number}</span> • Selamat bertugas mengemban amanah seluruh siswa
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
} 