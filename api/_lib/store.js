const crypto = require("crypto");

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command, ...args) {
  if (!redisUrl || !redisToken) {
    throw new Error("Faltan las variables de Upstash Redis.");
  }

  const response = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([command, ...args])
  });

  if (!response.ok) {
    throw new Error("Error al conectar con Redis.");
  }

  const data = await response.json();
  return data.result;
}

function randomId() {
  return crypto.randomBytes(16).toString("hex");
}

function makeKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const part = () =>
    Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");

  return `REYES-${part()}-${part()}`;
}

module.exports = {
  redis,
  randomId,
  makeKey
};
