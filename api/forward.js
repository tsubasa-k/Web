export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";

  let body = {};
  try {
    body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body); // for Vercel raw JSON
    }
  } catch (e) {
    console.error("❌ 解析 JSON 失敗", e);
  }

  const ref = body.referrer || "None";
  const lang = body.language || "unknown";
  const platform = body.platform || "unknown";
  const resolution = body.resolution || "unknown";
  const timezone = body.timezone || "unknown";
  const cores = body.cores || "unknown";

  const gscriptURL = "https://script.google.com/macros/s/AKfycbxp6U-Gr4-zvlOB5pB3R2CUNGb7azi5ZUaJ8wHEnJWueb7G8dhsRdlNW7I1a7GtMHaZ/exec";
  const params = new URLSearchParams({
    ip,
    userAgent: ua,
    referrer: ref,
    language: lang,
    platform,
    resolution,
    timezone,
    cores
  });

  await fetch(`${gscriptURL}?ts=${Date.now()}`, {
    method: "POST",
    body: params
  });

  res.status(200).send("OK");
}
