'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaVoteYea, FaLock, FaUserShield } from 'react-icons/fa'
import { BsClock } from 'react-icons/bs'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Elements */}
      {/* <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-10"></div>
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div> */}

      <div className="max-w-full mx-auto py-8 px-4 sm:py-12 sm:px-6 lg:px-4 relative">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Welcome Badge for First-Time Users */}
          <motion.div
            className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-green-200"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Selamat datang! Klik tombol di bawah untuk mulai voting
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 break-words leading-relaxed text-balance">
            Suaramu Untuk
            <br />
            Masa Depan Sekolah
          </h1>
          <motion.p
            className="mt-4 text-lg text-gray-600 sm:text-xl max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Berpartisipasilah dalam pemilihan OSIS dengan jujur dan bijaksana untuk membangun sekolah yang lebih baik
          </motion.p>

          {/* Enhanced Call-to-Action Section */}
          <motion.div
            className="mt-12 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Primary Login Button - More Prominent */}
            <motion.div
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-blue-100 max-w-md mx-auto"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-center">
                <motion.div
                  className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                  whileHover={{ y: -10, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <FaVoteYea className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Siap Memulai Voting?
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Klik tombol di bawah untuk masuk dan mulai memberikan suara Anda
                </p>
                <Link
                  href="/auth/login"
                  className="group inline-flex items-center justify-center w-full px-8 py-4 text-xl font-bold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-2 border-blue-500/20"
                >
                  <FaVoteYea className="mr-3 text-2xl group-hover:animate-bounce" />
                  MULAI VOTING SEKARANG
                  <motion.div
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </Link>
              </div>
            </motion.div>

            {/* Alternative Quick Access */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span>Butuh bantuan?</span>
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-medium underline decoration-blue-600/30 hover:decoration-blue-600 transition-all"
              >
                Klik di sini untuk langsung masuk →
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2">
              <FaLock className="w-4 h-4 text-green-500" />
              <span>Aman & Ter enkripsi</span>
            </div>
            <div className="flex items-center gap-2">
              <FaUserShield className="w-4 h-4 text-blue-500" />
              <span>Data Pribadi Dilindungi</span>
            </div>
            <div className="flex items-center gap-2">
              <BsClock className="w-4 h-4 text-purple-500" />
              <span>Proses Cepat & Mudah</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
