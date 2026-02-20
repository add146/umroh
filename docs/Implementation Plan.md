# Implementation Plan — Aplikasi Haji & Umroh Terintegrasi

## Tujuan

Membuat aplikasi manajemen Haji & Umroh end-to-end menggunakan Cloudflare Workers/Pages/D1/R2. Proyek ini dimulai dari nol (hanya folder `docs/` yang berisi PRD). Dokumen ini berisi langkah instalasi dan task breakdown per fase.

---

## Fase 0 — Instalasi & Project Setup

### 0.1. Prasyarat

| Tool | Versi Minimum | Cara Install |
|------|---------------|--------------|
| Node.js | v18+ | `winget install OpenJS.NodeJS.LTS` |
| npm | v9+ | Bundled with Node.js |
| Wrangler CLI | v3+ | `npm install -g wrangler` |
| Git | Latest | `winget install Git.Git` |

### 0.2. Cloudflare Account Setup

```
1. Login ke https://dash.cloudflare.com
2. Pastikan akun sudah verified
3. Di terminal: `wrangler login` → buka browser → authorize
```

### 0.3. Struktur Proyek

```
c:\Aplikasi\umroh\
├── docs/                          # Dokumentasi (sudah ada)
│   ├── Pengembangan Aplikasi Haji Umroh Terintegrasi.md
│   └── PRD - Aplikasi Haji Umroh Terintegrasi.md
├── frontend/                      # [NEW] React + Vite app → deploy ke CF Pages
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Route pages
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # Utilities, API client, auth helpers
│   │   ├── stores/                # Zustand stores
│   │   ├── styles/                # CSS files, design tokens
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── api/                           # [NEW] Cloudflare Worker → Hono.js API
│   ├── src/
│   │   ├── routes/                # Route handlers per domain
│   │   ├── middleware/            # Auth, RBAC, CORS, error handling
│   │   ├── services/             # Business logic layer
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle ORM schema definitions
│   │   │   └── migrations/       # SQL migration files
│   │   ├── lib/                  # Shared utilities
│   │   └── index.ts              # Worker entry point
│   ├── wrangler.toml
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   └── package.json
└── .github/
    └── workflows/                 # [NEW] CI/CD pipelines
        └── deploy.yml
```

### 0.4. Inisialisasi Proyek

#### Step 1: Git Init
```bash
cd c:\Aplikasi\umroh
git init
```

#### Step 2: Backend (API Worker)
```bash
mkdir api && cd api
npm init -y
npm install hono drizzle-orm @hono/zod-validator zod jose
npm install -D wrangler typescript @cloudflare/workers-types drizzle-kit @types/node
npx wrangler init . --yes
```

#### Step 3: Frontend (Vite + React)
```bash
cd c:\Aplikasi\umroh
npx -y create-vite@latest frontend -- --template react-ts
cd frontend
npm install react-router-dom zustand @tanstack/react-query react-hook-form @hookform/resolvers zod
npm install -D @types/react @types/react-dom
```

#### Step 4: Cloudflare Resources
```bash
# Buat D1 database
wrangler d1 create umroh-db

# Buat R2 bucket
wrangler r2 bucket create umroh-documents
```

#### Step 5: Konfigurasi `wrangler.toml` (API)
```toml
name = "umroh-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "umroh-db"
database_id = "<id dari step 4>"

[[r2_buckets]]
binding = "R2_DOCUMENTS"
bucket_name = "umroh-documents"

[vars]
ENVIRONMENT = "development"
FRONTEND_URL = "http://localhost:5173"
```

#### Step 6: Verifikasi Instalasi
```bash
# Test API
cd api && wrangler dev

# Test Frontend (terminal terpisah)
cd frontend && npm run dev
```

---

## Fase 1 — Foundation (Auth, RBAC, Hierarki) [COMPLETE]


### Deliverables
- Sistem login/register dengan JWT
- RBAC 5 tingkat (Pusat/Cabang/Mitra/Agen/Reseller)
- Closure Table untuk hierarki MLM
- Dashboard skeleton (sidebar, layout, routing)

