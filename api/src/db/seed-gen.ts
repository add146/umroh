import { hashPassword } from '../lib/password.js';

async function generateSeed() {
    const password = 'admin123';
    const hashedPassword = await hashPassword(password);
    const id = crypto.randomUUID();

    console.log(`-- Seed Pusat User`);
    console.log(`INSERT INTO users (id, email, password, name, role, is_active) 
VALUES ('${id}', 'admin@umroh.com', '${hashedPassword}', 'Admin Pusat', 'pusat', 1);`);

    // Also insert into hierarchy_paths for self (dist length 0)
    console.log(`INSERT INTO hierarchy_paths (ancestor_id, descendant_id, path_length)
VALUES ('${id}', '${id}', 0);`);
}

generateSeed();
