import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // 1. Proteksi Halaman Admin
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return res
    }

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
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
      return res
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // 2. Cek Jadwal Voting untuk Siswa (/auth/login dan /vote)
  if (pathname === '/auth/login' || pathname.startsWith('/vote')) {
    // Bypass jadwal khusus untuk pengujian E2E agar deterministik
    const isTestScheduleBypass = req.cookies.get('pilihku_test_schedule')?.value === 'live' ||
                                 req.headers.get('x-e2e-test') === 'true'

    if (isTestScheduleBypass) {
      return res
    }
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
        setAll() {},
      },
    })

    try {
      const { data: schedule, error } = await supabase
        .from('voting_schedule')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (error || !schedule) {
        return NextResponse.redirect(
          new URL(`/?message=${encodeURIComponent('Jadwal voting belum ditentukan')}`, req.url)
        )
      }

      const now = new Date()
      if (now < new Date(schedule.start_time)) {
        return NextResponse.redirect(
          new URL(`/?message=${encodeURIComponent('Voting belum dimulai')}`, req.url)
        )
      }
      if (now > new Date(schedule.end_time)) {
        return NextResponse.redirect(
          new URL(`/?message=${encodeURIComponent('Voting telah berakhir')}`, req.url)
        )
      }
    } catch (err) {
      console.warn('Gagal membaca jadwal voting di proxy:', err)
      // Jangan kunci pemilih jika jaringan supabase ada gangguan sesaat
    }
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/vote/:path*',
    '/auth/login'
  ]
}
