export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";
  const ref = req.headers['referer'] || "None";

  // 替換成你的 Google Apps Script Web App URL（/exec 結尾）
  const gscriptURL = "https://script.google.com/macros/s/AKfycbyyv_X5fERNpIs53cVbR6Vsqoo2wPmQuws3SIPBRwHITRjDO5CSwxgHIujlnFMxI2Ug/exec";
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
