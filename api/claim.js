const { redis, makeKey } = require("./_lib/store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const session = req.query && req.query.session;

  if (!session) {
    return res.status(400).json({ error: "Falta la sesión." });
  }

  const keyName = `reyes:session:${session}`;
  const raw = await redis("GET", keyName);

  if (!raw) {
    return res.status(404).json({
      error: "Sesión expirada o inexistente."
    });
  }

  const data = JSON.parse(raw);
  const minTasks = Number(process.env.MIN_TASKS || 2);

  if (data.claimed) {
    return res.status(409).json({
      error: "Esta sesión ya fue utilizada."
    });
  }

  if (Number(data.tasks || 0) < minTasks) {
    return res.status(403).json({
      error: `Aún faltan tareas. Completadas: ${data.tasks || 0}/${minTasks}.`
    });
  }

  const generatedKey = makeKey();
  const keyTtl = Number(process.env.KEY_TTL_SECONDS || 86400);

  await redis(
    "SETEX",
    `reyes:key:${generatedKey}`,
    keyTtl,
    JSON.stringify({
      createdAt: Date.now(),
      session
    })
  );

  data.claimed = true;
  data.key = generatedKey;

  await redis(
    "SETEX",
    keyName,
    Number(process.env.SESSION_TTL_SECONDS || 3600),
    JSON.stringify(data)
  );

  return res.status(200).json({
    key: generatedKey,
    expiresInSeconds: keyTtl
  });
};
