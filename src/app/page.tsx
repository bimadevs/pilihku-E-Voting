import Link from 'next/link'
import { FaVoteYea, FaUserShield } from 'react-icons/fa'
import { BsGraphUp } from 'react-icons/bs'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Pilihanku
          </h1>
          <p className="mt-4 max-w-md mx-auto text-xl text-gray-600 sm:text-2xl md:mt-6 md:text-2xl md:max-w-3xl">
            Sistem Pemilihan Ketua & Wakil Ketua OSIS Online
          </p>
          
          <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-10">
            <div className="rounded-md shadow">
              <Link
                href="/auth/login"
                className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300 md:text-xl md:px-12"
              >
                <FaVoteYea className="mr-2" />
                Mulai Voting
              </Link>
            </div>
            <div className="mt-4 rounded-md shadow sm:mt-0 sm:ml-4">
              <Link
                href="/admin/login"
                className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-colors duration-300 md:text-xl md:px-12"
              >
                <FaUserShield className="mr-2" />
                Login Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Fitur Unggulan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <FaVoteYea className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Voting Mudah</h3>
              <p className="text-gray-600">Proses pemilihan yang simpel dan aman untuk semua siswa</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <BsGraphUp className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Results</h3>
              <p className="text-gray-600">Pantau hasil pemilihan secara langsung dan transparan</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <FaUserShield className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Keamanan Terjamin</h3>
              <p className="text-gray-600">Sistem voting yang aman dan terenkripsi</p>
            </div>
          </div>
        </div>

        <div className="mt-24 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Pilihanku. All rights reserved.</p>
          <p>Developed by <a href="https://github.com/bimadevs" target='_blank' className="text-blue-500 hover:text-blue-600">bimadevs</a></p>
        </div>
      </div>
    </div>
  )
}
