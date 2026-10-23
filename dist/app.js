import { generateTerritory, landforms } from "./territory.js";
import {
  cabinetFor,
  governments,
  randomCountry,
  createCountry,
} from "./country.js";
import { initAdvisor } from "./advisor.js";
import { initEventIsland, renderBulletin } from "./interactions.js";
import { advanceTurn, decisionFor } from "./simulation.js";
import { initDecisionUI, policyGuidance } from "./decision-ui.js";
import {
  initialState,
  budget,
  policyDefs,
  regionsOf,
  municipalMetrics,
  regionalMetrics,
  clamp,
} from "./model.js";
import {
  landFor,
  multiPath,
  polygonPath,
  voronoiCell,
  elevation,
  generateCities,
  transportNetwork,
} from "./geography.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)],
  esc = (s) =>
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
    ),
  fmt = (n, d = 1) =>
    new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: d,
      minimumFractionDigits: d,
    }).format(n),
  date = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
let state = initialState(),
  selected = 3,
  selectedCity = null,
  layer = "relevo",
  view = "territorio",
  zoom = 1,
  pan = { x: 0, y: 0 },
  cities = [],
  saved = [],
  toastTimer,
  modalTrigger;
const svgNS = "http://www.w3.org/2000/svg";
let regions = regionsOf(state);
let eventIsland = null;
let decisionUI = null;
let atlasMap = null;
let advisorController = null,
  terrain3d = null,
  mapMode = "2d",
  mapLoadToken = 0,
  playTimer = null;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
