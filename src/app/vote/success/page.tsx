'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function VoteSuccess() {
  useEffect(() => {
    // Hapus cookie voter setelah berhasil voting
    document.cookie = 'voter=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            Terima Kasih!
          </h1>
          <p className="text-gray-600 mb-6">
            Suara Anda telah berhasil direkam. Terima kasih telah berpartisipasi dalam pemilihan.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  )
} 