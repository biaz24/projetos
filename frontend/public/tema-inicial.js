// Roda antes do React: aplica o tema salvo para a tela já nascer escura (ou clara).
(function () {
  try {
    var salvo = localStorage.getItem("ideiafutura:tema");
    var escuro =
      salvo === "escuro" ||
      ((salvo === null || salvo === "automatico") &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", escuro ? "dark" : "light");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
