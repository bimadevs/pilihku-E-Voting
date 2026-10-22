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

test.describe('Landing Page & Public Navigation', () => {
  test('landing page loads all essential components, branding, and statistics', async ({ app, browser, screen, agent }) => {
    await browser.route('**/rest/v1/candidates*', route => route.fulfill({ status: 200, json: mockCandidates }));
    await browser.route('**/rest/v1/voting_schedule*', route => route.fulfill({ status: 200, json: mockLiveSchedule }));
    await app.open('/');

    // 1. Verifikasi Header & Branding
    await expect(browser.locator('header')).toBeVisible();
    await expect(screen.getByText('PilihKu')).toBeVisible();
    await expect(screen.getByText('Sistem E-Voting Resmi')).toBeVisible();

    // 2. Verifikasi Hero Section
    await expect(screen.getByRole('heading', { name: /Suara Berintegritas untuk Pemimpin Masa Depan Sekolah/i })).toBeVisible();
    await expect(screen.getByText(/Wujudkan demokrasi sekolah yang jujur, adil, dan transparan/i)).toBeVisible();

    // 3. Verifikasi Tombol Aksi Utama
    await expect(screen.getByRole('link', { name: /Mulai Memilih Sekarang/i })).toBeVisible();
    await expect(screen.getByRole('link', { name: /Lihat Hasil Voting/i })).toBeVisible();

    // 4. Verifikasi Nilai Integritas Utama
    await expect(screen.getByText('1 Siswa 1 Suara Sah')).toBeVisible();
    await expect(screen.getByText('Kerahasiaan Terenkripsi')).toBeVisible();
    await expect(screen.getByText('Rekapitulasi Real-time')).toBeVisible();

    // 5. Verifikasi Bagian Tata Cara
    await expect(screen.getByRole('heading', { name: /Tata Cara Pemungutan Suara/i })).toBeVisible();
    await expect(screen.getByText(/Otentikasi NIS/i)).toBeVisible();
    await expect(screen.getByText(/Tentukan Pilihan/i)).toBeVisible();
    await expect(screen.getByText(/Konfirmasi Suara/i)).toBeVisible();

    // 6. Verifikasi Bagian Daftar Paslon
    await expect(screen.getByRole('heading', { name: /Daftar Pasangan Calon/i })).toBeVisible();
    await expect(screen.getByText('Ahmad Fauzi')).toBeVisible();
    await expect(screen.getByText('Budi Pratama')).toBeVisible();

    // 7. Verifikasi Asas Pemilu Siswa (Luber Jurdil)
    await expect(screen.getByRole('heading', { name: /Asas Pemilihan Umum Siswa/i })).toBeVisible();
    await expect(screen.getByText('Langsung')).toBeVisible();
    await expect(screen.getByText('Umum')).toBeVisible();
    await expect(screen.getByText('Bebas')).toBeVisible();
    await expect(screen.getByText('Rahasia')).toBeVisible();
    await expect(screen.getByText('Jujur')).toBeVisible();
    await expect(screen.getByText('Adil')).toBeVisible();

    // 8. Verifikasi Footer
    await expect(screen.getByText(/© 2026 PilihKu E-Voting. Komisi Pemilihan OSIS Sekolah./i)).toBeVisible();

    // 9. Audit AI Agent terhadap integritas tampilan landing page
    await agent.assert('does the page display official school e-voting branding and clear instructions for students?');
  });

  test('candidate detail modal opens, switches tabs, and closes properly', async ({ app, browser, screen }) => {
    await browser.route('**/rest/v1/candidates*', route => route.fulfill({ status: 200, json: mockCandidates }));
    await browser.route('**/rest/v1/voting_schedule*', route => route.fulfill({ status: 200, json: mockLiveSchedule }));
    await app.open('/');

    // Jika ada popup pengumuman pemenang di awal, tutup terlebih dahulu
    const closeWinnerBtn = browser.locator('button[aria-label="Tutup Pengumuman"]');
    if (await closeWinnerBtn.isVisible()) {
      await closeWinnerBtn.click();
    }

    // Scroll ke bagian kandidat dan klik tombol detail paslon pertama
    const detailButtons = browser.locator('button:has-text("Visi, Misi & Proker")');
    await expect(detailButtons.first()).toBeVisible();
    await detailButtons.first().click();

    // Dialog detail paslon harus terbuka (spesifik dengan aria-labelledby="candidate-modal-title")
    const dialog = browser.locator('[role="dialog"][aria-labelledby="candidate-modal-title"]');
    await expect(dialog).toBeVisible();
    await expect(screen.getByText(/Profil Resmi Pemilihan OSIS/i)).toBeVisible();
    await expect(browser.locator('[role="dialog"][aria-labelledby="candidate-modal-title"] button:has-text("Visi Kepemimpinan")')).toBeVisible();

    // Berpindah tab ke Program Kerja
    const prokerTab = browser.locator('[role="dialog"][aria-labelledby="candidate-modal-title"] button:has-text("Program Kerja")');
    await expect(prokerTab).toBeVisible();
    await prokerTab.click();
    await expect(browser.locator('[role="dialog"][aria-labelledby="candidate-modal-title"] span:has-text("Program Unggulan")').first()).toBeVisible();

    // Tutup dialog
    const closeBtn = browser.locator('[role="dialog"][aria-labelledby="candidate-modal-title"] button:has-text("Tutup Detail")');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();
  });
});
