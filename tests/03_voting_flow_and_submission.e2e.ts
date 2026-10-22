import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const mockCandidates = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    candidate_number: 1,
    ketua_name: 'Ahmad Fauzi',
    wakil_name: 'Siti Nurhaliza',
    ketua_class: 'XI MIPA 1',
    wakil_class: 'X-E',
    visi: 'Mewujudkan OSIS yang aspiratif, kreatif, dan berintegritas tinggi.',
    misi: 'Meningkatkan kedisiplinan dan kepedulian sosial warga sekolah.\nMemfasilitasi pengembangan minat dan bakat siswa di berbagai bidang.',
    program_kerja: 'PORSENI Terbuka Antar Kelas\nGerakan Sekolah Ramah Lingkungan\nKotak Aspirasi Digital',
    ketua_photo_url: null,
    wakil_photo_url: null,
    created_at: new Date().toISOString()
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    candidate_number: 2,
    ketua_name: 'Budi Pratama',
    wakil_name: 'Dewi Lestari',
    ketua_class: 'XI IPS 2',
    wakil_class: 'X-B',
    visi: 'Membangun ekosistem sekolah yang kolaboratif, inklusif, dan berwawasan teknologi.',
    misi: 'Mendukung literasi digital dan pemanfaatan teknologi positif.\nMengokohkan solidaritas dan toleransi antar sesama pelajar.',
    program_kerja: 'Workshop Coding & Desain Grafis\nFestival Budaya Nusantara\nBimbingan Tutor Sebaya',
    ketua_photo_url: null,
    wakil_photo_url: null,
    created_at: new Date().toISOString()
  }
];

const mockLiveSchedule = {
  id: '382aa4ef-aaad-447e-8efb-f011ae16da25',
  start_time: '2026-10-01T00:00:00Z',
  end_time: '2026-12-31T23:59:59Z',
  is_active: true,
  created_at: '2026-10-01T00:00:00Z'
};

const activeVoter = {
  id: 'a1111111-1111-4111-8111-111111111111',
  nis: '10293847',
  full_name: 'Raden Mas Bagus',
  class: 'XII MIPA 3',
  has_voted: false
};

const alreadyVotedVoter = {
  id: 'a2222222-2222-4222-8222-222222222222',
  nis: '10293848',
  full_name: 'Siti Rahmawati',
  class: 'XII IPS 1',
  has_voted: true
};

