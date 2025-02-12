'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Kelola Kandidat</h1>
        </div>

        {/* Form Tambah Kandidat */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Tambah Kandidat Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nomor Urut */}
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Urut Pasangan
              </label>
              <input
                type="number"
                value={formData.candidate_number}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  candidate_number: e.target.value
                }))}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Kolom Ketua */}
              <div className="space-y-4">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Data Calon Ketua</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Calon Ketua
                      </label>
                      <input
                        type="text"
                        value={formData.ketua_name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          ketua_name: e.target.value
                        }))}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kelas Calon Ketua
                      </label>
                      <input
                        type="text"
                        value={formData.ketua_class}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          ketua_class: e.target.value
                        }))}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                        placeholder="Contoh: XII RPL 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foto Calon Ketua
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          ketua_photo: e.target.files ? e.target.files[0] : null
                        }))}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Wakil */}
              <div className="space-y-4">
                <div className="p-6 bg-green-50 rounded-lg border border-green-100">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Data Calon Wakil</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Calon Wakil
                      </label>
                      <input
                        type="text"
                        value={formData.wakil_name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          wakil_name: e.target.value
                        }))}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kelas Calon Wakil
                      </label>
                      <input
                        type="text"
                        value={formData.wakil_class}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          wakil_class: e.target.value
                        }))}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                        placeholder="Contoh: XI TKJ 2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foto Calon Wakil
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          wakil_photo: e.target.files ? e.target.files[0] : null
                        }))}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visi, Misi, dan Program Kerja */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visi
                </label>
                <textarea
                  value={formData.visi}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    visi: e.target.value
                  }))}
                  rows={4}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Misi
                </label>
                <textarea
                  value={formData.misi}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    misi: e.target.value
                  }))}
                  rows={4}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Kerja
                </label>
                <textarea
                  value={formData.program_kerja}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    program_kerja: e.target.value
                  }))}
                  rows={4}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  placeholder="Tuliskan program kerja unggulan"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors duration-200"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kandidat'}
            </button>
          </form>
        </div>

        {/* Daftar Kandidat */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
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
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {candidate.candidate_number}
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
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                      >
                        Lihat Detail
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className="text-red-600 hover:text-red-900 font-medium text-sm"
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

      {/* Modal Detail Kandidat */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl">
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
  )
}
