'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { supabaseClient } from '@/lib/auth'

interface WinnerAnnouncementProps {
  announcementTime: string | null
}

export default function WinnerAnnouncement({ announcementTime }: WinnerAnnouncementProps) {
  const [timeLeft, setTimeLeft] = useState('')
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
      // Konversi waktu ke zona waktu lokal Indonesia
      const announcementDate = new Date(announcementTime)
      const distance = announcementDate.getTime() - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft('WAKTU HABIS')
        fetchWinner()
        return
      }

      // Hitung waktu tersisa
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft(`${days} Hari ${hours} Jam ${minutes} Menit ${seconds} Detik`)
    }, 1000)

    return () => clearInterval(timer)
  }, [announcementTime])

  // Fungsi untuk memeriksa status pengumuman
  async function checkAnnouncementStatus() {
    try {
      // Cek apakah masih ada data kandidat
      const { data: candidates, error: candidatesError } = await supabaseClient
        .from('candidates')
        .select('id')

      if (candidatesError) throw candidatesError

      // Cek apakah pengaturan masih aktif
      const { data: settings, error: settingsError } = await supabaseClient
        .from('settings')
        .select('announcement_time, winner_id')
        .single()

      if (settingsError) throw settingsError

      // Jika tidak ada kandidat atau pengaturan sudah di-reset
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
        .single()

      if (settingsError) throw settingsError

      if (!settings?.winner_id) {
        setIsAnnouncementActive(false)
        return
      }

      const { data: winner, error: winnerError } = await supabaseClient
        .from('candidates')
        .select('*')
        .eq('id', settings.winner_id)
        .single()

      if (winnerError) throw winnerError

      if (winner) {
        setWinner(winner)
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

  // Di dalam komponen, tambahkan fungsi untuk menghitung periode
  function getCurrentPeriod() {
    const currentYear = new Date().getFullYear()
    return `${currentYear}/${currentYear + 1}`
  }

  // Jika pengumuman tidak aktif, jangan tampilkan apa-apa
  if (!isAnnouncementActive) {
    return null
  }

  return (
    <div className="relative">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

      <AnimatePresence>
        {!showWinner ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pengumuman Pemenang Dalam
            </h2>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {timeLeft}
            </div>
          </motion.div>
        ) : winner ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              🎉 Selamat Kepada 🎉
            </h2>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {winner.ketua_name} & {winner.wakil_name}
              </h3>
              <p className="mt-4 text-gray-600">
                Terpilih sebagai Ketua & Wakil Ketua OSIS periode {getCurrentPeriod()}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
} 