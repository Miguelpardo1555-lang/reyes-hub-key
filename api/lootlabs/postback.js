const { redis } = require("../_lib/store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const expectedSecret = process.env.LOOTLABS_POSTBACK_SECRET;

  if (expectedSecret) {
    const receivedSecret =
      req.headers["x-lootlabs-secret"] ||
      req.query?.secret;

    if (receivedSecret !== expectedSecret) {
      return res.status(401).json({ error: "No autorizado." });
    }
  }

  const body = req.body || {};

  const session =
    body.session ||
    body.subid ||
    body.user_id ||
    body.userId;

  const completed =
    body.completed === true ||
    body.status === "completed" ||
    body.status === "complete";

  if (!session) {
    return res.status(400).json({
      error: "Falta el identificador de sesión."
    });
  }

  if (!completed) {
    return res.status(200).json({
      ok: true,
      completed: false
    });
  }

  const keyName = `reyes:session:${session}`;
  const raw = await redis("GET", keyName);

  if (!raw) {
    return res.status(404).json({
      error: "Sesión no encontrada."
    });
  }

  const data = JSON.parse(raw);
  const currentTasks = Number(data.tasks || 0);

  data.tasks = Math.min(currentTasks + 1, 2);

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
