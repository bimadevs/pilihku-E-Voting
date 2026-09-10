import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({
          request: {
            headers: req.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        )
      },
    },
  })

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
        .maybeSingle()

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