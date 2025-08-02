export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";
  const ref = req.headers['referer'] || "None";

  // 替換成你的 Google Apps Script Web App URL（/exec 結尾）
  const gscriptURL = "https://script.google.com/macros/s/AKfycbwuZ2-WR5gyilzKxc31sO3B06VIarV6cBFQZpdBRTYUTVQPofbEBoA3CGUk09fMPm6n/exec";
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
