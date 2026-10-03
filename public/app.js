const generate = document.getElementById("generate");
const status = document.getElementById("status");

const lootLabsLink = "https://direct-link.net/9743264/BEzE0DFmqRqN";

function setStatus(message) {
  status.textContent = message || "";
}

generate.addEventListener("click", () => {
  generate.disabled = true;
  setStatus("Abriendo verificador...");

  window.location.href = lootLabsLink;
});
