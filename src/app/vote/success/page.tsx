'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, Home, Share2 } from 'lucide-react'

export default function VoteSuccess() {
  useEffect(() => {
    // Hapus cookie voter setelah berhasil voting
    document.cookie = 'voter=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
  }, [])

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'E-Voting OSIS',
          text: 'Saya sudah memberikan suara dalam pemilihan OSIS! Mari berpartisipasi untuk sekolah kita!',
          url: window.location.origin
        })
      }
    } catch (error) {
      console.log('Error sharing:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Success Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          {/* Top Decoration */}
          <div className="h-2 bg-gradient-to-r from-green-400 to-green-500" />

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1 
              }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </motion.div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-4"
            >
              <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-700">
                Voting Berhasil!
              </h1>
              <p className="text-gray-600">
                Terima kasih telah berpartisipasi dalam pemilihan OSIS.
                Suara Anda sangat berarti untuk kemajuan sekolah kita.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-4 bg-green-50 rounded-2xl"
            >
              <p className="text-sm text-green-800 text-center font-medium">
                Suara Anda telah tercatat dengan aman dalam sistem
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 space-y-3"
            >
              <Link
                href="/"
                className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow group"
              >
                <Home className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-0.5" />
                Kembali ke Beranda
              </Link>

              <button
                onClick={handleShare}
                className="flex items-center justify-center w-full px-6 py-3 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
              >
                <Share2 className="w-5 h-5 mr-2 transition-transform group-hover:rotate-12" />
                Bagikan
              </button>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-500 text-sm mt-6"
        >
          Hasil pemilihan akan diumumkan setelah periode voting berakhir
        </motion.p>
      </motion.div>
    </div>
  )
} 