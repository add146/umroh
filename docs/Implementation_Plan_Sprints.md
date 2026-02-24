# Implementation Plan — 8 Sprint Pengembangan Fitur PRD

Berdasarkan audit menyeluruh terhadap codebase, **banyak skeleton sudah ada** (schema, route, halaman). Yang tersisa kebanyakan adalah **finishing**: modal yang masih `alert()`, fitur convert yang belum jalan, dark-mode belum konsisten, dan beberapa fitur fully baru.

---

## Sprint 1 — Prospect List & Lead Assignment (Finishing)

> **Status**: Skeleton sudah 80% ada. Perlu finishing UI + fitur convert.

### Existing Files
| File | Status |
|------|--------|
| `api/src/db/schema.ts` — `prospects` table | ✅ Done |
| `api/src/routes/prospects.ts` — CRUD API | ✅ Done |
| `api/src/routes/leads.ts` — assign + incoming | ✅ Done |
| `frontend/src/pages/ProspectList.tsx` | ⚠️ Partial — "Tambah Prospek" masih `alert()`, Convert masih `alert()` |
| `frontend/src/pages/IncomingLeads.tsx` | ⚠️ Partial — UI light mode, tidak dark-mode |
| `frontend/src/pages/admin/AssignLead.tsx` | ⚠️ Perlu dicek |
| Routes di `index.ts` + `App.tsx` | ✅ Done |

### Changes
- `ProspectList.tsx`: Ganti alert → Modal form add prospect + Convert → navigate ke `/register?prospect=id`
- `IncomingLeads.tsx`: Dark mode compliance
- `prospects.ts`: Tambah endpoint `POST /:id/convert`
- `Registration.tsx`: Baca query param `?prospect=<id>` → prefill form

---

## Sprint 2 — Dashboard Agen (CRM Pipeline, Quick WA)
- Stat Cards, Quick Actions Bar, Antrian Follow-Up, Quick WA Templates
- Dark mode compliance

## Sprint 3 — Approval Workflow Cabang
- Status `ready_review`, endpoints approve/reject, CabangApproval page finishing

## Sprint 4 — Audit Log (Finishing)
- `logAudit()` service, inject ke semua route penting, pagination + filter

## Sprint 5 — Marketing Kit (Finishing)
- Presigned URL download, Share ke WA, dark mode

## Sprint 6 — Dashboard Reseller (QR, Kartu Nama Digital)
- QR Code Generator, Kalkulator Komisi, Share-Ready Cards, Kartu Nama Digital

## Sprint 7 — Leaderboard & Gamifikasi
- Ranking API, Leaderboard page, Target widget

## Sprint 8 — Duplikat Detection, Quick Register, Broadcast WA
- ✅ Deteksi duplikat NIK/HP terintegrasi di backend `POST /api/bookings`. Tangkapan error friendly di UI Frontend Registrasi.
- ✅ Form ringkas booking (Quick Book Modal) via Dashboard Agen & Prospect CRM.
- ✅ Broadcast via WAHA terintegrasi di halaman *Booking List* dengan penyaringan kontak & sistem *delay buffer*.

---

_Dokumen digenerate dari analisis PRD vs codebase aktual pada 23 Feb 2026._
