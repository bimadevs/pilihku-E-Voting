# PilihKu - Sistem E-Voting OSIS

PilihKu adalah aplikasi e-voting modern untuk pemilihan ketua dan wakil ketua OSIS di sekolah. Dibangun dengan Next.js 14, Supabase, Tailwind CSS, dan berbagai teknologi modern lainnya.

## 🌟 Fitur Utama

### Untuk Pemilih
- Login dengan NIS
- Melihat profil lengkap kandidat (foto, visi, misi, program kerja)
- Melakukan voting dengan konfirmasi
- Halaman terima kasih setelah voting
- Tidak bisa voting lebih dari sekali
- Tampilan responsif untuk mobile dan desktop

### Untuk Admin
- Dashboard admin yang komprehensif dengan statistik real-time
- Manajemen data kandidat (CRUD)
- Manajemen data pemilih (CRUD)
- Import data pemilih via CSV
- Monitoring hasil voting real-time
- Export hasil dalam format CSV
- Cetak laporan hasil pemilihan

## 🛠 Teknologi yang Digunakan

- **Frontend**:
  - Next.js 14 (App Router)
  - React & TypeScript
  - Tailwind CSS
  - Framer Motion (animasi)
  - React Icons

- **Backend & Database**:
  - Supabase (Database, Auth, Storage)
  - Row Level Security (RLS)

- **Visualisasi Data**:
  - Chart.js

- **Utilitas**:
  - Papa Parse (CSV parsing)


## 📋 Prasyarat

- Node.js versi 18.0.0 atau lebih tinggi
- NPM atau Yarn
- Akun Supabase

## 🚀 Cara Instalasi

1. Clone repository
```bash
git clone https://github.com/username/pilihku.git
cd pilihku
```

2. Install dependencies
```bash
npm install
# atau
yarn install
```

3. Setup environment variables
```bash
cp .env.example .env.local
```

4. Isi environment variables di .env.local
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Jalankan aplikasi
```bash
npm run dev
# atau
yarn dev
```

## 💾 Struktur Database

### Tabel `voters`
- id (uuid, primary key)
- nis (string, unique)
- full_name (string)
- class (string)
- has_voted (boolean)
- selected_candidate (uuid, foreign key)
- created_at (timestamp)

### Tabel `candidates`
- id (uuid, primary key)
- candidate_number (integer)
- ketua_name (string)
- wakil_name (string)
- ketua_class (string)
- wakil_class (string)
- visi (text)
- misi (text)
- program_kerja (text)
- ketua_photo_url (string)
- wakil_photo_url (string)
- created_at (timestamp)

### Tabel `votes`
- id (uuid, primary key)
- voter_id (uuid, foreign key)
- candidate_id (uuid, foreign key)
- created_at (timestamp)

## 📝 Panduan Penggunaan

### Untuk Admin

1. **Login Admin**
   - Akses halaman `/admin`
   - Login menggunakan kredensial admin

2. **Mengelola Kandidat**
   - Buka menu "Kandidat"
   - Tambah/edit/hapus data kandidat
   - Upload foto kandidat
   - Isi visi, misi, dan program kerja

3. **Mengelola Pemilih**
   - Buka menu "Pemilih"
   - Tambah pemilih satu per satu
   - Import data pemilih via CSV
   - Format CSV: nis,full_name,class

4. **Melihat Hasil**
   - Buka menu "Hasil"
   - Lihat statistik real-time
   - Export hasil ke CSV
   - Cetak laporan

### Untuk Pemilih

1. **Login**
   - Masukkan NIS
   - Sistem akan memverifikasi kesesuaian data

2. **Memilih**
   - Lihat profil lengkap kandidat
   - Klik "Pilih" pada kandidat yang diinginkan
   - Konfirmasi pilihan
   - Setelah memilih, tidak bisa mengubah pilihan

## 🔒 Keamanan

- Autentikasi berbasis token
- Row Level Security (RLS) di Supabase
- Validasi input di frontend dan backend
- Pencegahan double voting
- Enkripsi data sensitif
- Session management

## 📊 Format CSV

### Import Pemilih
```csv
nis,full_name,class
12345,Nama Siswa 1,XII RPL 1
12346,Nama Siswa 2,XI TKJ 2
```

### Export Hasil
```csv
Statistik Pemilihan OSIS
Total Pemilih,100
Sudah Memilih,75
Belum Memilih,25
Persentase Partisipasi,75%

Hasil Per Kandidat
Nomor Urut,Ketua,Wakil,Jumlah Suara,Persentase
1,Ketua 1,Wakil 1,40,53.3%
2,Ketua 2,Wakil 2,35,46.7%
```

## 🤝 Kontribusi

Kontribusi selalu diterima dengan senang hati. Untuk kontribusi besar, silakan buka issue terlebih dahulu untuk mendiskusikan perubahan yang diinginkan.

## 📄 Lisensi

[MIT License](LICENSE)

## 👥 Tim Pengembang

- [Bima Jovanta](https://github.com/bimadevs)

## 📞 Kontak

Untuk pertanyaan dan dukungan, silakan hubungi:
- Email: bimaj0206@gmail.com
- Website: https://bimadev.xyz

## 🙏 Ucapan Terima Kasih

Terima kasih kepada semua kontributor dan pengguna yang telah membantu mengembangkan PilihKu.
