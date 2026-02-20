const { pbkdf2Sync, randomBytes } = require('crypto');

function hashPassword(password) {
    const salt = randomBytes(16);
    const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const saltHex = salt.toString('hex');
    const hashHex = hash.toString('hex');
    return `${saltHex}:${hashHex}`;
}

const password = 'password123';
const hashed = hashPassword(password);
console.log(`wrangler d1 execute umroh-db --local --command="UPDATE users SET password = '${hashed}' WHERE email = 'admin@umroh.com';"`);
