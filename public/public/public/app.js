const generate = document.getElementById("generate");
const status = document.getElementById("status");
const result = document.getElementById("result");
const keyEl = document.getElementById("key");
const copy = document.getElementById("copy");

function setStatus(message) {
  status.textContent = message || "";
}

async function claimFromReturn() {
  const params = new URLSearchParams(location.search);
  const session = params.get("session");
  if (!session) return;

  setStatus("Verificando tus tareas...");

  try {
    const res = await fetch(`/api/claim?session=${encodeURIComponent(session)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "No se pudo reclamar la key.");
    }

    keyEl.textContent = data.key;
    result.classList.remove("hidden");
    setStatus("Key generada correctamente.");

    history.replaceState({}, "", location.pathname);
  } catch (err) {
    setStatus(err.message);
  }
}

generate.addEventListener("click", async () => {
  generate.disabled = true;
  result.classList.add("hidden");
  setStatus("Preparando verificador...");

  try {
    const res = await fetch("/api/create-key", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "No se pudo iniciar.");
    }

    location.href = data.url;
  } catch (err) {
    setStatus(err.message);
    generate.disabled = false;
  }
});

copy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(keyEl.textContent);
  copy.textContent = "COPIADO";
  setTimeout(() => copy.textContent = "COPIAR", 1200);
});

claimFromReturn();
