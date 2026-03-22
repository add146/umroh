const fetch = require('node-fetch');

async function testWAHA() {
    try {
        const response = await fetch('https://waha.khibroh.com/api/sendText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': '060731d7987a4c7ebd23a173a8fdb158'
            },
            body: JSON.stringify({
                chatId: '628118889900@c.us',
                text: 'test',
                session: 'default'
            })
        });

        console.log('Status:', response.status);
        const data = await response.text();
        console.log('Response:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}

testWAHA();
