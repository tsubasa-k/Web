export default async function handler(req, res) {
  // 取得 IP、UA
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";

  // 手動解析 JSON body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString();

  let data = {};
  try {
    data = JSON.parse(rawBody);
  } catch (e) {
    console.error("JSON parse error:", e);
  }

  // 傳送到 Google Apps Script
  const gscriptURL = "https://script.google.com/macros/s/AKfycbyhHljLTGgqeqspJClii6V8I-utZCBKMNqAUMoMyB_6dYCYDo3BkfrZLR8Zo-V8QRzd/exec";

  await fetch(gscriptURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ip,
      userAgent: ua,
      referrer: data.referrer || "None",
      language: data.language || "unknown",
      platform: data.platform || "unknown",
      resolution: data.resolution || "unknown",
      timezone: data.timezone || "unknown",
      cores: data.cores || "unknown"
    })
  });

  res.status(200).send("OK");
}
