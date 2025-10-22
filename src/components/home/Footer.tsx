'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaVoteYea, FaInstagram, FaWhatsapp, FaEnvelope, FaPhone, FaUserShield, FaLock } from 'react-icons/fa'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-indigo-600/20"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand Section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center mb-4">
              <motion.div
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FaVoteYea className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Pilihku E-Voting
              </h3>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6 text-base">
              Sistem voting elektronik modern untuk pemilihan OSIS yang aman, transparan, dan dapat dipercaya.
              Memberikan pengalaman voting yang mudah dan terjamin keamanannya.
            </p>
            <div className="flex space-x-4">
              <motion.a
                href="https://instagram.com/biimaa_jo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                whileHover={{ y: -2 }}
                aria-label="Follow us on Instagram"
              >
                <FaInstagram className="w-5 h-5 text-white" />
              </motion.a>
              <motion.a
                href="https://wa.me/6282254044783"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                whileHover={{ y: -2 }}
                aria-label="Follow us on WhatsApp"
              >
                <FaWhatsapp className="w-5 h-5 text-white" />
              </motion.a>
            </div>
          </motion.div>

          {/* Support & Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold mb-4 text-white">Support & Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-300">
                <FaEnvelope className="w-4 h-4 mr-3 text-blue-400" />
                <span className="text-sm">bimaj0206@gmail.com</span>
              </li>
              <li className="flex items-center text-gray-300">
                <FaPhone className="w-4 h-4 mr-3 text-green-400" />
                <span className="text-sm">+62 822-5404-4783</span>
              </li>
              <li className="flex items-start text-gray-300">
                <FaUserShield className="w-4 h-4 mr-3 mt-0.5 text-purple-400" />
                <span className="text-sm leading-relaxed">
                  Sistem terenkripsi dan aman untuk privasi data Anda
                </span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          className="border-t border-gray-700/50 mt-12 pt-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Pilihku E-Voting. All rights reserved.
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span>Built with</span>
              <motion.span
                className="mx-1 text-red-400"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ❤️
              </motion.span>
              <span>by</span>
              <Link
                href="https://instagram.com/biimaa_jo"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
                aria-label="Visit BimaDev's Instagram"
              >
                BimaDev
              </Link>
            </div>
          </div>
          <motion.div
            className="mt-6 flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <FaLock className="w-3 h-3" />
              <span>SSL Encrypted • GDPR Compliant • Real-time Security</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}
