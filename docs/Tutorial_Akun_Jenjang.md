# Tutorial & Panduan Penggunaan Akun Berjenjang (Hierarchy Roles)

Sistem Al Madinah menggunakan sistem keagenan multi-tier (berjenjang) yang terdiri dari 5 level akun:
1. **Pusat** (Owner/Admin Utama)
2. **Cabang**
3. **Mitra**
4. **Agen**
5. **Reseller**

Setiap akun memiliki hak akses berbeda dan tampilan (Dashboard & Menu) yang disesuaikan dengan wewenangnya. Dokumen ini menjelaskan cara masuk, apa yang dapat dilihat, dan fitur yang tersedia untuk masing-masing jenjang berdasar data percobaan (_seed data_) terbaru.

---

## 1. Akun Pusat
Akun ini adalah level tertinggi yang memiliki akses penuh terhadap seluruh fitur platform.

- **Email Login:** `admin@almadinahms.com`
- **Password:** `password123`

### Fitur Tersedia:
*   **Dashboard Global:** Melihat "Total Jamaah Global" dan "Total Revenue Global" dari seluruh cabang dan agen di bawahnya. Terdapat juga grafik "Performa Cabang" untuk membandingkan penjualan antar cabang.
*   **Kelola Paket & Master Data:** Bisa menambah, mengedit, dan menghapus Paket Umroh, Data Hotel, Pesawat, dll.
*   **Kelola Testimoni:** Dapat menambahkan bukti testimoni yang akan ditampilkan di halaman depan website.
*   **Monitoring Jaringan:** Memantau seluruh Cabang, Mitra, Agen, dan Reseller yang terdaftar di sistem.
*   **Pembayaran & Pencairan Konfirmasi:** Pusat yang memberikan persetujuan (_approve_) jika ada permintaan pencairan (_disbursement_) komisi dari level di bawahnya.

---

## 2. Akun Cabang (Contoh: Cabang Jakarta & Surabaya)
Cabang adalah representasi perusahaan di daerah tertentu. Cabang membawahi Mitra, Agen, dan Reseller.

- **Email Login (Jakarta):** `jakarta@almadinahms.com`
- **Email Login (Surabaya):** `surabaya@almadinahms.com`
- **Password:** `password123`

### Fitur Tersedia:
*   **Dashboard Cabang:** Tampilannya berbeda dengan Pusat. Indikator "Total Jamaah" dan "Revenue" hanya mencakup hasil penjualan tim cabang tersebut (dan jaringan di bawahnya).
*   **Data Jamaah & Pemesanan (Booking):** Bisa mendaftarkan jamaah ke paket yang dibuat oleh Pusat, melihat status _seat_, dan menginput pembayaran jamaah.
*   **Komisi:** Cabang mendapatkan komisi terbesar yang diatur oleh Pusat. Bisa melihat riwayat Saldo Komisi dan mengajukan pencairan.
*   *Catatan:* Cabang tidak bisa mengubah Master Data (seperti Hotel, Pesawat) atau Paket Umroh.

---

## 3. Akun Mitra
Mitra adalah partner bisnis yang mendaftar di bawah sebuah Cabang.

- **Email Login:** `mitra.ahmad@gmail.com`
- **Password:** `password123`

### Fitur Tersedia:
*   **Dashboard Mitra:** Hanya melihat performa penjualan dan komisi miliknya sendiri serta tim afiliasinya (Agen/Reseller di bawahnya).
*   **Pendaftaran & Tracking:** Bisa mendaftarkan jamaah. Terdapat link Afiliasi khusus yang bisa dibackan untuk merekrut Agen baru di bawahnya.
*   **Komisi:** Nilai komisi lebih kecil dari Cabang, tapi lebih besar dari Agen.

---

## 4. Akun Agen
Agen berada di bawah struktur Mitra dan fokus pada penjualan langsung (B2C) serta rekrutmen Reseller kecil.

- **Email Login:** `agen.budi@gmail.com`
- **Password:** `password123`

### Fitur Tersedia:
*   **Dashboard Individu:** Fokus pada monitoring komisi, prospek, dan status pendaftaran jamaah.
*   Mendapatkan bahan promosi dari pusat/mitra yang di-_download_ di dashboard.
*   Dapat meminta pencairan komisi (Disbursement) ke rekening pribadinya setelah mendapat jamaah.

---

## 5. Akun Reseller
Reseller adalah afiliator lapangan yang mendaftarkan orang terdekatnya atau menyebarkan _link referral_.

- **Email Login:** `reseller.cindi@gmail.com`
- **Password:** `password123`

### Fitur Tersedia:
*   **Dashboard Minimalis:** Tampilan paling _simple_. Hanya berisi Saldo Komisi, Total Closing, dan _Tracking Link Referral_.
*   Pendaftaran jamaah yang masuk menggunakan _link_ Reseller ini secara otomatis memberikan komisi ke saldo akun ini (dan juga sebagian mengalir ke _upline_ di atasnya).

---

## Cara Verifikasi Alur Sistem Berjenjang:
1. Masuk sebagai **Pusat** (`admin@almadinahms.com`), lalu cek di menu **Monitoring Jaringan -> Hierarki & Tim**. Anda akan melihat struktur _tree_ (pohon jaringan) dari Cabang ➔ Mitra ➔ Agen ➔ Reseller.
2. Masuk sebagai **Cabang Jakarta** (`jakarta@almadinahms.com`). Perhatikan bahwa Cabang ini tidak punya akses ke menu **Manajemen Produk** secara penuh, namun bisa melihat performa sub-agen di bawahnya.
3. Masuk sebagai **Reseller** (`reseller.cindi@gmail.com`), Anda akan melihat menu yang jauh lebih sedikit, fokus semata ke *Marketing Materials* dan *Pencairan Komisi*.
