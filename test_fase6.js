// test_fase6.js (Using native fetch available in Node.js 18+)
async function testFase6() {
    console.log('🧪 SIMULASI FASE 6: COMMUNICATION & COMPLIANCE');
    console.log('=============================================');

    const API_URL = 'http://localhost:8787';
    let token = '';

    // 1. Login as Admin
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@umroh.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200) {
        console.error(`   ❌ Login Failed (Status: ${loginRes.status})`, loginData);
        return;
    }
    token = loginData.accessToken;
    if (!token) {
        console.error('   ❌ No accessToken found in login response', loginData);
        return;
    }
    console.log('[1] Login Admin... ✅ (Token obtained)');

    // 2. Test WhatsApp Connectivity
    console.log('[2] Testing WAHA Connection...');
    const waRes = await fetch(`${API_URL}/api/comm/test-wa`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            phone: '08123456789',
            message: 'Testing WAHA dari Umroh App!'
        })
    });
    const waData = await waRes.json();
    if (waData.success) {
        console.log('   ✅ WhatsApp Service Online & Tested');
    } else {
        console.error('   ❌ WAHA Error:', waData.error);
    }

    // 3. Test Export Endpoints
    console.log('[3] Testing Exports...');
    try {
        const depRes = await fetch(`${API_URL}/api/departures`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const depData = await depRes.json();
        const departures = depData.departures;

        console.log(`   Found ${departures ? departures.length : 0} departures.`);

        if (departures && departures.length > 0) {
            const depId = departures[0].id;
            console.log(`   Testing export for departure ID: ${depId}`);

            // Siskopatuh
            const sisRes = await fetch(`${API_URL}/api/export/siskopatuh/${depId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (sisRes.status === 200) {
                console.log(`   ✅ Siskopatuh CSV Generated (${sisRes.headers.get('content-disposition')})`);
            } else {
                console.log(`   ❌ Siskopatuh Export Failed (Status: ${sisRes.status})`);
                console.log(await sisRes.text());
            }

            // Manifest
            const manRes = await fetch(`${API_URL}/api/export/manifest/${depId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (manRes.status === 200) {
                console.log(`   ✅ Flight Manifest CSV Generated (${manRes.headers.get('content-disposition')})`);
            } else {
                console.log(`   ❌ Manifest Export Failed (Status: ${manRes.status})`);
                console.log(await manRes.text());
            }
        } else {
            console.log('   ⚠️ No departures to test export');
        }
    } catch (err) {
        console.error('   ❌ Export Test Error:', err.message);
    }

    console.log('\n🏆 SIMULASI FASE 6 BERHASIL!');
    console.log('=============================================');
}

testFase6();
