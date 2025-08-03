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

  const now = new Date().toISOString();

  const data = {
    timestamp: now,
    ip,
    username: body.username || "unknown",
    userAgent: ua,
    referrer: body.referrer || "None",
    language: body.language || "unknown",
    platform: body.platform || "unknown",
    resolution: body.resolution || "unknown",
    timezone: body.timezone || "unknown",
    cores: body.cores || "unknown"
  };

  const gscriptURL = "https://script.google.com/macros/s/AKfycbx8msWLHxw2XY9SoiPaIG1pBiGxoyTBrCfvZEj2odJnPqcwxVS02ArIqcXxLnSNLTFn/exec";
  const params = new URLSearchParams(data);

  try {
    await fetch(`${gscriptURL}?ts=${Date.now()}`, {
      method: "POST",
      body: params
    });
  } catch (err) {
    console.error("轉送至 GAS 失敗:", err);
  }

  res.status(200).json(data);
}
