// Script to create test accounts for all hierarchy levels
// Pusat → Cabang → Mitra → Agen → Reseller (same chain)

const API = 'http://127.0.0.1:8788';

const ACCOUNTS = [
    // Pusat already exists: admin@umroh.com / admin123
    { role: 'cabang', name: 'Cabang Jakarta', email: 'cabang@umroh.com', password: 'cabang123', affiliateCode: 'CAB-JKT', phone: '6281200000002' },
    { role: 'mitra', name: 'Mitra Bandung', email: 'mitra@umroh.com', password: 'mitra123', affiliateCode: 'MIT-BDG', phone: '6281200000003' },
    { role: 'agen', name: 'Agen Ahmad', email: 'agen@umroh.com', password: 'agen123', affiliateCode: 'AGN-AHM', phone: '6281200000004' },
    { role: 'reseller', name: 'Reseller Budi', email: 'reseller@umroh.com', password: 'reseller123', affiliateCode: 'RSL-BDI', phone: '6281200000005' },
];

async function login(email, password) {
    const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Login failed for ${email}: ${data.error}`);
    return data.accessToken;
}

async function createUser(token, user) {
    const res = await fetch(`${API}/api/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: user.name,
            email: user.email,
            phone: user.phone,
            password: user.password,
            affiliateCode: user.affiliateCode,
            targetRole: user.role,
        })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.log(`  ⚠️ Failed to create ${user.role} (${data.error || res.statusText})`);
        return null;
    }
    console.log(`  ✅ ${user.role}: ${user.name} (${user.email}) created → ID: ${data.user?.id}`);
    return data;
}

async function main() {
    console.log('🚀 Creating test accounts chain: Pusat → Cabang → Mitra → Agen → Reseller\n');

    // Step 1: Login as Pusat
    let currentEmail = 'admin@umroh.com';
    let currentPassword = 'admin123';

    for (const account of ACCOUNTS) {
        try {
            console.log(`\n📌 Login as ${currentEmail}...`);
            const token = await login(currentEmail, currentPassword);
            console.log(`  ✅ Authenticated`);

            console.log(`  Creating ${account.role}: ${account.name}...`);
            await createUser(token, account);

            // Next iteration: login as this account to create the next level
            currentEmail = account.email;
            currentPassword = account.password;
        } catch (err) {
            console.log(`  ❌ Error: ${err.message}`);
            // If user already exists, try logging in as them for next level
            currentEmail = account.email;
            currentPassword = account.password;
        }
    }

    console.log('\n\n🎉 Done! Summary of all accounts:\n');
    console.log('┌────────────┬──────────────────────┬──────────────────────┬──────────────┐');
    console.log('│ Role       │ Email                │ Password             │ Affiliate    │');
    console.log('├────────────┼──────────────────────┼──────────────────────┼──────────────┤');
    console.log('│ pusat      │ admin@umroh.com       │ admin123             │ -            │');
    ACCOUNTS.forEach(a => {
        console.log(`│ ${a.role.padEnd(10)} │ ${a.email.padEnd(20)} │ ${a.password.padEnd(20)} │ ${a.affiliateCode.padEnd(12)} │`);
    });
    console.log('└────────────┴──────────────────────┴──────────────────────┴──────────────┘');
}

main().catch(console.error);
