export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";

  const {
    userAgent = "unknown",
    referrer = "None",
    resolution = "unknown",
    platform = "unknown",
    language = "unknown",
    timezone = "unknown",
    cores = "unknown"
  } = req.body ? JSON.parse(req.body) : {};

  const gscriptURL = "https://script.google.com/macros/s/AKfycbxMbACS4gM7-k67MClyNOvpnjQWgDhENZpEZKwgzxvBdg4WegdPAldbhL5A2vzZz4_X/exec"; // 替換為你的 Apps Script URL

  const params = new URLSearchParams({
    ip,
    userAgent,
    referrer,
    resolution,
    platform,
    language,
    timezone,
    cores
  });

  await fetch(`${gscriptURL}?ts=${Date.now()}`, {
    method: "POST",
    body: params
  });

  res.status(200).send("OK");
}