### Tasks

#### 1.1. Database Schema Foundation

| # | Task | File | Detail |
|---|------|------|--------|
| 1.1.1 | Definisi Drizzle schema — `users` | `api/src/db/schema.ts` | Tabel users dengan role enum, affiliate_code, parent_id |
| 1.1.2 | Definisi Drizzle schema — `hierarchy_paths` | `api/src/db/schema.ts` | Closure Table: ancestor_id, descendant_id, path_length |
| 1.1.3 | Generate & run migration | `api/src/db/migrations/` | `npx drizzle-kit generate` → `wrangler d1 execute` |
| 1.1.4 | Seed data Pusat user | `api/src/db/seed.ts` | Script untuk insert super admin awal |

#### 1.2. Auth System

| # | Task | File | Detail |
|---|------|------|--------|
| 1.2.1 | JWT utility (sign, verify, refresh) | `api/src/lib/jwt.ts` | Pakai `jose` library. Access token 15min, refresh 7d |
| 1.2.2 | Password hashing utility | `api/src/lib/password.ts` | Pakai Web Crypto API (native di Workers) |
| 1.2.3 | POST `/api/auth/login` | `api/src/routes/auth.ts` | Validasi email+password → return JWT + set httpOnly cookie |
| 1.2.4 | POST `/api/auth/refresh` | `api/src/routes/auth.ts` | Baca refresh token dari cookie → issue new access token |
| 1.2.5 | GET `/api/auth/me` | `api/src/routes/auth.ts` | Return user profile dari JWT |
| 1.2.6 | Auth middleware | `api/src/middleware/auth.ts` | Validate JWT dari Authorization header atau cookie |

#### 1.3. RBAC & User Management (Self-Service Downline Creation)

| # | Task | File | Detail |
|---|------|------|--------|
| 1.3.1 | RBAC middleware | `api/src/middleware/rbac.ts` | `requireRole('pusat', 'cabang')` — cek role user |
| 1.3.2 | Downline role mapping | `api/src/lib/roleHierarchy.ts` | Map: `pusat→cabang`, `cabang→mitra`, `mitra→agen`, `agen→reseller`. Reseller = tidak bisa buat |
| 1.3.3 | POST `/api/users` — buat downline | `api/src/routes/users.ts` | Auto-set role downline berdasarkan role upline. Validasi: upline hanya bisa buat 1 level di bawah. Auto-insert closure table paths |
| 1.3.4 | GET `/api/users/downline` | `api/src/routes/users.ts` | Query closure table → return downline tree (hanya milik sendiri) |
| 1.3.5 | Closure table helper functions | `api/src/services/hierarchy.ts` | `insertUserWithHierarchy()`, `getUpline()`, `getDownline()`, `getDirectChildren()` |
| 1.3.6 | PATCH `/api/users/:id` | `api/src/routes/users.ts` | Update user (activate/deactivate, edit). Hanya bisa edit downline langsung |
| 1.3.7 | DELETE `/api/users/:id` (soft) | `api/src/routes/users.ts` | Deactivate downline (is_active=0). Hanya bisa deactivate downline sendiri |

#### 1.4. Frontend — Auth & Layout

