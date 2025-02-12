export interface Candidate {
  id: string
  candidate_number: number
  ketua_name: string
  wakil_name: string
  visi: string
  misi: string
  photo_url?: string
}

export interface Voter {
  id: string
  nis: string
  full_name: string
  class: string
  has_voted: boolean
}

export interface Vote {
  id: string
  voter_id: string
  candidate_id: string
  created_at: string
}
