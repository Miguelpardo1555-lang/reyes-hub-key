const { redis } = require("./_lib/store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ valid: false });
  }

  const key = String(req.query?.key || "").trim();

  if (!key) {
    return res.status(400).json({ valid: false });
  }

  const raw = await redis("GET", `reyes:key:${key}`);

  if (!raw) {
    return res.status(404).json({ valid: false });
  }

  return res.status(200).json({
    valid: true
  });
};
