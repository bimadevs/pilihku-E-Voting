'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalVoters: number
  votedCount: number
  totalCandidates: number
  votingPercentage: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalVoters: 0,
    votedCount: 0,
    totalCandidates: 0,
    votingPercentage: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  async function fetchDashboardStats() {
    try {
      // Mengambil total pemilih
      const { count: totalVoters } = await supabaseClient
        .from('voters')
        .select('*', { count: 'exact' })

      // Mengambil jumlah yang sudah memilih
      const { count: votedCount } = await supabaseClient
        .from('voters')
        .select('*', { count: 'exact' })
        .eq('has_voted', true)

      // Mengambil total kandidat
      const { count: totalCandidates } = await supabaseClient
        .from('candidates')
        .select('*', { count: 'exact' })
      // Menghitung persentase
      const percentage = totalVoters ? ((votedCount ?? 0) / totalVoters) * 100 : 0

      setStats({
        totalVoters: totalVoters ?? 0,
        votedCount: votedCount ?? 0,
        totalCandidates: totalCandidates || 0,
        votingPercentage: Number(percentage.toFixed(2))
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await supabaseClient.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Dashboard Admin
          </h1>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl 
            hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Total Pemilih */}
          <div className="bg-white p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-600">Total Pemilih</h3>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalVoters}</p>
              </div>
            </div>
          </div>

          {/* Sudah Memilih */}
          <div className="bg-white p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-600">Sudah Memilih</h3>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.votedCount}</p>
                <p className="text-sm font-medium text-green-500 mt-1">
                  {stats.votingPercentage}% partisipasi
                </p>
              </div>
            </div>
          </div>

          {/* Total Kandidat */}
          <div className="bg-white p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-600">Total Kandidat</h3>
                <p className="text-4xl font-bold text-purple-600 mt-2">{stats.totalCandidates}</p>
              </div>
            </div>
          </div>

          {/* Persentase Partisipasi */}
          <div className="bg-white p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-600">Persentase Partisipasi</h3>
                <p className="text-4xl font-bold text-orange-600 mt-2">{stats.votingPercentage}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Cepat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <button
            onClick={() => router.push('/admin/candidates')}
            className="group p-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg 
            hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200"
          >
            <div className="flex flex-col items-center text-white">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-xl font-semibold">Kelola Kandidat</h3>
              <p className="mt-2 text-blue-100">Tambah atau edit data kandidat</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/voters')}
            className="group p-8 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg 
            hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200"
          >
            <div className="flex flex-col items-center text-white">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-xl font-semibold">Kelola Pemilih</h3>
              <p className="mt-2 text-green-100">Atur data pemilih</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/results')}
            className="group p-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg 
            hover:from-purple-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
          >
            <div className="flex flex-col items-center text-white">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-semibold">Lihat Hasil</h3>
              <p className="mt-2 text-purple-100">Pantau hasil pemilihan</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
} 