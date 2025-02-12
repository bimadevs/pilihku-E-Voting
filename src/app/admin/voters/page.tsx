'use client'

import { useState, useEffect, useRef } from 'react'
import { supabaseClient } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import Papa from 'papaparse'

interface Voter {
  id: string
  nis: string
  full_name: string
  class: string
  has_voted: boolean
}

interface CSVVoter {
  nis: string
  full_name: string
  class: string
}

export default function VotersPage() {
  const [voters, setVoters] = useState<Voter[]>([])
  const [loading, setLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    nis: '',
    full_name: '',
    class: ''
  })

  useEffect(() => {
    fetchVoters()
  }, [])

  // Fungsi untuk memvalidasi data CSV
  function validateCSVData(data: CSVVoter): string | null {
    if (!data.nis) return 'NIS tidak boleh kosong'
    if (!data.full_name) return 'Nama lengkap tidak boleh kosong'
    if (!data.class) return 'Kelas tidak boleh kosong'
    return null
  }

  // Fungsi untuk menghandle import CSV
  async function handleCSVImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    let successCount = 0
    let errorCount = 0
    let duplicateCount = 0

    try {
      const text = await file.text()
      
      Papa.parse<CSVVoter>(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const { data } = results

          for (const row of data) {
            const validationError = validateCSVData(row)
            if (validationError) {
              console.error(`Baris dengan NIS ${row.nis}: ${validationError}`)
              errorCount++
              continue
            }

            try {
              // Cek duplikat NIS
              const { data: existingVoter } = await supabaseClient
                .from('voters')
                .select('id')
                .eq('nis', row.nis)
                .single()

              if (existingVoter) {
                console.log(`NIS ${row.nis} sudah terdaftar`)
                duplicateCount++
                continue
              }

              const { error } = await supabaseClient
                .from('voters')
                .insert([{
                  nis: row.nis,
                  full_name: row.full_name,
                  class: row.class,
                  has_voted: false
                }])

              if (error) throw error
              successCount++
            } catch (error) {
              console.error(`Error importing row ${row.nis}:`, error)
              errorCount++
            }
          }

          // Reset file input
          if (fileInputRef.current) fileInputRef.current.value = ''
          
          // Tampilkan hasil import
          toast.success(
            `Import selesai:\n${successCount} berhasil\n${duplicateCount} duplikat\n${errorCount} gagal`
          )
          
          // Refresh data
          fetchVoters()
        },
        error: (error: Error) => {
          console.error('Error parsing CSV:', error)
          toast.error('Gagal membaca file CSV')
        }
      })
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast.error('Gagal mengimpor data')
    } finally {
      setIsImporting(false)
    }
  }

  async function fetchVoters() {
    try {
      const { data, error } = await supabaseClient
        .from('voters')
        .select('*')
        .order('full_name')

      if (error) throw error
      setVoters(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat data pemilih')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabaseClient
        .from('voters')
        .insert([formData])

      if (error) throw error

      toast.success('Pemilih berhasil ditambahkan')
      fetchVoters()
      setFormData({ nis: '', full_name: '', class: '' })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal menambahkan pemilih')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus pemilih ini?')) return

    try {
      // Hapus vote terkait terlebih dahulu
      await supabaseClient
        .from('votes')
        .delete()
        .eq('voter_id', id)

      // Kemudian hapus pemilih
      const { error } = await supabaseClient
        .from('voters')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Pemilih berhasil dihapus')
      fetchVoters()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal menghapus pemilih')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Kelola Pemilih</h1>

          {/* Import CSV Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                ref={fileInputRef}
                className="hidden"
                id="csv-input"
                disabled={isImporting}
              />
              <label
                htmlFor="csv-input"
                className={`
                  inline-flex items-center px-4 py-2 rounded-lg
                  ${isImporting 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 cursor-pointer'}
                  text-white transition-colors duration-200
                `}
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Mengimpor...
                  </>
                ) : (
                  <>
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Import CSV
                  </>
                )}
              </label>
            </div>

            {/* Download Template Button */}
            <button
              onClick={() => {
                const csvContent = `nis,full_name,class
12345,Nama Siswa 1,XII RPL 1
12346,Nama Siswa 2,XI TKJ 2`

                const blob = new Blob([csvContent], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'template_pemilih.csv'
                a.click()
                window.URL.revokeObjectURL(url)
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Download Template
            </button>
          </div>
        </div>

        {/* Form Tambah Pemilih */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Tambah Pemilih Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIS
                </label>
                <input
                  type="text"
                  value={formData.nis}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nis: e.target.value
                  }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    full_name: e.target.value
                  }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kelas
                </label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    class: e.target.value
                  }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {loading ? 'Menyimpan...' : 'Tambah Pemilih'}
            </button>
          </form>
        </div>

        {/* Daftar Pemilih */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    NIS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kelas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {voters.map((voter) => (
                  <tr key={voter.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{voter.nis}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{voter.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{voter.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${voter.has_voted 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {voter.has_voted ? 'Sudah Memilih' : 'Belum Memilih'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(voter.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
