import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test.describe('Voter Authentication & Protections', () => {
  test.beforeEach(async ({ browser }) => {
    await browser.setCookies([
      {
        name: 'pilihku_test_schedule',
        value: 'live',
        domain: 'localhost',
        path: '/'
      }
    ]);
  });
  test('login page renders official branding, instructions, and NIS input', async ({ app, browser, screen, agent }) => {
    await app.open('/auth/login');

    // 1. Verifikasi Elemen Utama Halaman Login
    await expect(screen.getByText(/Masuk dengan NIS untuk menggunakan hak suaramu/i)).toBeVisible();
    await expect(screen.getByText('Nomor Induk Siswa (NIS)')).toBeVisible();

    // 2. Verifikasi Form Input
    const nisInput = browser.locator('#nis');
    await expect(nisInput).toBeVisible();
    await expect(nisInput).toHaveAttribute('placeholder', 'Masukkan NIS Anda');

    // 3. Verifikasi Tombol Submit & Navigasi Kembali
    const submitBtn = browser.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(screen.getByRole('link', { name: /Kembali ke Beranda/i })).toBeVisible();

    // 4. Verifikasi Catatan di Footer Form
    await expect(screen.getByText(/Gunakan NIS yang telah terdaftar untuk melakukan voting/i)).toBeVisible();

    // 5. AI Agent Verifikasi Clarity Halaman Login
    await agent.assert('is the login page dedicated to student voter authentication with clear NIS instructions?');
  });

  test('submitting non-existent NIS shows exact helpful error message', async ({ app, browser, screen }) => {
    await browser.route('**/rest/v1/voters*', route => {
      const url = route.request.url;
      if (url.includes('nis=eq.999999999')) {
        return route.fulfill({
          status: 406,
          json: { code: 'PGRST116', details: 'The result contains 0 rows', message: 'JSON object requested, multiple (or no) rows returned' }
        });
      }
      return route.continue();
    });

    await app.open('/auth/login');

    const nisInput = browser.locator('#nis');
    await nisInput.fill('999999999');

    const submitBtn = browser.locator('button[type="submit"]');
    await submitBtn.click();

    // Muncul pesan error NIS tidak ditemukan
    await expect(screen.getByText(/Maaf, NIS Anda tidak ditemukan\. Hubungi Admin untuk informasi lebih lanjut\./i)).toBeVisible();
  });

  test('submitting already-voted NIS is blocked with proper notice', async ({ app, browser, screen }) => {
    await browser.route('**/rest/v1/voters*', route => {
      const url = route.request.url;
      if (url.includes('nis=eq.10293848')) {
        return route.fulfill({
          status: 200,
          json: {
            id: 'a2222222-2222-4222-8222-222222222222',
            nis: '10293848',
            full_name: 'Siti Rahmawati',
            class: 'XII IPS 1',
            has_voted: true
          }
        });
      }
      return route.continue();
    });

    await app.open('/auth/login');

    const nisInput = browser.locator('#nis');
    await nisInput.fill('10293848');

    const submitBtn = browser.locator('button[type="submit"]');
    await submitBtn.click();

    // Muncul pesan blokir sudah memilih
    await expect(screen.getByText(/Anda sudah melakukan voting\. Terima kasih telah berkontribusi pada pemilihan OSIS\./i)).toBeVisible();
  });

  test('back button navigates back to landing page', async ({ app, browser, screen }) => {
    await app.open('/auth/login');

    const backLink = screen.getByRole('link', { name: /Kembali ke Beranda/i });
    await backLink.click();

    await expect(browser).toHaveURL('/');
  });
});
