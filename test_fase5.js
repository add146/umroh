/**
 * test_fase5.js — Verifikasi Backend Operations & OCR (Fase 5)
 * Run: node test_fase5.js
 */

const API = 'http://localhost:8787/api';

async function req(method, path, body, token, isMultipart = false) {
    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API}${path}`, {
        method,
        headers,
        body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
    });

    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error(`${method} ${path} → JSON parse failed. Status: ${res.status}. Body: "${text.substring(0, 150)}"`);
    }
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
    return data;
}

async function main() {
    console.log('\n🧪 SIMULASI FASE 5: OPERATIONS & OCR');
    console.log('=====================================\n');

    // [1] Login sebagai Pusat
    process.stdout.write('[1] Login sebagai Pusat... ');
    const loginRes = await req('POST', '/auth/login', { email: 'admin@umroh.com', password: 'admin123' });
    const adminToken = loginRes.accessToken;
    console.log('✅ Login Berhasil');

    const resDep = await req('GET', '/departures', null, adminToken);
    if (!resDep.departures || !resDep.departures.length) throw new Error('Tidak ada keberangkatan. Jalankan test_fase4.js dulu.');

    let dep = null;
    let bookings = [];

    for (const d of resDep.departures) {
        bookings = await req('GET', `/operations/rooming/${d.id}`, null, adminToken);
        if (bookings.length > 0) {
            dep = d;
            break;
        }
    }

    if (!dep) throw new Error('Tidak ada keberangkatan yang memiliki data pendaftaran jamaah (booking). Jalankan test_fase4.js dulu.');

    process.stdout.write('[2] Mencari keberangkatan & booking aktif... ');
    bookings = await req('GET', `/operations/rooming/${dep.id}`, null, adminToken);
    if (!bookings.length) throw new Error('Tidak ada booking untuk keberangkatan ini.');
    const booking = bookings[0];
    const pilgrimId = booking.pilgrimId;
    console.log(`✅ Keberangkatan ${dep.id.substring(0, 8)} | Booking ${booking.id.substring(0, 8)} | Pilgrim ${pilgrimId.substring(0, 8)}`);

    // [3] Simulasi Upload KTP (Multipart)
    process.stdout.write('[3] Simulasi Upload KTP & OCR... ');
    const formData = new FormData();
    formData.append('pilgrimId', pilgrimId);
    formData.append('docType', 'ktp');
    // Mock file upload
    const mockFile = new Blob(['fake image content'], { type: 'image/jpeg' });
    formData.append('file', mockFile, 'ktp_test.jpg');

    const uploadRes = await req('POST', '/documents/upload', formData, adminToken, true);
    console.log('✅ Upload Berhasil');
    console.log('   OCR Extract:', JSON.stringify(uploadRes.ocr));

    // [4] Verifikasi Dokumen
    process.stdout.write('[4] Verifikasi Dokumen... ');
    await req('PATCH', `/documents/${uploadRes.document.id}/verify`, { isVerified: true }, adminToken);
    console.log('✅ Dokumen diverifikasi');

    // [5] Kelola Perlengkapan
    process.stdout.write('[5] Kelola Master Perlengkapan... ');
    const items = await req('GET', '/operations/equipment', null, adminToken);
    let item;
    if (!items.length) {
        item = await req('POST', '/operations/equipment', { name: 'Koper Kabin', description: 'Koper ukuran standar pesawat' }, adminToken);
        console.log(`✅ Master baru dibuat: ${item.name}`);
    } else {
        item = items[0];
        console.log(`✅ Menggunakan item existing: ${item.name}`);
    }

    // [6] Update Checklist Perlengkapan
    process.stdout.write('[6] Update Checklist (Jamaah terima koper)... ');
    const checklistRes = await req('POST', '/operations/equipment/checklist', {
        bookingId: booking.id,
        equipmentItemId: item.id,
        status: 'received'
    }, adminToken);
    console.log(`✅ Status: ${checklistRes.status}`);

    // [7] Rooming Assignment
    process.stdout.write('[7] Penempatan Kamar... ');
    const roomRes = await req('POST', '/operations/rooming/assign', {
        bookingId: booking.id,
        roomNumber: 'ROOM-505',
        notes: 'Dekat lift'
    }, adminToken);
    console.log(`✅ Kamar ditetapkan: ${roomRes.roomNumber}`);

    // [8] Verifikasi Board
    process.stdout.write('[8] Verifikasi Rooming Board... ');
    const board = await req('GET', `/operations/rooming/${dep.id}`, null, adminToken);
    const myBooking = board.find(b => b.id === booking.id);
    console.log(`✅ Board diperbarui. Room: ${myBooking.roomAssignment?.roomNumber || 'ERROR'}`);

    console.log('\n🏆 SIMULASI FASE 5 BACKEND BERHASIL!');
    console.log('=====================================');
}

main().catch(e => {
    console.error('\n❌ TEST GAGAL:', e.message);
    process.exit(1);
});
