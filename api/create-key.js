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
    const tierId = Number(process.env.LOOTLABS_TIER_ID || 2);
    const theme = Number(process.env.LOOTLABS_THEME || 1);

    if (!siteUrl || !token) {
      return res.status(500).json({
        error: "Faltan variables de entorno."
      });
    }

    if (!Number.isFinite(tierId) || !Number.isFinite(theme)) {
      return res.status(500).json({
        error: "LOOTLABS_TIER_ID o LOOTLABS_THEME no son válidos."
      });
    }

    const session = randomId();
    const ttl = Number(process.env.SESSION_TTL_SECONDS || 3600);

    await redis(
      "SETEX",
      `reyes:session:${session}`,
      ttl,
      JSON.stringify({
        tasks: 0,
        createdAt: Date.now(),
        claimed: false
      })
    );

    const returnUrl =
      `${siteUrl.replace(/\/$/, "")}/?session=${encodeURIComponent(session)}`;

    let response;

    try {
      response = await fetch(
        "https://creators.lootlabs.gg/api/public/content_locker",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: "REYES HUB KEY",
            url: returnUrl,
            tier_id: tierId,
            number_of_tasks: 2,
            theme
          })
        }
      );
    } catch (error) {
      console.error("LOOTLABS FETCH ERROR:", error);

      return res.status(502).json({
        error: "No se pudo conectar con LootLabs.",
        code: error?.cause?.code || error?.code || "FETCH_FAILED"
      });
    }

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

    const url = data.message?.loot_url;

    if (!url) {
      return res.status(502).json({
        error: "LootLabs no devolvió una URL de verificación.",
        details: data
      });
    }

    const separator = url.includes("?") ? "&" : "?";

    const lootUrl =
      `${url}${separator}puid=${encodeURIComponent(session)}`;

    return res.status(200).json({
      url: lootUrl
    });

  } catch (error) {
    console.error("CREATE KEY ERROR:", error);

    return res.status(500).json({
      error: "Error interno al generar la key.",
      code: error?.cause?.code || error?.code || "UNKNOWN_ERROR"
    });
  }
};
