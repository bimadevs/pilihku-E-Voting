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

export interface VotingStats {
  totalVoters: number
  totalVotes: number
  participationRate: number
  candidateResults: {
    candidate: Candidate
    voteCount: number
    percentage: number
  }[]
}

export interface StepItem {
  step: string
  title: string
  desc: string
  icon: React.ReactNode
  color: string
}

export interface Settings {
  announcement_time: string | null
  winner_id: string | null
}

export type TabType = 'visi' | 'misi'
