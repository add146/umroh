const fs = require('fs');
const http = require('http');

async function simulate() {
    console.log('--- SIMULASI FASE 2: KATALOG & BOOKING ---');

    const API_URL = 'http://localhost:8787';
    let adminToken = '';
    let packageId = '';
    let departureId = '';
    let roomTypeId = '';

    // 1. Login as Admin (Pusat)
    console.log('\n[1] Login sebagai Pusat...');
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@umroh.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    adminToken = loginData.accessToken;
    console.log('✅ Login Berhasil');

    // 2. Create Package
    console.log('\n[2] Membuat Paket Umroh...');
    const pkgRes = await fetch(`${API_URL}/api/packages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            name: 'Umroh Syawal 2024',
            basePrice: 25000000,
            description: 'Paket Umroh Bintang 5 Akhir Syawal',
            isActive: true
        })
    });
    const pkgData = await pkgRes.json();
    if (!pkgData.package) {
        console.error('❌ Gagal membuat paket:', pkgRes.status, JSON.stringify(pkgData));
        process.exit(1);
    }
    packageId = pkgData.package.id;
    console.log(`✅ Paket Dibuat: ${pkgData.package.name} (ID: ${packageId})`);


    // 3. Create Departure & Room Types
    console.log('\n[3] Membuat Jadwal Keberangkatan & Room Types...');
    const depRes = await fetch(`${API_URL}/api/departures`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            packageId: packageId,
            departureDate: '2024-05-15',
            airport: 'CGK',
            totalSeats: 45
        })
    });
    const depData = await depRes.json();
    if (!depData.departure) {
        console.error('❌ Gagal membuat jadwal:', depRes.status, JSON.stringify(depData));
        process.exit(1);
    }
    departureId = depData.departure.id;

    // 3a. Create Room Types for this departure
    console.log('[3a] Menyiapkan Room Types...');
    const roomsSeedRes = await fetch(`${API_URL}/api/departures/${departureId}/rooms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify([
            { name: 'Quad', capacity: 4, priceAdjustment: 0 },
            { name: 'Triple', capacity: 3, priceAdjustment: 2000000 },
            { name: 'Double', capacity: 2, priceAdjustment: 4000000 }
        ])
    });
    const roomsSeedData = await roomsSeedRes.json();
    console.log(`✅ ${roomsSeedData.roomTypes.length} Room Types ditambahkan`);

    // Get Room Type ID
    const roomRes = await fetch(`${API_URL}/api/departures/${departureId}`);
    const roomData = await roomRes.json();
    if (!roomData.departure?.roomTypes || roomData.departure.roomTypes.length === 0) {
        console.error('❌ Gagal mengambil room types:', JSON.stringify(roomData));
        process.exit(1);
    }
    roomTypeId = roomData.departure.roomTypes[0].id;
    console.log(`✅ Jadwal Siap: ${depData.departure.departureDate} (Room ID: ${roomTypeId})`);



    // 4. Check Availability
    console.log('\n[4] Cek Kuota...');
    const availRes = await fetch(`${API_URL}/api/seats/${departureId}/availability`);
    const availData = await availRes.json();
    console.log(`✅ Sisa Seat: ${availData.remaining} / ${availData.total}`);

    // 5. Create Seat Lock
    console.log('\n[5] Mencoba Seat Lock...');
    const lockRes = await fetch(`${API_URL}/api/seats/${departureId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const lockData = await lockRes.json();
    if (!lockData.lockKey) {
        console.error('❌ Gagal mengunci seat:', JSON.stringify(lockData));
        process.exit(1);
    }
    const lockKey = lockData.lockKey;
    console.log(`✅ Seat Terkunci (Key: ${lockKey})`);

    // 6. Final Booking
    console.log('\n[6] Proses Booking Final...');
    const bookRes = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            departureId,
            roomTypeId,
            lockKey,
            pilgrim: {
                name: 'Jamaah Simulasi',
                noKtp: '1234567890123456',
                sex: 'L',
                born: '1990-01-01',
                address: 'Alamat Simulasi No. 123',
                fatherName: 'Ayah Simulasi',
                maritalStatus: 'Menikah',
                phone: '08123456789',
                lastEducation: 'S1',
                work: 'Swasta',
                famContactName: 'Istri Simulasi',
                famContact: '08987654321',
                sourceFrom: 'Media Sosial'
            }
        })
    });
    const bookData = await bookRes.json();
    if (bookData.bookingId) {
        console.log(`✅ Booking Berhasil! (ID: ${bookData.bookingId})`);
        console.log(`💰 Total Harga: ${bookData.totalPrice}`);
    } else {
        console.error('❌ Booking Gagal:', JSON.stringify(bookData));
        process.exit(1);
    }

    // 7. Re-check Availability
    const availRes2 = await fetch(`${API_URL}/api/seats/${departureId}/availability`);
    const availData2 = await availRes2.json();
    console.log(`\n[7] Verifikasi Sisa Seat Akhir: ${availData2.remaining} / ${availData2.total}`);


    if (availData2.remaining === availData.remaining - 1) {
        console.log('🏆 SIMULASI FASE 2 BERHASIL! (Seat berkurang 1)');
    } else {
        console.log('⚠️ Peringatan: Pengurangan seat tidak sesuai');
    }
}

simulate().catch(console.error);
