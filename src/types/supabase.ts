export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string
          candidate_number: number
          ketua_name: string
          wakil_name: string
          visi: string
          misi: string
          photo_url?: string
          created_at: string
        }
      }
      voters: {
        Row: {
          id: string
          nis: string
          full_name: string
          class: string
          has_voted: boolean
          created_at: string
        }
      }
      votes: {
        Row: {
          id: string
          voter_id: string
          candidate_id: string
          created_at: string
        }
      }
      voting_schedule: {
        Row: {
          id: string
          start_time: string
          end_time: string
          is_active: boolean
          created_at: string
        }
      }
    }
  }
} 