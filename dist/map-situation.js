export const situationColors = ["#9aa79c", "#7ca869", "#d3a048", "#c76b50"];
export function stateSituation(s, i) {
  const r = s.systems?.regions?.[i],
    issues = [];
  if (r) {
    if (r.waterService < 0.95 || (r.need > 0 && r.water / r.need < 0.5))
      issues.push({
        kind: "water",
        level: r.waterService < 0.7 ? 3 : 2,
        label: "Água em atenção",
        detail: `Atendimento ${Math.round(r.waterService * 100)}%; reserva ${r.water.toFixed(1).replace(".", ",")} u.a.`,
      });
    if (r.energyService < 0.95)
      issues.push({
        kind: "energy",
        level: r.energyService < 0.75 ? 3 : 2,
        label: "Rede elétrica pressionada",
        detail: `Atendimento ${Math.round(r.energyService * 100)}%; condição ${Math.round(r.grid)}/100.`,
      });
    if (r.backlog > 20)
      issues.push({
        kind: "logistics",
        level: r.backlog > 65 ? 3 : 2,
        label: "Carga acumulada",
        detail: `Fila em ${Math.round(r.backlog)}/200. O acúmulo limita as exportações.`,
      });
  }
  const works = (s.investments ?? []).filter(
    (p) =>
      p.region === i && ["planning", "building", "ready"].includes(p.phase),
  );
  for (const p of works)
    issues.push({
      kind: "works",
      level: 1,
      label:
        p.phase === "planning"
          ? "Obra em planejamento"
          : p.phase === "ready"
            ? "Entrega aguardando operação"
            : "Obra em andamento",
      detail:
        "A implantação ainda não concede os benefícios de uma rede em operação.",
    });
  if (r?.commissioned)
    issues.push({
      kind: "delivery",
      level: 1,
      label: "Capacidade privada entregue",
      detail: `Ampliação privada de manufaturas em ${Math.round(r.privateCapacity * 100)}% acumulados. Produção depende de redes e demanda.`,
    });
  for (const p of s.investmentReport?.transitions ?? [])
    if (p.region === i && p.phase === "operating")
      issues.push({
        kind: "delivery",
        level: 1,
        label: "Programa entrou em operação",
        detail: "Benefícios e manutenção passaram a integrar o país.",
      });
  issues.sort((a, b) => b.level - a.level);
  return {
    level: issues[0]?.level ?? (r ? 1 : 0),
    issues,
    label:
      issues[0]?.label ??
      (r ? "Redes sem restrição relevante" : "Redes ainda não apuradas"),
  };
}
export function initSituationUI({
  getState,
  getRegions,
  getSelected,
  getLayer,
  selectRegion,
}) {
  const ns = "http://www.w3.org/2000/svg",
    overlay = document.createElementNS(ns, "g");
  overlay.id = "situationOverlay";
  document.querySelector("#economicOverlay").after(overlay);
  const panel = document.createElement("section");
  panel.id = "regionSituation";
  document.querySelector("#regionalEconomy").after(panel);
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const symbol = {
    water: "M12 2C9 7 5 10 5 14a7 7 0 0 0 14 0c0-4-4-7-7-12Z",
    energy: "m13 2-8 12h6l-1 8 9-13h-6l1-7Z",
    logistics: "M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4",
    works: "M4 21V5h16v16M8 5V2m8 3V2M8 10h8M8 14h8M8 18h8",
    delivery: "m4 12 5 5L20 6",
  };
  function update() {
    const s = getState(),
      regions = getRegions();
    document.querySelector("#economicOverlay").style.display =
      getLayer() === "situacao" ? "none" : "";
    overlay.innerHTML = ["relevo", "situacao"].includes(getLayer())
      ? regions
          .map((r, i) => {
            const x = stateSituation(s, i),
              a = x.issues[0];
            return a
              ? `<g class="situation-pin" transform="translate(${r.x + 19},${r.y - 50})" data-situation-region="${i}" role="button" tabindex="0" aria-label="${esc(r.name + ": " + x.label)}"><title>${esc(x.issues.map((a) => a.label).join(" · "))}</title><rect x="-13" y="-13" width="26" height="26" rx="8" fill="${situationColors[x.level]}"/><path class="situation-symbol" transform="translate(-9,-9) scale(.75)" d="${symbol[a.kind]}"/></g>`
              : "";
          })
          .join("")
      : "";
    const x = stateSituation(s, getSelected());
    panel.innerHTML = `<div class="region-situation"><h4>${esc(x.label)}</h4>${
      x.issues
        .slice(0, 3)
        .map((a) => `<p><b>${a.label}</b><span>${esc(a.detail)}</span></p>`)
        .join("") ||
      "<p>Consulte o diagnóstico para acompanhar reservas, demanda e histórico deste estado.</p>"
    }<button class="secondary" data-view="redes">Abrir diagnóstico das redes ↗</button></div>`;
  }
  overlay.addEventListener("click", (e) => {
    const b = e.target.closest("[data-situation-region]");
    if (b) {
      e.stopPropagation();
      selectRegion(Number(b.dataset.situationRegion));
    }
  });
  overlay.addEventListener("keydown", (e) => {
    const b = e.target.closest("[data-situation-region]");
    if (b && ["Enter", " "].includes(e.key)) {
      e.preventDefault();
      selectRegion(Number(b.dataset.situationRegion));
    }
  });
  return { update };
}
