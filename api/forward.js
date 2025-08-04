export default async function handler(req, res) {
  const { mac, uuid, ipconfig } = req.body || {};

  console.log("來自本機的裝置資訊:", { mac, uuid, ipconfig });

  // TODO: 可寫入 Google Sheet、DB、或寄信

  res.status(200).json({ message: "已接收" });
}
