'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  Vote, 
  Sparkles, 
  Target, 
  CheckCircle2, 
  ArrowRight,
  BookOpen
} from 'lucide-react'

export interface Candidate {
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

interface CandidateDetailModalProps {
  candidate: Candidate | null
  isOpen: boolean
  onClose: () => void
}

export default function CandidateDetailModal({
  candidate,
  isOpen,
  onClose
}: CandidateDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'visi' | 'misi' | 'program_kerja'>('visi')

  // Reset to 'visi' whenever a new candidate is opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab('visi')
    }
  }, [isOpen, candidate?.id])

  // Handle Escape key to close modal & lock background scroll
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!candidate) return null

  // Parse lines for list rendering
  const parseLines = (text: string) => {
    if (!text || !text.trim()) return []
    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line.replace(/^(\d+[\.\)]\s*|[-•*]\s*)/, '').trim())
      .filter(Boolean)
  }

  const misiList = parseLines(candidate.misi)
  const prokerList = parseLines(candidate.program_kerja)

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="candidate-modal-title"
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            {/* Header with Candidate Duo & Badge */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 relative shrink-0">
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup jendela detail paslon"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-mono font-extrabold text-xs tracking-wider uppercase shadow-xs">
                  PASLON {String(candidate.candidate_number).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Profil Resmi Pemilihan OSIS
                </span>
              </div>

              {/* Duo Portrait Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Ketua */}
                <div className="flex items-center gap-3 bg-slate-800/80 rounded-2xl p-2.5 border border-slate-700/60">
                  <div className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                    {candidate.ketua_photo_url ? (
                      <Image
                        src={candidate.ketua_photo_url}
                        alt={candidate.ketua_name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">
                      Calon Ketua
                    </span>
                    <h3 
                      id="candidate-modal-title"
                      className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-1"
                    >
                      {candidate.ketua_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kelas: <span className="text-slate-300 font-medium">{candidate.ketua_class}</span>
                    </p>
                  </div>
                </div>

                {/* Wakil Ketua */}
                <div className="flex items-center gap-3 bg-slate-800/80 rounded-2xl p-2.5 border border-slate-700/60">
                  <div className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                    {candidate.wakil_photo_url ? (
                      <Image
                        src={candidate.wakil_photo_url}
                        alt={candidate.wakil_name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                      Calon Wakil
                    </span>
                    <h4 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-1">
                      {candidate.wakil_name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Kelas: <span className="text-slate-300 font-medium">{candidate.wakil_class}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs sm:text-sm font-semibold text-slate-600 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('visi')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
                    activeTab === 'visi'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span>Visi Kepemimpinan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('misi')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
                    activeTab === 'misi'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Misi ({misiList.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('program_kerja')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
                    activeTab === 'program_kerja'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Program Kerja ({prokerList.length || 0})</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Tab: Visi */}
              {activeTab === 'visi' && (
                <div className="space-y-4">
                  <div className="bg-blue-50/60 rounded-2xl p-5 border border-blue-100">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-2">
                      Visi Utama Paslon {candidate.candidate_number}
                    </span>
                    <p className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed italic">
                      &ldquo;{candidate.visi || 'Visi belum diisi oleh pasangan calon.'}&rdquo;
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Visi ini menjadi landasan arah program kerja OSIS selama satu tahun masa bakti ke depan.
                    </span>
                  </div>
                </div>
              )}

              {/* Tab: Misi */}
              {activeTab === 'misi' && (
                <div className="space-y-3">
                  {misiList.length === 0 ? (
                    <p className="text-slate-400 italic text-sm text-center py-6">
                      Informasi misi belum diisi oleh pasangan calon.
                    </p>
                  ) : (
                    misiList.map((misi, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed pt-0.5">
                          {misi}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Program Kerja */}
              {activeTab === 'program_kerja' && (
                <div className="space-y-3">
                  {prokerList.length === 0 ? (
                    <p className="text-slate-400 italic text-sm text-center py-6">
                      Informasi program kerja belum diisi oleh pasangan calon.
                    </p>
                  ) : (
                    prokerList.map((proker, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 hover:bg-white hover:shadow-xs transition-all flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                            Program Unggulan #{idx + 1}
                          </span>
                          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                            {proker}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
              >
                Tutup Detail
              </button>

              <Link
                href="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs hover:shadow-sm transition-all"
              >
                <Vote className="w-4 h-4" />
                <span>Masuk NIS & Pilih Paslon {candidate.candidate_number}</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
