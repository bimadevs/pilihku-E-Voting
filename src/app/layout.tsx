import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pilihku - Suaramu Masa Depan Sekolah Kita",
  description: "Pilihku adalah aplikasi e-voting modern untuk pemilihan ketua dan wakil ketua OSIS di sekolah. Dibangun dengan Next.js 14, Supabase, dan Tailwind CSS.",
  keywords: 'e-voting, OSIS, pemilihan ketua OSIS, voting online sekolah, sistem pemilihan digital',
  openGraph: {
    title: 'PilihKu - Sistem E-Voting OSIS Modern',
    description: 'Sistem e-voting modern untuk pemilihan ketua dan wakil ketua OSIS. Mudah, aman, dan transparan.',
    images: ['/og-image.png'],
    locale: 'id_ID',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://your-domain.com',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
