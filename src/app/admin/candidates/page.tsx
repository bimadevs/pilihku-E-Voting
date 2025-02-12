'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"

interface Candidate {
  id: string
  candidate_number: number
  ketua_name: string
  wakil_name: string
  ketua_class: string
  wakil_class: string
  visi: string
  misi: string
  program_kerja: string
  ketua_photo_url?: string
  wakil_photo_url?: string
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    candidate_number: '',
    ketua_name: '',
    wakil_name: '',
    ketua_class: '',
    wakil_class: '',
    visi: '',
    misi: '',
    program_kerja: '',
    ketua_photo: null as File | null,
    wakil_photo: null as File | null
  })
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    fetchCandidates()
  }, [])

  async function fetchCandidates() {
    try {
      const { data, error } = await supabaseClient
        .from('candidates')
        .select('*')
        .order('candidate_number')

      if (error) throw error
      setCandidates(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat data kandidat')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.candidate_number || !formData.ketua_name || !formData.wakil_name || 
          !formData.ketua_class || !formData.wakil_class ||
          !formData.visi || !formData.misi || !formData.program_kerja) {
        throw new Error('Semua field harus diisi')
      }

      let ketuaPhotoUrl = null
      let wakilPhotoUrl = null

      // Upload foto ketua
      if (formData.ketua_photo) {
        try {
          const fileExt = formData.ketua_photo.name.split('.').pop()
          const fileName = `ketua_${Date.now()}.${fileExt}`
          
          // Upload file
          const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('candidate-photos')
            .upload(`public/${fileName}`, formData.ketua_photo, {
              cacheControl: '3600',
              upsert: true
            })

          if (uploadError) throw uploadError

          // Get public URL
          const { data } = supabaseClient
            .storage
            .from('candidate-photos')
            .getPublicUrl(`public/${fileName}`)

          ketuaPhotoUrl = data.publicUrl
        } catch (error) {
          console.error('Error uploading ketua photo:', error)
          throw new Error('Gagal mengupload foto ketua')
        }
      }

      // Upload foto wakil
      if (formData.wakil_photo) {
        try {
          const fileExt = formData.wakil_photo.name.split('.').pop()
          const fileName = `wakil_${Date.now()}.${fileExt}`
          
          // Upload file
          const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('candidate-photos')
            .upload(`public/${fileName}`, formData.wakil_photo, {
              cacheControl: '3600',
              upsert: true
            })

          if (uploadError) throw uploadError

          // Get public URL
          const { data } = supabaseClient
            .storage
            .from('candidate-photos')
            .getPublicUrl(`public/${fileName}`)

          wakilPhotoUrl = data.publicUrl
        } catch (error) {
          console.error('Error uploading wakil photo:', error)
          throw new Error('Gagal mengupload foto wakil')
        }
      }

      // Simpan data kandidat
      const { error: insertError } = await supabaseClient
        .from('candidates')
        .insert([
          {
            candidate_number: parseInt(formData.candidate_number),
            ketua_name: formData.ketua_name,
            wakil_name: formData.wakil_name,
            ketua_class: formData.ketua_class,
            wakil_class: formData.wakil_class,
            visi: formData.visi,
            misi: formData.misi,
            program_kerja: formData.program_kerja,
            ketua_photo_url: ketuaPhotoUrl,
            wakil_photo_url: wakilPhotoUrl
          }
        ])

      if (insertError) throw insertError

      toast.success('Kandidat berhasil ditambahkan')
      fetchCandidates()
      setFormData({
        candidate_number: '',
        ketua_name: '',
        wakil_name: '',
        ketua_class: '',
        wakil_class: '',
        visi: '',
        misi: '',
        program_kerja: '',
        ketua_photo: null,
        wakil_photo: null
      })
    } catch (error) {
      console.error('Error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Gagal menambahkan kandidat')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus kandidat ini?')) return

    try {
      // Hapus foto dari storage
      const candidate = candidates.find(c => c.id === id)
      if (candidate?.ketua_photo_url) {
        const ketuaPhotoPath = candidate.ketua_photo_url.split('/').pop() || ''
        if (ketuaPhotoPath) {
          await supabaseClient.storage
            .from('candidate-photos')
            .remove([ketuaPhotoPath])
        }
      }
      if (candidate?.wakil_photo_url) {
        const wakilPhotoPath = candidate.wakil_photo_url.split('/').pop() || ''
        if (wakilPhotoPath) {
          await supabaseClient.storage
            .from('candidate-photos')
            .remove([wakilPhotoPath])
        }
      }

      // Hapus votes terkait
      await supabaseClient
        .from('votes')
        .delete()
        .eq('candidate_id', id)

      // Hapus kandidat
      const { error } = await supabaseClient
        .from('candidates')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Kandidat berhasil dihapus')
      fetchCandidates()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal menghapus kandidat')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Kelola Kandidat
          </h1>
        </div>

        {/* Form Tambah Kandidat */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 transform hover:scale-[1.01] transition-all duration-200">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800">Tambah Kandidat Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Nomor Urut */}
            <div className="w-full md:w-1/4">
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Nomor Urut Pasangan
              </label>
              <input
                type="number"
                value={formData.candidate_number}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  candidate_number: e.target.value
                }))}
                className="w-full border px-1 py-2 rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                required
                placeholder="Contoh: 1"
              />
            </div>

            {/* Info Kandidat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Ketua */}
              <div className="bg-blue-50 p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-semibold text-blue-900">Data Calon Ketua</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={formData.ketua_name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ketua_name: e.target.value
                      }))}
                      className="w-full px-1 py-2 rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kelas
                    </label>
                    <input
                      type="text"
                      value={formData.ketua_class}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ketua_class: e.target.value
                      }))}
                      className="w-full px-1 py-2 rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foto
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ketua_photo: e.target.files ? e.target.files[0] : null
                      }))}
                      className="w-full  text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 
                      file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 
                      transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Wakil */}
              <div className="bg-purple-50 p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-semibold text-purple-900">Data Calon Wakil</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={formData.wakil_name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        wakil_name: e.target.value
                      }))}
                      className="w-full px-1 py-2 rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kelas
                    </label>
                    <input
                      type="text"
                      value={formData.wakil_class}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        wakil_class: e.target.value
                      }))}
                      className="w-full px-1 py-2 rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foto
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        wakil_photo: e.target.files ? e.target.files[0] : null
                      }))}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 
                      file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100
                      transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visi, Misi, dan Program Kerja */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Visi
                </label>
                <textarea
                  value={formData.visi}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    visi: e.target.value
                  }))}
                  rows={4}
                  className="w-full p-4 rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  required
                />
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Misi
                </label>
                <textarea
                  value={formData.misi}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    misi: e.target.value
                  }))}
                  rows={4}
                  className="w-full p-4 rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  required
                />
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl w-full col-span-2">
                <label className="block text-sm font-medium text-green-900 mb-2">
                  Program Kerja
                </label>
                <textarea
                  value={formData.program_kerja}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    program_kerja: e.target.value
                  }))}
                  rows={4}
                  className="w-full p-4 rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl 
              hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
              focus:ring-offset-2 disabled:from-blue-300 disabled:to-blue-400 transition-all duration-200 
              shadow-lg hover:shadow-xl"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kandidat'}
            </button>
          </form>
        </div>

        {/* Daftar Kandidat */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800">Daftar Kandidat</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ketua</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wakil</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {candidate.candidate_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.ketua_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.ketua_class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.ketua_photo_url && (
                        <div className="h-12 w-12 rounded-full overflow-hidden">
                          <Image
                            src={candidate.ketua_photo_url}
                            alt={`Foto Ketua ${candidate.ketua_name}`}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            priority
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.wakil_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.wakil_class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.wakil_photo_url && (
                        <div className="h-12 w-12 rounded-full overflow-hidden">
                          <Image
                            src={candidate.wakil_photo_url}
                            alt={`Foto Wakil ${candidate.wakil_name}`}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            priority
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedCandidate(candidate)
                          setIsDetailModalOpen(true)
                        }}
                        className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 
                        hover:bg-blue-100 transition-colors duration-200"
                      >
                        <span>Lihat Detail</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className="inline-flex items-center px-3 py-1 rounded-lg bg-red-50 text-red-700 
                        hover:bg-red-100 transition-colors duration-200"
                      >
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail Kandidat */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-3xl bg-white">
            {selectedCandidate && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Detail Paslon Nomor {selectedCandidate.candidate_number}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Info Paslon */}
                  <div className="grid grid-cols-2 gap-8">
                    {/* Ketua */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        {selectedCandidate.ketua_photo_url && (
                          <div className="h-20 w-20 rounded-full overflow-hidden">
                            <Image
                              src={selectedCandidate.ketua_photo_url}
                              alt={`Foto Ketua ${selectedCandidate.ketua_name}`}
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                              priority
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">Calon Ketua</h3>
                          <p className="text-gray-700">{selectedCandidate.ketua_name}</p>
                          <p className="text-gray-500 text-sm">{selectedCandidate.ketua_class}</p>
                        </div>
                      </div>
                    </div>

                    {/* Wakil */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        {selectedCandidate.wakil_photo_url && (
                          <div className="h-20 w-20 rounded-full overflow-hidden">
                            <Image
                              src={selectedCandidate.wakil_photo_url}
                              alt={`Foto Wakil ${selectedCandidate.wakil_name}`}
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                              priority
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">Calon Wakil</h3>
                          <p className="text-gray-700">{selectedCandidate.wakil_name}</p>
                          <p className="text-gray-500 text-sm">{selectedCandidate.wakil_class}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visi */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg text-blue-900 mb-2">Visi</h3>
                    <p className="text-gray-700 whitespace-pre-line">{selectedCandidate.visi}</p>
                  </div>

                  {/* Misi */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg text-green-900 mb-2">Misi</h3>
                    <p className="text-gray-700 whitespace-pre-line">{selectedCandidate.misi}</p>
                  </div>

                  {/* Program Kerja */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg text-purple-900 mb-2">Program Kerja</h3>
                    <p className="text-gray-700 whitespace-pre-line">{selectedCandidate.program_kerja}</p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
