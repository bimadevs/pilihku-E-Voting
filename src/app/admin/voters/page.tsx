'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { supabaseClient } from '@/lib/auth'
import { resetDeviceLockByVoterId } from '@/lib/deviceFingerprint'
import { showAdminToast } from '@/app/admin/components/AdminToast'
import { ConfirmationDialog } from './components/ConfirmationDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import * as XLSX from 'xlsx'
import { 
  Users, 
  UserCheck, 
  Clock, 
  Search, 
  Plus, 
  UploadCloud, 
  Download, 
  Trash2, 
  Unlock, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  FileSpreadsheet, 
  Edit3, 
  Check, 
  Loader2,
  ShieldCheck,
  RotateCcw
} from 'lucide-react'

interface Voter {
  id: string
  nis: string
  full_name: string
  class: string
  has_voted: boolean
}

interface ExcelVoter {
  nis: string
  full_name: string
  class: string
}

export default function VotersPage() {
  const [voters, setVoters] = useState<Voter[]>([])
  const [lockedVoterIds, setLockedVoterIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'voted' | 'not_voted'>('all')
  const [filterClass, setFilterClass] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'nis' | 'class'>('name')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Selection
  const [selectedVoters, setSelectedVoters] = useState<string[]>([])

  // Modal: Tambah Pemilih
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addForm, setAddForm] = useState({ nis: '', full_name: '', class: '' })
  const [isAdding, setIsAdding] = useState(false)

  // Modal: Edit Pemilih
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null)
  const [editForm, setEditForm] = useState({ nis: '', full_name: '', class: '' })
  const [isEditing, setIsEditing] = useState(false)

  // Modal: Import Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importStats, setImportStats] = useState<{ totalRows: number } | null>(null)

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'single' | 'multiple' | 'all'
    id: string
    count: number
    title: string
    message: string
  }>({
    isOpen: false,
    type: 'single',
    id: '',
    count: 0,
    title: '',
    message: '',
  })

  // Reset Device Dialog
  const [resetDeviceDialog, setResetDeviceDialog] = useState<{
    isOpen: boolean
    voter: Voter | null
  }>({
    isOpen: false,
    voter: null,
  })

  useEffect(() => {
    fetchVoters()
  }, [])

  // Keyboard shortcut delete
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Delete' && selectedVoters.length > 0 && !loading) {
        openBulkDeleteConfirm()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedVoters, loading])

  async function fetchVoters() {
    try {
      setLoading(true)
      const { data, error } = await supabaseClient
        .from('voters')
        .select('*')
        .order('full_name')

      if (error) throw error
      setVoters(data || [])

      // Fetch locked devices
      const { data: devicesData, error: devicesError } = await supabaseClient
        .from('voted_devices')
        .select('voter_id')

      if (!devicesError && devicesData) {
        setLockedVoterIds(new Set(devicesData.map((d: { voter_id: string }) => d.voter_id)))
      }
    } catch (error: any) {
      console.error('Error fetching voters:', error)
      showAdminToast('Gagal memuat DPT', 'error', error?.message)
    } finally {
      setLoading(false)
    }
  }

  // 1. Tambah Pemilih Tunggal
  async function handleAddVoter(e: React.FormEvent) {
    e.preventDefault()
    setIsAdding(true)

    try {
      const nis = addForm.nis.trim()
      const fullName = addForm.full_name.trim()
      const voterClass = addForm.class.trim()

      if (!nis || !fullName || !voterClass) {
        throw new Error('NIS, Nama Lengkap, dan Kelas wajib diisi')
      }

      // Check existing NIS
      const { data: existing } = await supabaseClient
        .from('voters')
        .select('id')
        .eq('nis', nis)
        .maybeSingle()

      if (existing) {
        throw new Error(`NIS ${nis} sudah terdaftar dalam sistem`)
      }

      const { error } = await supabaseClient.from('voters').insert([
        {
          nis,
          full_name: fullName,
          class: voterClass,
          has_voted: false,
        },
      ])

      if (error) throw error

      showAdminToast('Pemilih Ditambahkan', 'success', `${fullName} (${nis}) berhasil didaftarkan.`)
      setIsAddModalOpen(false)
      setAddForm({ nis: '', full_name: '', class: '' })
      fetchVoters()
    } catch (err: any) {
      showAdminToast('Gagal Menambah Pemilih', 'error', err?.message)
    } finally {
      setIsAdding(false)
    }
  }

  // 2. Edit Pemilih
  function openEditModal(voter: Voter) {
    setEditingVoter(voter)
    setEditForm({ nis: voter.nis, full_name: voter.full_name, class: voter.class })
  }

  async function handleEditVoter(e: React.FormEvent) {
    e.preventDefault()
    if (!editingVoter) return
    setIsEditing(true)

    try {
      const { error } = await supabaseClient
        .from('voters')
        .update({
          nis: editForm.nis.trim(),
          full_name: editForm.full_name.trim(),
          class: editForm.class.trim(),
        })
        .eq('id', editingVoter.id)

      if (error) throw error

      showAdminToast('Data Diperbarui', 'success', `Data pemilih ${editForm.full_name} berhasil diubah.`)
      setEditingVoter(null)
      fetchVoters()
    } catch (err: any) {
      showAdminToast('Gagal Memperbarui', 'error', err?.message)
    } finally {
      setIsEditing(false)
    }
  }

  // 3. Import Excel
  function validateExcelRow(data: ExcelVoter): string | null {
    if (!data.nis) return 'NIS kosong'
    if (!data.full_name) return 'Nama kosong'
    if (!data.class) return 'Kelas kosong'
    return null
  }

  async function processExcelFile(file: File) {
    setIsImporting(true)
    let successCount = 0
    let duplicateCount = 0
    let errorCount = 0

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

      const dataRows = jsonData.slice(1) // Skip header

      // Ambil semua existing NIS sekaligus agar import sangat cepat
      const { data: allExisting } = await supabaseClient.from('voters').select('nis')
      const existingNisSet = new Set((allExisting || []).map((v) => v.nis))

      const rowsToInsert: { nis: string; full_name: string; class: string; has_voted: boolean }[] = []

      for (const row of dataRows) {
        if (!row || row.length === 0 || !row[0]) continue

        const rowData: ExcelVoter = {
          nis: String(row[0] || '').trim(),
          full_name: String(row[1] || '').trim(),
          class: String(row[2] || '').trim(),
        }

        if (validateExcelRow(rowData)) {
          errorCount++
          continue
        }

        if (existingNisSet.has(rowData.nis)) {
          duplicateCount++
          continue
        }

        existingNisSet.add(rowData.nis)
        rowsToInsert.push({
          nis: rowData.nis,
          full_name: rowData.full_name,
          class: rowData.class,
          has_voted: false,
        })
      }

      if (rowsToInsert.length > 0) {
        // Chunk insert 200 per batch
        const chunkSize = 200
        for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
          const chunk = rowsToInsert.slice(i, i + chunkSize)
          const { error: insertErr } = await supabaseClient.from('voters').insert(chunk)
          if (insertErr) {
            console.error('Chunk insert error:', insertErr)
            errorCount += chunk.length
          } else {
            successCount += chunk.length
          }
        }
      }

      showAdminToast(
        'Import Selesai',
        successCount > 0 ? 'success' : 'warning',
        `${successCount} pemilih berhasil diimport, ${duplicateCount} duplikat dilewati, ${errorCount} gagal.`
      )

      setIsImportModalOpen(false)
      setImportFile(null)
      fetchVoters()
    } catch (err: any) {
      console.error('Import error:', err)
      showAdminToast('File Tidak Valid', 'error', 'Format berkas Excel tidak sesuai atau rusak.')
    } finally {
      setIsImporting(false)
    }
  }

  // 4. Download Template
  function handleDownloadTemplate() {
    try {
      const templateData = [
        ['NIS', 'Nama Lengkap', 'Kelas'],
        ['123456', 'Bima Jovanta', 'XII TJKT'],
        ['123444', 'Erik Wong', 'XII TJKT'],
        ['123333', 'Felisitas Alverina', 'XI AKL 2'],
        ['122222', 'Gina Putri', 'XII AKL 1'],
        ['123453', 'Hendra Prasetyo', 'X AKL 1'],
      ]

      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(templateData)
      worksheet['!cols'] = [{ width: 16 }, { width: 30 }, { width: 16 }]

      XLSX.utils.book_append_sheet(workbook, worksheet, 'DPT Siswa')
      XLSX.writeFile(workbook, 'template_dpt_pilihku.xlsx')

      showAdminToast('Template Diunduh', 'success', 'Berkas template_dpt_pilihku.xlsx siap diisi.')
    } catch (err) {
      console.error('Template error:', err)
      showAdminToast('Gagal Mengunduh', 'error', 'Tidak dapat membuat berkas template Excel.')
    }
  }

  // 5. Reset Kunci Perangkat
  async function handleConfirmResetDevice() {
    if (!resetDeviceDialog.voter) return
    try {
      const res = await resetDeviceLockByVoterId(resetDeviceDialog.voter.id)
      if (!res.success) throw new Error(res.error)

      showAdminToast(
        'Kunci Perangkat Direset',
        'success',
        `Siswa ${resetDeviceDialog.voter.full_name} kini dapat login kembali di perangkat baru.`
      )
      setResetDeviceDialog({ isOpen: false, voter: null })
      fetchVoters()
    } catch (err: any) {
      showAdminToast('Gagal Reset Perangkat', 'error', err?.message)
    }
  }

  // 6. Delete confirmations
  function openSingleDelete(voter: Voter) {
    setConfirmDialog({
      isOpen: true,
      type: 'single',
      id: voter.id,
      count: 1,
      title: 'Hapus Data Pemilih',
      message: `Apakah Anda yakin ingin menghapus pemilih ${voter.full_name} (NIS: ${voter.nis})? Suara yang telah diberikan juga akan terhapus.`,
    })
  }

  function openBulkDeleteConfirm() {
    if (selectedVoters.length === 0) return
    setConfirmDialog({
      isOpen: true,
      type: 'multiple',
      id: '',
      count: selectedVoters.length,
      title: 'Hapus Pemilih Terpilih',
      message: `Apakah Anda yakin ingin menghapus ${selectedVoters.length} pemilih yang telah dicentang? Tindakan ini tidak dapat dibatalkan.`,
    })
  }

  function openClearAllConfirm() {
    if (voters.length === 0) return
    setConfirmDialog({
      isOpen: true,
      type: 'all',
      id: '',
      count: voters.length,
      title: 'Kosongkan Seluruh DPT',
      message: 'PERINGATAN: Seluruh data pemilih dan seluruh riwayat suara yang telah masuk akan dihapus bersih dari sistem!',
    })
  }

  async function handleExecuteDelete() {
    try {
      if (confirmDialog.type === 'single') {
        await supabaseClient.from('votes').delete().eq('voter_id', confirmDialog.id)
        const { error } = await supabaseClient.from('voters').delete().eq('id', confirmDialog.id)
        if (error) throw error
        showAdminToast('Pemilih Dihapus', 'success', '1 data pemilih berhasil dihapus.')
      } else if (confirmDialog.type === 'multiple') {
        await supabaseClient.from('votes').delete().in('voter_id', selectedVoters)
        const { error } = await supabaseClient.from('voters').delete().in('id', selectedVoters)
        if (error) throw error
        showAdminToast('Pemilih Dihapus', 'success', `${selectedVoters.length} data pemilih berhasil dihapus.`)
        setSelectedVoters([])
      } else if (confirmDialog.type === 'all') {
        const { data: all } = await supabaseClient.from('voters').select('id')
        if (all && all.length > 0) {
          const ids = all.map((v) => v.id)
          await supabaseClient.from('votes').delete().in('voter_id', ids)
          const { error } = await supabaseClient.from('voters').delete().in('id', ids)
          if (error) throw error
        }
        showAdminToast('DPT Dikosongkan', 'success', 'Seluruh data pemilih telah dibersihkan.')
        setSelectedVoters([])
      }

      fetchVoters()
    } catch (err: any) {
      console.error('Delete error:', err)
      showAdminToast('Gagal Menghapus', 'error', err?.message)
    } finally {
      setConfirmDialog({ isOpen: false, type: 'single', id: '', count: 0, title: '', message: '' })
    }
  }

  // Filter & Search computation
  const filteredVoters = useMemo(() => {
    return voters
      .filter((voter) => {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          voter.nis.toLowerCase().includes(q) ||
          voter.full_name.toLowerCase().includes(q) ||
          voter.class.toLowerCase().includes(q)

        const matchesStatus =
          filterStatus === 'all'
            ? true
            : filterStatus === 'voted'
            ? voter.has_voted
            : !voter.has_voted

        const matchesClass = filterClass ? voter.class === filterClass : true

        return matchesSearch && matchesStatus && matchesClass
      })
      .sort((a, b) => {
        if (sortBy === 'nis') return a.nis.localeCompare(b.nis)
        if (sortBy === 'class') return a.class.localeCompare(b.class)
        return a.full_name.localeCompare(b.full_name)
      })
  }, [voters, searchQuery, filterStatus, filterClass, sortBy])

  // Extract unique classes
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(voters.map((v) => v.class))).sort()
  }, [voters])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredVoters.length / itemsPerPage))
  const paginatedVoters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredVoters.slice(start, start + itemsPerPage)
  }, [filteredVoters, currentPage, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterClass, itemsPerPage])

  // Bulk selection helpers
  const isAllPaginatedSelected =
    paginatedVoters.length > 0 && paginatedVoters.every((v) => selectedVoters.includes(v.id))

  const handleToggleSelectAll = () => {
    if (isAllPaginatedSelected) {
      const pageIds = new Set(paginatedVoters.map((v) => v.id))
      setSelectedVoters((prev) => prev.filter((id) => !pageIds.has(id)))
    } else {
      const newIds = paginatedVoters.map((v) => v.id)
      setSelectedVoters((prev) => Array.from(new Set([...prev, ...newIds])))
    }
  }

  const handleToggleSelectOne = (id: string) => {
    setSelectedVoters((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Summary counts
  const totalVotersCount = voters.length
  const votedCount = voters.filter((v) => v.has_voted).length
  const notVotedCount = totalVotersCount - votedCount
  const lockedCount = lockedVoterIds.size

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Daftar Pemilih Tetap (DPT)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              {totalVotersCount} Siswa
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data pemilih sah, import massal berkas Excel, verifikasi status mencoblos, dan kendali kunci perangkat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh Template</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shadow-xs transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pemilih</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total DPT</span>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {totalVotersCount.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">Sudah Memilih</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-mono mt-1">
            {votedCount.toLocaleString('id-ID')}{' '}
            <span className="text-xs font-bold text-emerald-700">
              ({totalVotersCount > 0 ? ((votedCount / totalVotersCount) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">Belum Memilih</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {notVotedCount.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600">Perangkat Terkunci</span>
            <Smartphone className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {lockedCount.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Unified Action & Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan NIS, Nama Siswa, atau Kelas..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills & Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Semua ({totalVotersCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('voted')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'voted'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sudah ({votedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('not_voted')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'not_voted'
                    ? 'bg-white text-amber-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Belum ({notVotedCount})
              </button>
            </div>

            {/* Kelas dropdown */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 font-medium"
            >
              <option value="">Semua Kelas ({uniqueClasses.length})</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 font-medium"
            >
              <option value="name">Urut: Nama A-Z</option>
              <option value="nis">Urut: NIS</option>
              <option value="class">Urut: Kelas</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Sticky Bar when items are selected */}
        {selectedVoters.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-900">{selectedVoters.length} pemilih terpilih</span>
              <span className="text-slate-400">•</span>
              <button
                type="button"
                onClick={() => setSelectedVoters([])}
                className="text-blue-700 hover:underline font-medium"
              >
                Batalkan pilihan
              </button>
            </div>

            <button
              type="button"
              onClick={openBulkDeleteConfirm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedVoters.length} Pemilih Terpilih</span>
            </button>
          </div>
        )}
      </div>

      {/* High-Performance Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPaginatedSelected}
                    onChange={handleToggleSelectAll}
                    aria-label="Pilih semua pemilih di halaman ini"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3.5 px-4 font-bold">NIS</th>
                <th className="py-3.5 px-4 font-bold">Nama Lengkap Siswa</th>
                <th className="py-3.5 px-4 font-bold">Kelas</th>
                <th className="py-3.5 px-4 font-bold">Status Coblos</th>
                <th className="py-3.5 px-4 font-bold">Keamanan Perangkat</th>
                <th className="py-3.5 px-4 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Memuat data pemilih...</span>
                  </td>
                </tr>
              ) : paginatedVoters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data pemilih yang cocok dengan filter atau kata kunci.
                  </td>
                </tr>
              ) : (
                paginatedVoters.map((voter) => {
                  const isSelected = selectedVoters.includes(voter.id)
                  const isDeviceLocked = lockedVoterIds.has(voter.id)

                  return (
                    <tr
                      key={voter.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(voter.id)}
                          aria-label={`Pilih ${voter.full_name}`}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {voter.nis}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {voter.full_name}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/60 font-mono text-slate-700 font-semibold">
                          {voter.class}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {voter.has_voted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Sudah Memilih</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-medium text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Belum Memilih</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isDeviceLocked ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-medium text-[11px]">
                              <Smartphone className="w-3 h-3 text-blue-500" />
                              <span>Terkunci HP</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setResetDeviceDialog({ isOpen: true, voter })}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Reset Kunci Perangkat (Buka gembok agar bisa login di HP lain)"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(voter)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Data Pemilih"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openSingleDelete(voter)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Pemilih"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan {filteredVoters.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredVoters.length)} dari {filteredVoters.length} pemilih
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="ml-2 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value={15}>15 baris</option>
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-800 font-mono">
              Hal {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Clear entire DPT */}
      {voters.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-rose-900">Area Bahaya / Reset DPT</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Hapus seluruh daftar pemilih sekaligus jika ingin mengganti DPT untuk periode baru.
            </p>
          </div>
          <button
            type="button"
            onClick={openClearAllConfirm}
            className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-xl transition-colors self-start sm:self-auto"
          >
            Kosongkan Seluruh DPT ({voters.length})
          </button>
        </div>
      )}

      {/* Modal: Tambah Pemilih */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Tambah Pemilih Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Daftarkan satu siswa ke dalam Daftar Pemilih Tetap (DPT).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddVoter} className="space-y-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Induk Siswa (NIS) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.nis}
                onChange={(e) => setAddForm({ ...addForm, nis: e.target.value })}
                placeholder="Contoh: 123456"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.full_name}
                onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                placeholder="Contoh: Bima Jovanta"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addForm.class}
                onChange={(e) => setAddForm({ ...addForm, class: e.target.value })}
                placeholder="Contoh: XII TJKT"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Simpan Pemilih</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Pemilih */}
      <Dialog open={!!editingVoter} onOpenChange={(open) => !open && setEditingVoter(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Edit Data Pemilih
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Perbarui rincian identitas siswa dalam database DPT.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditVoter} className="space-y-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NIS</label>
              <input
                type="text"
                required
                value={editForm.nis}
                onChange={(e) => setEditForm({ ...editForm, nis: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
              <input
                type="text"
                required
                value={editForm.class}
                onChange={(e) => setEditForm({ ...editForm, class: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingVoter(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isEditing}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                {isEditing ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Import Excel / CSV */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Import DPT dari Excel / CSV
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Unggah berkas spreadsheet dengan urutan kolom: <strong>NIS</strong>, <strong>Nama Lengkap</strong>, dan <strong>Kelas</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* File dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/60 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-3"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setImportFile(f)
                }}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {importFile ? importFile.name : 'Klik untuk pilih berkas spreadsheet'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mendukung .XLSX, .XLS, atau .CSV (Maksimal 10MB)
                </p>
              </div>
            </div>

            {/* Template hint */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/70 text-xs">
              <span className="text-slate-600">Belum memiliki format template?</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Contoh Excel</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false)
                  setImportFile(null)
                }}
                disabled={isImporting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!importFile || isImporting}
                onClick={() => importFile && processExcelFile(importFile)}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengimpor Data...</span>
                  </>
                ) : (
                  <span>Mulai Import</span>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={handleExecuteDelete}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        count={confirmDialog.count}
      />

      {/* Reset Device Lock Dialog */}
      <ConfirmationDialog
        isOpen={resetDeviceDialog.isOpen}
        onClose={() => setResetDeviceDialog({ isOpen: false, voter: null })}
        onConfirm={handleConfirmResetDevice}
        title="Reset Kunci Perangkat"
        message={`Siswa ${resetDeviceDialog.voter?.full_name} (${resetDeviceDialog.voter?.nis}) saat ini terkunci di HP sebelumnya. Reset kunci ini jika siswa perlu mencoblos lewat perangkat lain atau komputer lab?`}
        type="reset"
        confirmText="Buka Kunci HP"
      />
    </div>
  )
}
