import { hashPassword } from './src/lib/password.js';
import fs from 'fs';

async function run() {
    const hashed = await hashPassword('password123');
    console.log("HASH:", hashed);
    const q1 = `UPDATE users SET password = '${hashed}' WHERE email = 'teknisi@madinah.com';`;
    fs.writeFileSync('query2.sql', q1, 'utf8');
}

run();
