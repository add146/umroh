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
    const id = crypto.randomUUID();
    const hashed = await hashPassword('password123');

    const sql = [
        `INSERT OR IGNORE INTO users (id, email, password, name, phone, role, is_active) VALUES ('${id}', 'teknisi@madinah.com', '${hashed}', 'Teknisi & Logistik', '6281200000099', 'teknisi', 1);`,
        `UPDATE users SET password = '${hashed}' WHERE email = 'teknisi@madinah.com';`,
        `INSERT OR IGNORE INTO hierarchy_paths (ancestor_id, descendant_id, path_length) SELECT id, id, 0 FROM users WHERE email = 'teknisi@madinah.com';`
    ].join('\n');

    fs.writeFileSync('remote_teknisi.sql', sql, 'utf8');
    console.log("Done! remote_teknisi.sql written.");
}

run();
