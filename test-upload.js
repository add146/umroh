import fs from 'fs';

async function testUpload() {
    const fd = new FormData();
    const fileBlob = new Blob([Buffer.from('pretend image data')], { type: 'image/png' });
    fd.append('image', fileBlob, 'test.png');

    const res = await fetch('https://umroh-api.khibroh.workers.dev/api/upload/imgbb', {
        method: 'POST',
        body: fd
    });
    const text = await res.text();
    console.log(res.status, text);
}

testUpload();
