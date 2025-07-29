// /api/forward.js
export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";

  // 手動解析 JSON body
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString();
  let body = {};
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    console.error("JSON parse error:", e);
  }

  // 準備要送到 Google Apps Script 的資料
  const payload = {
    ip,
    userAgent: ua,
    referrer: body.referrer || "None",
    language: body.language || "unknown",
    platform: body.platform || "unknown",
    resolution: body.resolution || "unknown",
    timezone: body.timezone || "unknown",
    cores: (body.cores || "unknown").toString()
  };

  // 傳送到 Google Apps Script
  const gscriptURL = "https://script.google.com/macros/s/AKfycbyM9jZAnb1q-4lpv8xXZcJzARjWIzbtC-qr7uYxPI0EiL09hkZdmNCVUbnaST4NECh0/exec";

  await fetch(gscriptURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  res.status(200).send("OK");
}
