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

    // Izinkan akses ke halaman login
    if (pathname === '/auth/login' || pathname === '/admin/login') {
      return res
    }

    // Proteksi route admin
    if (pathname.startsWith('/admin')) {
      if (!session) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
      return res
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