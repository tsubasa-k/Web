export const config = {
  api: {
    bodyParser: false, // 禁用 Vercel 預設 JSON parsing，自己解析
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 手動解析 JSON body
  let rawBody = '';
  req.on('data', chunk => {
    rawBody += chunk;
  });

  req.on('end', async () => {
    let data = {};
    try {
      data = JSON.parse(rawBody);
    } catch (err) {
      console.error("JSON parse error:", err);
      return res.status(400).send("Invalid JSON");
    }

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || "unknown";
    const ua = req.headers['user-agent'] || "unknown";

    const gscriptURL = "https://script.google.com/macros/s/AKfycbyM9jZAnb1q-4lpv8xXZcJzARjWIzbtC-qr7uYxPI0EiL09hkZdmNCVUbnaST4NECh0/exec";

    const gscriptPayload = {
      ip,
      userAgent: ua,
      referrer: data.referrer || "None",
      language: data.language || "unknown",
      platform: data.platform || "unknown",
      resolution: data.resolution || "unknown",
      timezone: data.timezone || "unknown",
      cores: data.cores || "unknown"
    };

    try {
      await fetch(gscriptURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(gscriptPayload)
      });

      return res.status(200).json({ status: "forwarded to Google Apps Script" });
    } catch (e) {
      console.error("Error forwarding to Apps Script:", e);
      return res.status(500).send("Forward failed");
    }
  });
}