| # | Task | File | Detail |
|---|------|------|--------|
| 1.4.1 | Design system — CSS variables, reset | `frontend/src/styles/index.css` | Warna (hijau tua, emas, putih), typography (Inter), spacing |
| 1.4.2 | Login page | `frontend/src/pages/Login.tsx` | Form email + password, validasi Zod, call `/api/auth/login` |
| 1.4.3 | Auth store (Zustand) | `frontend/src/stores/authStore.ts` | State: user, token, isAuthenticated. Actions: login, logout, refresh |
| 1.4.4 | API client wrapper | `frontend/src/lib/api.ts` | Fetch wrapper dengan auto-attach token, auto-refresh, error handling |
| 1.4.5 | Protected route component | `frontend/src/components/ProtectedRoute.tsx` | Redirect ke login jika tidak authenticated |
| 1.4.6 | Dashboard layout (sidebar + header) | `frontend/src/components/DashboardLayout.tsx` | Sidebar responsive, menu items per role, user avatar, logout |
| 1.4.7 | Dashboard home page (skeleton) | `frontend/src/pages/Dashboard.tsx` | KPI cards placeholder, welcome message |
| 1.4.8 | React Router setup | `frontend/src/App.tsx` | Route definitions: `/login`, `/dashboard/*`, `/packages/*` |
| 1.4.9 | Halaman Downline Management | `frontend/src/pages/DownlineManage.tsx` | Tabel downline langsung, tombol "Tambah [Role Bawahan]", modal form (nama, email, HP, password), auto-generate kode affiliate. Tampil untuk semua role kecuali Reseller |
| 1.4.10 | Role-based sidebar menu | `frontend/src/lib/menuConfig.ts` | Menu sidebar dinamis per role: Pusat lihat "Kelola Cabang", Cabang lihat "Kelola Mitra", dst. Reseller tidak ada menu "Kelola" |

#### 1.5. Deploy & Verify

| # | Task | Detail |
|---|------|--------|
| 1.5.1 | Deploy API Worker | `cd api && wrangler deploy` |
| 1.5.2 | Deploy Frontend | `cd frontend && npm run build && wrangler pages deploy dist` |
| 1.5.3 | Test login flow end-to-end | Login sebagai Pusat → buat Cabang → buat Mitra → verifikasi hierarchy |
| 1.5.4 | Test RBAC | Login sebagai Reseller → coba akses endpoint Pusat → harus 403 |

---

## Fase 2 — Katalog & Booking [COMPLETE]


### Deliverables
- CRUD Paket & Keberangkatan (Departures)
- Tipe Kamar & pricing dinamis
- Formulir pendaftaran jamaah (multi-step)
- Progress bar kuota & auto-close
- Seat locking (30 menit)

### Tasks

#### 2.1. Database — Katalog

| # | Task | File | Detail |
|---|------|------|--------|
| 2.1.1 | Schema: `packages` | `api/src/db/schema.ts` | Name, slug, description, duration, inclusions (JSON), thumbnail |
| 2.1.2 | Schema: `departures` | `api/src/db/schema.ts` | departure_date, airline, origin, total_seats, booked_seats, status |
| 2.1.3 | Schema: `room_types` | `api/src/db/schema.ts` | type (quad/triple/double), price, quota, booked_count |
| 2.1.4 | Schema: `pilgrims` | `api/src/db/schema.ts` | Semua field data jamaah (nama, NIK, alamat, ayah, dll) |
| 2.1.5 | Schema: `bookings` | `api/src/db/schema.ts` | booking_code, pilgrim_id, departure_id, room_type_id, status, payment_mode |
| 2.1.6 | Schema: `seat_locks` | `api/src/db/schema.ts` | departure_id, booking_id, seats_locked, expires_at, status |
| 2.1.7 | Run migration | | `npx drizzle-kit generate && wrangler d1 execute` |

#### 2.2. API — Katalog & Booking

| # | Task | File | Detail |
|---|------|------|--------|
| 2.2.1 | CRUD `/api/packages` | `api/src/routes/packages.ts` | GET list, GET detail by slug, POST/PUT/DELETE (admin only) |
| 2.2.2 | CRUD `/api/departures` | `api/src/routes/departures.ts` | GET list+filter, GET detail+rooms+kuota, POST/PUT (admin) |
| 2.2.3 | CRUD `/api/room-types` | `api/src/routes/room-types.ts` | Manage room types per departure |
| 2.2.4 | POST `/api/bookings` | `api/src/routes/bookings.ts` | Create booking + lock seat (transactional). Auto-detect payment_mode |
| 2.2.5 | Seat lock service | `api/src/services/seatLock.ts` | `lockSeats()`, `releaseExpired()`, auto-update booked_seats & status |
| 2.2.6 | Cron trigger — expired locks | `api/src/index.ts` | Scheduled handler setiap 5 menit → release expired seat locks |
| 2.2.7 | Auto-close kuota logic | `api/src/services/departure.ts` | Saat booking confirmed: `booked_seats += pax`, if >= total → status 'full' |
| 2.2.8 | GET `/api/bookings` | `api/src/routes/bookings.ts` | List bookings (filtered by role access) |

