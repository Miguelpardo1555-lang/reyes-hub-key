const { redis, randomId } = require("./_lib/store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido."
    });
  }

  try {
    const siteUrl = process.env.SITE_URL;
    const token = process.env.LOOTLABS_API_TOKEN;

    if (!siteUrl || !token) {
      return res.status(500).json({
        error: "Faltan variables de entorno."
      });
    }

    const session = randomId();

    await redis(
      "SETEX",
      `reyes:session:${session}`,
      Number(process.env.SESSION_TTL_SECONDS || 3600),
      JSON.stringify({
        tasks: 0,
        createdAt: Date.now(),
        claimed: false
      })
    );

    const returnUrl =
      `${siteUrl.replace(/\/$/, "")}/?session=${encodeURIComponent(session)}`;

    const params = new URLSearchParams();

    params.set("api_token", token);
    params.set("title", "REYES HUB KEY");
    params.set("url", returnUrl);
    params.set("tier_id", "2");
    params.set("number_of_tasks", "2");
    params.set("theme", "1");

    const lootApiUrl =
      `https://creators.lootlabs.gg/api/public/content_locker?${params.toString()}`;

    console.log("LOOTLABS REQUEST PARAMS:", {
      title: "REYES HUB KEY",
      url: returnUrl,
      tier_id: "2",
      number_of_tasks: "2",
      theme: "1",
      hasApiToken: Boolean(token)
    });

    const response = await fetch(lootApiUrl, {
      method: "GET"
    });

    const data = await response.json().catch(() => ({}));

    console.log("LOOTLABS STATUS:", response.status);
    console.log("LOOTLABS RESPONSE:", data);

    if (!response.ok || data.type === "error") {
      return res.status(502).json({
        error: "LootLabs rechazó la solicitud.",
        status: response.status,
        details: data.message || data
      });
    }

    const lootUrl = data.message?.loot_url;

    if (!lootUrl) {
      return res.status(502).json({
        error: "LootLabs no devolvió una URL.",
        details: data
      });
    }

    const separator = lootUrl.includes("?") ? "&" : "?";

    return res.status(200).json({
      url: `${lootUrl}${separator}puid=${encodeURIComponent(session)}`
    });

  } catch (error) {
    console.error("CREATE KEY ERROR:", error);

    return res.status(500).json({
      error: "Error interno al generar la key."
    });
  }
};
