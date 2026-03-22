const loginObj = { email: "admin@almadinahms.com", password: "password123" };
fetch("https://umroh-api.khibroh.workers.dev/api/auth/login", {
    method: "POST", body: JSON.stringify(loginObj), headers: { "Content-Type": "application/json" }
}).then(r => r.json()).then(data => {
    console.log("Login Res:", data);
    if (data.accessToken) {
        return fetch("https://umroh-api.khibroh.workers.dev/api/communication/test-wa", {
            method: "POST",
            body: JSON.stringify({ phone: "628118889900", message: "test cli" }),
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + data.accessToken }
        }).then(r => r.json()).then(res => console.log("Test WA result:", res));
    }
}).catch(console.error);
