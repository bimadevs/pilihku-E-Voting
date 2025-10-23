'use client'

import { motion } from 'framer-motion'
import { FaChartBar } from 'react-icons/fa'
import { Loader2 } from 'lucide-react'
import { VotingStats } from './types'
import VotingResultCard from './VotingResultCard'
import WinnerAnnouncement from '@/components/WinnerAnnouncement'

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
  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 sm:space-y-12 overflow-hidden">
      {/* Winner Announcement */}
      <WinnerAnnouncement />

      {/* Voting Results - Only show when announcement is active */}
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
