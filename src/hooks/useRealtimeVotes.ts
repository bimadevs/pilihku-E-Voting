import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeVotes(initialData: any) {
  const [data, setData] = useState(initialData)

  useEffect(() => {
    const channel = supabase
      .channel('voting-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        },
        (payload) => {
          // Update data ketika ada vote baru
          setData((currentData: any) => {
            const newVote = payload.new
            return {
              ...currentData,
              // Update logika sesuai struktur data Anda
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return data
} 