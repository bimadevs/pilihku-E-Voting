'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Candidate } from '@/types'

interface CandidateCardProps {
  candidate: Candidate
  isSelected: boolean
  onSelect: () => void
}

export function CandidateCard({ candidate, isSelected, onSelect }: CandidateCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'}`}
      onClick={onSelect}
    >
      {/* Konten card sama seperti sebelumnya */}
    </motion.div>
  )
} 