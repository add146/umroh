async function testLogin() {
    const res = await fetch('http://localhost:8787/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier: 'teknisi@madinah.com', password: 'password123' })
    });
    const data = await res.json();
    console.log("STATUS:", res.status);
    console.log("DATA:", data);
}
testLogin();
