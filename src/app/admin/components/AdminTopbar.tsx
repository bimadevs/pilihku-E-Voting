'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu, 
  ChevronRight, 
  Clock, 
  Wifi, 
  ExternalLink,
  ChevronLeft,
  Calendar
} from 'lucide-react'

const ROUTE_NAMES: Record<string, { title: string; category: string }> = {
  '/admin': { title: 'Dashboard Utama', category: 'Ringkasan' },
  '/admin/candidates': { title: 'Manajemen Kandidat Paslon', category: 'Data Pemilihan' },
  '/admin/voters': { title: 'Daftar Pemilih Tetap (DPT)', category: 'Data Pemilihan' },
  '/admin/results': { title: 'Hasil & Rekapitulasi Suara', category: 'Penghitungan' },
  '/admin/schedule': { title: 'Jadwal Pemilihan', category: 'Konfigurasi' },
  '/admin/settings': { title: 'Pengaturan & Pemenang', category: 'Konfigurasi' },
}

interface AdminTopbarProps {
  onOpenMobile: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function AdminTopbar({ onOpenMobile, isCollapsed, onToggleCollapse }: AdminTopbarProps) {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    function updateClock() {
      const now = new Date()
      const formatted = new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)
      setCurrentTime(formatted + ' WIB')
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  const currentRoute = ROUTE_NAMES[pathname] || { title: 'Admin Control Room', category: 'Sistem' }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all select-none">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Buka navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link href="/admin" className="hover:text-blue-600 transition-colors">
            Admin
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 hidden sm:inline">{currentRoute.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <span className="text-slate-900 font-semibold">{currentRoute.title}</span>
        </div>
      </div>

      {/* Right: Clock & System Telemetry */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200/60 text-slate-600 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime || 'Memuat waktu...'}</span>
        </div>

        {/* System Health */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Sistem Online</span>
        </div>

        {/* Voter Site Quick Jump */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors"
        >
          <span>Bilik Suara</span>
          <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
        </Link>
      </div>
    </header>
  )
}
