import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test.describe('Admin Authentication & Route Guards', () => {
  test('unauthorized direct visits to all admin routes redirect to /admin/login', async ({ app, browser }) => {
    const protectedRoutes = [
      '/admin',
      '/admin/candidates',
      '/admin/voters',
      '/admin/results',
      '/admin/schedule',
      '/admin/settings'
    ];

    for (const route of protectedRoutes) {
      await app.open(route);
      await browser.waitForURL(/\/admin\/login/, { timeout: 10000 });
      await expect(browser).toHaveURL('/admin/login');
    }
  });

  test('admin login page renders institutional security context, form elements, and navigates back', async ({ app, browser, screen }) => {
    await app.open('/admin/login');

    // 1. Verifikasi Branding & Context Keamanan OSIS
    await expect(screen.getByText('Panel Kendali Panitia OSIS')).toBeVisible();
    await expect(screen.getByText('Pusat Kendali Pemilihan OSIS')).toBeVisible();
    await expect(screen.getByText('Panel Pengawasan & Rekapitulasi Suara')).toBeVisible();
    await expect(screen.getByText('Enkripsi Sesi 256-Bit')).toBeVisible();
    await expect(screen.getByText('Integritas Suara Tunggal')).toBeVisible();

    // 2. Verifikasi Komponen Form Login Admin
    await expect(screen.getByRole('heading', { name: 'Masuk ke Panel Kendali' })).toBeVisible();
    const emailInput = browser.locator('#admin-email');
    const passwordInput = browser.locator('#admin-password');
    const submitBtn = browser.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // 3. Verifikasi Toggle Show/Hide Password
    await passwordInput.fill('SecretPassword123');
    const togglePasswordBtn = browser.locator('button[aria-label="Lihat kata sandi"]');
    await expect(togglePasswordBtn).toBeVisible();
    await togglePasswordBtn.click();

    const hidePasswordBtn = browser.locator('button[aria-label="Sembunyikan kata sandi"]');
    await expect(hidePasswordBtn).toBeVisible();
    await hidePasswordBtn.click();
    await expect(browser.locator('button[aria-label="Lihat kata sandi"]')).toBeVisible();

    // 4. Navigasi Kembali ke Beranda Pemilih
    const backLink = screen.getByRole('link', { name: /Kembali ke Beranda Pemilih/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(browser).toHaveURL('/');
  });

  test('invalid admin credentials display security alert banner and AI audit', async ({ app, browser, screen, agent }) => {
    // Mock Supabase Auth endpoint untuk menghasilkan kegagalan otentikasi
    await browser.route('**/auth/v1/token?grant_type=password', route => {
      return route.fulfill({
        status: 400,
        json: {
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
          msg: 'Invalid login credentials'
        }
      });
    });

    await app.open('/admin/login');

    const emailInput = browser.locator('#admin-email');
    const passwordInput = browser.locator('#admin-password');
    const submitBtn = browser.locator('button[type="submit"]');

    await emailInput.fill('penyusup@sekolah.sch.id');
    await passwordInput.fill('WrongPassword123');
    await submitBtn.click();

    // Muncul Banner Otorisasi Ditolak
    await expect(screen.getByText('Otorisasi Ditolak')).toBeVisible();
    await expect(screen.getByText('Email atau kata sandi tidak valid. Pastikan akun panitia Anda telah didaftarkan.')).toBeVisible();

    // AI Agent Audit: Evaluasi kejelasan dan keamanan UI saat login ditolak
    await agent.assert('is the rejected authorization banner clearly visible with an explicit rejection explanation?');
  });
});
