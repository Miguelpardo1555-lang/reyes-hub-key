const { redis } = require("../../api/_lib/store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const clickId = req.query?.click_id;
  const uniqueId = req.query?.unique_id;

  if (!clickId) {
    return res.status(400).json({
      error: "Falta el ID de clic."
    });
  }

  const keyName = `reyes:session:${clickId}`;
  const raw = await redis("GET", keyName);

  if (!raw) {
    return res.status(404).json({
      error: "Sesión no encontrada."
    });
  }

  const data = JSON.parse(raw);

  if (uniqueId) {
    const alreadyProcessed = await redis(
      "SISMEMBER",
      `reyes:postbacks:${clickId}`,
      uniqueId
    );

    if (alreadyProcessed) {
      return res.status(200).json({
        ok: true,
        duplicate: true,
        tasks: Number(data.tasks || 0)
      });
    }

    await redis(
      "SADD",
      `reyes:postbacks:${clickId}`,
      uniqueId
    );

    await redis(
      "EXPIRE",
      `reyes:postbacks:${clickId}`,
      Number(process.env.SESSION_TTL_SECONDS || 3600)
    );
  }

  data.tasks = Math.min(Number(data.tasks || 0) + 1, 2);

  await redis(
    "SETEX",
    keyName,
    Number(process.env.SESSION_TTL_SECONDS || 3600),
    JSON.stringify(data)
  );

  return res.status(200).json({
    ok: true,
    tasks: data.tasks
  });
};
