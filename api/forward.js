export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    console.error("JSON 解析失敗", e);
  }

  const now = new Date().toISOString();  // 傳給前端顯示時間（UTC 格式）

  const data = {
    timestamp: now,
    ip,
    userAgent: ua,
    referrer: body.referrer || "None",
    language: body.language || "unknown",
    platform: body.platform || "unknown",
    resolution: body.resolution || "unknown",
    timezone: body.timezone || "unknown",
    cores: body.cores || "unknown"
  };

  // 傳送到 Google Apps Script 儲存
  const gscriptURL = "https://script.google.com/macros/s/AKfycbw6Zbb8WVk8AYyqoyglxEBGab4iyewNaUgx0Ul68bNv-Bw-clfch40X880Cmtg2tesY/exec";
  const params = new URLSearchParams(data);

  try {
    await fetch(`${gscriptURL}?ts=${Date.now()}`, {
      method: "POST",
      body: params
    });
  } catch (err) {
    console.error("轉發到 GAS 失敗:", err);
  }

  // 回傳完整資料給前端
  res.status(200).json(data);
}
