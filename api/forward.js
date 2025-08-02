export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";
  const ref = req.headers['referer'] || "None";
  const lang = req.headers['accept-language'] || "unknown";
  const encoding = req.headers['accept-encoding'] || "unknown";
  const host = req.headers['host'] || "unknown";
  const connection = req.headers['connection'] || "unknown";

  // Google Apps Script Web App URL
  const gscriptURL = "https://script.google.com/macros/s/AKfycbwwXKr79kJDKLmUZ4oIeGqGOI6dwXU7ESzKhzCI3U0PDk4iFfEEMqRduxXclKM8uDhN/exec";
  const params = new URLSearchParams({
    ip,
    userAgent: ua,
    referrer: ref,
    language: lang,
    encoding,
    host,
    connection
  });

  await fetch(`${gscriptURL}?ts=${Date.now()}`, {
    method: "POST",
    body: params
  });

  res.status(200).send("OK");
}
