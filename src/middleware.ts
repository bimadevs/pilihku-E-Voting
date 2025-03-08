import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Cek session untuk admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const pathname = req.nextUrl.pathname

    // Izinkan akses ke halaman login admin
    if (pathname === '/admin/login') {
      return res
    }

    // Proteksi route admin
    if (pathname.startsWith('/admin')) {
      if (!session) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
      return res
    }

    // Cek jadwal voting untuk halaman auth/login dan vote
    if (pathname === '/auth/login' || pathname.startsWith('/vote')) {
      // Ambil jadwal voting yang aktif
      const { data: schedule } = await supabase
        .from('voting_schedule')
        .select('*')
        .eq('is_active', true)
        .single()

      const now = new Date()
      
      // Jika tidak ada jadwal atau di luar jadwal, redirect ke homepage dengan pesan
      if (!schedule || now < new Date(schedule.start_time) || now > new Date(schedule.end_time)) {
        const message = !schedule 
          ? 'Jadwal voting belum ditentukan'
          : now < new Date(schedule.start_time)
          ? 'Voting belum dimulai'
          : 'Voting telah berakhir'
          
        return NextResponse.redirect(
          new URL(`/?message=${encodeURIComponent(message)}`, req.url)
        )
      }
    }

    // Proteksi route voting
    if (pathname.startsWith('/vote')) {
      const voter = req.cookies.get('voter')
      if (!voter) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      return res
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Redirect berdasarkan jenis route
    if (req.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/vote/:path*',
    '/auth/login'
  ]
} 