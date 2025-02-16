'use client'

import StructuredData from "../components/StructuredData"


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <head>
        <StructuredData />
      </head>
      <div className="min-h-screen bg-gray-100">
        <div className="pt-16"> {/* Add padding top to account for fixed navbar */}
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </html>
  )
} 