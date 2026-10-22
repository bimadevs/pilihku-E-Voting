'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabaseClient } from '@/lib/auth'
import { showAdminToast } from '@/app/admin/components/AdminToast'
import { ConfirmationDialog } from '../voters/components/ConfirmationDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  UploadCloud, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  FileText, 
  Target, 
  ListOrdered,
  X,
  Loader2
} from 'lucide-react'

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
  ketua_photo_url?: string | null
  wakil_photo_url?: string | null
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal form states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null)

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
    wakil_photo: null as File | null,
  })

  // Preview URLs for selected files
  const [ketuaPreview, setKetuaPreview] = useState<string | null>(null)
  const [wakilPreview, setWakilPreview] = useState<string | null>(null)

  // Detail Modal
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Expandable accordions for candidate card details
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  // Delete Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    id: string
    name: string
  }>({
    isOpen: false,
    id: '',
    name: '',
  })

  useEffect(() => {
    fetchCandidates()
  }, [])

  async function fetchCandidates() {
    try {
      setLoading(true)
      const { data, error } = await supabaseClient
        .from('candidates')
        .select('*')
        .order('candidate_number')

      if (error) throw error
      setCandidates(data || [])
    } catch (error: any) {
      console.error('Error fetching candidates:', error)
      showAdminToast('Gagal memuat kandidat', 'error', error?.message)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenAddModal() {
    setEditingCandidateId(null)
    setFormData({
      candidate_number: String((candidates.length || 0) + 1),
      ketua_name: '',
      wakil_name: '',
      ketua_class: '',
      wakil_class: '',
      visi: '',
      misi: '',
      program_kerja: '',
      ketua_photo: null,
      wakil_photo: null,
    })
    setKetuaPreview(null)
    setWakilPreview(null)
    setIsFormModalOpen(true)
  }

  function handleOpenEditModal(candidate: Candidate) {
    setEditingCandidateId(candidate.id)
    setFormData({
      candidate_number: String(candidate.candidate_number),
      ketua_name: candidate.ketua_name,
      wakil_name: candidate.wakil_name,
      ketua_class: candidate.ketua_class,
      wakil_class: candidate.wakil_class,
      visi: candidate.visi,
      misi: candidate.misi,
      program_kerja: candidate.program_kerja,
      ketua_photo: null,
      wakil_photo: null,
    })
    setKetuaPreview(candidate.ketua_photo_url || null)
    setWakilPreview(candidate.wakil_photo_url || null)
    setIsFormModalOpen(true)
  }

  function handleKetuaPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAdminToast('Ukuran foto terlalu besar', 'warning', 'Maksimal ukuran file foto adalah 5MB.')
        return
      }
      setFormData((prev) => ({ ...prev, ketua_photo: file }))
      setKetuaPreview(URL.createObjectURL(file))
    }
  }

  function handleWakilPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAdminToast('Ukuran foto terlalu besar', 'warning', 'Maksimal ukuran file foto adalah 5MB.')
        return
      }
      setFormData((prev) => ({ ...prev, wakil_photo: file }))
      setWakilPreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      if (
        !formData.candidate_number ||
        !formData.ketua_name ||
        !formData.wakil_name ||
        !formData.ketua_class ||
        !formData.wakil_class ||
        !formData.visi ||
        !formData.misi ||
        !formData.program_kerja
      ) {
        throw new Error('Semua data pokok dan visi-misi pasangan calon wajib diisi')
      }

      const { data: { session } } = await supabaseClient.auth.getSession()
      if (!session) {
        throw new Error('Sesi admin berakhir. Silakan login kembali.')
      }

      let ketuaPhotoUrl = ketuaPreview
      let wakilPhotoUrl = wakilPreview

      // 1. Upload foto ketua jika ada file baru
      if (formData.ketua_photo) {
        const fileExt = formData.ketua_photo.name.split('.').pop()
        const fileName = `ketua_${Date.now()}.${fileExt}`
        const { error: uploadErr } = await supabaseClient.storage
          .from('candidate-photos')
          .upload(`public/${fileName}`, formData.ketua_photo, {
            cacheControl: '3600',
            upsert: true,
          })
        if (uploadErr) throw new Error('Gagal mengunggah foto ketua: ' + uploadErr.message)

        const { data } = supabaseClient.storage
          .from('candidate-photos')
          .getPublicUrl(`public/${fileName}`)
        ketuaPhotoUrl = data.publicUrl
      }

      // 2. Upload foto wakil jika ada file baru
      if (formData.wakil_photo) {
        const fileExt = formData.wakil_photo.name.split('.').pop()
        const fileName = `wakil_${Date.now()}.${fileExt}`
        const { error: uploadErr } = await supabaseClient.storage
          .from('candidate-photos')
          .upload(`public/${fileName}`, formData.wakil_photo, {
            cacheControl: '3600',
            upsert: true,
          })
        if (uploadErr) throw new Error('Gagal mengunggah foto wakil: ' + uploadErr.message)

        const { data } = supabaseClient.storage
          .from('candidate-photos')
          .getPublicUrl(`public/${fileName}`)
        wakilPhotoUrl = data.publicUrl
      }

      if (editingCandidateId) {
        // Mode Update
        const { error: updateError } = await supabaseClient
          .from('candidates')
          .update({
            candidate_number: parseInt(formData.candidate_number),
            ketua_name: formData.ketua_name.trim(),
            wakil_name: formData.wakil_name.trim(),
            ketua_class: formData.ketua_class.trim(),
            wakil_class: formData.wakil_class.trim(),
            visi: formData.visi.trim(),
            misi: formData.misi.trim(),
            program_kerja: formData.program_kerja.trim(),
            ketua_photo_url: ketuaPhotoUrl,
            wakil_photo_url: wakilPhotoUrl,
          })
          .eq('id', editingCandidateId)

        if (updateError) throw updateError
        showAdminToast('Paslon Diperbarui', 'success', `Data Paslon #${formData.candidate_number} berhasil disimpan.`)
      } else {
        // Mode Insert
        const { error: insertError } = await supabaseClient
          .from('candidates')
          .insert([
            {
              candidate_number: parseInt(formData.candidate_number),
              ketua_name: formData.ketua_name.trim(),
              wakil_name: formData.wakil_name.trim(),
              ketua_class: formData.ketua_class.trim(),
              wakil_class: formData.wakil_class.trim(),
              visi: formData.visi.trim(),
              misi: formData.misi.trim(),
              program_kerja: formData.program_kerja.trim(),
              ketua_photo_url: ketuaPhotoUrl,
              wakil_photo_url: wakilPhotoUrl,
            },
          ])

        if (insertError) {
          // Rollback foto jika gagal
          if (formData.ketua_photo && ketuaPhotoUrl) {
            const p = ketuaPhotoUrl.split('candidate-photos/')[1]
            if (p) await supabaseClient.storage.from('candidate-photos').remove([p])
          }
          if (formData.wakil_photo && wakilPhotoUrl) {
            const p = wakilPhotoUrl.split('candidate-photos/')[1]
            if (p) await supabaseClient.storage.from('candidate-photos').remove([p])
          }
          throw insertError
        }
        showAdminToast('Paslon Ditambahkan', 'success', `Paslon #${formData.candidate_number} berhasil didaftarkan.`)
      }

      setIsFormModalOpen(false)
      fetchCandidates()
    } catch (err: any) {
      console.error('Error submitting candidate:', err)
      showAdminToast('Gagal Menyimpan', 'error', err?.message || 'Terjadi kesalahan sistem')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDialog.id) return

    try {
      // 1. Fetch candidate to get photo urls
      const { data: cand } = await supabaseClient
        .from('candidates')
        .select('ketua_photo_url, wakil_photo_url')
        .eq('id', confirmDialog.id)
        .single()

      // 2. Remove photos from bucket
      if (cand?.ketua_photo_url) {
        const p = cand.ketua_photo_url.split('candidate-photos/')[1]
        if (p) await supabaseClient.storage.from('candidate-photos').remove([p])
      }
      if (cand?.wakil_photo_url) {
        const p = cand.wakil_photo_url.split('candidate-photos/')[1]
        if (p) await supabaseClient.storage.from('candidate-photos').remove([p])
      }

      // 3. Delete votes first
      await supabaseClient.from('votes').delete().eq('candidate_id', confirmDialog.id)

      // 4. Delete candidate
      const { error: delErr } = await supabaseClient
        .from('candidates')
        .delete()
        .eq('id', confirmDialog.id)

      if (delErr) throw delErr

      showAdminToast('Paslon Dihapus', 'success', `Kandidat ${confirmDialog.name} berhasil dihapus permanen.`)
      fetchCandidates()
    } catch (err: any) {
      console.error('Delete error:', err)
      showAdminToast('Gagal Menghapus', 'error', err?.message || 'Tidak dapat menghapus paslon.')
    } finally {
      setConfirmDialog({ isOpen: false, id: '', name: '' })
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Manajemen Pasangan Calon
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              {candidates.length} Paslon Terdaftar
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Daftarkan nomor urut, foto resmi, visi, misi, dan program kerja unggulan calon Ketua & Wakil OSIS.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Paslon Baru</span>
        </button>
      </div>

      {/* Main Roster Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Memuat data kandidat...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Belum Ada Paslon Terdaftar</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mulai masukkan data pasangan calon Ketua & Wakil OSIS beserta visi misi untuk ditampilkan di bilik suara pemilih.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Paslon Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => {
            const isExpanded = !!expandedCards[candidate.id]

            return (
              <div
                key={candidate.id}
                className="bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Card Top: Number & Actions */}
                <div className="p-5 pb-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                      #{candidate.candidate_number}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Paslon 0{candidate.candidate_number}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCandidate(candidate)
                        setIsDetailModalOpen(true)
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lihat Detail Lengkap"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(candidate)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit Paslon"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          id: candidate.id,
                          name: `Paslon #${candidate.candidate_number} (${candidate.ketua_name} & ${candidate.wakil_name})`,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Paslon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Candidate Photos & Names */}
                <div className="p-5 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Ketua */}
                    <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-xs relative mb-2">
                        {candidate.ketua_photo_url ? (
                          <Image
                            src={candidate.ketua_photo_url}
                            alt={candidate.ketua_name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                            {candidate.ketua_name.charAt(0) || 'K'}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1">
                        Calon Ketua
                      </span>
                      <p className="text-xs font-bold text-slate-900 leading-tight line-clamp-1" title={candidate.ketua_name}>
                        {candidate.ketua_name}
                      </p>
                      <span className="text-[11px] text-slate-500 font-mono mt-0.5">{candidate.ketua_class}</span>
                    </div>

                    {/* Wakil */}
                    <div className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-xs relative mb-2">
                        {candidate.wakil_photo_url ? (
                          <Image
                            src={candidate.wakil_photo_url}
                            alt={candidate.wakil_name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                            {candidate.wakil_name.charAt(0) || 'W'}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-1">
                        Calon Wakil
                      </span>
                      <p className="text-xs font-bold text-slate-900 leading-tight line-clamp-1" title={candidate.wakil_name}>
                        {candidate.wakil_name}
                      </p>
                      <span className="text-[11px] text-slate-500 font-mono mt-0.5">{candidate.wakil_class}</span>
                    </div>
                  </div>

                  {/* Visi preview */}
                  <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1">
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      <span>Visi Utama</span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed italic">
                      &ldquo;{candidate.visi}&rdquo;
                    </p>
                  </div>

                  {/* Expandable Misi & Program Kerja */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Misi</span>
                        </div>
                        <p className="text-slate-600 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed font-sans">
                          {candidate.misi}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-purple-800 mb-1">
                          <ListOrdered className="w-3.5 h-3.5 text-purple-600" />
                          <span>Program Kerja Unggulan</span>
                        </div>
                        <p className="text-slate-600 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed font-sans">
                          {candidate.program_kerja}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Toggle Accordion */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs font-medium text-slate-500">
                  <button
                    type="button"
                    onClick={() => toggleExpand(candidate.id)}
                    className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <span>{isExpanded ? 'Tutup Misi & Proker' : 'Lihat Misi & Proker'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(candidate)}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Edit Data
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Tambah / Edit Paslon */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {editingCandidateId ? 'Edit Data Paslon' : 'Tambah Pasangan Calon Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Lengkapi formulir pendaftaran pasangan calon Ketua & Wakil OSIS dengan teliti.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Step 1: Nomor Urut & Informasi Calon */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                1. Data Pokok Pasangan Calon
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Urut <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.candidate_number}
                    onChange={(e) => setFormData({ ...formData, candidate_number: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-400 block pt-7">
                    Nomor urut menentukan urutan paslon pada surat suara digital.
                  </span>
                </div>
              </div>

              {/* Data Ketua & Wakil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ketua */}
                <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-3">
                  <span className="text-xs font-bold text-blue-900 block">Calon Ketua OSIS</span>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.ketua_name}
                      onChange={(e) => setFormData({ ...formData, ketua_name: e.target.value })}
                      placeholder="Contoh: Muhammad Rayhan"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Kelas</label>
                    <input
                      type="text"
                      required
                      value={formData.ketua_class}
                      onChange={(e) => setFormData({ ...formData, ketua_class: e.target.value })}
                      placeholder="Contoh: XI MIPA 1"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Wakil */}
                <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                  <span className="text-xs font-bold text-indigo-900 block">Calon Wakil Ketua OSIS</span>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.wakil_name}
                      onChange={(e) => setFormData({ ...formData, wakil_name: e.target.value })}
                      placeholder="Contoh: Annisa Putri"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Kelas</label>
                    <input
                      type="text"
                      required
                      value={formData.wakil_class}
                      onChange={(e) => setFormData({ ...formData, wakil_class: e.target.value })}
                      placeholder="Contoh: X AKL 2"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Upload Foto Paslon */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                2. Foto Resmi Paslon (Maksimal 5MB, format PNG/JPG)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Foto Ketua */}
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center space-y-3 bg-slate-50/40">
                  <span className="text-xs font-bold text-slate-700">Foto Calon Ketua</span>
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 border-2 border-slate-300 relative">
                    {ketuaPreview ? (
                      <Image src={ketuaPreview} alt="Preview Ketua" fill sizes="96px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors">
                    <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pilih Foto Ketua</span>
                    <input type="file" accept="image/*" onChange={handleKetuaPhotoChange} className="hidden" />
                  </label>
                </div>

                {/* Foto Wakil */}
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center space-y-3 bg-slate-50/40">
                  <span className="text-xs font-bold text-slate-700">Foto Calon Wakil</span>
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 border-2 border-slate-300 relative">
                    {wakilPreview ? (
                      <Image src={wakilPreview} alt="Preview Wakil" fill sizes="96px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors">
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pilih Foto Wakil</span>
                    <input type="file" accept="image/*" onChange={handleWakilPhotoChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Step 3: Visi, Misi & Proker */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                3. Visi, Misi & Program Kerja Unggulan
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Visi Pasangan Calon <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.visi}
                  onChange={(e) => setFormData({ ...formData, visi: e.target.value })}
                  placeholder="Tuliskan visi besar pasangan calon untuk OSIS..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Misi <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Gunakan baris baru (Enter) per butir misi</span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={formData.misi}
                  onChange={(e) => setFormData({ ...formData, misi: e.target.value })}
                  placeholder="1. Meningkatkan partisipasi aktif siswa&#10;2. Menumbuhkan transparansi aspirasi&#10;3. Kolaborasi lintas ekstrakurikuler"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Program Kerja Unggulan <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Gunakan baris baru (Enter) per program</span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={formData.program_kerja}
                  onChange={(e) => setFormData({ ...formData, program_kerja: e.target.value })}
                  placeholder="• Pekan Seni & Olahraga Digital&#10;• Kotak Aspirasi Online Terbuka&#10;• Bank Daur Ulang Siswa"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Paslon...</span>
                  </>
                ) : (
                  <span>{editingCandidateId ? 'Simpan Perubahan' : 'Daftarkan Paslon'}</span>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Detail Lengkap Paslon */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 sm:p-8">
          {selectedCandidate && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                    #{selectedCandidate.candidate_number}
                  </span>
                  <DialogTitle className="text-xl font-bold text-slate-900">
                    Pasangan Calon Nomor Urut {selectedCandidate.candidate_number}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Profil resmi dan rancangan program kepengurusan OSIS.
                </DialogDescription>
              </DialogHeader>

              {/* Photos & Bios */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-200 relative mb-3 border-2 border-white shadow-xs">
                    {selectedCandidate.ketua_photo_url ? (
                      <Image
                        src={selectedCandidate.ketua_photo_url}
                        alt={selectedCandidate.ketua_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                        {selectedCandidate.ketua_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1">
                    Calon Ketua
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{selectedCandidate.ketua_name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedCandidate.ketua_class}</p>
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-200 relative mb-3 border-2 border-white shadow-xs">
                    {selectedCandidate.wakil_photo_url ? (
                      <Image
                        src={selectedCandidate.wakil_photo_url}
                        alt={selectedCandidate.wakil_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                        {selectedCandidate.wakil_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-1">
                    Calon Wakil
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{selectedCandidate.wakil_name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedCandidate.wakil_class}</p>
                </div>
              </div>

              {/* Visi */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>Visi Kepemimpinan</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed whitespace-pre-line">
                  &ldquo;{selectedCandidate.visi}&rdquo;
                </p>
              </div>

              {/* Misi */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Misi Strategis</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {selectedCandidate.misi}
                </p>
              </div>

              {/* Program Kerja */}
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                  <ListOrdered className="w-4 h-4 text-purple-600" />
                  <span>Program Kerja Unggulan</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {selectedCandidate.program_kerja}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, id: '', name: '' })}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Paslon"
        message={`Apakah Anda yakin ingin menghapus data ${confirmDialog.name}? Semua data suara pemilih dan foto kandidat terkait akan dihapus secara permanen.`}
        type="single"
        count={1}
      />
    </div>
  )
}
