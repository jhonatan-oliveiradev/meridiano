import { renderProjectCard, regionalProjectSummary } from "./project-card.js";
import { regionsOf, regionalMetrics, budget } from "./model.js";
import {
  quoteInvestment,
  startInvestment,
  cancelInvestment,
  regionalNeeds,
} from "./investments.js";
import {
  projectDefs,
  projectFor,
  activeInvestments,
  investmentFinance,
} from "./investment-ledger.js";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (v, d = 1) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d }).format(v);
const money = (v) =>
  v >= 1 ? `M$ ${fmt(v, 2)} bi` : `M$ ${fmt(v * 1000, 1)} mi`;
const people = (v) =>
  v >= 1 ? `${fmt(v, 2)} milhões` : `${fmt(v * 1000, 0)} mil`;
const quarter = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
export function initInvestmentUI({
  getState,
  setState,
  getSelected,
  selectRegion,
  openModal,
  closeModal,
  setView,
  notify,
}) {
  const action = (key, index, label, extra = "") =>
    `<button class="secondary" data-invest-action="${key}" data-invest-region="${index}" ${extra}>${label}</button>`;
  function focusTitle() {
    const el = $("#modalTitle");
    el.tabIndex = -1;
    el.focus();
  }
  function showOffers(index = getSelected()) {
    const s = getState(),
      r = regionsOf(s)[index],
      m = regionalMetrics(s, index);
    openModal(
      `<div class="investment-dialog cycle-dialog"><span class="eyebrow">PROGRAMAS ESTADUAIS · ${esc(r.name)}</span><h3 id="modalTitle">Onde investir</h3><p>Escolha um programa para ${esc(r.name)}. A contratação é estadual, inclusive quando você chega por um município.</p><div class="investment-context"><span>Acesso a serviços <b>${fmt(m.access, 0)}/100</b></span><span>População <b>${people(m.population)}</b></span><span>Em implantação no país <b>${activeInvestments(s).length}/3</b></span></div><div class="investment-offers">${projectDefs
        .map((def) => {
          const q = quoteInvestment(s, index, def.key);
          return `<article class="investment-offer"><span class="investment-symbol" aria-hidden="true">${{ water: "≈", health: "+", education: "Aa", transport: "↔" }[def.key]}</span><h4>${def.name}</h4><p>${def.detail}</p><dl><div><dt>Investimento total</dt><dd>${money(q.cost)}</dd></div><div><dt>Operação estimada</dt><dd>${q.operationTurns} trimestres</dd></div><div><dt>Moradores atendidos</dt><dd>${people(q.people)}</dd></div></dl>${q.reason ? `<p class="investment-reason">${q.reason}</p>` : ""}<button class="${q.allowed ? "primary" : "secondary"}" data-invest-action="quote" data-invest-region="${index}" data-invest-type="${def.key}" ${q.allowed ? "" : "disabled"}>Avaliar ${def.short.toLowerCase()}</button></article>`;
        })
        .join(
          "",
        )}</div><p class="investment-footnote">Custos adicionais às políticas nacionais. O prazo depende da capacidade de execução e do relevo. Cada programa pode ser contratado uma vez por estado.</p><div class="modal-actions">${action("compare", index, "Comparar estados ↗")}${action("portfolio", index, "Ver carteira")}<button class="secondary" data-close>Voltar ao país</button></div></div>`,
    );
    focusTitle();
  }
  function showComparison() {
    const s = getState();
    openModal(
      `<div class="investment-dialog cycle-dialog"><span class="eyebrow">DIAGNÓSTICO TERRITORIAL</span><h3 id="modalTitle">Compare as necessidades</h3><p>Estados ordenados pelo acesso atual a serviços. O índice resume a situação regional; não representa uma medição separada de cada rede.</p><div class="investment-table"><table><thead><tr><th>Estado</th><th>Acesso</th><th>População</th><th>Contratos</th><th>Investir</th></tr></thead><tbody>${regionalNeeds(
        s,
      )
        .map(
          (r) =>
            `<tr><th scope="row">${esc(r.name)}</th><td><meter min="0" max="100" value="${r.access}" aria-label="Acesso em ${esc(r.name)}" aria-valuetext="${fmt(r.access, 0)} de 100"></meter>${fmt(r.access, 0)}/100</td><td>${people(r.population)}</td><td>${r.projects}</td><td>${action("offers", r.index, "Escolher", `aria-label="Investir em ${esc(r.name)}"`)}</td></tr>`,
        )
        .join(
          "",
        )}</tbody></table></div><p class="investment-footnote">Relevo mais difícil encarece a implantação e reduz o ritmo da obra. O alcance de cada proposta considera o déficit de acesso do estado.</p><div class="modal-actions"><button class="secondary" data-close>Voltar ao país</button></div></div>`,
    );
    focusTitle();
  }
  function showQuote(index, type) {
    const s = getState(),
      q = quoteInvestment(s, index, type),
      def = projectFor(type);
    if (!q.allowed) {
      notify(q.reason);
      return;
    }
    const next = startInvestment(s, index, type),
      finance = investmentFinance(next),
      before = budget(s),
      after = budget(next);
    openModal(
      `<div class="investment-dialog cycle-dialog"><span class="eyebrow">PROPOSTA · ${esc(q.regionName)}</span><h3 id="modalTitle">${def.name}</h3><p>${def.detail} O alcance inicial estimado é de <b>${people(q.people)}${q.people >= 1 ? " de" : ""} moradores</b>, incluindo áreas urbanas e rurais.</p><div class="investment-quote-grid"><div><span>Investimento total</span><strong>${money(q.cost)}</strong></div><div><span>Manutenção anual após entrega</span><strong>${money(q.upkeepAnnual)}</strong></div><div><span>Entrega estimada</span><strong>${quarter(s.quarter + q.deliveryTurns)}</strong></div><div><span>Operação estimada</span><strong>${quarter(s.quarter + q.operationTurns)}</strong></div></div><ol class="investment-steps"><li><b>Planejar</b><span>10% no próximo trimestre: ${money(q.cost * 0.1)}.</span></li><li><b>Construir</b><span>90% pagos conforme o avanço físico; ${fmt(q.terrain, 2)}× de dificuldade territorial.</span></li><li><b>Operar</b><span>Manutenção e benefícios começam no avanço seguinte à entrega.</span></li></ol><div class="investment-impact"><h4>Benefício local em operação</h4><p>Acesso a serviços: até +${fmt(q.benefits.access)} pontos. Bem-estar: +${fmt(q.benefits.welfare)} pontos. Pobreza: −${fmt(q.benefits.poverty)} p.p.${q.benefits.growth ? ` Contribuição ao crescimento anualizado nacional: +${fmt(q.benefits.growth * q.regionShare, 2)} p.p.` : ""}</p><small>Regras sintéticas, com limites nos indicadores. Efeitos nacionais são ponderados pela participação do estado e se acumulam gradualmente.</small></div><div class="investment-finance"><b>Contas do próximo trimestre</b><p>Pagamento desta contratação: ${money(q.cost * 0.1)}. Total da carteira: ${money(finance.constructionQuarter + finance.upkeepQuarter)}.</p><p>Saldo anualizado / PIB: ${fmt(before.balance, 2)}% → ${fmt(after.balance, 2)}%. Valores trimestrais multiplicados por quatro para comparação; não representam um cronograma anual fixo.</p></div><p class="investment-footnote">A estimativa considera capacidade ${fmt(s.capacity * 100, 0)}/100. Mudanças na capacidade podem antecipar ou atrasar a entrega. O déficit é financiado pela dívida; não há verba reservada fora do orçamento. Você pode cancelar sem custo antes do primeiro avanço.</p><div class="modal-actions">${action("offers", index, "Voltar aos programas")}<button class="primary" data-invest-action="confirm" data-invest-region="${index}" data-invest-type="${type}">Contratar ${def.short.toLowerCase()}</button></div></div>`,
    );
    focusTitle();
  }
  function portfolioHTML(s, modal = false) {
    const list = s.investments ?? [],
      f = investmentFinance(s);
    return `<div class="investment-heading"><div><span class="eyebrow">INVESTIMENTO PÚBLICO</span><h${modal ? '3 id="modalTitle"' : "4"}>Carteira de projetos</h${modal ? "3" : "4"}></div>${action("compare", getSelected(), "Comparar estados ↗")}</div><p>${activeInvestments(s).length} de 3 vagas de implantação ocupadas · ${list.filter((p) => p.phase === "operating").length} ${list.filter((p) => p.phase === "operating").length === 1 ? "programa" : "programas"} em operação.</p>${list.length ? `<div class="investment-totals"><span>Obras no próximo trimestre <b>${money(f.constructionQuarter)}</b></span><span>Manutenção no próximo trimestre <b>${money(f.upkeepQuarter)}</b></span><span>A pagar em obras <b>${money(f.remainingCapital)}</b></span><span>Manutenção anual contratada <b>${money(f.upkeepAnnualCommitted)}</b></span></div><p class="investment-footnote">A manutenção contratada inclui programas ainda em implantação; só será cobrada após a entrega. Públicos dos programas podem se sobrepor.</p><div class="project-grid">${list.map((p) => renderProjectCard(s, p)).join("")}</div>` : `<div class="investment-empty"><span aria-hidden="true">↗</span><div><b>Seu primeiro investimento</b><p>Compare os estados e avalie custo, prazo e moradores atendidos antes de contratar.</p></div>${action("offers", getSelected(), "Avaliar programas")}</div>`}`;
  }
  function showPortfolio() {
    openModal(
      `<div class="investment-dialog cycle-dialog">${portfolioHTML(getState(), true)}<div class="modal-actions"><button class="secondary" data-close>Voltar ao país</button></div></div>`,
    );
    focusTitle();
  }
  function renderRegion() {
    const s = getState(),
      index = getSelected(),
      projects = (s.investments ?? []).filter((p) => p.region === index);
    $("#regionalInvestment").innerHTML =
      `<div class="regional-invest-actions"><button class="primary" data-invest-action="offers" data-invest-region="${index}">Investir no estado ↗</button>${action("compare", index, "Comparar")}</div>${projects.length ? `<button class="regional-project-summary" data-project-status="${projects.every((p) => p.phase === "operating") ? "active" : "pending"}" data-invest-action="portfolio">${regionalProjectSummary(projects)} ↗</button>` : '<small class="investment-footnote">Custo e prazo antes de contratar.</small>'}`;
  }
  function renderMarkers() {
    const s = getState(),
      regions = regionsOf(s),
      root = $("#investmentMarkers");
    root.innerHTML = regions
      .map((r, i) => {
        const ps = (s.investments ?? []).filter((p) => p.region === i);
        if (!ps.length) return "";
        const operating = ps.every((p) => p.phase === "operating");
        return `<g class="investment-pin ${operating ? "is-operating" : ""}" transform="translate(${r.x + 15},${r.y + 15})" data-invest-action="locate" data-invest-region="${i}" role="button" tabindex="0" aria-label="${ps.length} programas em ${esc(r.name)}"><title>${ps.length} programas em ${esc(r.name)}</title><circle r="11"/><text text-anchor="middle" dy="3.5">${ps.length}</text></g>`;
      })
      .join("");
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-invest-action]");
    if (!b || b.disabled) return;
    const index = Number(b.dataset.investRegion),
      type = b.dataset.investType;
    switch (b.dataset.investAction) {
      case "offers":
        showOffers(index);
        break;
      case "compare":
        showComparison();
        break;
      case "quote":
        showQuote(index, type);
        break;
      case "portfolio":
        showPortfolio();
        break;
      case "locate":
        closeModal();
        setView("territorio");
        selectRegion(index);
        $("#regionalInvestment button").focus();
        break;
      case "confirm": {
        const s = getState(),
          next = startInvestment(s, index, type);
        if (s === next) {
          notify(quoteInvestment(s, index, type).reason);
          showOffers(index);
          return;
        }
        setState(next);
        closeModal();
        setView("territorio");
        selectRegion(index);
        $("#regionalInvestment button").focus();
        notify(
          "Programa contratado. O planejamento começa no próximo trimestre.",
        );
        break;
      }
      case "cancel": {
        const s = getState(),
          next = cancelInvestment(s, b.dataset.investId);
        if (s === next) return;
        setState(next);
        showPortfolio();
        notify("Contratação cancelada sem cobrança.");
        break;
      }
    }
  });
  $("#investmentMarkers").addEventListener("keydown", (e) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target.matches(".investment-pin")
    ) {
      e.preventDefault();
      closeModal();
      setView("territorio");
      selectRegion(Number(e.target.dataset.investRegion));
      $("#regionalInvestment button").focus();
    }
  });
  return {
    showQuote,
    renderRegion,
    update() {
      renderRegion();
      renderMarkers();
      $("#investmentPortfolio").innerHTML = portfolioHTML(getState());
    },
  };
}
