# Ringkasan Handover: Standarisasi Layout & Spacing Admin 

Dokumen ini berisi pedoman desain (design guidelines) yang **wajib diikuti** oleh agent selanjutnya saat membuat atau memodifikasi halaman Admin Dashboard di `frontend/src/pages/admin/`. Semua halaman lama telah diseragamkan dengan spesifikasi ini agar selaras dengan `MasterDataPage.tsx`.

## 1. Global Layout Padding
Komponen pembungkus utama `DashboardLayout.tsx` telah diperbesar *padding*-nya agar konten tidak menempel ke header atas maupun sidebar.
- **Spec Baru**: `padding: 3rem 3rem 4rem;` (padding atas 48px, padding area isi 48px, padding bawah 64px)

## 2. Standar Header Halaman Admin
Hindari penggunaan utilitas teks Tailwind yang terlalu besar seperti `text-3xl font-black`. Header harus lebih proporsional.
**Pola Wajib untuk Header:**
```tsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
    <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Judul Halaman</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Deskripsi singkat halaman tersebut.</p>
    </div>
    {/* Action Buttons, Filter, dll ditaruh disini */}
</div>
```
*Catatan Penting*: Jarak antara Header dan Konten Utama (Tabel/Card) **harus menggunakan** `marginBottom: '2rem'`.

## 3. Standar Table Container & Card Wrapper
Berdasarkan permintaan user dengan spesifikasi akurat dari browser inspector, semua pembungkus tabel (Tabel Data) atau Card metrik **wajib** menggunakan inline-style berikut ini (jangan pakai alias `.dark-card` jika tidak sesuai spec).

**Pola Wajib untuk Container Tabel & Card Data:**
```tsx
<div style={{ 
    background: 'rgb(19, 18, 16)', 
    border: '1px solid var(--color-border)', 
    borderRadius: '0.3rem', 
    overflow: 'hidden', 
    padding: '10px' 
}}>
    {/* Tabel atau Konten Data ditaruh disini */}
</div>
```
*Mengapa padding 10px?* Agar ada jarak lega antara tulisan di dalam div dengan border luar (frame tidak "mepet").

## 4. Standar Padding Cell Tabel (th & td)
Tabel data memakan cukup banyak ruang, namun text tetap saja bisa menempel apabila padding horizontal tidak memadai.
- **Header Table (`<th>`) maupun Baris Baris Data (`<td>`)** minimal menggunakan `px-8` (32px) atau lebih baik `px-10` (40px) pada resolusi standar.
- *Contoh kelas valid*: `className="px-10 py-5 text-[10px] font-black uppercase text-gray-400"`

## 5. Halaman yang Telah Dirombak
Agent sebelumnya telah mengonversi total 8 halaman spesifik:
1. `Invoices.tsx`
2. `BookingList.tsx`
3. `RoomingBoard.tsx`
4. `LogisticsChecklist.tsx`
5. `BankAccounts.tsx`
6. `DocumentScanner.tsx`
7. `DepartureManage.tsx`
8. `PackageManage.tsx`
9. `MasterDataPage.tsx` (Reference Point)

## Tugas Agent Selanjutnya
- Pastikan komponen baru apa pun (terutama form CRUD atau tabel afiliasi/downline) yang ada di menu *Admin* menaati proporsi margin dan padding di atas.
- Konsisten terhadap *dark mode template* `rgb(19,18,16)` untuk tiap frame elemen.
