import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Izinkan akses ke halaman login meskipun tidak ada session
    if (req.nextUrl.pathname === '/admin/login') {
      return res
    }

    // Jika mengakses halaman admin dan tidak ada session, redirect ke login
    if (req.nextUrl.pathname.startsWith('/admin') && !session) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    // Proteksi route voting
    if (req.nextUrl.pathname.startsWith('/vote') && req.nextUrl.pathname !== '/vote/success') {
      const voter = req.cookies.get('voter')
      if (!voter) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
    }

    // Izinkan akses ke halaman voting jika ada data voter di localStorage
    const pathname = req.nextUrl.pathname
    if (pathname.startsWith('/vote')) {
      return res
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin/login',
    '/vote/:path*'
  ]
} 