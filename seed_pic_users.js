import fs from 'fs';

const crypto = globalThis.crypto;

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const baseKey = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits', 'deriveKey']);
    const derivedBits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, baseKey, 256);

    const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${saltHex}:${hashHex}`;
}

async function run() {
    const users = [
        {
            id: 'usr-pic-laras',
            name: 'Laras',
            email: 'laras@almadinahms.com',
            phone: '08123456701',
            role: 'pusat',
            passwordPlain: 'LarasUmroh2026!',
            jobdesk: 'Paket Umroh & Jadwal Keberangkatan (Export/Import Google Sheet/Excel)'
        },
        {
            id: 'usr-pic-ega',
            name: 'Ega',
            email: 'ega@almadinahms.com',
            phone: '08123456702',
            role: 'teknisi',
            passwordPlain: 'EgaLogistik2026!',
            jobdesk: 'Logistik & Inventory (Checklist & Catatan Kaki Penerima)'
        },
        {
            id: 'usr-pic-adin',
            name: 'Adin',
            email: 'adin@almadinahms.com',
            phone: '08123456703',
            role: 'pusat',
            passwordPlain: 'AdinJamaah2026!',
            jobdesk: 'Data Jamaah, Manifest, Rooming Board (Gender & Room Type)'
        },
        {
            id: 'usr-pic-edrea',
            name: 'Edrea',
            email: 'edrea@almadinahms.com',
            phone: '08123456704',
            role: 'pusat',
            passwordPlain: 'EdreaJamaah2026!',
            jobdesk: 'Data Jamaah, Manifest, Rooming Board (Gender & Room Type)'
        }
    ];

    const sqlStatements = [];

    for (const u of users) {
        const hashedPassword = await hashPassword(u.passwordPlain);
        sqlStatements.push(`-- PIC: ${u.name} (${u.jobdesk})`);
        sqlStatements.push(`INSERT INTO users (id, email, password, name, phone, role, is_active) VALUES ('${u.id}', '${u.email}', '${hashedPassword}', '${u.name}', '${u.phone}', '${u.role}', 1) ON CONFLICT(id) DO UPDATE SET email=excluded.email, password=excluded.password, name=excluded.name, phone=excluded.phone, role=excluded.role, is_active=1;`);
        sqlStatements.push(`INSERT OR IGNORE INTO hierarchy_paths (ancestor_id, descendant_id, path_length) VALUES ('${u.id}', '${u.id}', 0);`);
        sqlStatements.push('');
    }

    fs.writeFileSync('seed_pic_users.sql', sqlStatements.join('\n'), 'utf8');
    console.log('✅ File seed_pic_users.sql generated successfully!\n');
}

run();
