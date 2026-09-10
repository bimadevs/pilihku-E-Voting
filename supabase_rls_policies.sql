-- ==============================================================================
-- Supabase Row Level Security (RLS) Policies untuk Sistem E-Voting PilihKu
-- Jalankan seluruh script ini di menu "SQL Editor" pada Supabase Dashboard Anda.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL CANDIDATES
-- ------------------------------------------------------------------------------
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kandidat dapat dibaca oleh semua pengguna" ON public.candidates;
DROP POLICY IF EXISTS "Hanya admin yang dapat mengelola kandidat" ON public.candidates;
DROP POLICY IF EXISTS "Allow all candidates access" ON public.candidates;

-- Publik (pemilih & pengunjung) dapat melihat daftar kandidat
CREATE POLICY "Kandidat dapat dibaca oleh semua pengguna"
ON public.candidates FOR SELECT
TO public
USING (true);

-- Admin yang telah login (authenticated) dapat menambah, mengubah, dan menghapus kandidat
CREATE POLICY "Hanya admin yang dapat mengelola kandidat"
ON public.candidates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 2. TABEL VOTERS
-- ------------------------------------------------------------------------------
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik dapat membaca data pemilih untuk login" ON public.voters;
DROP POLICY IF EXISTS "Publik dapat memperbarui status voting sendiri" ON public.voters;
DROP POLICY IF EXISTS "Admin dapat mengelola pemilih" ON public.voters;

-- Publik dapat mencari NIS untuk proses login pemilih
CREATE POLICY "Publik dapat membaca data pemilih untuk login"
ON public.voters FOR SELECT
TO public
USING (true);

-- Pemilih dapat memperbarui status 'has_voted' setelah memberikan suara
CREATE POLICY "Publik dapat memperbarui status voting sendiri"
ON public.voters FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Admin dapat mengelola seluruh data pemilih (tambah, edit, hapus, import Excel/CSV)
CREATE POLICY "Admin dapat mengelola pemilih"
ON public.voters FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 3. TABEL VOTES
-- ------------------------------------------------------------------------------
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pemilih dapat mengirim suara" ON public.votes;
DROP POLICY IF EXISTS "Admin dapat mengelola semua votes" ON public.votes;
DROP POLICY IF EXISTS "Votes dapat dibaca publik" ON public.votes;

-- Pemilih (publik) dapat memasukkan suara pilihan
CREATE POLICY "Pemilih dapat mengirim suara"
ON public.votes FOR INSERT
TO public
WITH CHECK (true);

-- Publik & Admin dapat membaca data suara (untuk rekapitulasi / statistik)
CREATE POLICY "Votes dapat dibaca publik"
ON public.votes FOR SELECT
TO public
USING (true);

-- Admin dapat mengelola dan menghapus data votes jika diperlukan (misal saat hapus kandidat)
CREATE POLICY "Admin dapat mengelola semua votes"
ON public.votes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 4. TABEL SETTINGS
-- ------------------------------------------------------------------------------
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings dapat dibaca publik" ON public.settings;
DROP POLICY IF EXISTS "Admin dapat mengelola settings" ON public.settings;

-- Publik dapat membaca jadwal pengumuman & pemenang
CREATE POLICY "Settings dapat dibaca publik"
ON public.settings FOR SELECT
TO public
USING (true);

-- Admin dapat mengatur jadwal pengumuman dan pemenang
CREATE POLICY "Admin dapat mengelola settings"
ON public.settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 5. TABEL VOTING_SCHEDULE
-- ------------------------------------------------------------------------------
ALTER TABLE public.voting_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jadwal dapat dibaca oleh semua pengguna" ON public.voting_schedule;
DROP POLICY IF EXISTS "Hanya admin yang dapat mengatur jadwal" ON public.voting_schedule;

CREATE POLICY "Jadwal dapat dibaca oleh semua pengguna"
ON public.voting_schedule FOR SELECT
TO public
USING (true);

CREATE POLICY "Hanya admin yang dapat mengatur jadwal"
ON public.voting_schedule FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- ==============================================================================
-- CATATAN TAMBAHAN (OPSI CEPAT JIKA DEVELOPMENT/LOCAL):
-- Jika Anda ingin mematikan RLS sepenuhnya pada saat testing lokal:
-- ALTER TABLE public.candidates DISABLE ROW LEVEL SECURITY;
-- ==============================================================================
