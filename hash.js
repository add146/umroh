const crypto = require('crypto');

async function getHash(password) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

getHash('admin123').then(console.log);
