export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // 讀取 raw body
  let rawBody = "";
  req.on("data", chunk => rawBody += chunk);
  req.on("end", async () => {
    let clientData = {};
    try {
      clientData = JSON.parse(rawBody);
    } catch (e) {
      console.error("Invalid JSON", e);
      return res.status(400).send("Bad JSON");
    }

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "unknown";
    const ua = req.headers['user-agent'] || "unknown";

    // Google Apps Script Web App URL
    const gscriptURL = "https://script.google.com/macros/s/AKfycbyM9jZAnb1q-4lpv8xXZcJzARjWIzbtC-qr7uYxPI0EiL09hkZdmNCVUbnaST4NECh0/exec";

    // 組合 payload
    const payload = {
      ip,
      userAgent: ua,
      referrer: clientData.referrer || "None",
      language: clientData.language || "unknown",
      platform: clientData.platform || "unknown",
      resolution: clientData.resolution || "unknown",
      timezone: clientData.timezone || "unknown",
      cores: clientData.cores || "unknown"
    };

    // 傳送至 Google Apps Script
    try {
      const gRes = await fetch(gscriptURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const text = await gRes.text();
      return res.status(200).json({ status: "sent", reply: text });
    } catch (e) {
      console.error("Failed to forward", e);
      return res.status(500).send("Forwarding Failed");
    }
  });
}
