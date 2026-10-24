export function initNavigation() {
  const app = document.querySelector(".app");
  const toggle = document.querySelector("#toggleNavigation");
  function apply(expanded) {
    app.classList.toggle("nav-expanded", expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute(
      "aria-label",
      expanded ? "Recolher navegação" : "Expandir navegação",
    );
    toggle.querySelector(".nav-label").textContent = expanded
      ? "Recolher menu"
      : "Expandir menu";
    try {
      localStorage.setItem("meridiano:navigation-expanded", String(expanded));
    } catch {}
  }
  let expanded = false;
  try {
    expanded = localStorage.getItem("meridiano:navigation-expanded") === "true";
  } catch {}
  apply(expanded);
  toggle.onclick = () => apply(!app.classList.contains("nav-expanded"));
  document.querySelector(".rail").addEventListener("keydown", (e) => {
    if (e.key === "Escape" && app.classList.contains("nav-expanded")) {
      apply(false);
      toggle.focus();
    }
  });
}
