export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
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
      settings: {
        Row: {
          id: string
          announcement_time: string | null
          winner_id: string | null
          created_at: string | null
          updated_at: string | null
        }
      }
    }
  }
}
