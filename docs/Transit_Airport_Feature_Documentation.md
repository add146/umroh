# Dokumentasi Fitur: Transit Airport & Multi-City Departure

Dokumen ini mendokumentasikan implementasi fitur **Transit Airport / Multi-City Departure** pada platform Al Madinah Haji & Umroh. Fitur ini memungkinkan jamaah memilih kota keberangkatan yang berbeda (misalnya asal Surabaya atau Jakarta) pada satu jadwal keberangkatan yang sama dengan mekanisme penyesuaian harga khusus dan kuota global yang terbagi.

---

## 1. Desain Arsitektur & Database

Fitur ini menggunakan pendekatan **Global Quota** (satu kuota kursi terbagi secara global per jadwal keberangkatan) dengan penyesuaian harga (price adjustment) dinamis berdasarkan bandara boarding yang dipilih oleh jamaah.

### Tabel Baru: `departure_boarding_points`
Tabel ini merepresentasikan rute bandara asal dan bandara transit dalam sebuah jadwal keberangkatan.

| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | `text` (UUID) | Primary key. |
| `departure_id` | `text` (UUID) | Foreign key ke tabel `departures`. |
| `airport_id` | `text` (UUID) | Foreign key ke tabel `airports`. |
| `is_origin` | `integer` (Boolean) | Penanda apakah kota ini adalah kota asal pertama penerbangan (`true`) atau transit (`false`). |
| `sort_order` | `integer` | Urutan bandara pada rute perjalanan (mis. 1 = Surabaya, 2 = Jakarta, 3 = Jeddah). |
| `price_adjustment` | `integer` | Penyesuaian harga (positif/negatif) untuk jamaah yang naik dari kota ini. |
| `notes` | `text` | Catatan khusus keberangkatan (contoh: lokasi meeting point di bandara). |
| `created_at` | `text` | Waktu pembuatan (default: `datetime('now')`). |

### Relasi Baru pada `bookings`
Kolom `boarding_point_id` ditambahkan ke tabel `bookings` untuk mencatat titik naik keberangkatan yang dipilih jamaah secara spesifik.

---

## 2. API Update (Backend)

Beberapa endpoint API diperbarui untuk mendukung relasi dan penghitungan harga titik keberangkatan:

### `GET /api/packages` & `GET /api/packages/:id`
* Memuat seluruh list jadwal keberangkatan (`departures`) lengkap dengan relasi `boardingPoints` dan data detail `airport` masing-masing titik.

### `POST /api/departures`
* Menerima array `boardingPoints` dalam body JSON untuk disimpan secara batch saat pembuatan jadwal baru.
* **Skema Input Zod**:
  ```typescript
  const boardingPointSchema = z.object({
      airportId: z.string().uuid(),
      isOrigin: z.boolean().default(false),
      sortOrder: z.number().int().default(0),
      priceAdjustment: z.number().int().default(0),
      notes: z.string().optional().nullable(),
  });
  ```

### `POST /api/bookings`
* Menerima parameter opsional `boardingPointId`.
* **Kalkulasi Harga Akhir**:
  $$\text{Total Harga} = \text{Harga Dasar Paket} + \text{Penyesuaian Kamar} + \text{Penyesuaian Kota Keberangkatan}$$
* Menyimpan pilihan `boardingPointId` ke dalam baris booking di database.

---

## 3. Alur UI/UX & Tampilan (Frontend)

### A. Pengelolaan Admin (Pusat)
Pada halaman **Admin Package Detail** ([PackageDetail.tsx](file:///c:/Aplikasi/umroh/frontend/src/pages/admin/PackageDetail.tsx)):
1. **Repeater Form**: Di dalam modal "Tambah Keberangkatan", admin dapat menentukan lebih dari satu kota keberangkatan menggunakan tombol **+ Tambah Kota Keberangkatan**.
2. **Pengaturan Khusus**: Admin bisa menentukan kota mana yang bertindak sebagai *Origin* (kota asal), urutan transitnya (`sortOrder`), penyesuaian harga, serta instruksi khusus di kolom catatan.
3. **Route Timeline**: Daftar jadwal keberangkatan di dashboard admin kini menampilkan rute lengkap perjalanan (contoh: `SUB ➔ CGK`).

### B. Pencarian & Filter Landing Page
Pada **Landing Page** ([Landing.tsx](file:///c:/Aplikasi/umroh/frontend/src/pages/Landing.tsx)):
1. **Dropdown Filter**: Filter "Keberangkatan" ditambahkan ke dalam search box utama.
2. **Pencarian Pintar**: Filter mengekstrak semua bandara unik dari paket yang tersedia secara dinamis dan menyaring paket berdasarkan rute penerbangan yang dilalui.

### C. Halaman Detail Paket Publik
Pada **Public Package Detail** ([PublicPackageDetail.tsx](file:///c:/Aplikasi/umroh/frontend/src/pages/PublicPackageDetail.tsx)):
1. **Rute Header**: Menampilkan timeline rute bandara lengkap (misalnya `Surabaya (SUB) ➔ Jakarta (CGK)`) agar jamaah mengetahui alur transit.
2. **Selector Kota**: Selector berbasis radio card dihadirkan jika jadwal tersebut memiliki lebih dari satu kota boarding. Jamaah dapat langsung melihat penyesuaian harganya (misalnya diskon `- Rp 2.000.000` jika boarding dari Jakarta menggantikan titik asal Surabaya).
3. **Checkout Prefill**: Tombol *Pesan Sekarang* meneruskan parameter keberangkatan, kamar, dan kota asal ke URL pendaftaran secara otomatis.

### D. Formulir Registrasi & Invoice
Pada **Formulir Registrasi** ([StepProduct.tsx](file:///c:/Aplikasi/umroh/frontend/src/components/registration/StepProduct.tsx) & [StepReview.tsx](file:///c:/Aplikasi/umroh/frontend/src/components/registration/StepReview.tsx)):
1. **Opsi Form**: Step 1 memuat kota keberangkatan secara prefilled atau manual.
2. **Review Rincian**: Step 6 (Review) membedah seluruh komponen biaya (Harga dasar, penyesuaian kamar, dan penyesuaian kota) sebelum booking disubmit ke server.

---

## 4. Panduan Penggunaan Bagi Administrator

### Menambahkan Jadwal Multi-City / Transit:
1. Masuk ke panel **Admin -> Paket Pilihan -> Detail Paket**.
2. Klik **+ Tambah Keberangkatan**.
3. Isi tanggal dan kuota kursi global.
4. Klik **Tambah Kota Keberangkatan** untuk mendaftarkan bandara pertama (misalnya Juanda SUB, set sebagai *Kota Asal / Origin*, Price Adjustment: `0`, Sort Order: `1`).
5. Klik **Tambah Kota Keberangkatan** lagi untuk mendaftarkan bandara kedua tempat jamaah lain akan menunggu (misalnya Soekarno-Hatta CGK, set sebagai *Transit*, Price Adjustment: `-2000000` (jika tiket dari Jakarta lebih murah Rp 2 juta), Sort Order: `2`).
6. Klik **Simpan**. Jamaah kini dapat memilih mendaftar dari Surabaya (harga penuh) maupun Jakarta (potongan harga 2 juta) secara mandiri.
