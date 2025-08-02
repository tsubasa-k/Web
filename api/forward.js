export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";
  const ref = req.headers['referer'] || "None";
  const lang = req.headers['accept-language'] || "unknown";
  const encoding = req.headers['accept-encoding'] || "unknown";
  const host = req.headers['host'] || "unknown";
  const connection = req.headers['connection'] || "unknown";

  // Google Apps Script Web App URL
  const gscriptURL = "https://script.google.com/macros/s/AKfycbwAd3mFQQk9lRMqlZnJm7PBVLkfFLkzlY9joNFNKingwBrw7XA4gWZKALv8Km1QOFIW/exec";
  const params = new URLSearchParams({
    ip: ip,
    userAgent: ua,
    referrer: ref,
    language: lang,
    encoding: encoding,
    host: host,
    connection: connection
  });

  await fetch(`${gscriptURL}?ts=${Date.now()}`, {
    method: "POST",
    body: params
  });

  res.status(200).send("OK");
}
