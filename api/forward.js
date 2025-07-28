export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";
  const ref = req.headers['referer'] || "None";

  // 前端傳來的資訊（使用 JSON）
  let device = {};
  try {
    device = req.body ?? {};
  } catch (err) {
    console.error("JSON 解析失敗:", err);
  }

  // 確保支援 Vercel Serverless 自動解析 JSON（如必要可加 middleware）
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  const payload = {
    ip: ip,
    userAgent: ua,
    referrer: ref,
    language: body.language || "unknown",
    platform: body.platform || "unknown",
    resolution: body.resolution || "unknown",
    timezone: body.timezone || "unknown",
    hardwareConcurrency: body.hardwareConcurrency || "unknown",
    hasTouch: body.hasTouch || "unknown"
  };

  // 傳送到你的 Google Apps Script Web App
  const gscriptURL = "https://script.google.com/macros/s/AKfycbzGQiL4FjCjkxi1iNgpZ8BlBdUHFnBhpUdOB2njBh5vscDkCU0ww9kuCrciCfTgdA7mDA/exec";

  const params = new URLSearchParams(payload);

  await fetch(`${gscriptURL}?ts=${Date.now()}`, {
    method: "POST",
    body: params
  });

  res.status(200).send("OK");
}
