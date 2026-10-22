'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/auth'
import { checkDeviceVoted } from '@/lib/deviceFingerprint'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import BrandLogo from '@/components/BrandLogo'

export default function VoterLogin() {
  const [nis, setNis] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDeviceBlocked, setIsDeviceBlocked] = useState(false)
  const [isCheckingDevice, setIsCheckingDevice] = useState(true)
  const [deviceHash, setDeviceHash] = useState('')

  useEffect(() => {
    let isMounted = true

    async function verifyDevice() {
      try {
        const { hasVoted, deviceHash: hash } = await checkDeviceVoted()
        if (isMounted) {
          setDeviceHash(hash)
          if (hasVoted) {
            setIsDeviceBlocked(true)
            setError('Perangkat ini sudah pernah digunakan untuk voting. 1 perangkat hanya dapat memberikan 1 suara.')
          }
          setIsCheckingDevice(false)
        }
      } catch (err) {
        console.error('Error saat verifikasi perangkat:', err)
        if (isMounted) setIsCheckingDevice(false)
      }
    }

    verifyDevice()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Validasi Proteksi 1 Device 1 Vote
      const { hasVoted, deviceHash: currentHash } = await checkDeviceVoted(deviceHash)
      if (hasVoted) {
        setIsDeviceBlocked(true)
        setError('Perangkat ini sudah digunakan untuk melakukan voting. Satu perangkat hanya dapat digunakan untuk 1 kali suara.')
        setLoading(false)
        return
      }

      // 2. Validasi NIS Siswa
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

      // Simpan device_hash di cookie/session bersama data voter jika diperlukan
      document.cookie = `voter=${JSON.stringify(voter)}; path=/`
      if (currentHash) {
        document.cookie = `pilihku_device=${currentHash}; path=/; max-age=86400`
      }
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
          {/* Back to Home Navigation */}
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-64 overflow-hidden -z-10">
            <div className="absolute w-96 h-96 -top-48 -left-48 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
            <div className="absolute w-96 h-96 -top-48 -right-48 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
          </div>

          {/* Logo and Title */}
          <div className="text-center mb-8 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="mb-4"
            >
              <BrandLogo size="lg" variant="squircle" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-extrabold tracking-tight text-slate-900"
            >
              Pilih<span className="text-blue-600">Ku</span>{' '}
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 align-middle">
                OSIS
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-sm text-slate-600 font-medium"
            >
              Masuk dengan NIS untuk menggunakan hak suaramu
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
              {error && !isDeviceBlocked && (
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

            {isDeviceBlocked ? (
              <div className="py-2 text-center space-y-4 relative z-10">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Perangkat Sudah Memilih</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Perangkat ini sudah tercatat telah memberikan suara pada pemilihan ini. 
                    Demi menjaga integritas pemilihan, <span className="font-semibold text-slate-800">1 perangkat hanya dapat digunakan untuk 1 kali suara</span>.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-left text-xs text-amber-800">
                  <p className="font-semibold mb-1">Butuh bantuan?</p>
                  <p>Jika ini adalah kekeliruan atau Anda meminjam HP karena HP rusak, silakan hubungi <strong>Panitia Pemilihan OSIS</strong> untuk bantuan pembukaan kunci.</p>
                </div>
              </div>
            ) : (
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
                      disabled={loading || isCheckingDevice}
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
                  disabled={loading || isCheckingDevice}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl 
                           hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 
                           focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 
                           disabled:opacity-50 disabled:cursor-not-allowed font-medium relative overflow-hidden"
                >
                  <div className="relative z-10">
                    {loading || isCheckingDevice ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {isCheckingDevice ? 'Memeriksa Perangkat...' : 'Memproses...'}
                      </span>
                    ) : (
                      'Masuk'
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                </motion.button>
              </form>
            )}
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
