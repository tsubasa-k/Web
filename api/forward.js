export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";
  const ref = req.headers['referer'] || "unknown";

  // 將資料轉發到 Google Apps Script Web App
  const gscriptURL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
  const params = new URLSearchParams({
    ip: ip,
    userAgent: ua,
    referrer: ref
  });

  await fetch(`${gscriptURL}?ts=${Date.now()}`, {
    method: "POST",
    body: params
  });

  res.status(200).send("OK");
}
