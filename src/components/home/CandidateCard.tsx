'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { FaHandshake } from 'react-icons/fa'
import { Candidate, TabType } from './types'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

interface CandidateCardProps {
  candidate: Candidate
  index: number
  activeTab: TabType
  expandedCandidate: string | null
  onTabChange: (tab: TabType) => void
  onExpandToggle: (candidateId: string) => void
}

export default function CandidateCard({
  candidate,
  index,
  activeTab,
  expandedCandidate,
  onTabChange,
  onExpandToggle
}: CandidateCardProps) {
  const shouldShowButton = activeTab === 'visi' ? candidate.visi.length > 100 : candidate.misi.length > 100
  const currentText = activeTab === 'visi' ? candidate.visi : candidate.misi

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      transition={{ delay: index * 0.2 }}
      className="group"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-4xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
        {/* Header with Gradient */}
        <div className={`relative px-8 py-6 ${index % 2 === 0
          ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600'
          : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600'
          }`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl font-bold text-white">#{candidate.candidate_number}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Paslon {candidate.candidate_number}</h3>
                <p className="text-blue-100">Calon Ketua & Wakil Ketua OSIS</p>
              </div>
            </div>
            <motion.div
              className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <FaHandshake className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </div>

        <div className="p-8">
          {/* Candidate Photos - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 mb-8">
            {/* Ketua */}
            <motion.div
              className="text-center group/photo"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ring-4 ring-white group-hover/photo:ring-blue-200 transition-all duration-300">
                  <Image
                    src={candidate.ketua_photo_url || '/placeholder-image.webp'}
                    alt={candidate.ketua_name}
                    fill
                    className="object-cover max-w-full group-hover/photo:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">K</span>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 text-base sm:text-lg mt-3 sm:mt-4 group-hover/photo:text-blue-600 transition-colors">
                {candidate.ketua_name}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">{candidate.ketua_class}</p>
              <p className="text-xs text-blue-600 font-semibold mt-1">Calon Ketua</p>
            </motion.div>

            {/* Connector - Responsive */}
            <div className="flex items-center">
              <div className="w-8 h-0.5 sm:w-12 sm:h-0.5 bg-gradient-to-r from-blue-300 to-indigo-300 relative rotate-90 sm:rotate-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
              </div>
            </div>

            {/* Wakil */}
            <motion.div
              className="text-center group/photo"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ring-4 ring-white group-hover/photo:ring-indigo-200 transition-all duration-300">
                  <Image
                    src={candidate.wakil_photo_url || '/placeholder-image.webp'}
                    alt={candidate.wakil_name}
                    fill
                    className="object-cover max-w-full group-hover/photo:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">W</span>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 text-base sm:text-lg mt-3 sm:mt-4 group-hover/photo:text-indigo-600 transition-colors">
                {candidate.wakil_name}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">{candidate.wakil_class}</p>
              <p className="text-xs text-indigo-600 font-semibold mt-1">Calon Wakil</p>
            </motion.div>
          </div>

          {/* Enhanced Tabs */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-2xl p-1">
              {(['visi', 'misi'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === tab
                    ? 'bg-white text-blue-600 shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Content */}
          <div className="min-h-[120px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${candidate.id}-${activeTab}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6"
              >
                <div className={`text-gray-700 leading-relaxed ${shouldShowButton && expandedCandidate !== candidate.id ? 'line-clamp-4' : ''}`}>
                  {currentText.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>

                {shouldShowButton && (
                  <motion.button
                    onClick={() => onExpandToggle(candidate.id)}
                    className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {expandedCandidate === candidate.id ? 'Lihat lebih sedikit' : 'Lihat selengkapnya'}
                    <motion.span
                      className="ml-1"
                      animate={{ rotate: expandedCandidate === candidate.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      ↓
                    </motion.span>
                  </motion.button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
