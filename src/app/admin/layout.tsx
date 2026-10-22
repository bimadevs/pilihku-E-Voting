'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import { AdminSidebar } from './components/AdminSidebar'
import { AdminTopbar } from './components/AdminTopbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Load saved sidebar collapse preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pilihku_admin_sidebar_collapsed')
      if (saved !== null) {
        const collapsed = saved === 'true'
        requestAnimationFrame(() => setIsCollapsed(collapsed))
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, [])

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('pilihku_admin_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  if (isLoginPage) {
    return (
      <>
        {children}
        <Toaster position="top-right" />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar Navigation */}
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleCollapse}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Topbar */}
        <AdminTopbar
          onOpenMobile={() => setIsMobileOpen(true)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Content Area */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global Toast Container */}
      <Toaster position="top-right" />
    </div>
  )
}
