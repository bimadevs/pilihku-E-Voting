'use client'

import { motion } from 'framer-motion'
import { FaUsers, FaUsers as FaUsersIcon } from 'react-icons/fa'
import { Loader2 } from 'lucide-react'
import { Candidate, TabType } from './types'
import CandidateCard from './CandidateCard'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

interface CandidatesSectionProps {
  candidates: Candidate[]
  isLoadingCandidates: boolean
  activeTab: TabType
  expandedCandidate: string | null
  onTabChange: (tab: TabType) => void
  onExpandToggle: (candidateId: string) => void
}

export default function CandidatesSection({
  candidates,
  isLoadingCandidates,
  activeTab,
  expandedCandidate,
  onTabChange,
  onExpandToggle
}: CandidatesSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden overflow-x-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center mb-20"
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-6"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaUsers className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
            Kandidat OSIS
          </h2>
          <p className="text-xl text-gray-600 max-w-full mx-auto">
            Kenali calon pemimpin masa depan sekolah kita dengan visi dan misi yang inspiratif
          </p>
        </motion.div>

        {isLoadingCandidates ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Memuat data kandidat...</p>
            </div>
          </div>
        ) : candidates.length === 0 ? (
          <motion.div
            className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaUsersIcon className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-xl text-gray-600">Belum ada kandidat yang terdaftar</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
            {candidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                index={index}
                activeTab={activeTab}
                expandedCandidate={expandedCandidate}
                onTabChange={onTabChange}
                onExpandToggle={onExpandToggle}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
