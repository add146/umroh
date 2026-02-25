# Handover — Sprint 13: Technical Debt, Disbursements & Premium UI

> **Tanggal**: 25 Februari 2026  
> **Deployment**: ✅ Production (Cloudflare Workers + Pages)

---

## Ringkasan Sprint

Sprint 13 menyelesaikan **technical debt** dari sprint sebelumnya, menambah fitur **Pencairan Komisi**, fitur **Testimoni Jamaah**, dan melakukan **redesign UI Premium Black Gold** pada beberapa halaman admin.

---

## 1. Technical Debt

| Item | Detail |
|------|--------|
| Schema `bookings` | Kolom `equipmentDelivered` (boolean) |
| RBAC Fix | Multiple roles `requireRole('teknisi', 'pusat')` |
| Drizzle Migration | Raw SQL → ORM pada `/api/operations/deliver-equipment/:bookingId` |
| WhatsApp Template | Notifikasi otomatis penyerahan perlengkapan |
| Auto-Convert Prospect | Prospek auto-convert saat registrasi mandiri |
| Audit Log | Logging perubahan status perlengkapan |

---

## 2. Fitur Pencairan Komisi (Disbursements)

### Backend
- **Tabel**: `disbursement_requests` (D1)
- **Endpoint**: `POST /api/affiliate/request-disbursement`
- **Endpoint**: `GET /api/affiliate/disbursement-requests`
- **Validasi**: Cek saldo via `commission_ledger`

### Frontend — `DisbursementRequest.tsx`
- Stat cards: Saldo Tersedia, Dalam Proses, Total Dicairkan
- Form pencairan: input nominal + rekening, tombol 50% / Tarik Semua
- Tabel riwayat: status badges (Pending/Disetujui/Berhasil/Ditolak)

---

## 3. Fitur Testimoni Jamaah

### Backend
- **Tabel**: `testimonials` di `schema.ts`
- **API**: Full CRUD + image upload ke R2 (`/api/testimonials/upload`)

### Frontend
- **Admin** — `TestimonialManage.tsx`: CRUD testimoni, upload avatar, video YouTube, toggle publish
- **Public** — `TestimonialGallery.tsx`: Carousel masonry di Landing Page

---

## 4. Premium Black Gold UI Redesign

### Halaman yang Diupgrade

| Halaman | File | Highlight |
|---------|------|-----------|
| Testimoni Admin | `pages/admin/TestimonialManage.tsx` | Hero gold, stat cards, tabel premium, modal dark |
| Pencairan Komisi | `pages/DisbursementRequest.tsx` | Hero gradient, 3 stat cards, form dark card |
| Testimoni Public | `components/TestimonialGallery.tsx` | Background 950, glassmorphism, hover glow |

### Catatan Penting untuk Developer

> ⚠️ **Semua halaman admin HARUS menggunakan inline styles + CSS variables**, bukan Tailwind utility classes.
>
> Background app adalah `--color-bg: #0a0907` (hampir hitam). Class Tailwind seperti `bg-neutral-900` atau `bg-gray-50` akan **tidak terlihat** atau **clash** dengan design system.

### CSS Variables yang Digunakan
```css
--color-bg: #0a0907;
--color-bg-alt: #131210;
--color-bg-card: rgba(255, 255, 255, 0.05);
--color-bg-hover: rgba(255, 255, 255, 0.08);
--color-primary: #c8a851;          /* Gold utama */
--color-primary-bg: rgba(200, 168, 81, 0.12);
--color-border: rgba(255, 255, 255, 0.10);
--color-border-gold: rgba(200, 168, 81, 0.30);
--shadow-gold: 0 0 15px rgba(200, 168, 81, 0.30);
```

### CSS Classes yang Tersedia
- `.dark-card` — Card dengan border glass, hover gold
- `.btn-primary` — Tombol gold solid
- `.btn-outline` — Tombol border gold transparan

---

## 5. Status Deployment

| Komponen | Status | Target |
|----------|--------|--------|
| D1 Migrations | ✅ Applied | Remote database |
| Backend API | ✅ Deployed | `umroh-api.khibroh.workers.dev` |
| Frontend | ✅ Deployed | `umroh-3vl.pages.dev` |

---

## File yang Dimodifikasi

### Backend (`api/`)
- `src/db/schema.ts` — Tabel baru: `testimonials`, `disbursement_requests`
- `src/routes/testimonials.ts` — [NEW] CRUD + upload
- `src/routes/affiliate.ts` — Endpoint disbursement baru
- `migrations/` — SQL migrations terkait

### Frontend (`frontend/src/`)
- `pages/DisbursementRequest.tsx` — Full rewrite (inline styles)
- `pages/admin/TestimonialManage.tsx` — Full rewrite (inline styles)
- `components/TestimonialGallery.tsx` — Premium Black Gold UI
- `pages/Landing.tsx` — Integrasi TestimonialGallery