test.describe('Voting Flow & Ballot Submission', () => {
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

  test('unauthorized direct visit to /vote prompts login guard', async ({ app, browser, screen }) => {
    await browser.route('**/rest/v1/candidates*', route => route.fulfill({ status: 200, json: mockCandidates }));
    await browser.route('**/rest/v1/voting_schedule*', route => route.fulfill({ status: 200, json: mockLiveSchedule }));

    // Buka /vote tanpa cookie sesi pemilih
    await app.open('/vote');

    // Muncul tampilan ramah proteksi sesi tidak ditemukan
    await expect(screen.getByText('Sesi Voting Tidak Ditemukan')).toBeVisible();
    await expect(screen.getByText(/Anda harus login terlebih dahulu menggunakan Nomor Induk Siswa/i)).toBeVisible();

    // Klik tombol Login dengan NIS membawa ke /auth/login
    const loginLink = screen.getByRole('link', { name: /Login dengan NIS/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    await expect(browser).toHaveURL('/auth/login');
  });

  test('complete voting flow from login to ballot selection, confirmation modal, and success receipt', async ({ app, browser, screen, agent }) => {
    // 1. Setup Mock Routes untuk Supabase REST API
    await browser.route('**/rest/v1/candidates*', route => route.fulfill({ status: 200, json: mockCandidates }));
    await browser.route('**/rest/v1/voting_schedule*', route => route.fulfill({ status: 200, json: mockLiveSchedule }));
    await browser.route('**/rest/v1/voted_devices*', route => {
      if (route.request.method === 'POST') {
        return route.fulfill({ status: 201, json: [{ id: 'device-123' }] });
      }
      return route.fulfill({ status: 200, json: [] });
    });
    await browser.route('**/rest/v1/votes*', route => {
      if (route.request.method === 'POST') {
        return route.fulfill({ status: 201, json: [{ id: 'vote-123' }] });
      }
      return route.fulfill({ status: 200, json: [] });
    });
    await browser.route('**/rest/v1/voters*', route => {
      const url = route.request.url;
      const acceptHeader = route.request.headers['accept'] || '';

      if (route.request.method === 'PATCH') {
        return route.fulfill({ status: 200, json: [{ ...activeVoter, has_voted: true }] });
      }

      // Jika PostgREST meminta single object
      if (acceptHeader.includes('vnd.pgrst.object+json') || url.includes('nis=eq.10293847') || url.includes('id=eq.a1111111')) {
        return route.fulfill({ status: 200, json: activeVoter });
      }

      // Default: daftar pemilih untuk perhitungan statistik turnout
      return route.fulfill({ status: 200, json: [activeVoter] });
    });

    // 2. Login melalui /auth/login
    await app.open('/auth/login');
    const nisInput = browser.locator('#nis');
    await expect(nisInput).toBeVisible();
    await nisInput.fill('10293847');

    const submitBtn = browser.locator('button[type="submit"]');
    await submitBtn.click();

    // 3. Masuk ke Halaman Bilik Suara (/vote)
    await browser.waitForURL(/\/vote/, { timeout: 10000 });
    await expect(browser).toHaveURL('/vote');

    // Verifikasi Header Pemilih (Nama & Kelas Saja)
    await expect(screen.getByText('Raden Mas Bagus')).toBeVisible();
    await expect(screen.getByText(/Kelas:\s*XII MIPA 3/i)).toBeVisible();

    // Verifikasi Kedua Paslon Tampil
    await expect(screen.getByText('Ahmad Fauzi')).toBeVisible();
    await expect(screen.getByText('Budi Pratama')).toBeVisible();

    // 4. Interaksi Tab: Periksa Program Kerja Paslon 02
    const paslon2ProkerTab = browser.locator('button:has-text("Program")').nth(1);
    await paslon2ProkerTab.click();
    await expect(screen.getByText('Workshop Coding & Desain Grafis')).toBeVisible();

    // 5. Pilih Paslon 02
    const pilihPaslon2Btn = browser.locator('button:has-text("Pilih Paslon 02")');
    await pilihPaslon2Btn.click();

    // Bottom dock menampilkan paslon pilihan
    await expect(screen.getByText('Paslon Pilihan Anda')).toBeVisible();
    await expect(screen.getByText('Budi Pratama & Dewi Lestari')).toBeVisible();

    // 6. Buka Modal Konfirmasi Suara
    const konfirmasiBtn = browser.locator('button:has-text("Lanjutkan Konfirmasi Suara")');
    await konfirmasiBtn.click();

    // Verifikasi Isi Modal Konfirmasi
    await expect(screen.getByText('Konfirmasi Pilihan Suara')).toBeVisible();
    await expect(screen.getByText('Pilihan Bersifat Permanen & Rahasia')).toBeVisible();
    const modal = browser.locator('[role="dialog"]');
    await expect(modal.getByText('PASLON 02')).toBeVisible();

    // 7. AI Agent Audit: Memastikan kejelasan dan integritas modal konfirmasi
    await agent.assert('does the confirmation dialog explicitly show the chosen candidate with an integrity warning before final vote submission?');

    // 8. Kirim Suara Final
    const kirimSuaraBtn = browser.locator('button:has-text("Ya, Kirim Suara Saya")');
    await kirimSuaraBtn.click();

    // 9. Dialihkan ke Halaman Sukses (/vote/success)
    await browser.waitForURL(/\/vote\/success/, { timeout: 10000 });
    await expect(browser).toHaveURL('/vote/success');

    // Verifikasi Tampilan Halaman Sukses
    await expect(screen.getByRole('heading', { name: 'Voting Berhasil!' })).toBeVisible();
    await expect(screen.getByText(/Suara Anda telah tercatat dengan aman dalam sistem/i)).toBeVisible();
    await expect(screen.getByRole('link', { name: /Kembali ke Beranda/i })).toBeVisible();
  });

  test('already voted voter trying to vote again is prevented on ballot page', async ({ app, browser, screen }) => {
    await browser.route('**/rest/v1/candidates*', route => route.fulfill({ status: 200, json: mockCandidates }));
    await browser.route('**/rest/v1/voting_schedule*', route => route.fulfill({ status: 200, json: mockLiveSchedule }));
    await browser.route('**/rest/v1/voters*', route => {
      const acceptHeader = route.request.headers['accept'] || '';
      if (acceptHeader.includes('vnd.pgrst.object+json')) {
        return route.fulfill({ status: 200, json: alreadyVotedVoter });
      }
      return route.fulfill({ status: 200, json: [alreadyVotedVoter] });
    });

    // Simulasikan cookie sesi pemilih yang sudah memilih
    await browser.setCookies([
      {
        name: 'voter',
        value: encodeURIComponent(JSON.stringify(alreadyVotedVoter)),
        domain: 'localhost',
        path: '/'
      }
    ]);

    await app.open('/vote');

    // Sistem menampilkan pesan hak suara telah digunakan
    await expect(screen.getByText('Hak Suara Telah Digunakan')).toBeVisible();
    await expect(screen.getByText(/Terima Kasih, Siti Rahmawati!/i)).toBeVisible();
    await expect(screen.getByText(/Setiap siswa hanya memiliki satu hak suara yang sah/i)).toBeVisible();

    const homeBtn = screen.getByRole('link', { name: /Kembali ke Beranda/i });
    await expect(homeBtn).toBeVisible();
    await homeBtn.click();
    await expect(browser).toHaveURL('/');
  });
});
