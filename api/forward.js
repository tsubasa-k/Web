export default async function handler(req, res) {
  const { mac, uuid, os } = req.body || {};
  const log = `[${new Date().toISOString()}] OS: ${os} | MAC: ${mac} | UUID: ${uuid}`;
  console.log("Received:", log);

  await fetch("https://script.google.com/macros/s/AKfycbzYlrtp8nu7_q86ScZz-YrmJ-ptx3WZQV1hQWhwMa1jfzHqmMUwBW9_yPO8zHA6lXxg/exec", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ mac, uuid, os })
  });

  res.status(200).send("Logged");
}
