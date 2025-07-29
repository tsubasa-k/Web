export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || "unknown";
  const ua = req.headers['user-agent'] || "unknown";
  const ref = req.headers['referer'] || "None";

  // 從前端取得補充資訊（你應該是用 JSON POST）
  let clientInfo = {};
  try {
    clientInfo = req.body || {};
  } catch (e) {
    console.error("無法解析 req.body", e);
  }

  const gscriptURL = "https://script.google.com/macros/s/AKfycbyM9jZAnb1q-4lpv8xXZcJzARjWIzbtC-qr7uYxPI0EiL09hkZdmNCVUbnaST4NECh0/exec";

  const payload = {
    ip: ip,
    userAgent: ua,
    referrer: ref,
    ...clientInfo
  };

  await fetch(gscriptURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  res.status(200).json({ status: "sent", reply: "OK" });
}
