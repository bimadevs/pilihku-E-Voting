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
      router.push('/admin/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pemilih */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium">Total Pemilih</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalVoters}</p>
        </div>

        {/* Sudah Memilih */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium">Sudah Memilih</h3>
          <p className="text-3xl font-bold mt-2">{stats.votedCount}</p>
        </div>

        {/* Total Kandidat */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium">Total Kandidat</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalCandidates}</p>
        </div>

        {/* Persentase Partisipasi */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium">Persentase Partisipasi</h3>
          <p className="text-3xl font-bold mt-2">{stats.votingPercentage}%</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Menu Cepat</h2>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/admin/candidates')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Kelola Kandidat
            </button>
            <button
              onClick={() => router.push('/admin/voters')}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Kelola Pemilih
            </button>
            <button
              onClick={() => router.push('/admin/results')}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Lihat Hasil
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 