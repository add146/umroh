const crypto = globalThis.crypto;

async function hashPassword(password) {
    const salt = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hashHex}.${salt}`;
}

async function run() {
    const id = crypto.randomUUID();
    const hashed = await hashPassword('admin123');
    console.log(`INSERT INTO users (id, email, password, name, phone, role, is_active) VALUES ('${id}', 'admin@umroh.com', '${hashed}', 'Admin Pusat', '6281200000001', 'pusat', 1);`);
    console.log(`INSERT INTO hierarchy_paths (ancestor_id, descendant_id, path_length) VALUES ('${id}', '${id}', 0);`);
}

run();