function svgEl(tag, attrs = {}, text) {
  const el = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text !== undefined) el.textContent = text;
  return el;
}
function notify(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4500);
}
function readStorage() {
  try {
    saved = JSON.parse(localStorage.getItem("meridiano:scenarios:v1") || "[]");
    if (!Array.isArray(saved)) saved = [];
    saved = saved.filter(
      (s) =>
        s.id &&
        s.state?.version === 1 &&
        Array.isArray(s.state.history) &&
        s.state.policies &&
        s.state.metrics,
    );
    const active = JSON.parse(
      localStorage.getItem("meridiano:active:v1") || "null",
    );
    if (
      active?.version === 1 &&
      active.history?.length &&
      active.policies &&
      active.metrics &&
      Number.isFinite(active.seed)
    )
      state = active;
    else state = createCountry();
  } catch {
    saved = [];
    state = createCountry();
    notify(
      "Não foi possível recuperar os dados locais. Você pode começar uma nova sessão.",
    );
  }
}
function persist() {
  try {
    localStorage.setItem("meridiano:active:v1", JSON.stringify(state));
    $("#localStatus").textContent = "Salvo neste navegador";
  } catch {
    $("#localStatus").textContent = "Sessão sem salvamento";
    notify(
      "O navegador bloqueou o salvamento. Exporte o cenário para conservar os dados.",
    );
  }
}
function setView(next) {
  if (
    ![
      "territorio",
      "politicas",
      "indicadores",
      "cenarios",
      "conselheiro",
    ].includes(next)
  )
    next = "territorio";
  view = next;
  $$(".view").forEach((el) =>
    el.classList.toggle("active", el.id === "view-" + view),
  );
  $$("[data-view]").forEach((el) => {
    el.classList.toggle("active", el.dataset.view === view);
    if (el.dataset.view === view) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  const title = {
    territorio: "Território",
    politicas: "Políticas públicas",
    indicadores: "Indicadores",
    cenarios: "Cenários salvos",
    conselheiro: cabinetFor(state.government).office,
  }[view];
  $("#pageTitle").textContent = title;
  document.title = `${title} · ${state.name} — Meridiano`;
  history.replaceState(null, "", "#" + view);
  if (view === "indicadores") renderIndicators();
  if (view === "cenarios") renderScenarios();
  if (!reducedMotion.matches)
    $("#view-" + view).animate(
      [
        { opacity: 0.35, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 190, easing: "cubic-bezier(.2,.7,.3,1)" },
    );
}
function updateUI() {
  const m = state.metrics;
  $("#countryName").textContent = state.name;
  $("#countrySystem").textContent = state.government + " · " + state.economy;
  $("#breadCountry").textContent = state.name;
  $("#pop").innerHTML = fmt(m.population) + " <small>milhões</small>";
  $("#gdpPc").textContent = "M$ " + fmt((m.gdp / m.population) * 1000, 0);
  $("#sideDate").textContent = date(state.quarter);
  $("#sideMetrics").innerHTML = [
    ["Bem-estar", fmt(m.welfare, 0) + "/100", m.welfare],
    ["Pobreza", fmt(m.poverty) + "%", m.poverty],
    ["Desemprego", fmt(m.unemployment) + "%", m.unemployment * 3],
    ["Inflação anual", fmt(m.inflation) + "%", m.inflation * 5],
    ["Dívida / PIB", fmt(m.debt) + "%", m.debt],
  ]
    .map(
      ([label, val, bar]) =>
        `<div class="metric-row"><span>${label}</span><div class="metric-value">${val}<span class="mini-bar"><i style="width:${clamp(bar, 0, 100)}%"></i></span></div></div>`,
    )
    .join("");
  $("#regionCount").textContent = `${regions.length} estados`;
  $("#territoryFacts").textContent = state.territory
    ? `${landforms[state.territory.kind]} · ${fmt(state.territory.areaKm2, 0)} km² · ${fmt((state.metrics.population * 1e6) / state.territory.areaKm2)} hab./km²`
    : "Geografia original · cenário preservado";
  $("#regionList").innerHTML = regions
    .map(
      (r, i) =>
        `<button class="region-list-item ${i === selected ? "selected" : ""}" data-region="${i}" aria-pressed="${i === selected}"><span class="region-dot" style="background:${r.color}"></span>${r.name}<span>${fmt(m.population * r.share)} mi</span></button>`,
    )
    .join("");
  $("#dateDisplay").innerHTML =
    `${2027 + Math.floor(state.quarter / 4)} <span>${(state.quarter % 4) + 1}º trimestre</span>`;
  $("#elapsed").textContent = state.quarter
    ? `${state.quarter} trimestre${state.quarter > 1 ? "s" : ""} simulado${state.quarter > 1 ? "s" : ""}`
    : "Ponto de partida";
  const start = Math.max(0, state.quarter - 2);
  $("#timelineTrack").innerHTML = Array.from({ length: 5 }, (_, i) => {
    let q = start + i;
    return `<div class="time-stop ${q === state.quarter ? "current" : ""}">${date(q)}</div>`;
  }).join("");
  $("#advance").disabled = state.quarter >= 160;
  $("#advance").innerHTML =
    state.quarter >= 160
      ? "Limite de 40 anos"
      : decisionFor(state)
        ? 'Resolver acontecimento <svg><use href="#i-arrow"/></svg>'
        : 'Avançar trimestre <svg><use href="#i-arrow"/></svg>';
  $("#mapSeed").textContent = "SEMENTE " + state.seed;
  $(".map-shell").setAttribute(
    "aria-label",
    "Mapa interativo de " + state.name,
  );
  renderRegion();
  renderBudget();
  if (view === "indicadores") renderIndicators();
  applyLayer();
  advisorController?.stateChanged(state);
  updateCabinetLabels();
  eventIsland?.update(state);
  renderBulletin(state);
  decisionUI?.update();
  if (state.quarter >= 160) pausePlayback();
}
function renderRegion() {
  $("#stateSelect").innerHTML = regions
    .map(
      (r, i) =>
        `<option value="${i}" ${i === selected ? "selected" : ""}>${r.name}</option>`,
    )
    .join("");
  $("#municipalitySelect").innerHTML =
    '<option value="">Visão do estado</option>' +
    cities
      .map((c, i) =>
        c.region === selected
          ? `<option value="${i}" ${c === selectedCity ? "selected" : ""}>${esc(c.name)}</option>`
          : "",
      )
      .join("");
  let r = regions[selected],
    m = regionalMetrics(state, selected),
    localPop = selectedCity
      ? state.territory
        ? municipalMetrics(state, selectedCity).population
        : m.population / cities.filter((c) => c.region === selected).length
      : m.population;
  if (selectedCity && state.territory)
    m = municipalMetrics(state, selectedCity);
  $("#regionName").textContent = selectedCity?.name || r.name;
  $("#regionType").textContent = selectedCity
    ? "MUNICÍPIO SELECIONADO"
    : "ESTADO SELECIONADO";
  $("#regionDescription").textContent = selectedCity
    ? `${r.name} · ${r.sector}.${state.territory ? " População municipal inclui áreas urbanas e rurais." : " Dados municipais distribuídos igualmente nesta versão."}`
    : r.description;
  $("#regionData").innerHTML = [
    [
      "População",
      selectedCity
        ? fmt(localPop * 1000, 0) + " mil"
        : fmt(m.population) + " milhões",
    ],
    ["Renda por habitante", "M$ " + fmt(m.income, 0)],
    ["Bem-estar", fmt(m.welfare, 0) + "/100"],
    ["Pobreza", fmt(m.poverty) + "%"],
    ...(m.areaKm2
      ? [
          ["Área", fmt(m.areaKm2, 0) + " km²"],
          ["Densidade", fmt(m.density) + " hab./km²"],
          ...(selectedCity
            ? [
                ["População urbana", fmt(m.urbanization, 0) + "%"],
                ["Acesso a serviços", fmt(m.access, 0) + "/100"],
              ]
            : []),
        ]
      : []),
  ]
    .map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`)
    .join("");
  const count = cities.filter((c) => c.region === selected).length;
  $("#municipalCount").textContent = selectedCity
    ? state.territory
      ? "Distribuição sintética · geografia v2"
      : "Estimativa municipal"
    : `${count} municípios`;
  $("#exploreRegion").textContent = selectedCity
    ? "Ver estado ↗"
    : "Explorar região ↗";
  $$(".region-path").forEach((el) =>
    el.classList.toggle("selected", Number(el.dataset.region) === selected),
  );
  terrain3d?.update(state, { selected, layer });
  atlasMap?.update(state, { selected, layer });
}
function selectRegion(i, city = null) {
  selected = i;
  selectedCity = city;
  $("#regionCard").classList.remove("hidden");
  updateUI();
}
function renderBudget() {
  const b = budget(state);
  $("#policyBudget").innerHTML =
    `<div><span>Receita anual / PIB</span><strong>${fmt(b.revenue)}%</strong></div><div><span>Despesa + juros / PIB</span><strong>${fmt(b.spending + b.interest)}%</strong></div><div><span>Saldo projetado / PIB</span><strong>${b.balance > 0 ? "+" : ""}${fmt(b.balance)}%</strong></div><div class="budget-description">${b.balance < 0 ? "O déficit será financiado por dívida." : "O superávit permite reduzir a dívida."} Projeção com a configuração atual.</div>`;
  const costs = [
    ["Renda básica", b.ubi],
    ["Previdência", b.pension],
    ["Saúde e educação", state.policies.services],
    ["Infraestrutura", state.policies.infrastructure],
    ["Outros gastos", 11],
    ["Juros", b.interest],
  ];
  $("#policyLedger").innerHTML =
    `<div class="ledger-title"><svg><use href="assets/reicon.svg#i-bank" /></svg><span>CONTAS DO PAÍS</span></div><h4>Para onde vai a receita</h4><p>Projeção anual · % do PIB</p><div class="ledger-stack" aria-hidden="true">${costs.map(([_, v], i) => `<i style="flex:${v};--tone:${i}"></i>`).join("")}</div><div class="ledger-items">${costs.map(([n, v], i) => `<div><i style="--tone:${i}"></i><span>${n}</span><strong>${fmt(v)}%</strong></div>`).join("")}</div><div class="ledger-balance ${b.balance < 0 ? "negative" : ""}"><span>Saldo projetado</span><strong>${b.balance > 0 ? "+" : ""}${fmt(b.balance)}%</strong><p>${b.balance < 0 ? "A diferença será financiada pela dívida." : "O saldo pode reduzir a dívida."}</p></div><div class="execution-meter"><span>Capacidade de execução</span><strong>${fmt(state.capacity * 100, 0)}/100</strong><meter min="0" max="100" value="${state.capacity * 100}"></meter><p>As políticas entram no próximo trimestre. A execução melhora aos poucos.</p></div>`;
  for (const def of policyDefs) {
    const out = $(`#output-${def.key}`);
    if (out) out.textContent = policyValue(def, state.policies[def.key]);
    const cost = $(`#cost-${def.key}`);
    if (cost)
      cost.textContent =
        def.key === "income"
          ? `Custo anual: ${fmt(b.ubi)}% do PIB`
          : def.key === "pension"
            ? `Custo anual: ${fmt(b.pension)}% do PIB`
            : def.key === "tax"
              ? "Arrecadação simplificada, sem faixas por renda."
              : def.key === "labor"
                ? "Efeitos graduais sobre proteção e contratação."
                : `Dotação anual: ${fmt(state.policies[def.key])}% do PIB`;
  }
}
function policyValue(def, v) {
  return def.unit === "M$"
    ? "M$ " + fmt(v, 0)
    : def.unit === "/100"
      ? fmt(v, 0) + "/100"
      : fmt(v, def.step < 1 ? 1 : 0) + "%";
}
function renderPolicies() {
  state.policyBaseline ??= { ...state.policies };
  $("#policies").innerHTML = policyDefs
    .map(
      (p) =>
        `<article class="policy"><div class="policy-head"><span class="policy-icon" aria-hidden="true"><svg><use href="assets/reicon.svg#i-${{ income: "coin", pension: "people", labor: "shield", tax: "bank", services: "health", infrastructure: "buildings" }[p.key]}" /></svg></span><span class="eyebrow">POLÍTICA NACIONAL</span></div><h4>${p.name}</h4><p>${p.description}</p><label for="policy-${p.key}">${p.label}<output id="output-${p.key}" for="policy-${p.key}">${policyValue(p, state.policies[p.key])}</output></label><input id="policy-${p.key}" data-policy="${p.key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${state.policies[p.key]}"><div class="policy-range"><span>${policyValue(p, p.min)}</span><span>${policyValue(p, p.max)}</span></div><div class="policy-cost" id="cost-${p.key}"></div></article>`,
    )
    .join("");
  renderBudget();
  for (const p of policyDefs) {
    const note = document.createElement("details");
    note.className = "policy-guidance";
    const summary = document.createElement("summary");
    summary.textContent = "Quem é afetado e quando";
    note.append(summary);
    for (const text of policyGuidance[p.key]) {
      const line = document.createElement("p");
      line.textContent = text;
      note.append(line);
    }
    $(`#policy-${p.key}`).closest("article").append(note);
  }
}
const metricDefs = [
  ["welfare", "Bem-estar", "/100"],
  ["poverty", "Pobreza", "%"],
  ["unemployment", "Desemprego", "%"],
  ["gdp", "PIB", " bi M$"],
  ["inflation", "Inflação anual", "%"],
  ["debt", "Dívida / PIB", "%"],
];
function renderIndicators() {
  const first = state.history[0],
    m = state.metrics;
  $("#indicatorCards").innerHTML = metricDefs
    .map(([k, n, u]) => {
      const delta = m[k] - first[k];
      return `<button type="button" class="indicator-card" data-chart-key="${k}" aria-pressed="${$("#chartMetric").value === k}"><span>${n}<span class="metric-arrow" aria-hidden="true">↗</span></span><strong>${fmt(m[k])}<span style="font-size:13px">${u}</span></strong><small>${delta >= 0 ? "+" : ""}${fmt(delta)} ${u === "%" ? "p.p." : u === "/100" ? "pontos" : u.trim()} desde o início</small></button>`;
    })
    .join("");
  renderBulletin(state);
  $("#events").innerHTML = state.events
    .map(
      (e) =>
        `<div class="event"><i class="event-dot"></i><div><b>${esc(e.title)}</b><span>${esc(e.detail)}</span></div></div>`,
    )
    .join("");
  renderChart();
}
$("#indicatorCards").addEventListener("click", (e) => {
  const key = e.target.closest("[data-chart-key]")?.dataset.chartKey;
  if (key) {
    $("#chartMetric").value = key;
    renderIndicators();
  }
});
function renderChart() {
  const key = $("#chartMetric").value,
    h = state.history,
    values = h.map((m) => m[key]),
    min = Math.max(0, Math.min(...values) * 0.9 - 1),
    max = Math.max(...values) * 1.1 + 1;
  let points = values.map((v, i) => [
    65 + (i / Math.max(1, values.length - 1)) * 700,
    230 - ((v - min) / (max - min)) * 195,
  ]);
  const chart = $("#historyChart");
  chart.replaceChildren();
  chart.append(
    svgEl(
      "title",
      {},
      `${metricDefs.find((d) => d[0] === key)[1]}: ${fmt(values[0])} no início; ${fmt(values.at(-1))} em ${date(state.quarter)}`,
    ),
  );
  const defs = svgEl("defs"),
    gradient = svgEl("linearGradient", {
      id: "historyGradient",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
    });
  gradient.append(
    svgEl("stop", {
      offset: "0%",
      "stop-color": "var(--primary)",
      "stop-opacity": 0.55,
    }),
    svgEl("stop", { offset: "100%", "stop-color": "var(--primary)" }),
  );
  defs.append(gradient);
  chart.append(defs);
  for (let i = 0; i < 5; i++) {
    let y = 35 + i * 48.75;
    chart.append(
      svgEl("path", {
        d: `M65 ${y}H765`,
        stroke: getComputedStyle(document.documentElement)
          .getPropertyValue("--border")
          .trim(),
        "stroke-width": 1,
      }),
    );
    chart.append(
      svgEl(
        "text",
        {
          x: 50,
          y: y + 4,
          "text-anchor": "end",
          fill: getComputedStyle(document.documentElement)
            .getPropertyValue("--muted")
            .trim(),
          "font-size": 10,
          "font-family": "Manrope, sans-serif",
        },
        fmt(max - ((max - min) * i) / 4),
      ),
    );
  }
  if (points.length > 1) {
    const path = "M" + points.map((p) => p.join(",")).join("L");
    chart.append(
      svgEl("path", {
        d: path + `L765 230L65 230Z`,
        fill: getComputedStyle(document.documentElement)
          .getPropertyValue("--selection")
          .trim(),
      }),
    );
    chart.append(
      svgEl("path", {
        d: path,
        fill: "none",
        stroke: "url(#historyGradient)",
        "stroke-width": 2.5,
      }),
    );
  }
  points.forEach((p, i) => {
    const point = svgEl("circle", {
      cx: p[0],
      cy: p[1],
      r: 4,
      tabindex: "0",
      role: "button",
      "aria-label": `${date(h[i].quarter)}: ${fmt(values[i])}`,
      class: "chart-point",
      fill: getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim(),
    });
    const show = () => {
      $("#chartTooltip").textContent =
        `${date(h[i].quarter)} · ${metricDefs.find((d) => d[0] === key)[1]}: ${fmt(values[i])}${metricDefs.find((d) => d[0] === key)[2]}`;
      chart
        .querySelectorAll(".chart-point")
        .forEach((el) => el.classList.toggle("selected", el === point));
    };
    point.addEventListener("pointerenter", show);
    point.addEventListener("focus", show);
    point.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const step = e.key === "ArrowRight" ? 1 : -1;
        chart
          .querySelectorAll(".chart-point")
          [clamp(i + step, 0, points.length - 1)].focus();
      }
    });
    chart.append(point);
  });
  $("#chartTooltip").textContent =
    `${date(state.quarter)} · ${fmt(values.at(-1))}${metricDefs.find((d) => d[0] === key)[2]}`;
  chart.append(
    svgEl(
      "text",
      {
        x: 65,
        y: 260,
        fill: getComputedStyle(document.documentElement)
          .getPropertyValue("--muted")
          .trim(),
        "font-size": 10,
        "font-family": "Manrope, sans-serif",
      },
      date(0),
    ),
  );
  chart.append(
    svgEl(
      "text",
      {
        x: 765,
        y: 260,
        fill: getComputedStyle(document.documentElement)
          .getPropertyValue("--muted")
          .trim(),
        "font-size": 10,
        "text-anchor": "end",
        "font-family": "Manrope, sans-serif",
      },
      date(state.quarter),
    ),
  );
  $("#chartSummary").textContent =
    h.length === 1
      ? "Avance um trimestre para começar a construir o histórico."
      : `${fmt(values[0])} → ${fmt(values.at(-1))} em ${state.quarter} trimestre${state.quarter > 1 ? "s" : ""}. Série produzida pelo modelo experimental.`;
}
function terrainImage() {
  const w = 700,
    h = 532,
    canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d"),
    im = ctx.createImageData(w, h),
    colors = [
      [185, 204, 157],
      [162, 186, 139],
      [184, 196, 150],
      [211, 210, 176],
      [233, 228, 205],
      [246, 242, 225],
    ];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let gx = (x * 1000) / w,
        gy = (y * 760) / h,
        z = elevation(gx, gy, state.seed, state.territory?.profile),
        dx = elevation(gx + 2, gy, state.seed, state.territory?.profile) - z,
        dy = elevation(gx, gy + 2, state.seed, state.territory?.profile) - z,
        shade = clamp(1 - dx * 4 - dy * 3, 0.73, 1.15),
        v = clamp(z * 5, 0, 4.99),
        k = Math.floor(v),
        t = v - k;
      let idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++)
        im.data[idx + c] = clamp(
          (colors[k][c] * (1 - t) + colors[k + 1][c] * t) * shade,
          0,
          255,
        );
      im.data[idx + 3] = 255;
    }
  ctx.putImageData(im, 0, 0);
  $("#terrain").setAttribute("href", canvas.toDataURL());
}
function drawContours() {
  const group = $("#contours");
  group.replaceChildren();
  const step = 7;
  for (let level = 0.15; level < 0.95; level += 0.055) {
    let d = "";
    for (let y = 70; y < 690; y += step)
      for (let x = 140; x < 800; x += step) {
        const pts = [
            [x, y],
            [x + step, y],
            [x + step, y + step],
            [x, y + step],
          ],
          v = pts.map((p) =>
            elevation(...p, state.seed, state.territory?.profile),
          );
        let hits = [];
        for (let i = 0; i < 4; i++) {
          let j = (i + 1) % 4;
          if (v[i] < level !== v[j] < level) {
            let t = (level - v[i]) / (v[j] - v[i]);
            hits.push([
              pts[i][0] + t * (pts[j][0] - pts[i][0]),
              pts[i][1] + t * (pts[j][1] - pts[i][1]),
            ]);
          }
        }
        for (let i = 0; i + 1 < hits.length; i += 2)
          d += `M${hits[i].map((v) => v.toFixed(1))}L${hits[i + 1].map((v) => v.toFixed(1))}`;
      }
    group.append(
      svgEl("path", {
        d,
        fill: "none",
        stroke: level > 0.6 ? "#a59f7b" : "#6e8b59",
        "stroke-opacity": 0.17,
        "stroke-width": 0.65,
      }),
    );
  }
}
function drawMap() {
  setMapMode("2d");
  regions = regionsOf(state);
  selected = clamp(selected, 0, regions.length - 1);
  const land = landFor(state),
    path = polygonPath(land);
  for (const id of ["landClipPath", "landShadow", "coast"])
    $("#" + id).setAttribute("d", path);
  terrainImage();
  drawContours();
  $("#regions").replaceChildren();
  regions.forEach((r, i) => {
    const el = svgEl("path", {
      d: r.shape ? multiPath(r.shape) : polygonPath(voronoiCell(r, regions)),
      class: "region-path",
      "data-region": i,
    });
    el.append(svgEl("title", {}, r.name));
    $("#regions").append(el);
  });
  cities = state.territory?.cities ?? generateCities(state.seed, regions, land);
  const network = state.territory ?? transportNetwork(state.seed, cities, land);
  $("#urbanFootprints").replaceChildren(
    ...cities
      .filter((c) => c.urbanAreaKm2)
      .map((c) =>
        svgEl("circle", {
          cx: c.x,
          cy: c.y,
          r: Math.sqrt(c.urbanAreaKm2 / Math.PI) / state.territory.kmPerUnit,
          class: "urban-footprint",
        }),
      ),
  );

  $("#streetNetwork").replaceChildren(
    ...network.streets.map((points) =>
      svgEl("path", { d: "M" + points.map((p) => p.join(",")).join("L") }),
    ),
  );
  $("#municipalities").replaceChildren();
  $$("[data-state-clip]").forEach((el) => el.remove());
  regions.forEach((r, i) => {
    const clip = svgEl("clipPath", {
      id: "stateClip" + i,
      "data-state-clip": "",
    });
    clip.append(
      svgEl("path", {
        d: r.shape ? multiPath(r.shape) : polygonPath(voronoiCell(r, regions)),
      }),
    );
    $("#atlas defs").append(clip);
    const group = svgEl("g", { "clip-path": "url(#stateClip" + i + ")" }),
      local = cities.filter((c) => c.region === i);
    local.forEach((c) =>
      group.append(
        svgEl("path", {
          d: c.shape ? multiPath(c.shape) : polygonPath(voronoiCell(c, local)),
          class: "municipality",
          "data-municipality": cities.indexOf(c),
          "fill-rule": "evenodd",
        }),
      ),
    );
    $("#municipalities").append(group);
  });
  $("#cities").replaceChildren();
  cities.forEach((c, i) => {
    let g = svgEl("g", {
      class:
        "city-marker " +
        (c.major ? "major-city" : "minor-city") +
        (c.capital ? " capital" : ""),
      "data-city": i,
    });
    g.append(
      svgEl("circle", {
        cx: c.x,
        cy: c.y,
        r: state.territory
          ? clamp(
              1.5 +
                Math.log10(
                  Math.max(
                    1,
                    c.populationShare * state.metrics.population * 1e6,
                  ),
                ) *
                  0.45,
              2,
              5.4,
            )
          : c.capital
            ? 5
            : c.major
              ? 3.4
              : 2.1,
      }),
    );
    g.append(
      svgEl(
        "text",
        {
          x: c.x + 8,
          y: c.y + 3,
          class: "city-text",
          "font-size": c.major ? 10 : 7.5,
        },
        c.name,
      ),
    );
    g.append(svgEl("title", {}, "Município de " + c.name));
    $("#cities").append(g);
  });
  $("#seaGrid").replaceChildren();
  for (let x = 0; x < 1000; x += 125)
    $("#seaGrid").append(
      svgEl("path", {
        d: `M${x} 0V760`,
        stroke: "#9db8b5",
        "stroke-width": 0.5,
        "stroke-opacity": 0.18,
      }),
    );
  for (let y = 0; y < 760; y += 125)
    $("#seaGrid").append(
      svgEl("path", {
        d: `M0 ${y}H1000`,
        stroke: "#9db8b5",
        "stroke-width": 0.5,
        "stroke-opacity": 0.18,
      }),
    );
  $("#geoLabels").replaceChildren();
  regions.forEach((r) =>
    $("#geoLabels").append(
      svgEl(
        "text",
        { x: r.x, y: r.y - 18, "text-anchor": "middle", class: "state-label" },
        r.name.toUpperCase(),
      ),
    ),
  );
  $("#geoLabels").append(
    svgEl(
      "text",
      {
        x: 810,
        y: 535,
        transform: "rotate(-75 810 535)",
        class: "water-label",
      },
      "OCEANO AUSTRAL",
    ),
  );
  $("#geoLabels").append(
    svgEl(
      "text",
      {
        x: 145,
        y: 350,
        transform: "rotate(-80 145 350)",
        class: "water-label",
        "font-size": 12,
      },
      "MAR DO POENTE",
    ),
  );
  $("#rivers").innerHTML = state.territory
    ? state.territory.rivers
        .map(
          (points) =>
            `<path d="M${points.map((p) => p.join(",")).join("L")}" fill="none" stroke="#8ebfce" stroke-width="2.2"/>`,
        )
        .join("")
    : '<path d="M343 168 C380 220 327 262 393 300 S453 345 469 393 S530 425 550 470 S620 465 673 515" fill="none" stroke="#edf4db" stroke-width="5" opacity=".6"/><path d="M343 168 C380 220 327 262 393 300 S453 345 469 393 S530 425 550 470 S620 465 673 515" fill="none" stroke="#7caaa9" stroke-width="2.3"/><path d="M334 456 Q380 435 438 426 T550 470M515 183 Q490 250 452 284T441 368" fill="none" stroke="#85afaa" stroke-width="1.5"/>';
  $("#roads").replaceChildren();
  network.roads.forEach((points) =>
    $("#roads").append(
      svgEl("path", {
        d: "M" + points.map((p) => p.join(",")).join("L"),
        class: "transport-road",
        fill: "none",
        stroke: "#dbb46d",
        "stroke-width": 1.2,
        opacity: 0.65,
      }),
    ),
  );
  for (let i = 0; i < regions.length; i++) {
    if (state.territory || i === 3) continue;
    const r = regions[i],
      c = regions[3];
    $("#roads").append(
      svgEl("path", {
        d: `M${c.x + 8} ${c.y + 13} Q${(r.x + c.x) / 2 + 30} ${(r.y + c.y) / 2} ${r.x + 8} ${r.y + 13}`,
        fill: "none",
        stroke: "#f9f4d7",
        "stroke-width": 2,
        "stroke-dasharray": "3 3",
        opacity: 0.8,
      }),
    );
  }
  resetMap();
  renderRegion();
  applyLayer();
}
function applyLayer() {
  terrain3d?.update(state, { selected, layer });
  atlasMap?.update(state, { selected, layer });
  const colors = {
    populacao: ["#dbe7c7", "#73935d", "#3a654c"],
    densidade: ["#d8e6c0", "#7eaa38", "#e97738"],
    renda: ["#ece5be", "#b8bf84", "#4e7b5c"],
    bemestar: ["#e6e4c5", "#99b18b", "#3f795c"],
  };
  $$(".region-path").forEach((el, i) => {
    if (layer === "relevo") {
      el.style.fill = "";
      return;
    }
    const m = regionalMetrics(state, i),
      v =
        layer === "populacao"
          ? regions[i].share / Math.max(...regions.map((r) => r.share))
          : layer === "densidade"
            ? Math.log1p(m.density ?? 0) /
              Math.log1p(
                Math.max(
                  1,
                  ...regions.map(
                    (_, j) => regionalMetrics(state, j).density ?? 0,
                  ),
                ),
              )
            : layer === "renda"
              ? (m.income /
                  ((state.metrics.gdp / state.metrics.population) * 1000) -
                  0.5) /
                0.8
              : m.welfare / 100;
    const palette = colors[layer];
    el.style.fill =
      palette[Math.min(2, Math.floor(clamp(v, 0, 0.99) * 3))] + "ce";
  });
  $$("[data-layer]").forEach((el) => {
    el.classList.toggle("active", el.dataset.layer === layer);
    el.setAttribute("aria-pressed", el.dataset.layer === layer);
  });
  $(".map-shell").classList.toggle("density-active", layer === "densidade");
  const maximumDensity = Math.max(
    1,
    ...cities.map((c) =>
      state.territory ? municipalMetrics(state, c).density : 0,
    ),
  );
  $$("[data-municipality]").forEach((el) => {
    const c = cities[Number(el.dataset.municipality)];
    const v = state.territory
      ? Math.log1p(municipalMetrics(state, c).density) /
        Math.log1p(maximumDensity)
      : 0;
    el.style.fill =
      layer === "densidade" && state.territory
        ? `hsl(${105 - v * 85} 45% ${72 - v * 30}%)`
        : "";
  });
  const labels = {
    relevo: ["ALTITUDE", "0 m", "2.400 m"],
    densidade: [
      state.territory
        ? "DENSIDADE MUNICIPAL"
        : "DENSIDADE · SEM ÁREA NO LEGADO",
      state.territory ? "0 hab./km²" : "Indisponível",
      state.territory
        ? fmt(maximumDensity, 0) + " hab./km²"
        : "Crie um país novo",
    ],
    populacao: [
      "POPULAÇÃO ESTADUAL",
      fmt(state.metrics.population * Math.min(...regions.map((r) => r.share))) +
        " mi",
      fmt(state.metrics.population * Math.max(...regions.map((r) => r.share))) +
        " mi",
    ],
    renda: ["RENDA / HABITANTE", "Menor", "Maior"],
    bemestar: ["BEM-ESTAR", "0", "100"],
  };
  const l = labels[layer];
  $("#legendLabel").textContent = l[0];
  $("#legendMin").textContent = l[1];
  $("#legendMax").textContent = l[2];
  $("#legendRamp").style.background =
    layer === "relevo"
      ? ""
      : "linear-gradient(90deg," + colors[layer].join(",") + ")";
}
function transformMap() {
  const tx = 500 - 500 * zoom + pan.x,
    ty = 380 - 380 * zoom + pan.y;
  $("#mapTransform").setAttribute(
    "transform",
    `translate(${tx},${ty}) scale(${zoom})`,
  );
  $(".map-shell").classList.toggle("zoomed", zoom >= 1.5);
  $("#zoomIn").disabled = zoom >= 3;
  $("#zoomOut").disabled = zoom <= 0.75;
  if (state.territory) {
    const rect = $("#atlas").getBoundingClientRect();
    const pxPerUnit = Math.min(rect.width / 1000, rect.height / 760) * zoom;
    const length =
      (106 / Math.max(0.001, pxPerUnit)) * state.territory.kmPerUnit;
    const ticks = $$(".scale span");
    ticks[0].textContent = "0";
    ticks[1].textContent = fmt(length / 2, 0);
    ticks[2].textContent = fmt(length, 0) + " km";
  }
  $("#mapHint").textContent =
    zoom >= 1.5
      ? "Municípios visíveis · arraste para navegar"
      : "Selecione um estado para explorar";
}
function resetMap() {
  atlasMap?.reset();
  terrain3d?.reset();
  zoom = matchMedia("(max-width: 760px)").matches ? 1.3 : 1;
  pan = { x: 0, y: 0 };
  transformMap();
}
function openModal(html) {
  pausePlayback();
  if (!$("#modal").open) modalTrigger = document.activeElement;
  $("#modalBody").innerHTML = html;
  if (!$("#modal").open) $("#modal").showModal();
  if ($("#modalBody .cycle-dialog")) {
    $("#modalTitle").tabIndex = -1;
    $("#modalTitle").focus();
  }
}
function closeModal() {
  $("#modal").close();
  if (modalTrigger?.isConnected) modalTrigger.focus();
}
function showMethods() {
  openModal(
    `<h3 id="modalTitle">Como este mundo funciona</h3><p>Meridiano é um laboratório de hipóteses. Território, indicadores e coeficientes são sintéticos. Os resultados não são previsões nem evidências a favor de uma ideologia.</p><div class="method-block"><h4>Tempo e contexto</h4><p>Cada turno representa um trimestre. O contexto externo modifica a atividade econômica. A semente reproduz o território e o ciclo; não há sorteios ocultos a cada clique.</p></div><div class="method-block"><h4>Financiamento explícito</h4><p>A moeda fictícia é M$. Os fluxos são anuais. O modelo considera gasto administrativo de 11% do PIB e juros anuais equivalentes a 5,5% do estoque da dívida.</p><div class="method-code">Renda básica (% PIB) = valor mensal × 12 × população (milhões) ÷ [PIB (bilhões) × 1.000] × 100<br>Previdência (% PIB) = cobertura (%) × 0,075<br>Saldo = tributação − (11 + saúde/educação + infraestrutura + renda básica + previdência) − dívida/PIB × 0,055<br>Dívida seguinte = (dívida − saldo/4 + gasto extraordinário) ÷ (1 + crescimento anual/400)</div></div><div class="method-block"><h4>Efeitos graduais e capacidade</h4><p>Pobreza se aproxima 13% por trimestre de uma meta sintética baseada em transferências, previdência, proteção trabalhista, serviços e desemprego. Bem-estar ajusta 10% da distância para sua meta; inflação, 16%. Saúde/educação e infraestrutura alteram a capacidade de execução ao longo do tempo.</p></div><div class="method-block"><h4>Geografia e diferenças regionais</h4><p>Países novos têm área, relevo e divisões reproduzíveis pela semente. Extensão e população inicial influenciam o número de estados e municípios. Costa, rios e relevo influenciam a ocupação; cada município tem população urbana e rural, área e densidade próprias. A população cresce sem migração e as divisas permanecem estáveis. Renda, pobreza e bem-estar municipais ainda seguem o estado. Cenários antigos conservam seus seis estados e a distribuição original, sem área inventada. Estradas são esquemáticas, sem cálculo de rotas.</p></div><div class="method-block"><h4>Acontecimentos e projeções</h4><p>A previsão compara os ajustes com as políticas no início do trimestre, por até quatro trimestres. Inclui respostas já escolhidas e exclui acontecimentos ainda desconhecidos. A partir do primeiro avanço e depois a cada três trimestres, um acontecimento elegível pode exigir uma escolha. O tempo pausa até a resposta; seus modificadores duram um trimestre e o custo extraordinário é financiado por dívida uma única vez. Os números são regras fictícias, consultáveis nas opções.</p></div><div class="method-block"><h4>Limites do modelo</h4><p>Governo e orientação econômica descrevem o cenário; as políticas efetivas determinam os efeitos. Ainda não há eleições, agentes políticos, migração, comércio bilateral ou demografia por idade. Não há calibração empírica nem intervalos probabilísticos. Os coeficientes completos estão em model.js no repositório.</p></div><div class="modal-actions"><button class="primary" data-close>Entendi</button></div>`,
  );
}
function countryForm(isNew = false) {
  let randomDraft = null;
  const s = isNew
    ? initialState({ name: "", seed: Math.floor(Math.random() * 99999) + 1 })
    : state;
  openModal(
    `<h3 id="modalTitle">${isNew ? "Criar um novo país" : "Configurar país"}</h3><p>${isNew ? "Defina as condições de partida. O cenário ativo será substituído; cenários salvos serão preservados." : "Nome, regime e orientação são independentes. A semente e a população são condições iniciais e só mudam ao criar outro país."}</p><form id="countryForm" novalidate>${isNew ? `<div class="country-randomizer"><div><strong>Prefere começar com um país pronto?</strong><span>Sorteie população, indicadores, governo e políticas.</span></div><button type="button" id="randomizeCountry" class="secondary">⚄ Gerar país aleatório</button></div><div id="randomSummary" class="random-summary" hidden aria-live="polite"></div>` : ""}<div class="form-grid"><div class="field wide"><label for="inputName">Nome do país</label><input id="inputName" name="name" value="${esc(s.name)}" maxlength="40" placeholder="Como se chama seu país?" aria-describedby="nameError"><span class="field-error" id="nameError"></span></div><div class="field"><label for="government">Sistema político</label><select id="government" name="government">${governments.map((v) => `<option ${v === s.government ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="field"><label for="economy">Orientação econômica</label><select id="economy" name="economy">${["Economia mista", "Liberal", "Neoliberal", "Social-democrata", "Socialista"].map((v) => `<option ${v === s.economy ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="field wide"><label for="external">Contexto externo</label><select id="external" name="external">${Object.entries(
      {
        estavel: "Comércio estável",
        recessao: "Recessão internacional",
        expansao: "Expansão internacional",
        sancoes: "Sanções comerciais",
      },
    )
      .map(
        ([v, label]) =>
          `<option value="${v}" ${v === s.external ? "selected" : ""}>${label}</option>`,
      )
      .join(
        "",
      )}</select><small>Afeta o crescimento e a pressão inflacionária.</small></div>${
      isNew
        ? `<div class="field"><label for="population">População inicial (milhões)</label><input id="population" name="population" type="number" min="1" max="500" step="0.1" value="24.8" aria-describedby="numberError"></div><div class="field"><label for="seed">Semente territorial</label><input id="seed" name="seed" type="number" min="1" max="99999" step="1" value="${s.seed}" aria-describedby="numberError"></div><div class="field"><label for="areaKm2">Área territorial (km²)</label><input id="areaKm2" name="areaKm2" type="number" min="5000" max="8000000" step="100" placeholder="Gerar pela semente" aria-describedby="numberError"><small>Define a escala e a densidade, sem alterar a população.</small></div><div class="field"><label for="landform">Formato do território</label><select id="landform" name="landform"><option value="">Gerar pela semente</option>${Object.entries(
            landforms,
          )
            .map(([v, n]) => `<option value="${v}">${n}</option>`)
            .join(
              "",
            )}</select></div><span class="field-error wide" id="numberError"></span>`
        : ""
    }</div><div class="modal-actions"><button type="button" class="secondary" data-close>Cancelar</button><button class="primary" type="submit">${isNew ? "Criar e substituir cenário ativo" : "Salvar configuração"}</button></div></form>`,
  );
  if (isNew)
    $("#randomizeCountry").onclick = () => {
      const values = new Uint32Array(1);
      crypto.getRandomValues(values);
      randomDraft = randomCountry((values[0] % 99999) + 1);
      for (const [id, val] of Object.entries({
        inputName: randomDraft.name,
        government: randomDraft.government,
        economy: randomDraft.economy,
        external: randomDraft.external,
        population: randomDraft.metrics.population,
        seed: randomDraft.seed,
        areaKm2: randomDraft.territory.areaKm2,
        landform: randomDraft.territory.kind,
      }))
        $("#" + id).value = val;
      $("#randomSummary").hidden = false;
      $("#randomSummary").textContent =
        `PIB por habitante: M$ ${fmt((randomDraft.metrics.gdp / randomDraft.metrics.population) * 1000, 0)} · Pobreza: ${fmt(randomDraft.metrics.poverty)}% · Dívida: ${fmt(randomDraft.metrics.debt)}% do PIB. As políticas também foram sorteadas.`;
      $("#nameError").textContent = "";
      $("#numberError").textContent = "";
      $("#inputName").removeAttribute("aria-invalid");
    };
  $("#countryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      name = f.get("name").trim();
    if (!name) {
      $("#nameError").textContent = "Informe um nome para o país.";
      $("#inputName").setAttribute("aria-invalid", "true");
      $("#inputName").focus();
      return;
    }
    const config = {
      name,
      government: f.get("government"),
      economy: f.get("economy"),
      external: f.get("external"),
    };
    if (isNew) {
      let population = Number(f.get("population")),
        seed = Number(f.get("seed"));
      if (
        !Number.isFinite(population) ||
        population < 1 ||
        population > 500 ||
        !Number.isInteger(seed) ||
        seed < 1 ||
        seed > 99999
      ) {
        $("#numberError").textContent =
          "Use população de 1 a 500 milhões e semente inteira de 1 a 99999.";
        $("#population").setAttribute(
          "aria-invalid",
          population < 1 || population > 500,
        );
        $("#seed").setAttribute(
          "aria-invalid",
          !Number.isInteger(seed) || seed < 1 || seed > 99999,
        );
        (population < 1 || population > 500
          ? $("#population")
          : $("#seed")
        ).focus();
        return;
      }
      const areaInput = f.get("areaKm2"),
        area = areaInput ? Number(areaInput) : undefined;
      if (
        area !== undefined &&
        (!Number.isFinite(area) || area < 5000 || area > 8000000)
      ) {
        $("#numberError").textContent =
          "Use uma área de 5.000 a 8.000.000 km².";
        $("#areaKm2").focus();
        return;
      }
      if (randomDraft) {
        state =
          randomDraft.seed === seed
            ? structuredClone(randomDraft)
            : randomCountry(seed);
        const perCapita = state.metrics.gdp / state.metrics.population;
        Object.assign(state, config);
        state.metrics.population = population;
        state.metrics.gdp = population * perCapita;
        state.history = [{ quarter: 0, ...state.metrics }];
      } else state = initialState({ ...config, population, seed });
      state.territory = generateTerritory({
        seed,
        population,
        areaKm2: f.get("areaKm2") ? Number(f.get("areaKm2")) : undefined,
        kind: f.get("landform") || undefined,
      });
      selected = state.territory.capitalRegion;
      selectedCity = null;
      drawMap();
      renderPolicies();
      setView("territorio");
    } else Object.assign(state, config);
    closeModal();
    updateUI();
    persist();
    notify(
      isNew
        ? "País criado. Explore seu novo território."
        : "Configuração atualizada.",
    );
  });
}
function saveScenario() {
  openModal(
    `<h3 id="modalTitle">Salvar cenário</h3><p>Guarde este ponto para retomar ou comparar depois.</p><form id="saveForm" novalidate><div class="field"><label for="scenarioName">Nome do cenário</label><input id="scenarioName" maxlength="70" value="${esc(state.name)} · ${date(state.quarter)}" aria-describedby="saveError"><span id="saveError" class="field-error"></span></div><div class="modal-actions"><button type="button" class="secondary" data-close>Cancelar</button><button type="submit" class="primary">Salvar cenário</button></div></form>`,
  );
  $("#saveForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#scenarioName").value.trim();
    if (!name) {
      $("#saveError").textContent = "Dê um nome para este cenário.";
      $("#scenarioName").setAttribute("aria-invalid", "true");
      $("#scenarioName").focus();
      return;
    }
    const item = {
      id:
        crypto.randomUUID?.() ??
        Date.now().toString(36) + Math.random().toString(36).slice(2),
      name,
      state: structuredClone(state),
    };
    try {
      const next = [item, ...saved].slice(0, 20);
      localStorage.setItem("meridiano:scenarios:v1", JSON.stringify(next));
      saved = next;
      closeModal();
      renderScenarios();
      notify("Cenário salvo neste navegador.");
    } catch {
      $("#saveError").textContent =
        "Não foi possível salvar. Feche esta janela e exporte uma cópia JSON.";
    }
  });
}
function renderScenarios() {
  $("#scenarios").innerHTML = saved.length
    ? saved
        .map(
          (s) =>
            `<article class="scenario-card"><div><h4>${esc(s.name)}</h4><p>${esc(s.state.name)} · ${date(s.state.quarter)} · Semente ${s.state.seed}</p></div><div class="scenario-numbers"><div><span>Bem-estar</span><strong>${fmt(s.state.metrics.welfare, 0)}/100</strong></div><div><span>Pobreza</span><strong>${fmt(s.state.metrics.poverty)}%</strong></div></div><div class="scenario-buttons"><button class="secondary" data-load="${s.id}">Retomar</button><button class="secondary" data-compare="${s.id}">Comparar</button><button class="remove" data-remove="${s.id}" aria-label="Excluir cenário ${esc(s.name)}">Excluir</button></div></article>`,
        )
        .join("")
    : '<div class="empty"><svg style="width:30px;height:30px"><use href="assets/reicon.svg#i-layers"/></svg><h4>Nenhum cenário salvo</h4><p>Salve o cenário atual para retomar ou comparar depois.</p></div>';
}
function compareScenario(s) {
  openModal(
    `<h3 id="modalTitle">Comparar cenários</h3><p>${s.state.seed === state.seed ? "Mesma semente territorial." : "Territórios diferentes: considere as condições iniciais."} Comparação descritiva, sem atribuição causal automática.</p><div class="comparison"><table><thead><tr><th>Indicador</th><th>Atual<br>${date(state.quarter)}</th><th>${esc(s.name)}<br>${date(s.state.quarter)}</th></tr></thead><tbody>${metricDefs.map(([k, n, u]) => `<tr><td>${n}</td><td>${fmt(state.metrics[k])}${u}</td><td>${fmt(s.state.metrics[k])}${u}</td></tr>`).join("")}</tbody></table></div><p>Atual: ${esc(state.name)} · ${esc(state.external)}<br>Salvo: ${esc(s.state.name)} · ${esc(s.state.external)}</p><div class="modal-actions"><button class="primary" data-close>Fechar comparação</button></div>`,
  );
}
// Shared event delegation keeps generated controls consistent.
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.view) setView(b.dataset.view);
  if (b.dataset.region !== undefined) selectRegion(Number(b.dataset.region));
  if (b.dataset.layer) {
    layer = b.dataset.layer;
    applyLayer();
  }
  if (b.hasAttribute("data-close")) closeModal();
  if (b.hasAttribute("data-methods")) showMethods();
  if (b.dataset.compare) {
    const s = saved.find((s) => s.id === b.dataset.compare);
    if (s) compareScenario(s);
  }
  if (b.dataset.load) {
    const item = saved.find((s) => s.id === b.dataset.load);
    if (!item) return;
    openModal(
      `<h3 id="modalTitle">Retomar ${esc(item.name)}?</h3><p>O cenário ativo será substituído. Para conservar seu progresso atual, cancele e salve uma cópia primeiro.</p><div class="modal-actions"><button class="secondary" data-close autofocus>Cancelar</button><button class="primary" id="confirmLoad">Retomar cenário</button></div>`,
    );
    $("#confirmLoad").onclick = () => {
      state = structuredClone(item.state);
      selected = state.territory?.capitalRegion ?? 3;
      selectedCity = null;
      drawMap();
      renderPolicies();
      updateUI();
      persist();
      closeModal();
      setView("territorio");
      notify("Cenário retomado.");
    };
  }
  if (b.dataset.remove) {
    const item = saved.find((s) => s.id === b.dataset.remove);
    if (!item) return;
    openModal(
      `<h3 id="modalTitle">Excluir cenário?</h3><p>A cópia salva de “${esc(item.name)}” será removida deste navegador. O cenário ativo permanece disponível.</p><div class="modal-actions"><button class="secondary" data-close autofocus>Cancelar</button><button class="primary" id="confirmRemove">Excluir cenário</button></div>`,
    );
    $("#confirmRemove").onclick = () => {
      try {
        const next = saved.filter((s) => s.id !== item.id);
        localStorage.setItem("meridiano:scenarios:v1", JSON.stringify(next));
        saved = next;
        renderScenarios();
        closeModal();
        notify("Cenário excluído.");
      } catch {
        notify("Não foi possível excluir o cenário. Tente novamente.");
      }
    };
  }
});
$("#policies").addEventListener("input", (e) => {
  const key = e.target.dataset.policy;
  if (!key) return;
  state.policies[key] = Number(e.target.value);
  renderBudget();
  decisionUI?.renderForecast();
  advisorController?.stateChanged(state);
  persist();
});
$("#advance").onclick = () => stepForward(true);
$("#save").onclick = saveScenario;
$("#save2").onclick = saveScenario;
$("#configure").onclick = () => countryForm();
$("#newCountry").onclick = () => countryForm(true);
$("#methods").onclick = showMethods;
$("#mapMethods").onclick = showMethods;
$("#chartMetric").onchange = renderIndicators;
$("#closeModal").onclick = closeModal;
$("#modal").addEventListener("click", (e) => {
  if (e.target === $("#modal")) {
    const r = e.target.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      closeModal();
  }
});
$("#stateSelect").onchange = (e) => selectRegion(Number(e.target.value));
$("#municipalitySelect").onchange = (e) => {
  if (e.target.value === "") {
    selectedCity = null;
    renderRegion();
  } else {
    const c = cities[Number(e.target.value)];
    selectRegion(c.region, c);
  }
};
$("#closeRegion").onclick = () => $("#regionCard").classList.add("hidden");
$("#zoomIn").onclick = () => {
  if (atlasMap) {
    atlasMap.zoomBy(0.5);
    return;
  }
  if (terrain3d) {
    terrain3d.zoomBy(0.82);
    return;
  }
  zoom = clamp(zoom + 0.35, 0.75, 3);
  transformMap();
};
$("#zoomOut").onclick = () => {
  if (atlasMap) {
    atlasMap.zoomBy(-0.5);
    return;
  }
  if (terrain3d) {
    terrain3d.zoomBy(1.2);
    return;
  }
  zoom = clamp(zoom - 0.35, 0.75, 3);
  transformMap();
};
$("#resetMap").onclick = resetMap;
$("#overview").onclick = () => {
  resetMap();
  selectedCity = null;
  renderRegion();
  $("#regionCard").classList.remove("hidden");
};
$("#exploreRegion").onclick = () => {
  if (selectedCity) {
    selectedCity = null;
    renderRegion();
    return;
  }
  if (atlasMap) {
    atlasMap.focus(selected, selectedCity);
    return;
  }
  if (terrain3d) {
    terrain3d.focus(selected);
    return;
  }
  const r = regions[selected];
  zoom = 2;
  pan = { x: (500 - r.x) * zoom, y: (380 - r.y) * zoom };
  transformMap();
  notify("Municípios visíveis. Selecione um ponto no mapa.");
};
$("#export").onclick = () => {
  const blob = new Blob(
      [
        JSON.stringify(
          { application: "meridiano", exportVersion: 1, state },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `meridiano-${state.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${2027 + Math.floor(state.quarter / 4)}-t${(state.quarter % 4) + 1}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Cópia JSON exportada.");
};
let drag = null;
$("#mapViewport").addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  drag = { x: e.clientX, y: e.clientY, pan: { ...pan }, moved: false };
  $("#mapViewport").classList.add("dragging");
});
window.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const rect = $("#atlas").getBoundingClientRect(),
    scale = Math.max(1000 / rect.width, 760 / rect.height),
    dx = e.clientX - drag.x,
    dy = e.clientY - drag.y;
  if (Math.hypot(dx, dy) > 4) drag.moved = true;
  if (drag.moved) {
    pan = {
      x: clamp(drag.pan.x + dx * scale, -1000, 1000),
      y: clamp(drag.pan.y + dy * scale, -760, 760),
    };
    transformMap();
  }
});
window.addEventListener("pointerup", (e) => {
  if (!drag) return;
  const moved = drag.moved;
  drag = null;
  $("#mapViewport").classList.remove("dragging");
  if (moved) return;
  const city = e.target.closest("[data-city]"),
    region = e.target.closest(".region-path"),
    municipality = e.target.closest("[data-municipality]");
  if (municipality && layer === "densidade") {
    const c = cities[Number(municipality.dataset.municipality)];
    selectRegion(c.region, c);
    return;
  }
  if (city) {
    let c = cities[Number(city.dataset.city)];
    selectRegion(c.region, c);
  } else if (region) selectRegion(Number(region.dataset.region));
});
window.addEventListener("pointercancel", () => {
  drag = null;
  $("#mapViewport").classList.remove("dragging");
});
readStorage();
drawMap();
renderPolicies();
decisionUI = initDecisionUI({
  getState: () => state,
  setState: (next) => {
    state = next;
    renderPolicies();
    updateUI();
    persist();
  },
  openModal,
  closeModal,
  setView,
  notify,
});
eventIsland = initEventIsland({
  onDetails: () =>
    decisionFor(state) ? decisionUI.showDecision() : setView("indicadores"),
});
advisorController = initAdvisor({ getState: () => state, notify });
updateUI();
setView(location.hash.slice(1) || "territorio");
window.addEventListener("hashchange", () => setView(location.hash.slice(1)));

function pausePlayback() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
  $("#playSimulation").textContent = "▶";
  $("#playSimulation").setAttribute("aria-pressed", "false");
  $("#playSimulation").setAttribute("aria-label", "Reproduzir simulação");
}
function stepForward(manual = false) {
  if (state.quarter >= 160) {
    pausePlayback();
    return;
  }
  if (decisionFor(state)) {
    pausePlayback();
    decisionUI.showDecision();
    return;
  }
  state = advanceTurn(state);
  updateUI();
  eventIsland?.update(state, true);
  persist();
  if (decisionFor(state)) pausePlayback();
  const root = $(".app");
  root.classList.remove("pulse-turn");
  requestAnimationFrame(() => root.classList.add("pulse-turn"));
  if (manual) decisionUI.showReport();
  if (!reducedMotion.matches) {
    $("#sideMetrics").animate([{ opacity: 0.45 }, { opacity: 1 }], {
      duration: 350,
    });
  }
}
function play() {
  pausePlayback();
  if (state.quarter >= 160) return;
  if (decisionFor(state)) {
    decisionUI.showDecision();
    return;
  }
  const speed = Number($("#playSpeed").value);
  playTimer = setInterval(() => {
    if (document.hidden || $("#modal").open) {
      pausePlayback();
      return;
    }
    stepForward();
  }, speed);
  $("#playSimulation").textContent = "Ⅱ";
  $("#playSimulation").setAttribute("aria-pressed", "true");
  $("#playSimulation").setAttribute("aria-label", "Pausar simulação");
  $("#playSimulation").title = `Um trimestre a cada ${speed / 1000} segundos`;
}
$("#playSimulation").onclick = () => (playTimer ? pausePlayback() : play());
$("#playSpeed").onchange = () => {
  if (playTimer) play();
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pausePlayback();
});
let themePreference = "system";
try {
  themePreference = localStorage.getItem("meridiano:theme") || "system";
} catch {}
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
function applyTheme(choice) {
  themePreference = ["light", "dark", "system"].includes(choice)
    ? choice
    : "system";
  const resolved =
    themePreference === "system"
      ? systemTheme.matches
        ? "dark"
        : "light"
      : themePreference;
  document.documentElement.dataset.theme = resolved;
  document.querySelector("meta[name=theme-color]").content =
    resolved === "dark" ? "#070807" : "#f3f5ef";
  $$("[data-theme-choice]").forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.themeChoice === themePreference),
  );
  try {
    localStorage.setItem("meridiano:theme", themePreference);
  } catch {}
  terrain3d?.setTheme(resolved);
  atlasMap?.setTheme(resolved);
  if (view === "indicadores") renderChart();
}
$$("[data-theme-choice]").forEach(
  (b) => (b.onclick = () => applyTheme(b.dataset.themeChoice)),
);
systemTheme.addEventListener("change", () => {
  if (themePreference === "system") applyTheme("system");
});
applyTheme(themePreference);
async function setMapMode(next) {
  if (
    next === mapMode &&
    next !== "2d" &&
    (terrain3d || atlasMap || !$("#threeLoading").hidden)
  )
    return;
  const token = ++mapLoadToken;
  mapMode = next;
  $$("[data-map-mode]").forEach((b) => {
    b.classList.toggle("active", b.dataset.mapMode === next);
    b.setAttribute("aria-pressed", b.dataset.mapMode === next);
  });
  const shell = $(".map-shell"),
    host = $("#terrain3d");
  shell.classList.toggle("cartographic", next === "atlas");
  if (next !== "atlas") {
    atlasMap?.dispose();
    atlasMap = null;
    $("#atlasInteractive").hidden = true;
    shell.classList.remove("atlas-active");
  }
  if (next !== "3d") {
    terrain3d?.dispose();
    terrain3d = null;
    host.hidden = true;
    $("#threeLoading").hidden = true;
    shell.classList.remove("three-active");
    $("#mapInteractionHint").textContent =
      next === "atlas"
        ? "Vias e cidades fictícias. Aproxime para explorar o traçado urbano."
        : "Arraste para navegar. Selecione um estado ou município.";
    if (next !== "atlas") return;
    $("#threeLoading").hidden = false;
    try {
      const { createAtlasMap } = await import("./atlas-map.js");
      if (token !== mapLoadToken) return;
      const atlasHost = $("#atlasInteractive");
      atlasHost.hidden = false;
      shell.classList.add("atlas-active");
      const fallback = (message) => {
        atlasMap?.dispose();
        atlasMap = null;
        atlasHost.hidden = true;
        atlasHost.replaceChildren();
        shell.classList.remove("atlas-active");
        notify(message);
      };
      atlasMap = createAtlasMap(atlasHost, {
        state,
        cities,
        onSelect: selectRegion,
        onError: fallback,
        reducedMotion,
      });
      atlasMap.update(state, { selected, layer });
      $("#mapInteractionHint").textContent =
        "Atlas: aproxime para revelar municípios e ruas. Território e dados sintéticos.";
    } catch {
      if (token === mapLoadToken) {
        atlasMap?.dispose();
        atlasMap = null;
        $("#atlasInteractive").replaceChildren();
        $("#atlasInteractive").hidden = true;
        shell.classList.remove("atlas-active");
        notify(
          "Atlas em modo vetorial neste aparelho. Os mesmos estados, cidades e dados continuam disponíveis.",
        );
      }
    } finally {
      if (token === mapLoadToken) $("#threeLoading").hidden = true;
    }
    return;
  }
  $("#threeLoading").hidden = false;
  try {
    const { createTerrain3D } = await import("./terrain3d.js");
    if (token !== mapLoadToken) return;
    host.hidden = false;
    shell.classList.add("three-active");
    terrain3d = createTerrain3D(host, {
      state,
      cities,
      onSelect: selectRegion,
      onError: (message) => {
        setMapMode("2d");
        notify(message);
      },
    });
    terrain3d.update(state, { selected, layer });
    $("#mapInteractionHint").textContent =
      "Arraste para girar. Use dois dedos para aproximar ou afastar.";
  } catch {
    if (token === mapLoadToken) {
      setMapMode("2d");
      notify(
        "Não foi possível abrir a visão 3D neste aparelho. Use o mapa 2D.",
      );
    }
  } finally {
    if (token === mapLoadToken) $("#threeLoading").hidden = true;
  }
}
$$("[data-map-mode]").forEach(
  (b) => (b.onclick = () => setMapMode(b.dataset.mapMode)),
);
window.addEventListener("pagehide", () => {
  pausePlayback();
  advisorController?.cancel();
  eventIsland?.destroy();
  terrain3d?.dispose();
  atlasMap?.dispose();
});

const narrowViewport = matchMedia("(max-width: 760px)");
function positionRegionPanel() {
  const panel = $("#regionCard");
  if (narrowViewport.matches) {
    $(".map-shell").after(panel);
  } else {
    $(".map-shell").append(panel);
  }
  resetMap();
}
narrowViewport.addEventListener("change", positionRegionPanel);
positionRegionPanel();

function updateCabinetLabels() {
  const person = cabinetFor(state.government);
  document
    .querySelectorAll("[data-cabinet-title]")
    .forEach((el) => (el.textContent = person.title));
  document
    .querySelectorAll("[data-cabinet-office]")
    .forEach((el) => (el.textContent = person.office));
  const nav = document.querySelector('.rail [data-view="conselheiro"]');
  nav.setAttribute("aria-label", person.title);
  nav.title = person.title;
  if (view === "conselheiro") {
    $("#pageTitle").textContent = person.office;
    document.title = person.office + " · " + state.name + " — Meridiano";
  }
}
