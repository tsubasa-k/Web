// File: api/forward.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { mac, uuid, ipconfig, os } = req.body || {};

    const log = `[${new Date().toISOString()}] OS: ${os} | MAC: ${mac} | UUID: ${uuid} | IP: ${ipconfig}`;
    console.log("收到資料:", log);

    // 請將這個改成你的 Google Apps Script Web App URL (要是 /exec 結尾)
    const gscriptURL = "https://script.google.com/macros/s/AKfycbybQVgVkMiyoYmveAoDrj8Bp1tbbzNlf-6_n_Qw6XGpVouZWXk3tPpcQfxiRUhiKDuS/exec";

    // 傳送到 Google Apps Script
    const response = await fetch(gscriptURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        mac,
        uuid,
        ipconfig,
        os
      })
    });

    const reply = await response.text();
    console.log("Google Apps Script 回應:", reply);

    res.status(200).json({ success: true, reply });
  } catch (err) {
    console.error("發送資料失敗:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
