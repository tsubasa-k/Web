export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";

  let body = {};
  try {
    if (req.headers['content-type'] === 'application/json') {
      body = req.body;
    }
  } catch (e) {
    console.error("JSON parse error:", e);
  }

  const gscriptURL = "https://script.google.com/macros/s/AKfycbyM9jZAnb1q-4lpv8xXZcJzARjWIzbtC-qr7uYxPI0EiL09hkZdmNCVUbnaST4NECh0/exec";

  const payload = {
    ip,
    userAgent: ua,
    referrer: body.referrer || "None",
    language: body.language || "unknown",
    platform: body.platform || "unknown",
    resolution: body.resolution || "unknown",
    timezone: body.timezone || "unknown",
    cores: body.cores?.toString() || "unknown" // 確保為 string
  };

  await fetch(gscriptURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  res.status(200).send("OK");
}