#### 2.3. Frontend — Public Catalog

| # | Task | File | Detail |
|---|------|------|--------|
| 2.3.1 | Landing page / Hero section | `frontend/src/pages/Landing.tsx` | Hero image Ka'bah, tagline, search bar (bulan, kota, harga) |
| 2.3.2 | Komponen `PackageCard` | `frontend/src/components/PackageCard.tsx` | Thumbnail, nama, tanggal, maskapai, harga, **progress bar kuota** |
| 2.3.3 | Komponen `KuotaBar` | `frontend/src/components/KuotaBar.tsx` | Bar horizontal "Kuota: X/Y", warna dinamis, overlay "KUOTA PENUH" |
| 2.3.4 | Halaman katalog paket | `frontend/src/pages/Packages.tsx` | Grid cards, filter, responsive 2-3 kolom |
| 2.3.5 | Halaman detail paket | `frontend/src/pages/PackageDetail.tsx` | Tab (fasilitas, itinerary, syarat), sticky booking panel, pilih kamar |
| 2.3.6 | WhatsApp float button | `frontend/src/components/WhatsAppButton.tsx` | Fixed bottom-right, bounce animation, link WA dinamis |

| # | Task | File | Detail |
|---|------|------|--------|
| 2.4.1 | Multi-step form container | `frontend/src/pages/Registration.tsx` | Stepper 6 bagian (A-F) + Review, react-hook-form + Zod validation |
| 2.4.2 | Bagian A: Pilihan Produk | `frontend/src/components/registration/StepProduct.tsx` | `name` (text), `program` (select), `departure_date` (date picker), `airport` (select), `rooms` (card selection + pax) |
| 2.4.3 | Bagian B: Data Pribadi | `frontend/src/components/registration/StepPersonal.tsx` | `no_ktp` (16 digit), `ktp` (file upload → OCR), `sex` (select), `born` (text), `address` (textarea), `father_name` (text) |
| 2.4.4 | Bagian C: Data Paspor | `frontend/src/components/registration/StepPassport.tsx` | `has_passport` (toggle), conditional: `no_passport`, `passport` (file upload → OCR), `passport_from`, `passport_releaseAt`, `passport_expiredAt` (date pickers) |
| 2.4.5 | Bagian D: Kontak & Status | `frontend/src/components/registration/StepContact.tsx` | `marital_status` (select), `phone`, `home_phone`, `last_education` (select), `work`, `disease_history` (textarea) |
| 2.4.6 | Bagian E: Keluarga & Sumber | `frontend/src/components/registration/StepFamily.tsx` | `fam_member` (dynamic list +/-), `fam_contact_name`, `fam_contact`, `source_from` (select) |
| 2.4.7 | Review & Pembayaran (placeholder) | `frontend/src/components/registration/StepReview.tsx` | Review semua data, total harga, tombol submit → pembayaran (Fase 3) |
| 2.4.8 | Countdown timer component | `frontend/src/components/CountdownTimer.tsx` | MM:SS, sticky top, merah, auto-redirect saat habis |

#### 2.5. Admin — Manajemen Katalog

| # | Task | File | Detail |
|---|------|------|--------|
| 2.5.1 | Halaman CRUD Paket | `frontend/src/pages/admin/PackageManage.tsx` | Tabel paket, modal create/edit, upload thumbnail ke R2 |
| 2.5.2 | Halaman CRUD Keberangkatan | `frontend/src/pages/admin/DepartureManage.tsx` | Tabel departures + kuota bar per row, modal create/edit |
| 2.5.3 | Halaman CRUD Room Types | `frontend/src/pages/admin/RoomTypeManage.tsx` | Per departure: manage quad/triple/double + harga |
| 2.5.4 | Halaman daftar Jamaah | `frontend/src/pages/admin/PilgrimList.tsx` | Tabel jamaah, filter by departure/status, detail view |
| 2.5.5 | Halaman daftar Booking | `frontend/src/pages/admin/BookingList.tsx` | Tabel booking, filter, update status |

