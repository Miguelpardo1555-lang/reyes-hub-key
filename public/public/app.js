const generate = document.getElementById("generate");
const status = document.getElementById("status");
const result = document.getElementById("result");
const keyEl = document.getElementById("key");
const copy = document.getElementById("copy");

function setStatus(message) {
  status.textContent = message || "";
}

generate.addEventListener("click", async () => {
  generate.disabled = true;
  result.classList.add("hidden");
  setStatus("Preparando verificador...");

  try {
    const response = await fetch("/api/create-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || `Error del servidor (${response.status}).`
      );
    }

    if (!data.url) {
      throw new Error("LootLabs no devolvió el enlace.");
    }

    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo iniciar el verificador.");
    generate.disabled = false;
  }
});

copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(keyEl.textContent);
    copy.textContent = "COPIADO";

    setTimeout(() => {
      copy.textContent = "COPIAR";
    }, 1200);
  } catch {
    setStatus("No se pudo copiar la key.");
  }
});
