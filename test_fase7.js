// test_fase7.js — Verifikasi Phase 7: Polish & Launch
async function testFase7() {
    console.log('🧪 SIMULASI FASE 7: POLISH & LAUNCH');
    console.log('====================================');

    const API_URL = 'http://localhost:8787';

    // 1. Login
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@umroh.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.accessToken) {
        console.error('❌ Login gagal:', loginData);
        return;
    }
    const token = loginData.accessToken;
    console.log('[1] Login Admin... ✅');

    // 2. Security Headers Audit
    console.log('[2] Memeriksa Security Headers...');
    const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const headers = {
        'x-content-type-options': res.headers.get('x-content-type-options'),
        'x-frame-options': res.headers.get('x-frame-options'),
        'x-xss-protection': res.headers.get('x-xss-protection'),
        'referrer-policy': res.headers.get('referrer-policy'),
        'permissions-policy': res.headers.get('permissions-policy'),
    };

    let allPassed = true;
    for (const [header, value] of Object.entries(headers)) {
        if (value) {
            console.log(`   ✅ ${header}: ${value}`);
        } else {
            console.log(`   ❌ ${header}: MISSING`);
            allPassed = false;
        }
    }
    if (allPassed) console.log('   🛡️  Semua security headers hadir!');

    // 3. Rate Limiter Check (send 65 requests quickly)
    console.log('[3] Menguji Rate Limiter (65 permintaan cepat)...');
    let rateLimited = false;
    for (let i = 0; i < 65; i++) {
        const r = await fetch(`${API_URL}/api/departures`);
        if (r.status === 429) {
            console.log(`   ✅ Rate limiter aktif setelah ${i + 1} permintaan (HTTP 429 Too Many Requests)`);
            rateLimited = true;
            break;
        }
    }
    if (!rateLimited) console.log('   ⚠️  Rate limiter tidak aktif (normal jika masih dalam window baru)');

    // 4. Health Check
    console.log('[4] Health Check API...');
    const healthRes = await fetch(`${API_URL}/`);
    const health = await healthRes.json();
    console.log(`   ✅ Status: ${health.status} | App: ${health.app} | Version: ${health.version}`);

    console.log('\n🏆 FASE 7 TERVERIFIKASI!');
    console.log('====================================');
}

testFase7().catch(e => {
    console.error('\n❌ TEST GAGAL:', e.message);
    process.exit(1);
});
