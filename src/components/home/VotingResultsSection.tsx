'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaChartBar, FaClock } from 'react-icons/fa'
import { Loader2 } from 'lucide-react'
import { VotingStats } from './types'
import VotingResultCard from './VotingResultCard'
import WinnerAnnouncement from '@/components/WinnerAnnouncement'
import { supabaseClient } from '@/lib/auth'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

interface VotingResultsSectionProps {
  votingStats: VotingStats | null
  isLoadingStats: boolean
}

export default function VotingResultsSection({ votingStats, isLoadingStats }: VotingResultsSectionProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(true)
  const [announcementTime, setAnnouncementTime] = useState<string | null>(null)

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

        setIsAnnouncementActive(true)
        const timer = setInterval(() => {
          const now = new Date().getTime()
          const announcementDate = new Date(fetchedAnnouncementTime)
          const distance = announcementDate.getTime() - now

          if (distance <= 0) {
            clearInterval(timer)
            setTimeLeft('Waktu pengumuman sudah tiba!')
            setIsAnnouncementActive(true)
            return
          }

          const days = Math.floor(distance / (1000 * 60 * 60 * 24))
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((distance % (1000 * 60)) / 1000)

          setTimeLeft(`${days} Hari ${hours} Jam ${minutes} Menit ${seconds} Detik`)
        }, 1000)

        return () => clearInterval(timer)
      } catch (error: any) {
        console.error('VotingResultsSection: Error fetching settings:', error.message)
        setIsAnnouncementActive(false)
      }
    }

    fetchSettings()

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

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 sm:space-y-12 overflow-hidden">
      {/* Countdown Timer - Show when announcement is active but not yet time */}
      {isAnnouncementActive && timeLeft && !timeLeft.includes('sudah tiba') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl sm:rounded-4xl p-6 sm:p-8 text-center text-white shadow-2xl"
        >
          <div className="flex items-center justify-center mb-4">
            <FaClock className="mr-2 text-xl sm:text-2xl" />
            <h3 className="text-lg sm:text-xl font-semibold">
              Pengumuman Pemenang Dalam
            </h3>
          </div>
          <p className="text-white/80 mb-6">
            Waktu sampai pengumuman pemenang OSIS
          </p>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {timeLeft}
          </div>
          <p className="text-sm text-white/70">
            Pantau terus perkembangan voting di bawah ini
          </p>
        </motion.div>
      )}

      {/* Winner Announcement */}
      <WinnerAnnouncement />

      {/* Voting Results */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl sm:rounded-4xl p-4 sm:p-8 shadow-2xl hover:shadow-3xl transition-shadow duration-300 leading-relaxed">
        <motion.div
          className="text-center mb-8 sm:mb-12"
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            <FaChartBar className="inline-block mr-2 sm:mr-3 text-blue-600 text-xl sm:text-2xl" />
            Hasil Voting
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Hasil perolehan suara setiap kandidat
          </p>
        </motion.div>

        {isLoadingStats ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : votingStats ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {votingStats.candidateResults.map((result, index) => (
              <VotingResultCard
                key={result.candidate.id}
                candidate={result.candidate}
                voteCount={result.voteCount}
                percentage={result.percentage}
                index={index}
                isWinner={index === 0 && result.voteCount > 0}
              />
            ))}

            {/* Refresh Notice */}
            <motion.div
              className="text-center mt-8"
              variants={fadeInUp}
            >
              <p className="text-sm text-gray-500">
                Data diperbarui secara real-time tanpa reload • Optimistic updates aktif
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600">Belum ada data voting tersedia</p>
          </div>
        )}
      </section>
    </div>
  )
}