---

## Fase 3 — Payment (Dual Mode) [COMPLETE]

### Deliverables
- Midtrans Snap integration (jika API key ada)
- Manual transfer + upload bukti (fallback)
- Sistem invoice bertahap (DP + cicilan)
- Admin verify bukti transfer

### Tasks

#### 3.1. Database — Payment

| # | Task | File | Detail |
|---|------|------|--------|
| 3.1.1 | Schema: `payment_invoices` | `api/src/db/schema.ts` | invoice_code, amount, due_date, payment_mode, transfer_proof fields |
| 3.1.2 | Schema: `payment_transactions` | `api/src/db/schema.ts` | Midtrans webhook data store |
| 3.1.3 | Schema: `bank_accounts` | `api/src/db/schema.ts` | Rekening tujuan transfer manual |
| 3.1.4 | Run migration | | Generate & execute |

#### 3.2. API — Payment

| # | Task | File | Detail |
|---|------|------|--------|
| 3.2.1 | Payment mode detection | `api/src/services/payment.ts` | `getPaymentMode(env)` → cek MIDTRANS_SERVER_KEY |
| 3.2.2 | GET `/api/payments/mode` | `api/src/routes/payments.ts` | Return mode aktif (auto/manual) + daftar bank jika manual |
| 3.2.3 | POST `/api/payments/create-invoice` | `api/src/routes/payments.ts` | Buat invoice DP/cicilan. Auto-set payment_mode |
| 3.2.4 | POST `/api/payments/snap-token` | `api/src/routes/payments.ts` | Midtrans Snap token (hanya mode auto). Server-to-server call |
| 3.2.5 | POST `/api/payments/webhook` | `api/src/routes/payments.ts` | Midtrans webhook: verify signature, update invoice & booking |
| 3.2.6 | POST `/api/payments/upload-proof` | `api/src/routes/payments.ts` | Upload bukti transfer ke R2, update invoice status → 'pending' |
| 3.2.7 | PATCH `/api/payments/:id/verify` | `api/src/routes/payments.ts` | Admin approve/reject bukti. Update invoice & booking status |
| 3.2.8 | CRUD `/api/bank-accounts` | `api/src/routes/bank-accounts.ts` | Admin kelola rekening tujuan |
| 3.2.9 | Invoice generation service | `api/src/services/invoice.ts` | Auto-generate cicilan setelah DP paid. Hitung jadwal jatuh tempo |
| 3.2.10 | Commission trigger after payment | `api/src/services/payment.ts` | Setelah payment confirmed → trigger commission calculation |

#### 3.3. Frontend — Payment

| # | Task | File | Detail |
|---|------|------|--------|
| 3.3.1 | Step 5 — Mode Midtrans | `frontend/src/components/registration/StepPayment.tsx` | Load Midtrans Snap JS SDK, `snap.pay(token)` |
| 3.3.2 | Step 5 — Mode Manual | `frontend/src/components/registration/StepPayment.tsx` | Info rekening + form upload bukti + nominal field |
| 3.3.3 | Dashboard Jamaah — Payment status | `frontend/src/pages/MyBooking.tsx` | Stepper visual, ringkasan, tombol bayar cicilan, status per invoice |
| 3.3.4 | Admin — Verifikasi Pembayaran | `frontend/src/pages/admin/PaymentVerify.tsx` | Tabel "Menunggu Verifikasi", modal bukti, Approve/Reject |
| 3.3.5 | Admin — Daftar Invoice | `frontend/src/pages/admin/InvoiceList.tsx` | Tabel semua invoice, filter status/mode |
| 3.3.6 | Admin — Pengaturan Rekening | `frontend/src/pages/admin/BankSettings.tsx` | CRUD rekening tujuan transfer |
| 3.3.7 | Payment mode indicator badge | `frontend/src/components/PaymentModeBadge.tsx` | "💳 Midtrans" (biru) atau "🏦 Transfer" (hijau) |

