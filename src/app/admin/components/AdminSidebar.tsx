'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BarChart3, 
  CalendarClock, 
  Trophy, 
  ExternalLink, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Radio,
  X
} from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { supabaseClient } from '@/lib/auth'

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Kandidat Paslon', href: '/admin/candidates', icon: Users },
  { name: 'Daftar Pemilih (DPT)', href: '/admin/voters', icon: UserCheck },
  { name: 'Hasil & Rekapitulasi', href: '/admin/results', icon: BarChart3 },
  { name: 'Jadwal Pemilihan', href: '/admin/schedule', icon: CalendarClock },
  { name: 'Pengaturan & Pemenang', href: '/admin/settings', icon: Trophy },
]

interface AdminSidebarProps {
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export function AdminSidebar({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [adminEmail, setAdminEmail] = useState<string>('Panitia Pemilihan')
  const [electionStatus, setElectionStatus] = useState<'live' | 'upcoming' | 'closed' | 'loading'>('loading')

  useEffect(() => {
    async function loadSessionAndSchedule() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (session?.user?.email) {
          setAdminEmail(session.user.email)
        }

        const { data: schedule } = await supabaseClient
          .from('voting_schedule')
          .select('start_time, end_time, is_active')
          .eq('is_active', true)
          .maybeSingle()

        if (!schedule) {
          setElectionStatus('closed')
          return
        }

        const now = new Date().getTime()
        const start = new Date(schedule.start_time).getTime()
        const end = new Date(schedule.end_time).getTime()

        if (now < start) {
          setElectionStatus('upcoming')
        } else if (now >= start && now <= end) {
          setElectionStatus('live')
        } else {
          setElectionStatus('closed')
        }
      } catch (err) {
        console.error('Error fetching admin sidebar state:', err)
        setElectionStatus('closed')
      }
    }

    loadSessionAndSchedule()
  }, [pathname])

  async function handleLogout() {
    try {
      await supabaseClient.auth.signOut()
      localStorage.removeItem('session')
      router.push('/admin/login')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
      router.push('/admin/login')
    }
  }

  const statusBadge = () => {
    if (electionStatus === 'live') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold tracking-wider uppercase">TPS Sedang Aktif</span>
        </div>
      )
    }
    if (electionStatus === 'upcoming') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300">
          <Radio className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] font-bold tracking-wider uppercase">Menunggu Jadwal</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        <span className="text-[11px] font-bold tracking-wider uppercase">Pemilihan Ditutup</span>
      </div>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 border-r border-slate-800/80 select-none">
      {/* Top Header & Brand */}
      <div className="p-4 lg:p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <BrandLogo size={isCollapsed ? 'sm' : 'md'} variant="squircle" />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white truncate">
                  Pilih<span className="text-blue-400">Ku</span>
                </span>
                <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  ADMIN
                </span>
              </div>
              <span className="text-[11px] text-slate-400 truncate">Ruang Kontrol OSIS</span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Status Banner (When expanded) */}
      {!isCollapsed && (
        <div className="px-4 pt-4 pb-2">
          {statusBadge()}
        </div>
      )}

      {/* Main Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {!isCollapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {/* Link to Voter Portal */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-blue-300 hover:bg-slate-900 transition-colors ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title={isCollapsed ? 'Pratinjau Bilik Suara' : undefined}
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0 text-slate-500" />
          {!isCollapsed && <span className="truncate">Pratinjau Bilik Suara</span>}
        </Link>

        {/* Operator Profile Card */}
        <div className={`p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Panitia OSIS</p>
              <p className="text-[11px] text-slate-500 truncate" title={adminEmail}>
                {adminEmail}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Keluar dari Admin"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-full items-center justify-center gap-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-lg transition-colors"
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!isCollapsed && <span className="text-[11px]">Ciutkan Menu</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  )
}
