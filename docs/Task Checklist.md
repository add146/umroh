# Task — Aplikasi Haji & Umroh Terintegrasi

## Fase 0 — Instalasi & Setup
- [x] Git init
- [x] Backend: init Hono.js + Drizzle + Wrangler
- [x] Frontend: init Vite + React + deps
- [x] Buat D1 database & R2 bucket
- [x] Konfigurasi wrangler.toml (D1 + R2 bindings)
- [x] Verifikasi dev server berjalan (API + Frontend)

## Fase 1 — Foundation (Auth, RBAC, Hierarki, Downline)
- [x] Schema: `users` + `hierarchy_paths` (Drizzle)
- [x] Migration: run ke D1
- [x] Seed: Pusat super admin
- [x] Auth: JWT sign/verify/refresh (`jose`)
- [x] Auth: password hashing (Web Crypto)
- [x] API: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`
- [x] Middleware: auth (JWT validation)
- [x] Middleware: RBAC (role check)
- [x] Role hierarchy mapping (`roleHierarchy.ts`): pusat→cabang, cabang→mitra, mitra→agen, agen→reseller
- [x] API: POST `/api/users` — auto-set role downline berdasarkan upline, validasi 1 level bawah saja
- [x] API: GET `/api/users/downline` — tree downline milik sendiri
- [x] API: PATCH `/api/users/:id` — edit downline langsung
- [x] API: DELETE `/api/users/:id` — soft delete (deactivate) downline
- [x] Service: hierarchy helpers (`insertUserWithHierarchy`, `getUpline`, `getDownline`, `getDirectChildren`)
- [x] Frontend: design system (CSS vars, typography, colors)
- [x] Frontend: login page
- [x] Frontend: auth store (Zustand)
- [x] Frontend: API client wrapper
- [x] Frontend: protected route component
- [x] Frontend: dashboard layout (sidebar + header)
- [x] Frontend: dashboard home (skeleton)
- [x] Frontend: React Router setup
- [x] Frontend: halaman Downline Management — tabel downline, tombol "Tambah [Role Bawahan]", modal form, auto-generate kode affiliate
- [x] Frontend: role-based sidebar menu (`menuConfig.ts`) — menu dinamis per role
- [x] Deploy & test: login, hierarchy, RBAC, buat downline per jenjang


## Fase 2 — Katalog & Booking
- [x] Schema: `packages`, `departures`, `room_types`, `pilgrims` (27 field, 6 bagian), `bookings`, `seat_locks`
- [x] Migration: run ke D1
- [x] API: CRUD `/api/packages`
- [x] API: CRUD `/api/departures`
- [x] API: CRUD `/api/room-types`
- [x] API: POST `/api/bookings` (+ seat lock)
- [x] Service: seat lock (lock, release, cron expired)
- [x] Service: auto-close kuota (`booked_seats >= total_seats → 'full'`)
- [x] Frontend: landing page + hero
- [x] Frontend: `PackageCard` + `KuotaBar` component
- [x] Frontend: katalog paket page
- [x] Frontend: detail paket page
- [x] Frontend: formulir pendaftaran multi-step:
  - [x] Bagian A: Pilihan Produk — nama, program, departure_date, airport, rooms (card + pax)
  - [x] Bagian B: Data Pribadi — no_ktp, upload KTP (OCR), sex, born, address, father_name
  - [x] Bagian C: Data Paspor — has_passport toggle, conditional: no_passport, upload passport, passport_from, releaseAt, expiredAt
  - [x] Bagian D: Kontak & Status — marital_status, phone, home_phone, last_education, work, disease_history
  - [x] Bagian E: Keluarga & Sumber — fam_member (dynamic +/-), fam_contact_name, fam_contact, source_from
  - [x] Review & Submit
- [x] Frontend: countdown timer (seat lock 30 menit)
- [x] Frontend: WhatsApp float button
- [x] Admin: CRUD paket halaman
- [x] Admin: CRUD keberangkatan halaman
- [x] Admin: jamaah list + booking list
- [x] Deploy & test: catalog, booking, form, kuota


## Fase 3 — Payment (Dual Mode)
- [x] Schema: `payment_invoices`, `payment_transactions`, `bank_accounts`
- [x] Migration: run ke D1
- [x] Service: payment mode detection (`MIDTRANS_SERVER_KEY` check)
- [x] API: GET `/api/payments/mode`
- [x] API: POST `/api/payments/create-invoice`
- [x] API: POST `/api/payments/snap-token` (Midtrans)
- [x] API: POST `/api/payments/webhook` (Midtrans)
- [x] API: POST `/api/payments/upload-proof` (manual transfer)
- [x] API: PATCH `/api/payments/:id/verify` (admin approve/reject)
- [x] API: CRUD `/api/bank-accounts`
- [x] Service: invoice generation (DP + cicilan schedule)
- [x] Service: commission trigger after payment confirmed
- [x] Frontend: pembayaran Midtrans Snap
- [x] Frontend: pembayaran Manual (info rekening + upload bukti)
- [x] Frontend: dashboard jamaah (payment status per invoice)
- [x] Admin: verifikasi pembayaran
- [x] Admin: invoice list
- [x] Admin: pengaturan rekening
- [x] Frontend: payment mode badge
- [x] Deploy & test: payment flow (manual + midtrans sandbox)

## Fase 4 — Affiliate Engine
- [x] Schema: `commission_rules`, `commission_ledger`, `affiliate_clicks`
- [x] Migration: run ke D1
- [x] Service: affiliate attribution on booking
- [x] Service: commission calculation via closure table (`triggerCommissions`)
- [x] API: POST `/api/affiliate/commission-rules` (admin)
- [x] API: DELETE `/api/affiliate/commission-rules/:id` (admin)
- [x] API: GET `/api/affiliate/dashboard` (user)
- [x] API: GET `/api/affiliate/my-bookings` (user)
- [x] API: GET `/api/affiliate/commission-history` (user)
- [x] API: POST `/api/affiliate/track-click` (public)
- [x] API: GET `/api/affiliate/ledger` (admin)
- [x] API: POST `/api/affiliate/ledger/:id/disburse` (admin)
- [x] Frontend: Dashboard Affiliasi (`/affiliate`) — stat cards, link referral, tabel referral & komisi
- [x] Frontend: Admin Manajemen Komisi (`/admin/commissions`) — CRUD rules, tabel ledger + cairkan
- [x] Routing: update `App.tsx` + sidebar `DashboardLayout.tsx`
- [x] Deploy & test: affiliate flow, commission calc (10/10 test berhasil)

## Fase 5 — Operations
- [x] Schema: `documents`, `equipment_items`, `equipment_checklist`
- [x] Migration: run ke D1
- [x] API: POST `/api/documents/upload` (+ OCR call)
- [x] Service: OCR KTP & Paspor (Mindee/Glair.ai)
- [x] API: GET `/api/documents/:id/presigned` (R2 URL)
- [x] API: CRUD `/api/equipment-items`
- [x] API: GET/PATCH `/api/equipment/:booking`
- [x] API: GET/PATCH `/api/rooming`
- [x] Frontend: OCR preview card
- [x] Frontend: integrasi OCR ke form Bagian B & C
- [x] Admin: document viewer + verify toggle
- [x] Admin: equipment checklist (bulk update)
- [x] Admin: rooming board (drag-and-drop)
- [x] Deploy & test: OCR, documents, equipment, rooming

## Fase 6 — Communication & Compliance
- [x] Service: WAHA client (`sendMessage`)
- [x] Message templates (booking, payment, reminder)
- [x] Hook: WA after booking created
- [x] Hook: WA after payment confirmed
- [x] Cron: payment reminders (H-7, H-1 jatuh tempo)
- [x] Cron: incomplete document reminders
- [x] API: GET `/api/export/siskopatuh` (CSV format Kemenag)
- [x] API: GET `/api/export/manifest` (maskapai)
- [x] API: GET `/api/export/jamaah`
- [x] Frontend: export button dropdown
- [x] Deploy & test: WhatsApp notifications, exports

## Fase 7 — Polish & Launch
- [x] Responsive audit (mobile/tablet/desktop)
- [x] Loading states & skeletons
- [x] Error boundaries & 404 page
- [x] Security headers (CSP, HSTS)
- [x] Rate limiting
- [x] Wrangler Secrets setup (production)
- [x] CI/CD pipeline (GitHub Actions)
- [x] UAT testing (full end-to-end flow)
- [x] Custom domain setup
- [x] Go-live & monitoring