---

## Fase 4 — Affiliate Engine [COMPLETE]

### Deliverables
- Link affiliate unik per user
- Server-side cookie tracking (7 hari)
- Commission calculation via Closure Table
- Dashboard affiliator

### Tasks

#### 4.1. Database — Affiliate

| # | Task | File | Detail |
|---|------|------|--------|
| 4.1.1 | Schema: `commission_rules` | `api/src/db/schema.ts` | user_id, target_role, commission_type, commission_value |
| 4.1.2 | Schema: `commission_ledger` | `api/src/db/schema.ts` | booking_id, user_id, amount, status |
| 4.1.3 | Schema: `affiliate_clicks` | `api/src/db/schema.ts` | affiliate_code, ip_hash, user_agent, timestamps |
| 4.1.4 | Run migration | | Generate & execute |

#### 4.2. API — Affiliate

| # | Task | File | Detail |
|---|------|------|--------|
| 4.2.1 | Affiliate cookie middleware | `api/src/middleware/affiliate.ts` | Intercept `?ref=` param → set server-side cookie (7d, httpOnly, secure) |
| 4.2.2 | Affiliate attribution on booking | `api/src/services/booking.ts` | Read cookie → bind affiliate_user_id ke booking |
| 4.2.3 | Commission calculation service | `api/src/services/commission.ts` | Query closure table → get upline → apply commission_rules → insert ledger |
| 4.2.4 | POST `/api/affiliate/commission-rules` | `api/src/routes/affiliate.ts` | Set aturan komisi untuk downline |
| 4.2.5 | GET `/api/affiliate/dashboard` | `api/src/routes/affiliate.ts` | Stats: total klik, registrasi, komisi, conversion rate |
| 4.2.6 | GET `/api/affiliate/downline` | `api/src/routes/affiliate.ts` | List downline + performa per user |
| 4.2.7 | GET `/api/commissions` | `api/src/routes/commissions.ts` | List komisi per user, filter status |
| 4.2.8 | POST `/api/commissions/disburse` | `api/src/routes/commissions.ts` | Admin: cairkan komisi (ubah status → 'disbursed') |
| 4.2.9 | Click tracking endpoint | `api/src/routes/affiliate.ts` | Log affiliate clicks ke `affiliate_clicks` table |

#### 4.3. Frontend — Affiliate

| # | Task | File | Detail |
|---|------|------|--------|
| 4.3.1 | Dashboard Affiliator — Stats | `frontend/src/pages/affiliate/Dashboard.tsx` | Stat cards (klik, registrasi, komisi, rate), line chart |
| 4.3.2 | Generate Link panel | `frontend/src/components/AffiliateLinkGen.tsx` | Copy link, QR code auto-generate |
| 4.3.3 | Tabel Jamaah Referral | `frontend/src/pages/affiliate/Referrals.tsx` | Nama, status booking, tanggal, komisi |
| 4.3.4 | Downline Management | `frontend/src/pages/affiliate/Downline.tsx` | Tabel downline, performa, set komisi modal |
| 4.3.5 | Commission Tree Viewer | `frontend/src/components/CommissionTree.tsx` | Visualisasi pohon hierarki collapsible |
| 4.3.6 | Komisi saya + history | `frontend/src/pages/affiliate/MyCommissions.tsx` | List komisi, filter status, total earned |

---

## Fase 5 — Operations

### Deliverables
- OCR upload (KTP & Paspor)
- Document management (R2)
- Equipment checklist
- Rooming list

### Tasks

#### 5.1. Database — Operations

