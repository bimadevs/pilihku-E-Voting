'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { supabaseClient } from '@/lib/auth'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

interface WinnerAnnouncementProps {
  // announcementTime removed, now fetched from settings
}

export default function WinnerAnnouncement({}: WinnerAnnouncementProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [showWinner, setShowWinner] = useState(false)
  const [winner, setWinner] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(true)
  const [announcementTime, setAnnouncementTime] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: settings, error } = await supabaseClient
          .from('settings')
          .select('announcement_time')
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error

        const fetchedAnnouncementTime = settings?.[0]?.announcement_time
        setAnnouncementTime(fetchedAnnouncementTime)

        if (!fetchedAnnouncementTime) {
          setIsAnnouncementActive(false)
          return
        }

        checkAnnouncementStatus()
        const timer = setInterval(() => {
          const now = new Date().getTime()
          // Konversi waktu ke zona waktu lokal Indonesia
          const announcementDate = new Date(fetchedAnnouncementTime)
          const distance = announcementDate.getTime() - now

          if (distance <= 0) {
            clearInterval(timer)
            setTimeLeft('0 Detik')
            setTimeout(() => fetchWinner(), 1000) // Delay 1 detik untuk menampilkan 0 sebelum winner
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
      } catch (error: any) {
        console.error('WinnerAnnouncement: Error fetching settings:', error.message, error)
        setIsAnnouncementActive(false)
      }
    }

    fetchSettings()

    // Subscribe to settings changes
    const subscription = supabaseClient
      .channel('settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload: any) => {
        fetchSettings()
      })
      .subscribe()

    return () => {
      supabaseClient.removeChannel(subscription)
    }
  }, [])

  // Fungsi untuk memeriksa status pengumuman
  async function checkAnnouncementStatus() {
    try {
      // Cek apakah masih ada data kandidat
      const { data: candidates, error: candidatesError } = await supabaseClient
        .from('candidates')
        .select('id')

      if (candidatesError) throw candidatesError

      const { data: settings, error: settingsError } = await supabaseClient
        .from('settings')
        .select('announcement_time, winner_id')

      if (settingsError) throw settingsError

      // Ambil settings pertama jika ada multiple rows
      const setting = settings?.[0]
      // Jika tidak ada kandidat atau announcement_time tidak ada, tidak aktif
      if (!candidates?.length || !setting?.announcement_time) {
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

      if (settingsError) throw settingsError

      // Ambil settings pertama
      const setting = settings?.[0]

      if (!setting?.winner_id) {
        setIsAnnouncementActive(false)
        return
      }

      const { data: winner, error: winnerError } = await supabaseClient
        .from('candidates')
        .select('*')
        .eq('id', setting.winner_id)
        .single()

      if (winnerError) throw winnerError

      if (winner) {
        setWinner(winner)
        setShowWinner(true)
        setShowConfetti(true)
        // Open dialog only when winner is announced
        setIsDialogOpen(true)
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
    <>
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTitle className="sr-only">
          {showWinner ? 'Pengumuman Pemenang' : 'Pengumuman Pemenang Dalam'}
        </DialogTitle>
        <DialogContent className="sm:max-w-[600px] p-0 bg-gradient-to-br from-white via-blue-50 to-indigo-50 border-0 shadow-2xl">
          <div className="relative overflow-hidden">
            {/* Close button - positioned absolutely */}
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground bg-white hover:bg-gray-100 p-2 shadow-lg"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Gradient background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10" />

            {/* Main content */}
            <div className="relative z-10 p-8 md:p-12">
              <AnimatePresence mode="wait">
                {!showWinner ? (
                  <motion.div
                    key="countdown"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-6"
                  >
                    <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Pengumuman Pemenang dalam
                      </h2>
                      <p className="text-gray-600 text-sm md:text-base">
                        Menunggu hasil pemungutan suara...
                      </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {timeLeft}
                      </div>
                    </div>
                  </motion.div>
                ) : winner ? (
                  <motion.div
                    key="winner"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-8"
                  >
                    {/* Victory icon */}
                    <div className="relative">
                       {/* Trophy animation */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.2, 1] }}
                          transition={{ delay: 0.5, type: "spring", bounce: 0.4 }}
                          className="mt-6 flex justify-center"
                        >
                          <div className="text-4xl md:text-5xl">🏆</div>
                        </motion.div>

                      {/* Sparkle effects */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ delay: 0.5, repeat: Infinity, duration: 2 }}
                        className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400"
                      >
                        ✨
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ delay: 0.8, repeat: Infinity, duration: 2 }}
                        className="absolute -top-2 -left-2 w-4 h-4 text-yellow-500"
                      >
                        ⭐
                      </motion.div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold ">
                        🎉 Selamat kepada 🎉
                      </h2>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg"
                      >
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                          {winner.ketua_name} & {winner.wakil_name}
                        </h3>
                        <p className="text-gray-700 text-sm md:text-base font-medium">
                          Terpilih sebagai Ketua & Wakil Ketua OSIS<br />
                          Periode {getCurrentPeriod()}
                        </p>

                       
                      </motion.div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
