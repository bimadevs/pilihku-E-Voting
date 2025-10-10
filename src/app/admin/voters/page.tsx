'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabaseClient } from '@/lib/auth'
import { toast } from 'react-hot-toast'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Spinner } from '@/app/admin/voters/components/spinner'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { ConfirmationDialog } from './components/ConfirmationDialog'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'voted' | 'not_voted'>('all')
  const [filterClass, setFilterClass] = useState('')
  const [sortBy, setSortBy] = useState<'nis' | 'name' | 'class'>('name')
  const [selectedVoters, setSelectedVoters] = useState<string[]>([])
  
  const ITEMS_PER_PAGE = 20

  // 2. Tambahkan state untuk dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'single' as 'single' | 'multiple' | 'all',
    id: '',
    count: 0
  })

  useEffect(() => {
    fetchVoters()
  }, [])

  // Tambahkan event listener untuk keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Delete' && selectedVoters.length > 0 && !loading) {
        handleDeleteSelected()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedVoters, loading])

  // Fungsi untuk memvalidasi data Excel
  function validateExcelData(data: ExcelVoter): string | null {
    if (!data.nis) return 'NIS tidak boleh kosong'
    if (!data.full_name) return 'Nama lengkap tidak boleh kosong'
    if (!data.class) return 'Kelas tidak boleh kosong'
    return null
  }

  // Fungsi untuk menghandle import Excel
  async function handleExcelImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    let successCount = 0
    let duplicateCount = 0
    let errorCount = 0

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Ambil worksheet pertama
      const worksheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[worksheetName]
      
      // Convert ke JSON dengan header
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      // Skip header row dan process data
      const dataRows = jsonData.slice(1) as string[][]
      
      for (const row of dataRows) {
        // Skip empty rows
        if (!row || row.length === 0 || !row[0]) continue
        
        // Map Excel columns to our data structure
        // Template: ['NIS', 'Nama Lengkap', 'Kelas']
        const rowData: ExcelVoter = {
          nis: String(row[0] || '').trim(),
          full_name: String(row[1] || '').trim(),
          class: String(row[2] || '').trim()
        }

        const validationError = validateExcelData(rowData)
        if (validationError) {
          console.error(`Baris dengan NIS ${rowData.nis}: ${validationError}`)
          errorCount++
          continue
        }

        try {
          // Cek duplikat NIS
          const { data: existingVoter } = await supabaseClient
            .from('voters')
            .select('id')
            .eq('nis', rowData.nis)
            .single()

          if (existingVoter) {
            console.log(`NIS ${rowData.nis} sudah terdaftar`)
            duplicateCount++
            continue
          }

          const { error } = await supabaseClient
            .from('voters')
            .insert([{
              nis: rowData.nis,
              full_name: rowData.full_name,
              class: rowData.class,
              has_voted: false
            }])

          if (error) throw error
          successCount++
        } catch (error) {
          console.error(`Error importing row ${rowData.nis}:`, error)
          errorCount++
        }
      }

      // Tampilkan notifikasi hasil import
      showNotification(
        `Import selesai: ${successCount} berhasil, ${duplicateCount} duplikat, ${errorCount} gagal`,
        successCount > 0 ? 'success' : 'error'
      )
      
      await fetchVoters()
    } catch (error) {
      console.error('Error importing Excel:', error)
      showNotification('File Excel tidak valid atau terjadi kesalahan', 'error')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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

      await toast.promise(
        Promise.resolve(), // Gunakan Promise.resolve() karena operasi sudah selesai
        {
          loading: 'Menambahkan pemilih...',
          success: 'Pemilih berhasil ditambahkan',
          error: 'Gagal menambahkan pemilih'
        }
      )

      await fetchVoters()
      setFormData({ nis: '', full_name: '', class: '' })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal menambahkan pemilih')
    } finally {
      setLoading(false)
    }
  }

  // 3. Modifikasi fungsi handleDelete
  async function handleDelete(id: string) {
    setConfirmDialog({
      isOpen: true,
      type: 'single',
      id,
      count: 1
    })
  }

  // 4. Modifikasi fungsi handleDeleteSelected
  async function handleDeleteSelected() {
    if (!selectedVoters.length) return
    
    setConfirmDialog({
      isOpen: true,
      type: 'multiple',
      id: '',
      count: selectedVoters.length
    })
  }

  // 5. Modifikasi fungsi handleDeleteAll
  async function handleDeleteAll() {
    setConfirmDialog({
      isOpen: true,
      type: 'all',
      id: '',
      count: voters.length
    })
  }

  // 6. Tambahkan fungsi handleConfirmDelete
  async function handleConfirmDelete() {
    setLoading(true)
    
    try {
      if (confirmDialog.type === 'single') {
        // Hapus votes terkait
        await supabaseClient
          .from('votes')
          .delete()
          .eq('voter_id', confirmDialog.id)

        // Hapus voter
        const { error } = await supabaseClient
          .from('voters')
          .delete()
          .eq('id', confirmDialog.id)

        if (error) throw error
      } else if (confirmDialog.type === 'multiple') {
        // Hapus votes terkait
        await supabaseClient
          .from('votes')
          .delete()
          .in('voter_id', selectedVoters)

        // Hapus voters
        const { error } = await supabaseClient
          .from('voters')
          .delete()
          .in('id', selectedVoters)

        if (error) throw error
        setSelectedVoters([])
      } else if (confirmDialog.type === 'all') {
        const { data: allVoters } = await supabaseClient
          .from('voters')
          .select('id')

        if (allVoters) {
          const voterIds = allVoters.map(voter => voter.id)
          
          // Hapus votes terkait
          await supabaseClient
            .from('votes')
            .delete()
            .in('voter_id', voterIds)

          // Hapus semua voters
          const { error } = await supabaseClient
            .from('voters')
            .delete()
            .in('id', voterIds)

          if (error) throw error
        }
      }

      showNotification(
        `${confirmDialog.type === 'all' 
          ? 'Semua data' 
          : confirmDialog.type === 'multiple'
          ? `${confirmDialog.count} data`
          : 'Data'} pemilih berhasil dihapus`, 
        'success'
      )
      await fetchVoters()
    } catch (error) {
      showNotification('Gagal menghapus data pemilih', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk men-download template Excel
  function handleDownloadTemplate() {
    try {
      // Data template dengan header dan contoh data
      const templateData = [
        ['NIS', 'Nama Lengkap', 'Kelas'], // Header
        ['123456', 'Bima Jovanta', 'XII TJKT'],
        ['123444', 'Erik Wong', 'XII TJKT'],
        ['123333', 'Felisitas Alverina', 'XI AKL 2'],
        ['122222', 'Gina Putri', 'XII AKL 1'],
        ['123453', 'Hendra Prasetyo', 'X AKL 1']
      ];

      // Buat workbook dan worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      // Set lebar kolom agar lebih rapi
      worksheet['!cols'] = [
        { width: 15 }, // NIS
        { width: 25 }, // Nama Lengkap
        { width: 15 }  // Kelas
      ];

      // Style header (bold)
      const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:C1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E3F2FD" } }
        };
      }

      // Tambahkan worksheet ke workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Pemilih');

      // Download file Excel
      XLSX.writeFile(workbook, 'template_pemilih.xlsx');

      showNotification('Template Excel berhasil diunduh', 'success')
    } catch (error) {
      console.error('Error downloading template:', error);
      showNotification('Gagal mengunduh template', 'error')
    }
  }

  // Filter dan sort data
  const filteredVoters = useMemo(() => {
    return voters.filter(voter => {
      const matchesSearch = 
        voter.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.class.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'voted' ? voter.has_voted :
        !voter.has_voted

      const matchesClass = 
        filterClass ? voter.class === filterClass : true

      return matchesSearch && matchesStatus && matchesClass
    }).sort((a, b) => {
      switch (sortBy) {
        case 'nis':
          return a.nis.localeCompare(b.nis)
        case 'name':
          return a.full_name.localeCompare(b.full_name)
        case 'class':
          return a.class.localeCompare(b.class)
        default:
          return 0
      }
    })
  }, [voters, searchQuery, filterStatus, filterClass, sortBy])

  // Get unique classes for filter dropdown
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(voters.map(voter => voter.class))).sort()
  }, [voters])

  // Pagination
  const totalPages = Math.ceil(filteredVoters.length / ITEMS_PER_PAGE)
  const paginatedVoters = filteredVoters.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterClass])

  // Fungsi untuk menangani select/deselect semua
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVoters(paginatedVoters.map(voter => voter.id))
    } else {
      setSelectedVoters([])
    }
  }

  // Fungsi untuk menangani select/deselect individual
  const handleSelectVoter = (voterId: string, checked: boolean) => {
    if (checked) {
      setSelectedVoters(prev => [...prev, voterId])
    } else {
      setSelectedVoters(prev => prev.filter(id => id !== voterId))
    }
  }

  //  fungsi handle select untuk  row click
  const handleRowClick = (voterId: string) => {
    if (selectedVoters.includes(voterId)) {
      setSelectedVoters(prev => prev.filter(id => id !== voterId))
    } else {
      setSelectedVoters(prev => [...prev, voterId])
    }
  }

  // Fungsi untuk generate nomor halaman dengan ellipsis
  const generatePageNumbers = (current: number, total: number, delta: number = 2) => {
    const pages: (number | string)[] = []
    const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i)

    if (total <= 7) {
      return range(1, total)
    }

    pages.push(1)

    const start = Math.max(2, current - delta)
    const end = Math.min(total - 1, current + delta)

    if (start > 2) {
      pages.push('...')
    }

    pages.push(...range(start, end))

    if (end < total - 1) {
      pages.push('...')
    }

    if (total > 1) {
      pages.push(total)
    }

    return pages
  }
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Kelola Pemilih
          </h1>
        </div>

        {/* Form Import CSV dengan Loading yang Lebih Jelas */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 transform hover:scale-[1.01] transition-all duration-200">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Import Data Pemilih</h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
              <button
                onClick={handleDownloadTemplate}
                className="bg-green-500 text-white py-2 px-4 rounded-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={isImporting}
              >
                Download Template Excel
              </button>
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls"
                  onChange={handleExcelImport}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer
                    disabled:opacity-50"
                  disabled={isImporting}
                />
              </div>
            </div>
            
            {/* Loading Indicator yang Lebih Jelas */}
            {isImporting && (
              <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-xl">
                <Spinner className="w-5 h-5 text-blue-600" />
                <span className="text-blue-600 font-medium">
                  Sedang mengimpor data pemilih...
                </span>
              </div>
            )}
          </div>
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

        {/* Filter dan Search dengan Counter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <input
                type="text"
                placeholder="Cari NIS, nama, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'voted' | 'not_voted')}
              className="px-4 py-2 rounded-xl border border-gray-200"
            >
              <option value="all">Semua Status</option>
              <option value="voted">Sudah Memilih</option>
              <option value="not_voted">Belum Memilih</option>
            </select>

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200"
            >
              <option value="">Semua Kelas</option>
              {uniqueClasses.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'nis' | 'name' | 'class')}
              className="px-4 py-2 rounded-xl border border-gray-200"
            >
              <option value="name">Urutkan: Nama</option>
              <option value="nis">Urutkan: NIS</option>
              <option value="class">Urutkan: Kelas</option>
            </select>

            {/* Counter Hasil Filter */}
            <div className="px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-center justify-center">
              <span>
                {filterStatus === 'all' ? 'Total' : 
                 filterStatus === 'voted' ? 'Sudah Memilih' : 
                 'Belum Memilih'}: {filteredVoters.length} pemilih
                {filterClass && ` di kelas ${filterClass}`}
                {searchQuery && ` (hasil pencarian)`}
              </span>
            </div>
          </div>
        </div>

        {/* Tombol Delete All dan Delete Selected */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <button
              onClick={handleDeleteAll}
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200"
              disabled={loading || voters.length === 0}
            >
              Hapus Semua Data
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200"
              disabled={loading || selectedVoters.length === 0}
            >
              Hapus {selectedVoters.length} Data Terpilih
            </button>
          </div>
        </div>

        {/* Daftar Pemilih */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {paginatedVoters.length > 0 && (
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        checked={paginatedVoters.length > 0 && selectedVoters.length === paginatedVoters.length}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                  </th>
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
                  {/* <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedVoters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Tidak ada data pemilih
                    </td>
                  </tr>
                ) : (
                  paginatedVoters.map((voter) => (
                    <tr 
                      key={voter.id} 
                      onClick={() => handleRowClick(voter.id)}
                      className={`
                        hover:bg-gray-50 transition-colors cursor-pointer
                        ${selectedVoters.includes(voter.id) ? 'bg-blue-50' : ''}
                      `}
                    >
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
                      >
                        <input
                          type="checkbox"
                          checked={selectedVoters.includes(voter.id)}
                          onChange={(e) => handleSelectVoter(voter.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
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
                      {/* <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking delete
                      >
                        <button
                          onClick={() => handleDelete(voter.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          Hapus
                        </button>
                      </td> */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - hanya tampil jika ada data dan lebih dari 1 halaman */}
          {filteredVoters.length > ITEMS_PER_PAGE && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredVoters.length)} dari {filteredVoters.length} data
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {generatePageNumbers(currentPage, totalPages).map((page, index) => (
                      typeof page === 'string' ? (
                        <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-500">...</span>
                      ) : (
                        <button
                          key={`page-${page}`}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-xl ${
                            currentPage === page
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tambahkan informasi shortcut */}
        <div className="mt-4 text-sm text-gray-600">
          <p>Shortcut: Tekan tombol "Delete" untuk menghapus data yang dipilih</p>
        </div>

        {/* 7. Tambahkan ConfirmationDialog di akhir sebelum penutup div terakhir */}
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleConfirmDelete}
          title={
            confirmDialog.type === 'all' 
              ? 'Hapus Semua Data'
              : confirmDialog.type === 'multiple'
              ? 'Hapus Data Terpilih'
              : 'Hapus Data Pemilih'
          }
          message={
            confirmDialog.type === 'all'
              ? 'Anda yakin ingin menghapus SEMUA data pemilih? Tindakan ini tidak dapat dibatalkan.'
              : confirmDialog.type === 'multiple'
              ? 'Anda yakin ingin menghapus data pemilih yang dipilih?'
              : 'Anda yakin ingin menghapus data pemilih ini?'
          }
          type={confirmDialog.type}
          count={confirmDialog.count}
        />
      </div>
    </div>
  )
}
