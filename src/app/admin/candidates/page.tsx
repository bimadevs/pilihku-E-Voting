'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/auth'
import { toast, Toaster } from 'react-hot-toast'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { ConfirmationDialog } from '../voters/components/ConfirmationDialog'

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

// Custom Toast Component
const CustomToast = ({ message, type }: { message: string, type: 'success' | 'error' | 'info' }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${bgColors[type]}`}>
      {icons[type]}
      <span className="text-gray-700">{message}</span>
    </div>
  )
}

// Fungsi helper untuk menampilkan toast
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toast.custom((t: { visible: boolean }) => (
    <CustomToast message={message} type={type} />
  ), {
    duration: 3000,
    position: 'top-center'
  })
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
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'single' as 'single' | 'multiple' | 'all',
    id: '',
    count: 0
  })

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
          
          const { error: uploadError } = await supabaseClient
            .storage
            .from('candidate-photos')
            .upload(`public/${fileName}`, formData.ketua_photo, {
              cacheControl: '3600',
              upsert: true
            })

          if (uploadError) throw uploadError

          const { data } = supabaseClient
            .storage
            .from('candidate-photos')
            .getPublicUrl(`public/${fileName}`)

          ketuaPhotoUrl = data.publicUrl
        } catch (error) {
          showNotification('Gagal mengupload foto ketua', 'error')
          throw new Error('Gagal mengupload foto ketua')
        }
      }

      // Upload foto wakil
      if (formData.wakil_photo) {
        try {
          const fileExt = formData.wakil_photo.name.split('.').pop()
          const fileName = `wakil_${Date.now()}.${fileExt}`
          
          const { error: uploadError } = await supabaseClient
            .storage
            .from('candidate-photos')
            .upload(`public/${fileName}`, formData.wakil_photo, {
              cacheControl: '3600',
              upsert: true
            })

          if (uploadError) throw uploadError

          const { data } = supabaseClient
            .storage
            .from('candidate-photos')
            .getPublicUrl(`public/${fileName}`)

          wakilPhotoUrl = data.publicUrl
        } catch (error) {
          showNotification('Gagal mengupload foto wakil', 'error')
          throw new Error('Gagal mengupload foto wakil')
        }
      }

      // Simpan data kandidat
      const { error: insertError } = await supabaseClient
        .from('candidates')
        .insert([{
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
        }])

      if (insertError) throw insertError

      showNotification('Kandidat berhasil ditambahkan', 'success')
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
        showNotification(error.message, 'error')
      } else {
        showNotification('Gagal menambahkan kandidat', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setConfirmDialog({
      isOpen: true,
      type: 'single',
      id,
      count: 1
    })
  }

  async function handleConfirmDelete() {
    if (!confirmDialog.id) return
    
    try {
      // 1. Dapatkan data kandidat untuk mendapatkan path foto
      const { data: candidate, error: fetchError } = await supabaseClient
        .from('candidates')
        .select('*')
        .eq('id', confirmDialog.id)
        .single()

      if (fetchError) {
        throw new Error('Gagal mengambil data kandidat')
      }

      // 2. Hapus foto ketua dari storage jika ada
      if (candidate?.ketua_photo_url) {
        const ketuaPhotoPath = candidate.ketua_photo_url
          .split('candidate-photos/')[1] // Ambil path setelah 'candidate-photos/'

        const { error: ketuaDeleteError } = await supabaseClient
          .storage
          .from('candidate-photos')
          .remove([ketuaPhotoPath])
        
        if (ketuaDeleteError) {
          console.error('Error deleting ketua photo:', ketuaDeleteError)
          throw new Error('Gagal menghapus foto ketua')
        }
      }

      // 3. Hapus foto wakil dari storage jika ada
      if (candidate?.wakil_photo_url) {
        const wakilPhotoPath = candidate.wakil_photo_url
          .split('candidate-photos/')[1] // Ambil path setelah 'candidate-photos/'

        const { error: wakilDeleteError } = await supabaseClient
          .storage
          .from('candidate-photos')
          .remove([wakilPhotoPath])
        
        if (wakilDeleteError) {
          console.error('Error deleting wakil photo:', wakilDeleteError)
          throw new Error('Gagal menghapus foto wakil')
        }
      }

      // 4. Hapus votes terkait
      const { error: votesError } = await supabaseClient
        .from('votes')
        .delete()
        .eq('candidate_id', confirmDialog.id)

      if (votesError) {
        throw new Error('Gagal menghapus data voting')
      }

      // 5. Hapus kandidat
      const { error: deleteError } = await supabaseClient
        .from('candidates')
        .delete()
        .eq('id', confirmDialog.id)

      if (deleteError) {
        throw new Error('Gagal menghapus data kandidat')
      }

      showNotification('Kandidat berhasil dihapus', 'success')
      fetchCandidates()
    } catch (error) {
      console.error('Error:', error)
      showNotification(
        error instanceof Error ? error.message : 'Gagal menghapus kandidat', 
        'error'
      )
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-12">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-6 sm:mb-12">
          Kelola Data Kandidat
        </h1>

        {/* Form Tambah Kandidat */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800">
            Tambah Kandidat Baru
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid untuk input fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nomor Urut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Urut
                </label>
                <input
                  type="number"
                  name="candidate_number"
                  value={formData.candidate_number}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    candidate_number: e.target.value
                  }))}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              {/* Spacer untuk alignment */}
              <div className="hidden md:block"></div>

              {/* Ketua Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Data Calon Ketua</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="ketua_name"
                    value={formData.ketua_name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ketua_name: e.target.value
                    }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kelas
                  </label>
                  <input
                    type="text"
                    name="ketua_class"
                    value={formData.ketua_class}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ketua_class: e.target.value
                    }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto
                  </label>
                  <input
                    type="file"
                    name="ketua_photo"
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ketua_photo: e.target.files ? e.target.files[0] : null
                    }))}
                    accept="image/*"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                             file:rounded-xl file:border-0 file:text-sm file:font-semibold
                             file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              {/* Wakil Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Data Calon Wakil</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="wakil_name"
                    value={formData.wakil_name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      wakil_name: e.target.value
                    }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kelas
                  </label>
                  <input
                    type="text"
                    name="wakil_class"
                    value={formData.wakil_class}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      wakil_class: e.target.value
                    }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto
                  </label>
                  <input
                    type="file"
                    name="wakil_photo"
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      wakil_photo: e.target.files ? e.target.files[0] : null
                    }))}
                    accept="image/*"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                             file:rounded-xl file:border-0 file:text-sm file:font-semibold
                             file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Visi, Misi, Program Kerja */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visi
                </label>
                <textarea
                  name="visi"
                  value={formData.visi}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    visi: e.target.value
                  }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Misi
                </label>
                <textarea
                  name="misi"
                  value={formData.misi}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    misi: e.target.value
                  }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Kerja
                </label>
                <textarea
                  name="program_kerja"
                  value={formData.program_kerja}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    program_kerja: e.target.value
                  }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 
                         transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         w-full sm:w-auto"
              >
                {loading ? 'Menyimpan...' : 'Simpan Kandidat'}
              </button>
            </div>
          </form>
        </div>

        {/* Daftar Kandidat */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. Urut
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Foto
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ketua
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Foto
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wakil
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                        {candidate.candidate_number}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      {candidate.ketua_photo_url && (
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden">
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
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.ketua_name}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.ketua_class}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      {candidate.wakil_photo_url && (
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden">
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
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.wakil_name}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.wakil_class}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate)
                            setIsDetailModalOpen(true)
                          }}
                          className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg bg-blue-50 text-blue-700 
                                   hover:bg-blue-100 transition-colors duration-200"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleDelete(candidate.id)}
                          className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg bg-red-50 text-red-700 
                                   hover:bg-red-100 transition-colors duration-200"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail Kandidat */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-3xl bg-white mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
            {selectedCandidate && (
              <>
                <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                    Detail Paslon Nomor {selectedCandidate.candidate_number}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="py-6 space-y-8">
                  {/* Info Paslon */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Ketua */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex flex-col items-center text-center">
                        {selectedCandidate.ketua_photo_url && (
                          <div className="mb-4 h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                            <Image
                              src={selectedCandidate.ketua_photo_url}
                              alt={`Foto Ketua ${selectedCandidate.ketua_name}`}
                              width={160}
                              height={160}
                              className="h-full w-full object-cover"
                              priority
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-xl text-gray-900 mb-1">Calon Ketua</h3>
                          <p className="text-lg text-gray-700 font-medium">{selectedCandidate.ketua_name}</p>
                          <p className="text-gray-500">{selectedCandidate.ketua_class}</p>
                        </div>
                      </div>
                    </div>

                    {/* Wakil */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex flex-col items-center text-center">
                        {selectedCandidate.wakil_photo_url && (
                          <div className="mb-4 h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                            <Image
                              src={selectedCandidate.wakil_photo_url}
                              alt={`Foto Wakil ${selectedCandidate.wakil_name}`}
                              width={160}
                              height={160}
                              className="h-full w-full object-cover"
                              priority
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-xl text-gray-900 mb-1">Calon Wakil</h3>
                          <p className="text-lg text-gray-700 font-medium">{selectedCandidate.wakil_name}</p>
                          <p className="text-gray-500">{selectedCandidate.wakil_class}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visi, Misi, Program Kerja */}
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-xl">
                      <h3 className="font-bold text-xl text-blue-900 mb-3">Visi</h3>
                      <p className="text-gray-700 whitespace-pre-line text-base leading-relaxed">
                        {selectedCandidate.visi}
                      </p>
                    </div>

                    <div className="bg-green-50 p-6 rounded-xl">
                      <h3 className="font-bold text-xl text-green-900 mb-3">Misi</h3>
                      <p className="text-gray-700 whitespace-pre-line text-base leading-relaxed">
                        {selectedCandidate.misi}
                      </p>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-xl">
                      <h3 className="font-bold text-xl text-purple-900 mb-3">Program Kerja</h3>
                      <p className="text-gray-700 whitespace-pre-line text-base leading-relaxed">
                        {selectedCandidate.program_kerja}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleConfirmDelete}
          title="Hapus Data Kandidat"
          message="Anda yakin ingin menghapus data kandidat ini? Semua data terkait termasuk foto dan data voting akan ikut terhapus."
          type="single"
          count={1}
        />
      </div>
    </div>
  )
}