| # | Task | File | Detail |
|---|------|------|--------|
| 5.1.1 | Schema: `documents` | `api/src/db/schema.ts` | pilgrim_id, doc_type, r2_key, ocr_result, verified |
| 5.1.2 | Schema: `equipment_items` | `api/src/db/schema.ts` | Master perlengkapan (koper, ihram, dll) |
| 5.1.3 | Schema: `equipment_checklist` | `api/src/db/schema.ts` | booking_id, item_id, received, received_by |
| 5.1.4 | Run migration | | Generate & execute |

#### 5.2. API — Operations

| # | Task | File | Detail |
|---|------|------|--------|
| 5.2.1 | POST `/api/documents/upload` | `api/src/routes/documents.ts` | Upload ke R2, call OCR API, save result |
| 5.2.2 | OCR service (KTP/Paspor) | `api/src/services/ocr.ts` | Call Mindee/Glair.ai API, parse response → structured data |
| 5.2.3 | GET `/api/documents/:id/presigned` | `api/src/routes/documents.ts` | Generate R2 presigned URL (admin only) |
| 5.2.4 | CRUD `/api/equipment-items` | `api/src/routes/equipment.ts` | Master perlengkapan (admin) |
| 5.2.5 | GET/PATCH `/api/equipment/:booking` | `api/src/routes/equipment.ts` | Checklist perlengkapan per booking, bulk update |
| 5.2.6 | GET `/api/rooming/:departure_id` | `api/src/routes/rooming.ts` | Rooming list per departure |
| 5.2.7 | PATCH `/api/rooming/assign` | `api/src/routes/rooming.ts` | Assign jamaah ke kamar |

#### 5.3. Frontend — Operations

| # | Task | File | Detail |
|---|------|------|--------|
| 5.3.1 | OCR Preview Card | `frontend/src/components/OCRPreview.tsx` | Foto KTP + overlay hasil extract, edit manual |
| 5.3.2 | Integrasi OCR ke Step 2 form | `frontend/src/components/registration/StepPersonal.tsx` | Upload KTP → loading → auto-fill + highlight kuning |
| 5.3.3 | Admin — Document viewer | `frontend/src/pages/admin/Documents.tsx` | Per jamaah: list dokumen, presigned URL viewer, verify toggle |
| 5.3.4 | Admin — Perlengkapan | `frontend/src/pages/admin/Equipment.tsx` | Per departure: checklist grid, bulk update |
| 5.3.5 | Admin — Rooming Board | `frontend/src/pages/admin/Rooming.tsx` | Kanban-style: kolom=kamar, card=jamaah, drag-and-drop |

---

## Fase 6 — Communication & Compliance

### Deliverables
- WAHA WhatsApp integration
- Auto-notifications (booking, payment, reminder)
- Export SISKOPATUH (Excel)
- Export manifest maskapai

### Tasks

#### 6.1. API — WhatsApp

| # | Task | File | Detail |
|---|------|------|--------|
| 6.1.1 | WAHA client service | `api/src/services/whatsapp.ts` | `sendMessage(phone, message)` via WAHA REST API |
| 6.1.2 | Message templates | `api/src/lib/messageTemplates.ts` | Template: booking confirmation, payment received, reminder, etc |
| 6.1.3 | Hook: after booking created | `api/src/services/booking.ts` | Kirim WA ke jamaah + agen (jika afiliasi) |
| 6.1.4 | Hook: after payment confirmed | `api/src/services/payment.ts` | Kirim WA receipt ke jamaah |
| 6.1.5 | Cron: payment reminders | `api/src/index.ts` | H-7, H-1 jatuh tempo → kirim WA reminder |
| 6.1.6 | Cron: incomplete document reminder | `api/src/index.ts` | Scan jamaah tanpa dokumen lengkap → kirim WA |

#### 6.2. API — Export

