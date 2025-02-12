import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <h1 className="text-[150px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 leading-none">
            404
          </h1>
          <div className="absolute -bottom-4 w-full">
            <div className="h-2 w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-25"></div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-600 mb-8">
          Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
        </p>

        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
          text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 
          shadow-lg hover:shadow-xl"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
} 