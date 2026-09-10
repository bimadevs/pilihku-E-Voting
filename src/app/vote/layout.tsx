import type { Metadata } from "next"
import StructuredData from "../components/StructuredData"

export const metadata: Metadata = {
  title: "Bilik Suara - PilihKu E-Voting OSIS",
  description: "Bilik suara digital pemilihan Ketua dan Wakil Ketua OSIS. Berikan hak suaramu dengan aman, transparan, dan rahasia.",
}

export default function VoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData />
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </div>
    </>
  )
} 