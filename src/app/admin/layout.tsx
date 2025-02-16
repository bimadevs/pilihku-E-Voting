'use client'

import Link from 'next/link'
import { Navbar } from './components/navbar'
import { motion } from 'framer-motion'
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="pt-16"> {/* Add padding top to account for fixed navbar */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      {/* Credit Footer */}
      <div className="mt-12 text-center py-8 border-t border-gray-200">
        <Link
          href="https://instagram.com/biimaa_jo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Build by{' '}
            <span className="font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-indigo-600 hover:to-blue-600">
              BimaDev
            </span>
          </motion.span>
        </Link>
      </div>
    </div>
  )
} 