// File: api/receive.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { mac, uuid, ipconfig, os } = req.body || {};
  const log = `[${new Date().toISOString()}] OS: ${os} | MAC: ${mac} | UUID: ${uuid} | IPINFO: ${ipconfig}`;

  console.log("Received from client:", log);

  // 將資料轉發至 Google Apps Script（請替換為你的網址）
  const gscriptURL = "https://script.google.com/macros/s/AKfycbynoB555JuBUhbEbeJYr8FafVSDcssL1qigSbiJTLUkD_YbBOy_-jnMdLgR8sG0eXWA/exec";

  try {
    await fetch(gscriptURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ mac, uuid, ipconfig, os })
    });
  } catch (err) {
    console.error("Failed to forward to Google Sheet:", err.message);
  }

  res.status(200).send("Logged");
}
