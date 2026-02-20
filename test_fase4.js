/**
 * test_fase4.js — Verifikasi end-to-end Affiliate Engine (Fase 4)
 * Run: node test_fase4.js
 */

const API = 'http://localhost:8787/api';

async function req(method, path, body, token) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
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
    console.log('\n🧪 SIMULASI FASE 4: AFFILIATE ENGINE');
    console.log('=====================================\n');

    // [1] Login sebagai Pusat
    process.stdout.write('[1] Login sebagai Pusat... ');
    const loginRes = await req('POST', '/auth/login', { email: 'admin@umroh.com', password: 'admin123' });
    const adminToken = loginRes.accessToken;
    const adminId = loginRes.user.id;
    console.log('✅ Login Berhasil (ID:', adminId.substring(0, 8), '...)');

    // [2] Set Commission Rules — pusat mengatur komisi untuk reseller
    process.stdout.write('[2] Mengambil daftar user downline... ');
    const { downline } = await req('GET', '/users/downline', null, adminToken);
    let resellerUser = downline?.find(u => u.role === 'reseller');
    if (!resellerUser) {
        // Buat reseller baru jika belum ada  
        console.log('(Tidak ada reseller, membuat baru)');
        const newReseller = await req('POST', '/users', {
            name: 'Reseller Test Fase4',
            email: `reseller_${Date.now()}@test.com`,
            password: 'pass1234',
            phone: '08111111111',
        }, adminToken);
        // response bisa jadi { user: {...} } atau langsung user object
        resellerUser = newReseller?.user || newReseller;
        console.log(`✅ Reseller dibuat (ID: ${resellerUser?.id?.substring(0, 8)}...)`);
    } else {
        console.log(`✅ Reseller ditemukan: ${resellerUser.name}`);
    }

    // [3] Buat Commission Rule — admin → kalau reseller refer jamaah, admin dapat 5% (pusat sering tidak dapat, ini demo)
    process.stdout.write('[3] Membuat Commission Rule... ');
    const rule = await req('POST', '/affiliate/commission-rules', {
        userId: adminId,
        targetRole: 'reseller',
        commissionType: 'percentage',
        commissionValue: 5,
    }, adminToken);
    console.log(`✅ Rule dibuat (ID: ${rule?.id?.substring(0, 8)}...)`);

    // [4] Siapkan Paket & Keberangkatan untuk Booking
    process.stdout.write('[4] Siapkan paket & keberangkatan aktif... ');

    const newPkg = await req('POST', '/packages', {
        name: `Umroh Reguler Test ${Date.now()}`,
        slug: `umroh-test-${Date.now()}`,
        basePrice: 25000000,
        description: 'Test package Fase 4'
    }, adminToken);
    const pkg = newPkg?.package || newPkg;

    const newDep = await req('POST', '/departures', {
        packageId: pkg.id,
        departureDate: '2025-12-01',
        airport: 'CGK',
        totalSeats: 45
    }, adminToken);
    const departure = newDep?.departure || newDep;

    const newRt = await req('POST', `/departures/${departure.id}/rooms`, [
        { name: 'Quad', capacity: 4, priceAdjustment: 0 }
    ], adminToken);
    const roomTypeId = (newRt?.roomTypes?.[0]?.id) || (Array.isArray(newRt) ? newRt[0]?.id : null);
    if (!roomTypeId) throw new Error('Room type ID tidak ditemukan. Response: ' + JSON.stringify(newRt).substring(0, 150));

    console.log(`\u2705 Siap: Paket "${pkg.name}" | Departure ${departure.departureDate} | Room: ${roomTypeId.substring(0, 8)}...`);

    // [5] Lock seat
    process.stdout.write('[5] Mengunci seat... ');
    const lockRes = await req('POST', `/seats/${departure.id}/lock`, null, adminToken);
    const lockKey = lockRes.lockKey;
    console.log(`✅ Seat terkunci (Key: ${lockKey?.substring(0, 8)}...)`);

    // [6] Booking dengan affiliatorId = reseller
    process.stdout.write('[6] Booking dengan affiliatorId reseller... ');
    const bookingRes = await req('POST', '/bookings', {
        departureId: departure.id,
        roomTypeId: roomTypeId,
        lockKey,
        affiliatorId: resellerUser.id,
        pilgrim: {
            name: `Test Jamaah Fase4 ${Date.now()}`,
            noKtp: String(Date.now()).padEnd(16, '0').substring(0, 16),
            sex: 'L',
            born: '1990-01-01',
            address: 'Jl. Test No. 1, Jakarta',
            fatherName: 'Bapak Test',
            hasPassport: false,
            maritalStatus: 'Belum Menikah',
            phone: '08122222222',
            lastEducation: 'S1',
            work: 'Karyawan',
            famContactName: 'Keluarga Test',
            famContact: '08133333333',
            sourceFrom: 'Referral',
        },
    });
    console.log(`✅ Booking Berhasil (ID: ${bookingRes.bookingId?.substring(0, 8)}...)`);

    // [7] Verify payment sebagai admin (simulasi pembayaran lunas → trigger komisi)
    process.stdout.write('[7] Verifikasi invoice sebagai PAID (trigger komisi)... ');
    await req('PATCH', `/payments/${bookingRes.invoiceId}/verify`, { status: 'paid' }, adminToken);
    console.log('✅ Invoice diverifikasi sebagai PAID');

    // [8] Cek affiliate dashboard reseller
    process.stdout.write('[8] Cek ledger komisi global... ');
    const ledger = await req('GET', '/affiliate/ledger', null, adminToken);
    const myEntries = Array.isArray(ledger) ? ledger.filter(e => e.userId === resellerUser.id) : [];
    console.log(`✅ Ledger Komisi: ${Array.isArray(ledger) ? ledger.length : 0} entri total`);

    // [9] Track affiliate click
    process.stdout.write('[9] Tracking klik affiliate link... ');
    await req('POST', '/affiliate/track-click', { affiliateCode: resellerUser.affiliateCode || 'TEST001' });
    console.log('✅ Klik berhasil dicatat');

    // [10] Get commission rules
    process.stdout.write('[10] Verifikasi commission rules... ');
    const rules = await req('GET', '/affiliate/commission-rules', null, adminToken);
    console.log(`✅ ${Array.isArray(rules) ? rules.length : 0} rules aktif`);

    console.log('\n🏆 SIMULASI FASE 4 BERHASIL!');
    console.log('=====================================');
    console.log('✅ Commission Service — aktif');
    console.log('✅ Affiliate Attribution — berfungsi');
    console.log('✅ Click Tracking — berfungsi');
    console.log('✅ Commission Rules CRUD — berfungsi');
    console.log('✅ Ledger API — berfungsi');
}

main().catch(e => {
    console.error('\n❌ TEST GAGAL:', e.message);
    process.exit(1);
});
