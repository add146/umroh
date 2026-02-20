const API_URL = 'http://127.0.0.1:8787';

async function simulate() {
    console.log('=== START SIMULATION ===');

    // 1. Login as Pusat
    console.log('\n1. Login as Pusat (admin@umroh.com)...');
    const loginPusatRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@umroh.com', password: 'admin123' })
    });
    const loginPusatData = await loginPusatRes.json();
    const pusatToken = loginPusatData.accessToken;
    console.log('   Pusat Login Success.');

    // 2. Create Cabang
    console.log('\n2. Creating Cabang (via Pusat)...');
    const createCabangRes = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pusatToken}`
        },
        body: JSON.stringify({
            name: 'Cabang Jawa Barat',
            email: 'cabang.jabar@umroh.com',
            password: 'password123'
        })
    });
    const createCabangData = await createCabangRes.json();
    console.log('   Response:', JSON.stringify(createCabangData));

    // 3. Login as Cabang
    console.log('\n3. Login as Cabang (cabang.jabar@umroh.com)...');
    const loginCabangRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'cabang.jabar@umroh.com', password: 'password123' })
    });
    const loginCabangData = await loginCabangRes.json();
    const cabangToken = loginCabangData.accessToken;
    console.log('   Cabang Login Success.');

    // 4. Create Mitra
    console.log('\n4. Creating Mitra (via Cabang)...');
    const createMitraRes = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cabangToken}`
        },
        body: JSON.stringify({
            name: 'Mitra Bekasi',
            email: 'mitra.bekasi@umroh.com',
            password: 'password123'
        })
    });
    const createMitraData = await createMitraRes.json();
    console.log('   Response:', JSON.stringify(createMitraData));

    // 5. Verify Pusat Downline
    console.log('\n5. Verifying Pusat Downlines (should see two levels)...');
    const pusatDownlineRes = await fetch(`${API_URL}/api/users/downline`, {
        headers: { 'Authorization': `Bearer ${pusatToken}` }
    });
    const pusatDownlineData = await pusatDownlineRes.json();
    console.log('   Pusat Downlines Count:', pusatDownlineData.downlines.length);
    pusatDownlineData.downlines.forEach(d => console.log(`   - [${d.role}] ${d.name}`));

    // 6. Verify Cabang Downline
    console.log('\n6. Verifying Cabang Downlines (should see only the Mitra)...');
    const cabangDownlineRes = await fetch(`${API_URL}/api/users/downline`, {
        headers: { 'Authorization': `Bearer ${cabangToken}` }
    });
    const cabangDownlineData = await cabangDownlineRes.json();
    console.log('   Cabang Downlines Count:', cabangDownlineData.downlines.length);
    cabangDownlineData.downlines.forEach(d => console.log(`   - [${d.role}] ${d.name}`));

    console.log('\n=== SIMULATION COMPLETE ===');
}

simulate().catch(err => {
    console.error('Simulation Failed:', err);
    process.exit(1);
});
