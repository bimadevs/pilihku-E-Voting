import { motion } from 'framer-motion'
import Image from 'next/image'
import { Candidate } from './types'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

interface VotingResultCardProps {
  candidate: Candidate
  voteCount: number
  percentage: number
  index: number
  isWinner?: boolean
}

export default function VotingResultCard({ candidate, voteCount, percentage, index, isWinner }: VotingResultCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200"
    >
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Mobile Layout - Stack vertically */}
        <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:gap-8 lg:space-y-0">
          {/* Candidate Info - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 flex-shrink-0">
            {/* Number Badge */}
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl font-bold text-white ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                'bg-gradient-to-r from-orange-400 to-orange-600'
              }`}>
              #{candidate.candidate_number}
            </div>

            {/* Photos and Names */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photos */}
              <div className="flex gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 relative rounded-lg sm:rounded-xl overflow-hidden shadow-md">
                    <Image
                      src={candidate.ketua_photo_url || '/placeholder-image.webp'}
                      alt={candidate.ketua_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Ketua</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 relative rounded-lg sm:rounded-xl overflow-hidden shadow-md">
                    <Image
                      src={candidate.wakil_photo_url || '/placeholder-image.webp'}
                      alt={candidate.wakil_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Wakil</p>
                </div>
              </div>

              {/* Names and Classes */}
              <div className="text-center sm:text-left">
                <h4 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                  {candidate.ketua_name} & {candidate.wakil_name}
                </h4>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {candidate.ketua_class} • {candidate.wakil_class}
                </p>
              </div>
            </div>
          </div>

          {/* Vote Stats - Mobile Optimized */}
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {voteCount}
                </span>
                <span className="text-base sm:text-lg text-gray-600">suara</span>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-bold text-blue-600">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Progress Bar - Enhanced for Mobile */}
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  index === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}
                initial={{ width: 0 }}
                whileInView={{ width: `${percentage}%` }}
                transition={{ duration: 1.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              />
            </div>

            {/* Winner Badge - Mobile Positioned */}
            {isWinner && voteCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="flex justify-center lg:justify-end mt-4 lg:mt-0"
              >
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg">
                  🏆 TERDEPAN
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
