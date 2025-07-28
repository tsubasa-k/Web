export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";

  let body = {};
  try {
    body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
  } catch (e) {
    console.error("JSON parse error:", e);
  }

  // 要傳給 Apps Script 的參數
  const params = new URLSearchParams({
    ip,
    userAgent: ua,
    referrer: body.referrer || "None",
    language: body.language || "unknown",
    platform: body.platform || "unknown",
    resolution: body.resolution || "unknown",
    timezone: body.timezone || "unknown",
    cores: body.cores || "unknown"
  });

  const gscriptURL = "https://script.google.com/macros/s/AKfycbyM9jZAnb1q-4lpv8xXZcJzARjWIzbtC-qr7uYxPI0EiL09hkZdmNCVUbnaST4NECh0/exec";

  await fetch(`${gscriptURL}?ts=${Date.now()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded" 
    },
    body: params.toString()
  });

  res.status(200).send("OK");
}
