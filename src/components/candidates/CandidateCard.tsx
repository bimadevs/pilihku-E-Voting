'use client'

import Image from 'next/image'
import { Candidate } from '@/types'

interface CandidateCardProps {
  candidate: Candidate
  onVote: (candidateId: string) => void
  isSelected: boolean
}

export function CandidateCard({ candidate, onVote, isSelected }: CandidateCardProps) {
  return (
    <div 
      className={`p-4 border rounded-lg ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <div className="aspect-square relative mb-4 rounded-lg overflow-hidden">
        <Image
          src={candidate.photo_url || '/placeholder.png'}
          alt={`Foto ${candidate.ketua_name} & ${candidate.wakil_name}`}
          fill
          className="object-cover"
        />
      </div>
      
      <div className="text-center mb-4">
        <div className="text-2xl font-bold mb-2">Paslon {candidate.candidate_number}</div>
        <h3 className="font-semibold">{candidate.ketua_name}</h3>
        <h4 className="text-gray-600">{candidate.wakil_name}</h4>
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <h5 className="font-semibold">Visi:</h5>
          <p className="text-sm text-gray-600">{candidate.visi}</p>
        </div>
        <div>
          <h5 className="font-semibold">Misi:</h5>
          <p className="text-sm text-gray-600">{candidate.misi}</p>
        </div>
      </div>

      <button
        onClick={() => onVote(candidate.id)}
        className={`w-full py-2 px-4 rounded-md ${
          isSelected 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        {isSelected ? 'Dipilih' : 'Pilih'}
      </button>
    </div>
  )
} 