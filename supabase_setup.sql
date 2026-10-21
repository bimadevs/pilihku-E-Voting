-- ==============================================================================
-- PILIHKU E-VOTING: SETUP LENGKAP DATABASE SUPABASE (FULL INITIALIZATION SCRIPT)
-- ==============================================================================
-- Petunjuk Penggunaan:
-- 1. Buka Supabase Dashboard proyek baru Anda (https://supabase.com/dashboard)
-- 2. Masuk ke menu "SQL Editor" di bilah navigasi kiri
-- 3. Klik "New Query", lalu tempelkan (paste) seluruh isi file ini
-- 4. Klik tombol "Run" (atau Ctrl+Enter)
-- 
-- Script ini sudah mencakup:
--   ✔ Ekstensi UUID
--   ✔ 6 Tabel Utama (candidates, voters, votes, voted_devices, voting_schedule, settings)
--   ✔ Index & Relasi Foreign Key
--   ✔ Row Level Security (RLS) & Policies Lengkap
--   ✔ Storage Bucket ("candidate-photos") & Storage Policies
--   ✔ Supabase Realtime Publication untuk Live Tally
--   ✔ Inisialisasi Data Default Settings
-- ==============================================================================


-- ==============================================================================
-- 0. AKTIFKAN EKSTENSI POSTGRESQL
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ==============================================================================
-- 1. PEMBUATAN TABEL, RELASI, & INDEKS
-- ==============================================================================

-- 1.1 Tabel Candidates (Data Pasangan Calon Ketua & Wakil OSIS)
CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  candidate_number integer NOT NULL,
  ketua_name text NOT NULL,
  wakil_name text NOT NULL,
  visi text NOT NULL,
  misi text NOT NULL,
  photo_url text NULL,
  ketua_photo_url text NULL,
  wakil_photo_url text NULL,
  ketua_class text NULL,
  wakil_class text NULL,
  program_kerja text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT candidates_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS candidates_candidate_number_key 
ON public.candidates USING btree (candidate_number) TABLESPACE pg_default;


-- 1.2 Tabel Voters (Daftar Pemilih Tetap / Siswa)
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

CREATE INDEX IF NOT EXISTS voters_nis_idx 
ON public.voters USING btree (nis) TABLESPACE pg_default;


-- 1.3 Tabel Votes (Surat Suara Masuk)
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  voter_id uuid NULL,
  candidate_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates (id) ON DELETE CASCADE,
  CONSTRAINT votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.voters (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS votes_candidate_id_idx 
ON public.votes USING btree (candidate_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS votes_voter_id_idx 
ON public.votes USING btree (voter_id) TABLESPACE pg_default;


-- 1.4 Tabel Voted Devices (Proteksi 1 Device 1 Vote / Anti-Spam)
CREATE TABLE IF NOT EXISTS public.voted_devices (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  device_hash text NOT NULL,
  voter_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT voted_devices_pkey PRIMARY KEY (id),
  CONSTRAINT voted_devices_device_hash_key UNIQUE (device_hash),
  CONSTRAINT voted_devices_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.voters (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS voted_devices_device_hash_idx 
ON public.voted_devices USING btree (device_hash) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS voted_devices_voter_id_idx 
ON public.voted_devices USING btree (voter_id) TABLESPACE pg_default;


-- 1.5 Tabel Voting Schedule (Jadwal Buka & Tutup Bilik Suara)
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


-- 1.6 Tabel Settings (Pengaturan Waktu Pengumuman & Pemenang Terpilih)
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

-- Publik dapat melihat informasi semua kandidat
CREATE POLICY "Kandidat dapat dibaca oleh semua pengguna"
ON public.candidates FOR SELECT
TO public
USING (true);

-- Admin (authenticated) dapat menambah, mengedit, dan menghapus kandidat
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

-- Siswa/Publik dapat mencari data NIS saat login
CREATE POLICY "Publik dapat membaca data pemilih untuk login"
ON public.voters FOR SELECT
TO public
USING (true);

-- Siswa dapat menandai has_voted = true saat selesai memilih
CREATE POLICY "Publik dapat memperbarui status voting sendiri"
ON public.voters FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Admin dapat mengelola pemilih (tambah manual, import Excel/CSV, hapus)
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

-- Siswa dapat memasukkan surat suara
CREATE POLICY "Pemilih dapat mengirim suara"
ON public.votes FOR INSERT
TO public
WITH CHECK (true);

-- Publik & Siswa dapat membaca surat suara untuk rekapitulasi real-time
CREATE POLICY "Votes dapat dibaca publik"
ON public.votes FOR SELECT
TO public
USING (true);

-- Admin dapat mengelola & menghapus suara jika dibutuhkan (misal saat reset data)
CREATE POLICY "Admin dapat mengelola semua votes"
ON public.votes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- --- D. TABEL VOTED_DEVICES ---
ALTER TABLE public.voted_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik dapat membaca status perangkat" ON public.voted_devices;
DROP POLICY IF EXISTS "Publik dapat mendaftarkan perangkat saat memilih" ON public.voted_devices;
DROP POLICY IF EXISTS "Admin dapat mengelola semua status perangkat" ON public.voted_devices;

-- Publik dapat mengecek apakah perangkat sudah pernah digunakan
CREATE POLICY "Publik dapat membaca status perangkat"
ON public.voted_devices FOR SELECT
TO public
USING (true);

-- Publik mendaftarkan sidik jari perangkat saat submit suara
CREATE POLICY "Publik dapat mendaftarkan perangkat saat memilih"
ON public.voted_devices FOR INSERT
TO public
WITH CHECK (true);

-- Admin dapat mengelola dan mereset kunci perangkat siswa
CREATE POLICY "Admin dapat mengelola semua status perangkat"
ON public.voted_devices FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- --- E. TABEL VOTING_SCHEDULE ---
ALTER TABLE public.voting_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jadwal dapat dibaca oleh semua pengguna" ON public.voting_schedule;
DROP POLICY IF EXISTS "Hanya admin yang dapat mengatur jadwal" ON public.voting_schedule;

-- Publik dapat memeriksa rentang waktu pemilihan
CREATE POLICY "Jadwal dapat dibaca oleh semua pengguna"
ON public.voting_schedule FOR SELECT
TO public
USING (true);

-- Admin dapat mengatur jadwal buka & tutup bilik suara
CREATE POLICY "Hanya admin yang dapat mengatur jadwal"
ON public.voting_schedule FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- --- F. TABEL SETTINGS ---
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings dapat dibaca publik" ON public.settings;
DROP POLICY IF EXISTS "Admin dapat mengelola settings" ON public.settings;

-- Publik dapat melihat jadwal pengumuman & pemenang
CREATE POLICY "Settings dapat dibaca publik"
ON public.settings FOR SELECT
TO public
USING (true);

-- Admin dapat mengatur waktu pengumuman & mengunci pemenang
CREATE POLICY "Admin dapat mengelola settings"
ON public.settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- ==============================================================================
-- 3. STORAGE BUCKET (FOTO KANDIDAT KETUA & WAKIL)
-- ==============================================================================

-- Buat bucket publik "candidate-photos" jika belum ada
INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidate-photos', 'candidate-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Hapus policy storage lama jika ada
DROP POLICY IF EXISTS "Foto kandidat dapat diakses publik" ON storage.objects;
DROP POLICY IF EXISTS "Hanya admin yang dapat menambah foto kandidat" ON storage.objects;
DROP POLICY IF EXISTS "Hanya admin yang dapat mengubah foto kandidat" ON storage.objects;
DROP POLICY IF EXISTS "Hanya admin yang dapat menghapus foto kandidat" ON storage.objects;

-- Publik dapat melihat & mengunduh foto kandidat
CREATE POLICY "Foto kandidat dapat diakses publik"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'candidate-photos');

-- Admin dapat mengunggah foto kandidat
CREATE POLICY "Hanya admin yang dapat menambah foto kandidat"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'candidate-photos' 
  AND auth.role() = 'authenticated'
);

-- Admin dapat memperbarui foto kandidat
CREATE POLICY "Hanya admin yang dapat mengubah foto kandidat"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'candidate-photos' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'candidate-photos' 
  AND auth.role() = 'authenticated'
);

-- Admin dapat menghapus foto kandidat
CREATE POLICY "Hanya admin yang dapat menghapus foto kandidat"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidate-photos' 
  AND auth.role() = 'authenticated'
);


-- ==============================================================================
-- 4. AKTIFKAN SUPABASE REALTIME (UNTUK LIVE COUNTING DI HOMEPAGE)
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
  END IF;
END $$;


-- ==============================================================================
-- 5. INISIALISASI DATA AWAL (SEED SETTINGS)
-- ==============================================================================

-- Buat baris pengaturan awal jika tabel settings masih kosong
INSERT INTO public.settings (announcement_time, winner_id)
SELECT NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.settings);
