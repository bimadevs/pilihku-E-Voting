'use client'

import { Candidate } from '@/types'

interface ConfirmVoteModalProps {
  isOpen: boolean
  candidate: Candidate | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmVoteModal({ isOpen, candidate, onConfirm, onCancel }: ConfirmVoteModalProps) {
  if (!isOpen || !candidate) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Konfirmasi Pilihan</h2>
        <p className="text-gray-600 mb-4">
          Anda akan memilih:
        </p>
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <p className="font-semibold">Paslon {candidate.candidate_number}</p>
          <p>Ketua: {candidate.ketua_name}</p>
          <p>Wakil: {candidate.wakil_name}</p>
        </div>
        <p className="text-red-600 text-sm mb-6">
          Perhatian: Pilihan tidak dapat diubah setelah dikonfirmasi
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  )
} 