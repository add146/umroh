import fs from 'fs';

async function testUpload() {
    // 1. Login to get token
    const loginRes = await fetch('https://umroh-api.khibroh.workers.dev/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'admin@umroh.com', password: 'admin123' })
    });
    const { accessToken } = await loginRes.json();
    console.log('Got token:', accessToken ? 'Yes' : 'No');

    // 2. Upload image
    const fd = new FormData();
    const fileBlob = new Blob([Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64')], { type: 'image/gif' }); // transparent 1x1 gif
    // In node 18+, FormData requires File-like objects, or just Blob
    fd.append('image', fileBlob, 'test.gif');

    // Using explicitly Headers object like Vite/React might
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accessToken}`);

    const res = await fetch('https://umroh-api.khibroh.workers.dev/api/upload/imgbb', {
        method: 'POST',
        headers: headers,
        body: fd
    });
    const text = await res.text();
    console.log('Upload Result:', res.status, text);
}

testUpload();