| # | Task | File | Detail |
|---|------|------|--------|
| 6.2.1 | Install xlsx library | `api/package.json` | `npm install xlsx` |
| 6.2.2 | GET `/api/export/siskopatuh` | `api/src/routes/export.ts` | Generate Excel format Kemenag → return file download |
| 6.2.3 | GET `/api/export/manifest` | `api/src/routes/export.ts` | Generate manifest maskapai Excel |
| 6.2.4 | GET `/api/export/jamaah` | `api/src/routes/export.ts` | Export data jamaah per departure |

#### 6.3. Frontend — Communication & Export

| # | Task | File | Detail |
|---|------|------|--------|
| 6.3.1 | Admin — Export dropdown | `frontend/src/components/ExportButton.tsx` | Dropdown menu: SISKOPATUH / Manifest / Data Jamaah |
| 6.3.2 | Admin — WhatsApp log viewer | `frontend/src/pages/admin/WhatsAppLog.tsx` | (Opsional) Log pesan terkirim |

---

## Fase 7 — Polish & Launch

### Deliverables
- UI polish & responsive finalization
- Performance optimization
- Security hardening
- UAT & go-live

### Tasks

| # | Task | Detail |
|---|------|--------|
| 7.1 | Responsive audit | Test semua halaman di mobile/tablet/desktop viewport |
| 7.2 | Accessibility review | Contrast ratio, focus states, ARIA labels, keyboard navigation |
| 7.3 | Loading states & skeletons | Semua fetch operations punya loading indicator |
| 7.4 | Error boundaries | Global error boundary, 404 page, API error toast |
| 7.5 | Image optimization | Lazy loading, WebP conversion, R2 CDN caching |
| 7.6 | Security headers | CSP, X-Frame-Options, HSTS via Workers |
| 7.7 | Rate limiting | Login attempts, API abuse protection |
| 7.8 | Wrangler Secrets setup | Set semua production secrets (JWT_SECRET, dll) |
| 7.9 | CI/CD pipeline | GitHub Actions: lint → build → deploy Workers & Pages |
| 7.10 | UAT testing | End-to-end test seluruh flow utama |
| 7.11 | Custom domain setup | Cloudflare DNS + Pages custom domain |
| 7.12 | Go-live monitoring | D1 metrics, Worker analytics, error tracking |

---

## Verification Plan

### Per-Phase Verification

| Fase | Metode | Cara Menjalankan |
|------|--------|-----------------|
| **0** | Smoke test | `cd api && wrangler dev` → buka `http://localhost:8787` → harus ada response. `cd frontend && npm run dev` → buka `http://localhost:5173` → harus render. |
| **1** | API test manual | Via browser/Postman: POST `/api/auth/login` → cek JWT. POST `/api/users` → buat hierarchy. GET `/api/users/downline` → verify tree. Login sebagai Reseller → GET admin endpoint → harus 403. |
| **2** | Browser test | Buka halaman katalog → kartu paket tampil dengan kuota bar. Klik detail → pilih kamar → harga update. Submit form → booking terbuat. Tunggu 30 menit → seat lock expired. |
| **3** | Payment flow | **Manual mode**: submit booking → lihat info rekening → upload bukti → admin approve → status updated. **Midtrans** (jika key ada): submit → Snap popup → bayar sandbox → webhook received. |
| **4** | Affiliate flow | Generate link → buka di incognito → daftar → cek booking punya affiliate_user_id. Verify komisi terhitung di commission_ledger. |
| **5** | Document flow | Upload foto KTP → OCR extract otomatis → verifikasi data terisi. Cek R2 bucket ada file. Equipment checklist: centang → saved. |
| **6** | Communication test | Pastikan WAHA running → buat booking → cek WA terkirim. Download export SISKOPATUH → buka Excel → verifikasi format. |
| **7** | Full UAT | End-to-end: buka katalog → pilih paket → daftar → bayar → admin verify → jamaah lunas → export. Test di HP & desktop. |

> [!IMPORTANT]
> Semua fase akan di-test secara manual via browser (buka `http://localhost:5173` untuk frontend, `http://localhost:8787` untuk API). Saat ini belum ada automated test suite — ini bisa ditambahkan di Fase 7 sebagai improvement.
