'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertCircle,
  KeyRound,
  FileCheck2,
  LockKeyhole
} from 'lucide-react'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setError('Email atau kata sandi tidak valid. Pastikan akun panitia Anda telah didaftarkan.')
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setError('Alamat email belum dikonfirmasi. Silakan periksa email aktivasi Anda.')
        } else {
          setError(error.message)
        }
        return
      }

      if (data?.user) {
        localStorage.setItem('session', JSON.stringify(data.session))
        router.push('/admin')
        router.refresh()
      }
    } catch (err) {
      setError('Terjadi kendala jaringan saat menghubungi server autentikasi.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-slate-950 selection:bg-indigo-600 selection:text-white">
      {/* Sisi Kiri: Institutional Brand & Integrity Mandate */}
      <aside className="lg:col-span-5 xl:col-span-5 bg-slate-950 text-slate-100 flex flex-col justify-between p-8 sm:p-12 lg:p-14 border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden">
        {/* Subtle grid pattern texture */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px' 
          }} 
        />

        {/* Top: Navigasi Kembali */}
        <div className="relative z-10">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-slate-400 group-hover:text-white" />
            <span>Kembali ke Beranda Pemilih</span>
          </Link>
        </div>

        {/* Center: Context & Civic Mandate */}
        <div className="relative z-10 py-10 lg:py-0 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-xs font-medium mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Pusat Kendali Pemilihan OSIS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Panel Pengawasan & Rekapitulasi Suara
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Akses resmi panitia pemilihan dan pembina OSIS untuk mengelola daftar pemilih tetap, verifikasi bilik suara, serta memantau perolehan suara secara transparan dan terenkripsi.
          </p>

          {/* Protokol Integritas */}
          <div className="mt-8 pt-8 border-t border-slate-800/80 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <LockKeyhole className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Enkripsi Sesi 256-Bit</p>
                <p className="text-xs text-slate-400 mt-0.5">Seluruh sesi diautentikasi dengan token aman berbasis Row Level Security.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <FileCheck2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Integritas Suara Tunggal</p>
                <p className="text-xs text-slate-400 mt-0.5">Sistem memastikan setiap siswa hanya memiliki satu hak suara sah tanpa duplikasi.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Institutional Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-slate-400">PilihKu v2.0 • E-Voting</span>
          <span className="text-slate-400">Ruang Panitia</span>
        </div>
      </aside>

      {/* Sisi Kanan: Modern Authentication Console */}
      <main className="lg:col-span-7 xl:col-span-7 bg-slate-50 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile Badge (tampil di layar kecil) */}
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Beranda Pemilih
            </Link>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              Admin Console
            </span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm mb-4">
              <KeyRound className="w-6 h-6 text-slate-100" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Masuk ke Panel Kendali
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Silakan masukkan kredensial akun panitia atau pembina OSIS yang terverifikasi untuk melanjutkan.
            </p>
          </div>

          {/* Error Banner */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-6 overflow-hidden"
              >
                <div 
                  role="alert" 
                  className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 text-sm shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-950 text-xs uppercase tracking-wider">Otorisasi Ditolak</p>
                    <p className="text-red-800 mt-0.5 text-xs leading-relaxed">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                htmlFor="admin-email" 
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
              >
                Alamat Email Panitia
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="panitia@sekolah.sch.id"
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label 
                  htmlFor="admin-password" 
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Kata Sandi
                </label>
                <span className="text-xs text-slate-500">
                  Akses Terbatas
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-3 text-sm bg-white rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm py-3 px-4 rounded-xl transition-all duration-150 shadow-sm hover:shadow active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <span>Masuk ke Panel Kendali</span>
              )}
            </button>
          </form>

          {/* Security & Support Note */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Mengalami kendala otentikasi atau pergantian pengurus panitia? Hubungi <span className="font-semibold text-slate-700">Pembina OSIS</span> atau administrator server sekolah.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
} 