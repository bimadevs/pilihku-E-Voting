'use client'

import { useState } from 'react'
import { supabaseClient } from '@/lib/auth'

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
        setError('NIS tidak ditemukan')
        setLoading(false)
        return
      }

      if (voter.has_voted) {
        setError('Anda sudah melakukan voting')
        setLoading(false)
        return
      }

      // Simpan data voter ke cookie alih-alih localStorage
      document.cookie = `voter=${JSON.stringify(voter)}; path=/`
      
      // Redirect ke halaman voting
      window.location.href = '/vote'

    } catch (error) {
      console.error('Login error:', error)
      setError('Terjadi kesalahan saat login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Login Pemilih</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nomor Induk Siswa (NIS)
            </label>
            <input
              type="text"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Masukkan NIS Anda"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
          >
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Gunakan NIS yang telah terdaftar untuk melakukan voting
        </p>
      </div>
    </div>
  )
}
