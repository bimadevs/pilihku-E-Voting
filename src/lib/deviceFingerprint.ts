import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { supabaseClient } from '@/lib/auth'

let fpPromise: ReturnType<typeof FingerprintJS.load> | null = null

function getFpAgent() {
  if (typeof window === 'undefined') return null
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }
  return fpPromise
}

/**
 * Mendapatkan sidik jari unik perangkat (Device Fingerprint)
 * Menggunakan @fingerprintjs/fingerprintjs dan fallback localStorage
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return ''

  try {
    const agent = getFpAgent()
    if (agent) {
      const fp = await agent
      const result = await fp.get()
      if (result?.visitorId) {
        try {
          localStorage.setItem('pilihku_device_hash', result.visitorId)
        } catch {
          // Abaikan jika storage dinonaktifkan di browser
        }
        return result.visitorId
      }
    }
  } catch (error) {
    console.warn('Gagal memuat fingerprint agent:', error)
  }

  // Fallback ke localStorage jika fingerprint agent gagal
  try {
    const localHash = localStorage.getItem('pilihku_device_hash')
    if (localHash) return localHash

    // Buat fallback identifier acak jika belum ada
    const fallbackId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('pilihku_device_hash', fallbackId)
    return fallbackId
  } catch {
    return 'unknown_device'
  }
}

/**
 * Memeriksa apakah perangkat ini sudah pernah digunakan untuk voting
 */
export async function checkDeviceVoted(customHash?: string): Promise<{
  hasVoted: boolean
  deviceHash: string
  error?: string
}> {
  try {
    const hash = customHash || (await getDeviceFingerprint())
    if (!hash || hash === 'unknown_device') {
      return { hasVoted: false, deviceHash: hash }
    }

    const { data, error } = await supabaseClient
      .from('voted_devices')
      .select('id, voter_id, created_at')
      .eq('device_hash', hash)
      .maybeSingle()

    if (error) {
      console.error('Error saat memeriksa status perangkat:', error)
      return { hasVoted: false, deviceHash: hash, error: error.message }
    }

    return {
      hasVoted: !!data,
      deviceHash: hash
    }
  } catch (err: any) {
    console.error('Pengecekan perangkat gagal:', err)
    return { hasVoted: false, deviceHash: '', error: err?.message || 'Gagal memeriksa perangkat' }
  }
}

/**
 * Mendaftarkan perangkat yang telah digunakan untuk voting
 */
export async function registerDeviceVote(deviceHash: string, voterId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabaseClient
      .from('voted_devices')
      .insert([
        {
          device_hash: deviceHash,
          voter_id: voterId
        }
      ])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mencatat perangkat' }
  }
}

/**
 * Admin: Mereset / menghapus kunci perangkat untuk seorang siswa (voterId)
 */
export async function resetDeviceLockByVoterId(voterId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabaseClient
      .from('voted_devices')
      .delete()
      .eq('voter_id', voterId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mereset kunci perangkat' }
  }
}
