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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Kelola Pemilih
          </h1>
        </div>

        {/* Form Tambah Pemilih */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 transform hover:scale-[1.01] transition-all duration-200">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Tambah Pemilih Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIS
                </label>
                <input
                  type="text"
                  value={formData.nis}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nis: e.target.value
                  }))}
                  className="w-full px-1 py-2 border rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  required
                  placeholder="Contoh: 1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    full_name: e.target.value
                  }))}
                  className="w-full px-1 py-2 border rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  required
                  placeholder="Contoh: Nama Lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelas
                </label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    class: e.target.value
                  }))}
                  className="w-full px-1 py-2 border rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  required
                  placeholder="Contoh: XII TJKT"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-blue-300 disabled:to-blue-400 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Menyimpan...' : 'Tambah Pemilih'}
            </button>
          </form>
        </div>

        {/* Daftar Pemilih */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NIS
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {voters.map((voter) => (
                  <tr key={voter.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voter.nis}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voter.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{voter.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium
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
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
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
