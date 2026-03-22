const loginObj = { identifier: "admin@almadinahms.com", password: "password123" };
fetch("http://localhost:8787/api/auth/login", {
    method: "POST", body: JSON.stringify(loginObj), headers: { "Content-Type": "application/json" }
}).then(r => r.json()).then(data => {
    console.log("Login Res:", data);
    if (data.accessToken) {
        return fetch("http://localhost:8787/api/communication/test-wa", {
            method: "POST",
            body: JSON.stringify({ phone: "628118889900", message: "test cli" }),
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + data.accessToken }
        }).then(async r => {
            console.log("Status:", r.status);
            const text = await r.text();
            console.log("Response Text:", text);
        });
    }
}).catch(console.error);
