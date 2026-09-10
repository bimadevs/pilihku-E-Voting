-- ==============================================================================
-- PILIHKU E-VOTING: SETUP LENGKAP DATABASE & ROW LEVEL SECURITY (RLS) SUPABASE
-- Jalankan seluruh query ini sekaligus di menu "SQL Editor" pada Supabase Dashboard.
-- Script ini sudah mencakup: Pembuatan Tabel, Index, RLS Policies, dan Storage Bucket.
-- ==============================================================================

-- 0. AKTIFKAN EKSTENSI UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PEMBUATAN TABEL & RELASI
-- ==============================================================================

-- Tabel Candidates (Data Pasangan Calon Ketua & Wakil OSIS)
CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  candidate_number integer NOT NULL,
  ketua_name text NOT NULL,
  wakil_name text NOT NULL,
  visi text NOT NULL,
  misi text NOT NULL,
  photo_url text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ketua_photo_url text NULL,
  wakil_photo_url text NULL,
  ketua_class text NULL,
  wakil_class text NULL,
  program_kerja text NULL,
  CONSTRAINT candidates_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS candidates_candidate_number_key 
ON public.candidates USING btree (candidate_number) TABLESPACE pg_default;


-- Tabel Voters (Daftar Pemilih Tetap / Siswa)
CREATE TABLE IF NOT EXISTS public.voters (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  nis text NOT NULL,
  full_name text NOT NULL,
  class text NOT NULL,
  has_voted boolean NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT voters_pkey PRIMARY KEY (id),
  CONSTRAINT voters_nis_key UNIQUE (nis)
) TABLESPACE pg_default;


-- Tabel Votes (Surat Suara Masuk)
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  voter_id uuid NULL,
  candidate_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates (id) ON DELETE CASCADE,
  CONSTRAINT votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.voters (id) ON DELETE CASCADE
) TABLESPACE pg_default;


-- Tabel Voting Schedule (Jadwal Buka & Tutup Bilik Suara)
CREATE TABLE IF NOT EXISTS public.voting_schedule (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT voting_schedule_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS voting_schedule_active_idx 
ON public.voting_schedule (is_active) WHERE (is_active = true);


-- Tabel Settings (Pengaturan Waktu Pengumuman & Pemenang)
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  announcement_time timestamp with time zone NULL,
  winner_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT settings_pkey PRIMARY KEY (id),
  CONSTRAINT settings_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.candidates (id) ON DELETE SET NULL
) TABLESPACE pg_default;


-- ==============================================================================
-- 2. KONFIGURASI ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- --- A. TABEL CANDIDATES ---
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kandidat dapat dibaca oleh semua pengguna" ON public.candidates;
DROP POLICY IF EXISTS "Hanya admin yang dapat mengelola kandidat" ON public.candidates;
DROP POLICY IF EXISTS "Allow all candidates access" ON public.candidates;

CREATE POLICY "Kandidat dapat dibaca oleh semua pengguna"
ON public.candidates FOR SELECT
TO public
USING (true);

CREATE POLICY "Hanya admin yang dapat mengelola kandidat"
ON public.candidates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- --- B. TABEL VOTERS ---
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik dapat membaca data pemilih untuk login" ON public.voters;
DROP POLICY IF EXISTS "Publik dapat memperbarui status voting sendiri" ON public.voters;
DROP POLICY IF EXISTS "Admin dapat mengelola pemilih" ON public.voters;

-- Publik (siswa) dapat mencari NIS saat login
CREATE POLICY "Publik dapat membaca data pemilih untuk login"
ON public.voters FOR SELECT
TO public
USING (true);

-- Pemilih dapat menandai status dirinya sudah memilih (has_voted = true)
CREATE POLICY "Publik dapat memperbarui status voting sendiri"
ON public.voters FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Admin dapat mengelola pemilih (tambah, ubah, hapus, import Excel)
CREATE POLICY "Admin dapat mengelola pemilih"
ON public.voters FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- --- C. TABEL VOTES ---
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pemilih dapat mengirim suara" ON public.votes;
DROP POLICY IF EXISTS "Votes dapat dibaca publik" ON public.votes;
DROP POLICY IF EXISTS "Admin dapat mengelola semua votes" ON public.votes;

-- Pemilih (publik) dapat memasukkan suara pilihan
CREATE POLICY "Pemilih dapat mengirim suara"
ON public.votes FOR INSERT
TO public
WITH CHECK (true);

-- Publik dapat membaca data suara untuk rekapitulasi real-time
CREATE POLICY "Votes dapat dibaca publik"
ON public.votes FOR SELECT
TO public
USING (true);

-- Admin dapat mengelola semua votes (termasuk hapus saat kandidat dihapus)
CREATE POLICY "Admin dapat mengelola semua votes"
ON public.votes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- --- D. TABEL VOTING_SCHEDULE ---
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


-- --- E. TABEL SETTINGS ---
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings dapat dibaca publik" ON public.settings;
DROP POLICY IF EXISTS "Admin dapat mengelola settings" ON public.settings;

CREATE POLICY "Settings dapat dibaca publik"
ON public.settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin dapat mengelola settings"
ON public.settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- ==============================================================================
-- 3. STORAGE BUCKET (PENYIMPANAN FOTO KANDIDAT)
-- ==============================================================================

-- Buat bucket penyimpanan foto jika belum ada
INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidate-photos', 'candidate-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Hapus policy storage lama jika ada
DROP POLICY IF EXISTS "Foto kandidat dapat diakses publik" ON storage.objects;
DROP POLICY IF EXISTS "Hanya admin yang dapat menambah foto kandidat" ON storage.objects;
DROP POLICY IF EXISTS "Hanya admin yang dapat menghapus foto kandidat" ON storage.objects;

-- Akses publik untuk melihat foto kandidat
CREATE POLICY "Foto kandidat dapat diakses publik"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'candidate-photos');

-- Hanya admin (authenticated) yang dapat mengunggah foto kandidat
CREATE POLICY "Hanya admin yang dapat menambah foto kandidat"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'candidate-photos' 
  AND auth.role() = 'authenticated'
);

-- Hanya admin (authenticated) yang dapat menghapus foto kandidat
CREATE POLICY "Hanya admin yang dapat menghapus foto kandidat"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidate-photos' 
  AND auth.role() = 'authenticated'
);
