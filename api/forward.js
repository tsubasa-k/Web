export default async function handler(req, res) {
  const { mac, uuid, os } = req.body || {};
  const log = `[${new Date().toISOString()}] OS: ${os} | MAC: ${mac} | UUID: ${uuid}`;
  console.log("Received:", log);

  await fetch("https://script.google.com/macros/s/AKfycbynoB555JuBUhbEbeJYr8FafVSDcssL1qigSbiJTLUkD_YbBOy_-jnMdLgR8sG0eXWA/exec", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ mac, uuid, os })
  });

  res.status(200).send("Logged");
}
