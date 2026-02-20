const BASE_URL = 'http://localhost:8787/api';

async function testPaymentFlow() {
    console.log('--- Phase 3 Payment Flow Test ---');

    try {
        // 0. Login as Pusat
        console.log('Attempting login...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@umroh.com', password: 'admin123' })
        });


        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));

        const { accessToken } = loginData;
        console.log('Logged in as Pusat. Token length:', accessToken.length);

        // 1. Get Payment Mode
        const modeRes = await fetch(`${BASE_URL}/payments/mode`);
        const modeData = await modeRes.json();
        console.log('Payment Mode:', modeData.mode);

        // 2. Create Unique Package & Departure for this test
        const testSlug = `test-payment-${Date.now()}`;
        console.log(`Seeding package with slug: ${testSlug}`);

        const createPkgRes = await fetch(`${BASE_URL}/packages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                name: 'Test Payment Package',
                slug: testSlug,
                description: 'End-to-end payment testing',
                durationDays: 12,
                basePrice: 30000000
            })
        });
        const newPkgResponse = await createPkgRes.json();
        if (!createPkgRes.ok) throw new Error('Package creation failed: ' + JSON.stringify(newPkgResponse));
        const newPkg = newPkgResponse.package;


        // Create Departure
        console.log('Creating Departure...');
        const createDepRes = await fetch(`${BASE_URL}/departures`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                packageId: newPkg.id,
                departureDate: '2026-12-01',
                airport: 'CGK',
                totalSeats: 45,
                roomTypes: [
                    { name: 'Quad', capacity: 4, priceAdjustment: 0 },
                    { name: 'Triple', capacity: 3, priceAdjustment: 2000000 },
                    { name: 'Double', capacity: 2, priceAdjustment: 5000000 }
                ]
            })
        });
        const newDep = await createDepRes.json();
        if (!createDepRes.ok) throw new Error('Departure creation failed: ' + JSON.stringify(newDep));

        // Refetch to get IDs (roomTypes)
        const pkgDetailRes = await fetch(`${BASE_URL}/packages/${testSlug}`);
        const pkgDetail = await pkgDetailRes.json();
        const departure = pkgDetail.package.departures[0];
        const roomType = departure.roomTypes[0];

        console.log(`Testing with Departure ID: ${departure.id}, RoomType ID: ${roomType.id}`);

        // 3. Create Booking (Should trigger Invoice)
        console.log('Creating Booking...');
        const bookingRes = await fetch(`${BASE_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                departureId: departure.id,
                roomTypeId: roomType.id,
                pilgrim: {
                    name: 'Jamaah Fase 3',
                    noKtp: '9' + Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0'),
                    sex: 'L',
                    born: '1985-05-05',
                    address: 'Kota Bekasi',
                    fatherName: 'Ayah Jamaah',
                    maritalStatus: 'Menikah',
                    phone: '08' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
                    lastEducation: 'S1',
                    work: 'Swasta',
                    famContactName: 'Kontak Darurat',
                    famContact: '0812222222',
                    sourceFrom: 'Facebook'
                }
            })
        });

        const bookingData = await bookingRes.json();
        if (!bookingRes.ok) throw new Error('Booking failed: ' + JSON.stringify(bookingData));

        console.log('Booking OK:', bookingData.bookingId);
        console.log('Invoice OK:', bookingData.invoiceCode);
        const invoiceId = bookingData.invoiceId;

        // 4. Get Snap Token (if auto)
        if (modeData.mode === 'auto') {
            console.log('Fetching Snap Token...');
            const snapRes = await fetch(`${BASE_URL}/payments/${invoiceId}/snap-token`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const snapData = await snapRes.json();

            if (snapRes.ok) {
                console.log('Snap Token SUCCESS:', snapData.token);
            } else {
                console.warn('Snap Token FAIL:', JSON.stringify(snapData));
            }

            // 5. Simulate Webhook
            console.log('Simulating Webhook hit...');
            const webhookRes = await fetch(`${BASE_URL}/payments/webhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: invoiceId,
                    status_code: '200',
                    gross_amount: '5000000',
                    signature_key: 'invalid', // should get 403
                    transaction_status: 'settlement',
                    transaction_id: 'tx-test-3',
                    payment_type: 'bank_transfer'
                })
            });
            const webhookData = await webhookRes.json();
            console.log('Webhook Verification result:', webhookData.error || 'SUCCESS');
        }

    } catch (err) {
        console.error('Test FAILED:', err.message);
    }
}

testPaymentFlow();
