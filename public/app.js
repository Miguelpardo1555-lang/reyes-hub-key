const generate = document.getElementById("generate");
const status = document.getElementById("status");

const lootLabsLink = "https://lootdest.org/s?JoG5Y0vG";

function setStatus(message) {
  status.textContent = message || "";
}

generate.addEventListener("click", () => {
  generate.disabled = true;
  setStatus("Abriendo verificador...");

  window.location.href = lootLabsLink;
});
