// Startup feedback must not depend on the game's module dependency graph.
export async function bootGame({
  load,
  ui,
  schedule = setTimeout,
  cancel = clearTimeout,
  onError = () => {},
}) {
  let settled = false;
  ui("loading");
  const timer = schedule(() => {
    if (!settled) ui("slow");
  }, 15000);
  try {
    await load();
    settled = true;
    cancel(timer);
    ui("ready");
    return true;
  } catch (error) {
    settled = true;
    cancel(timer);
    onError(error);
    ui("failed");
    return false;
  }
}
export function renderBootState(doc, state) {
  const ready = state === "ready",
    failed = state === "failed",
    home = doc.querySelector("#welcome");
  doc.body.dataset.boot = state;
  home.setAttribute("aria-busy", String(!ready && !failed));
  for (const id of ["welcomePlay", "welcomeNew", "welcomeLearn"])
    doc.getElementById(id).disabled = !ready;
  doc.querySelector("#welcomeBootText").textContent = {
    loading: "Preparando seu país…",
    slow: "A abertura está demorando mais que o esperado.",
    failed: "Não foi possível abrir o país.",
    ready: "",
  }[state];
  doc.querySelector("#welcomeBootDetail").textContent =
    failed || state === "slow"
      ? "Tente carregar novamente. Seus cenários salvos serão mantidos."
      : "Carregando território e dados da sessão.";
  doc.querySelector("#welcomeRetry").hidden = ready || state === "loading";
  if (failed) {
    home.hidden = false;
    doc.querySelector("#tutorial").hidden = true;
    doc.querySelector(".app").inert = true;
    doc.body.classList.remove("tutorial-active");
    doc.body.classList.add("entry-active");
    doc.querySelector("#welcomeRetry").focus();
  } else if (ready && !home.hidden)
    doc.getElementById("welcomePlay").focus({ preventScroll: true });
}
if (typeof document !== "undefined") {
  document.querySelector("#welcomeRetry").onclick = (event) => {
    event.preventDefault();
    location.reload();
  };
  bootGame({
    load: () => import("./app.js"),
    ui: (state) => renderBootState(document, state),
    onError: (error) =>
      console.error("Meridiano: falha na inicialização", error),
  });
}
