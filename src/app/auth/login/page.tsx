'use client'

import { useState } from 'react'
import { supabaseClient } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function VoterLogin() {
  const [nis, setNis] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: voter, error } = await supabaseClient
        .from('voters')
        .select('*')
        .eq('nis', nis)
        .single()

      if (error || !voter) {
        setError('Maaf, NIS Anda tidak ditemukan. Hubungi Admin untuk informasi lebih lanjut.')
        return
      }

      if (voter.has_voted) {
        setError('Anda sudah melakukan voting. Terima kasih telah berkontribusi pada pemilihan OSIS.')
        return
      }

      document.cookie = `voter=${JSON.stringify(voter)}; path=/`
      window.location.href = '/vote'

    } catch (error) {
      console.error('Login error:', error)
      setError('Terjadi kesalahan saat login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 h-screen flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-64 overflow-hidden -z-10">
            <div className="absolute w-96 h-96 -top-48 -left-48 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
            <div className="absolute w-96 h-96 -top-48 -right-48 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
          </div>

          {/* Logo and Title */}
          <div className="text-center mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              PilihKu E-Voting
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-gray-600"
            >
              Masuk untuk memberikan suara Anda
            </motion.p>
          </div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden"
          >
            {/* Decorative Corner */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-50 rounded-full" />
            <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-indigo-50 rounded-full" />

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl"
                >
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div>
                <label htmlFor="nis" className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Induk Siswa (NIS)
                </label>
                <div className="relative">
                  <input
                    id="nis"
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Masukkan NIS Anda"
                    required
                    autoComplete='off'
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl 
                         hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 
                         focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed font-medium relative overflow-hidden"
              >
                <div className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    'Masuk'
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 hover:opacity-100 transition-opacity duration-200" />
              </motion.button>
            </form>
          </motion.div>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center text-sm text-gray-600"
          >
            Gunakan NIS yang telah terdaftar untuk melakukan voting
          </motion.p>

          {/* Build Credit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <a
              href="https://github.com/bimadevs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Build by{' '}
              <span className="font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BimaDev
              </span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
