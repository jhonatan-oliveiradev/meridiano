import {
  sectors,
  createTrade,
  validTrade,
  tradeQuarter,
  setTradePolicy,
  quoteAgreement,
  signAgreement,
} from "./trade.js";
import { regionsOf } from "./model.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (v, d = 2) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d }).format(v);
const money = (v) =>
  Math.abs(v) >= 1 ? `M$ ${fmt(v)} bi` : `M$ ${fmt(v * 1000, 1)} mi`;
const period = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
export function sectorIcon(key) {
  const paths = {
    food: "M12 21V4m0 5C5 9 5 4 5 4s7 0 7 5Zm0 7c-7 0-7-5-7-5s7 0 7 5Zm0-4c7 0 7-5 7-5s-7 0-7 5Z",
    energy: "m13 2-8 12h6l-1 8 9-13h-6l1-7Z",
    minerals: "m7 3-5 7 10 12 10-12-5-7H7Zm-5 7h20M7 3l5 19 5-19",
    manufactures: "M3 21V9l6 4V8l6 4V3h4v18H3Zm3-4h2m3 0h2m3 0h2",
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[key]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
export function initTradeUI({
  getState,
  setState,
  getSelected,
  getLayer,
  setLayer,
  setView,
  selectRegion,
  openModal,
  closeModal,
  notify,
}) {
  const root = document.querySelector("#tradeContent"),
    ns = "http://www.w3.org/2000/svg";
  const overlay = document.createElementNS(ns, "g");
  overlay.id = "economicOverlay";
  document.querySelector("#investmentMarkers").after(overlay);
  const panel = document.createElement("aside");
  panel.id = "mapEconomyPanel";
  panel.setAttribute("aria-label", "Economia do território");
  document.querySelector(".map-shell").append(panel);
  const regional = document.createElement("section");
  regional.id = "regionalEconomy";
  document.querySelector("#regionalInvestment").after(regional);
  let pending = null;
  function policies(key) {
    const s = getState(),
      d = sectors.find((d) => d.key === key),
      p = s.trade.policy[key];
    openModal(
      `<div class="cycle-dialog trade-dialog"><span class="eyebrow">ABASTECIMENTO E MERCADO</span><h3 id="modalTitle">${d.name}</h3><p>A reserva doméstica tem prioridade sobre vendas. Importações são compras dos agentes econômicos, sujeitas à oferta externa, sem despesa direta no orçamento público.</p><form id="tradePolicyForm"><label for="tradeReserve">Reserva desejada</label><select id="tradeReserve" name="reserve">${[0, 1, 3, 6].map((v) => `<option value="${v}" ${p.reserveMonths === v ? "selected" : ""}>${v} ${v === 1 ? "mês" : "meses"} de consumo interno</option>`).join("")}</select><label for="tradeExport">Parcela exportável do excedente</label><select id="tradeExport" name="export">${[0, 0.25, 0.5, 0.7, 1].map((v) => `<option value="${v}" ${p.exportShare === v ? "selected" : ""}>${fmt(v * 100, 0)}%</option>`).join("")}</select><label class="trade-check"><input type="checkbox" name="imports" ${p.imports ? "checked" : ""}>Permitir importações para abastecimento e insumos</label><div id="tradePolicyPreview" class="proposal-tradeoff"></div><p>O ajuste entra no próximo trimestre; não vende estoque imediatamente. A reserva desejada não garante disponibilidade física.</p><div class="modal-actions"><button class="secondary" type="button" data-close>Voltar</button><button class="primary" type="submit">Preparar política</button></div></form></div>`,
    );
    const seed = s.seed,
      quarter = s.quarter;
    const form = document.querySelector("#tradePolicyForm");
    form.oninput = () => {
      const f = new FormData(form),
        next = setTradePolicy(s, key, {
          reserveMonths: Number(f.get("reserve")),
          exportShare: Number(f.get("export")),
          imports: f.has("imports"),
        });
      const before = tradeQuarter(s).report.flows.find((x) => x.key === key),
        after = tradeQuarter(next).report.flows.find((x) => x.key === key);
      document.querySelector("#tradePolicyPreview").textContent =
        `Prévia com a capacidade atual: exportações ${fmt(before.exports)} → ${fmt(after.exports)} UP; importações ${fmt(before.imports)} → ${fmt(after.imports)} UP; estoque final ${fmt(before.closing)} → ${fmt(after.closing)} UP. Insumos também podem afetar outros setores.`;
    };
    form.oninput();
    document.querySelector("#tradePolicyForm").onsubmit = (e) => {
      e.preventDefault();
      const now = getState();
      if (now.seed !== seed || now.quarter !== quarter) {
        closeModal();
        notify("O cenário mudou. Revise a política.");
        return;
      }
      const f = new FormData(e.currentTarget),
        next = setTradePolicy(now, key, {
          reserveMonths: Number(f.get("reserve")),
          exportShare: Number(f.get("export")),
          imports: f.has("imports"),
        });
      setState(next);
      closeModal();
      notify("Política comercial preparada para o próximo trimestre.");
    };
  }
  function agreement(key, duration = 4) {
    const s = getState(),
      q = quoteAgreement(s, key, duration),
      d = sectors.find((d) => d.key === key);
    pending = q;
    openModal(
      `<div class="cycle-dialog trade-dialog"><span class="eyebrow">MERCADO EXTERNO AGREGADO</span><h3 id="modalTitle">Acordo de ${d.name.toLowerCase()}</h3><p>Preço e volume por trimestre são fixados na assinatura. O acordo reserva demanda externa, mantendo prioridade do consumo e da reserva interna. Não há antecipação de pagamento.</p><div class="trade-term">${[4, 8].map((v) => `<button class="secondary ${v === duration ? "active" : ""}" data-trade-action="term" data-sector="${key}" data-duration="${v}" aria-pressed="${v === duration}">${v} trimestres</button>`).join("")}</div>${q.allowed ? `<div class="trade-kpis"><div><span>Volume / trimestre</span><strong>${fmt(q.quantity)} UP</strong></div><div><span>Preço fixado</span><strong>${fmt(q.price)}× referência</strong></div><div><span>Receita se entregue integralmente</span><strong>${money(q.quantity * q.price)}</strong></div><div><span>Última entrega</span><strong>${period(q.endsAt)}</strong></div></div><p>Oferta: metade do excedente exportável estimado com a capacidade atual, com desconto de 3% no preço de referência da cotação. Se faltar produto ou logística, a entrega será parcial e a receita menor. Até três acordos ativos, um por setor.</p>` : `<p class="trade-warning">${esc(q.reason)}</p>`}<p class="governance-note">Mercado fictício. Não representa negociação diplomática com um país específico. Produção e preços futuros podem mudar; esta receita é de vendas, não um crédito ao Tesouro.</p><div class="modal-actions"><button class="secondary" data-close>Voltar</button><button class="primary" data-trade-action="sign" ${q.allowed ? "" : "disabled"}>Assinar acordo</button></div></div>`,
    );
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-trade-action]");
    if (!b || b.disabled) return;
    const key = b.dataset.sector;
    switch (b.dataset.tradeAction) {
      case "enable": {
        const s = getState();
        if (s.quarter >= 160) return;
        const n = structuredClone(s);
        n.trade = createTrade(n, regionsOf(n));
        delete n.tradeReport;
        setState(n);
        notify(
          "Recursos definidos pela semente. Produção ativa no próximo avanço.",
        );
        break;
      }
      case "policy":
        policies(key);
        break;
      case "agreement":
        agreement(key);
        break;
      case "term":
        agreement(key, Number(b.dataset.duration));
        break;
      case "sign": {
        const s = getState(),
          n = signAgreement(s, pending);
        if (n === s) {
          notify("A cotação mudou. Compare o acordo novamente.");
          closeModal();
          return;
        }
        setState(n);
        pending = null;
        closeModal();
        notify("Acordo assinado. As entregas começam no próximo trimestre.");
        break;
      }
      case "map":
        if (!validTrade(getState().trade)) {
          setView("comercio");
          return;
        }
        setView("territorio");
        setLayer("manufactures");
        updateMap();
        break;
      case "sector-map":
        setView("territorio");
        setLayer(key);
        updateMap();
        break;
      case "region":
        selectRegion(Number(b.dataset.region));
        break;
    }
  });
  overlay.addEventListener("keydown", (e) => {
    const b = e.target.closest("[data-economic-region]");
    if (b && ["Enter", " "].includes(e.key)) {
      e.preventDefault();
      selectRegion(Number(b.dataset.economicRegion));
    }
  });
  overlay.addEventListener("click", (e) => {
    const b = e.target.closest("[data-economic-region]");
    if (b) selectRegion(Number(b.dataset.economicRegion));
  });
  function chart(s, r) {
    const h = s.trade.history ?? [];
    if (h.length < 2)
      return `<div class="trade-chart-empty">O histórico de vendas e compras aparece após dois avanços.</div>`;
    const values = h.slice(-24),
      max = Math.max(0.001, ...values.flatMap((x) => [x.exports, x.imports]));
    return `<svg class="trade-history" viewBox="0 0 680 150" role="img" aria-label="Exportações e importações nos últimos ${values.length} trimestres; valores exatos na tabela abaixo"><line x1="16" y1="132" x2="664" y2="132" stroke="currentColor" opacity=".15"/>${values.map((x, i) => `<g><title>${period(x.quarter)}: exportações ${money(x.exports)}, importações ${money(x.imports)}</title><rect x="${16 + (i * 640) / values.length}" y="${132 - (x.exports / max) * 110}" width="${Math.max(2, 280 / values.length)}" height="${(x.exports / max) * 110}" rx="2" fill="#a5d449"/><rect x="${18 + (i * 640) / values.length + 280 / values.length}" y="${132 - (x.imports / max) * 110}" width="${Math.max(2, 280 / values.length)}" height="${(x.imports / max) * 110}" rx="2" fill="#e8a163"/></g>`).join("")}</svg><details><summary>Valores do histórico</summary><div class="governance-table"><table><thead><tr><th>Trimestre</th><th>Exportações</th><th>Importações</th></tr></thead><tbody>${values.map((x) => `<tr><th>${period(x.quarter)}</th><td>${money(x.exports)}</td><td>${money(x.imports)}</td></tr>`).join("")}</tbody></table></div></details>`;
  }
  function update() {
    const s = getState();
    if (!validTrade(s.trade)) {
      root.innerHTML = `<div class="trade-intro"><span class="eyebrow">RECURSOS, PRODUÇÃO E MERCADO</span><h3>Produção neste cenário</h3><p>Ative a economia produtiva neste cenário para revelar os recursos de cada estado e administrar abastecimento, reservas e exportações. A geografia e o histórico do país serão preservados. Novos efeitos começam no próximo trimestre.</p><button class="primary" data-trade-action="enable" ${s.quarter >= 160 ? "disabled" : ""}>Ativar produção e comércio</button></div>`;
      updateMap();
      return;
    }
    const r = s.tradeReport ?? tradeQuarter(s).report,
      preview = !s.tradeReport;
    root.innerHTML = `<header class="trade-heading"><div><span class="eyebrow">ECONOMIA PRODUTIVA</span><h3>Abastecimento e exportações</h3><p>${preview ? "Prévia com a capacidade atual" : `Fechamento de ${period(r.quarter)}`} · fluxos trimestrais</p></div><button class="secondary" data-trade-action="map">Explorar recursos no mapa ↗</button></header><div class="trade-kpis"><div><span>Exportações</span><strong>${money(r.exports)}</strong><small>Receita dos produtores</small></div><div><span>Importações</span><strong>${money(r.imports)}</strong><small>Compras e insumos</small></div><div><span>Balança comercial</span><strong class="${r.balance < 0 ? "trade-negative" : ""}">${money(r.balance)}</strong><small>Vendas menos compras</small></div><div><span>Logística disponível</span><strong>${fmt(r.logistics * 100, 0)}<small>/100</small></strong><small>Limita o escoamento</small></div></div><div class="trade-ledger-note"><b>PIB e orçamento</b><span>Contribuição da produção ao crescimento: ${r.growth > 0 ? "+" : ""}${fmt(r.growth)} p.p. no crescimento anualizado, limitada a ±2,5 p.p. A primeira apuração estabelece a referência. O valor agregado desconta os insumos industriais; vendas externas não entram integralmente no caixa público. Receita tributária anual estimada do país: ${money((s.metrics.gdp * s.policies.tax) / 100)}; não há crédito extra das exportações.</span></div><section class="trade-history-card"><div class="trade-section-heading"><h4>Vendas e compras no tempo</h4><span><i></i>Exportações <i></i>Importações</span></div>${chart(s, r)}</section><div class="trade-sector-grid">${r.flows
      .map((f) => {
        const d = sectors.find((d) => d.key === f.key),
          p = s.trade.policy[f.key],
          scale = Math.max(0.001, f.opening + f.production + f.imports);
        return `<article class="trade-sector" style="--sector:${d.color}"><header><div class="trade-sector-icon">${sectorIcon(f.key)}</div><div><span>SETOR PRODUTIVO</span><h4>${d.name}</h4></div><button class="trade-map-link" data-trade-action="sector-map" data-sector="${f.key}" aria-label="Ver ${d.name.toLowerCase()} no mapa">↗</button></header><div class="trade-flow-bar" aria-hidden="true"><i style="width:${Math.min(100, (f.domestic / scale) * 100)}%"></i><i style="width:${Math.min(100, (f.exports / scale) * 100)}%"></i></div><dl>${[
          ["Capacidade disponível", f.capacity],
          ["Produção", f.production],
          ["Consumo interno", f.domestic],
          ["Insumos para indústria", f.inputs],
          ["Importações", f.imports],
          ["Exportações", f.exports],
          ["Estoque final", f.closing],
        ]
          .map(
            ([name, value]) =>
              `<div><dt>${name}</dt><dd>${fmt(value)} UP</dd></div>`,
          )
          .join(
            "",
          )}<div><dt>Preço externo</dt><dd>${fmt(f.price)}× referência</dd></div></dl>${f.unmet > 0.001 ? `<p class="trade-warning">Demanda interna não atendida: ${fmt(f.unmet)} UP. A escassez pressiona a inflação no modelo.</p>` : ""}${f.agreements.map((c) => `<p class="${c.delivered < c.quantity ? "trade-warning" : "trade-delivery"}">Acordo: ${fmt(c.delivered)} de ${fmt(c.quantity)} UP entregues neste trimestre.</p>`).join("")}<p class="trade-policy-summary">Reserva: ${fmt(p.reserveMonths, 0)} ${p.reserveMonths === 1 ? "mês" : "meses"} · exportação de ${fmt(p.exportShare * 100, 0)}% do excedente · importações ${p.imports ? "permitidas" : "suspensas"}</p><div class="trade-sector-actions"><button class="secondary" data-trade-action="policy" data-sector="${f.key}" ${s.quarter >= 160 ? "disabled" : ""}>Abastecimento</button><button class="secondary" data-trade-action="agreement" data-sector="${f.key}" ${s.quarter >= 160 ? "disabled" : ""}>Negociar acordo ↗</button></div></article>`;
      })
      .join(
        "",
      )}</div><section class="trade-contracts"><h4>Acordos ativos <span>${s.trade.contracts.length}/3</span></h4>${s.trade.contracts.length ? s.trade.contracts.map((c) => `<article><b>${sectors.find((d) => d.key === c.key)?.name ?? "Setor"}</b><span>${fmt(c.quantity)} UP / trimestre · preço ${fmt(c.price)}×</span><small>Até ${period(c.endsAt)}. Entregas sujeitas à disponibilidade.</small></article>`).join("") : "<p>Nenhum acordo assinado. Você pode vender excedentes ao mercado sem compromisso de prazo.</p>"}<p class="governance-note">${(s.trade.closed ?? []).length} acordos encerrados no histórico recente. Acordos encerram automaticamente após a última entrega; não se renovam sozinhos.</p></section><details class="trade-method"><summary>Como funciona esta economia</summary><p>UP são unidades produtivas sintéticas: 1 UP equivale a M$ 1 bilhão aos preços de referência. Não representam toneladas ou uma estimativa do mundo real. Demanda, oferta e preços externos são simulados, sem cotações reais.</p><p>O consumo interno é atendido antes das exportações. A indústria consome 0,12 UP de energia e 0,22 UP de minerais por UP produzida. Importações têm limite de oferta; estoques excessivos podem ser descartados. No trimestre: estoque inicial + produção + importação = consumo + insumos + exportação + descarte + estoque final.</p><p>Programas produtivos ampliam capacidade após a operação e cobram obras/manutenção no orçamento. A produção realizada depende de demanda e insumos. Tecnologia avançada e países parceiros específicos ainda não fazem parte desta cadeia.</p></details>`;
    updateMap();
  }
  function updateMap() {
    const s = getState(),
      enabled = validTrade(s.trade),
      economic = sectors.some((d) => d.key === getLayer()),
      i = getSelected(),
      r = enabled ? s.trade.resources[i] : null;
    document
      .querySelector(".map-shell")
      .classList.toggle("economic-active", economic && enabled);
    if (!enabled) {
      regional.innerHTML = "";
      overlay.innerHTML = "";
      panel.innerHTML = "";
      panel.hidden = true;
      return;
    }
    const sector = sectors.find((d) => d.key === getLayer()) ?? sectors[0],
      report = s.tradeReport ?? tradeQuarter(s).report,
      port = [...s.trade.resources].sort((a, b) => b.coast - a.coast)[0];
    const routes =
      economic &&
      r &&
      (report.flows.find((f) => f.key === sector.key)?.exports ?? 0) > 0
        ? `<g class="economic-routes" aria-hidden="true"><path d="M${r.x},${r.y} Q${(r.x + port.x) / 2},${Math.min(r.y, port.y) - 65} ${port.x},${port.y}" stroke="${sector.color}"/><path d="M${port.x},${port.y} Q920,360 925,115" stroke="${sector.color}"/><g transform="translate(925,115)"><circle r="22"/><path d="M-10 0h20M0-10v20"/><text y="39" text-anchor="middle">Mercado externo</text></g></g>`
        : "";
    overlay.innerHTML =
      routes +
      s.trade.resources
        .map((v, j) => {
          const dominant = economic
              ? sector
              : sectors.reduce((a, b) => (v[a.key] > v[b.key] ? a : b)),
            amount =
              report.regional.find((x) => x.region === j)?.output[
                dominant.key
              ] ?? 0;
          return `<g class="economic-site ${j === i ? "is-selected" : ""}" transform="translate(${v.x - 18},${v.y - 50})" data-economic-region="${j}" role="button" tabindex="0" aria-label="${esc(v.name)}: potencial de ${dominant.name.toLowerCase()} ${fmt(v[dominant.key] * 100, 0)} de 100"><title>${esc(v.name)} · ${dominant.name} · ${fmt(amount)} UP no trimestre</title><rect x="-13" y="-13" width="26" height="26" rx="7" fill="${dominant.color}"/><g transform="translate(-9,-9) scale(.75)" class="economic-symbol">${sectorIcon(
            dominant.key,
          )
            .replace(/^<svg[^>]*>/, "")
            .replace(
              "</svg>",
              "",
            )}</g>${economic && j === i ? `<text x="19" y="4">${fmt(amount)} UP</text>` : ""}</g>`;
        })
        .join("");
    regional.innerHTML = r
      ? `<div class="economic-region-title"><span>ECONOMIA DO ESTADO</span><button class="economic-close" data-view="comercio" aria-label="Abrir produção e comércio">↗</button></div>${sectors.map((d) => `<button class="economic-resource-row" data-trade-action="sector-map" data-sector="${d.key}"><span style="color:${d.color}">${sectorIcon(d.key)}</span><b>${d.name}</b><meter min="0" max="100" value="${r[d.key] * 100}" aria-label="Potencial de ${d.name.toLowerCase()}"></meter><small>${fmt(r[d.key] * 100, 0)}/100</small></button>`).join("")}<p>Potencial da geografia; não é produção instalada.</p><button class="secondary" data-invest-action="offers" data-invest-region="${i}">Desenvolver este estado ↗</button>`
      : "";
    panel.hidden = !economic;
    panel.innerHTML = economic
      ? `<div class="economic-panel-title"><span>RECURSOS DO TERRITÓRIO</span><button class="economic-close" data-trade-action="sector-map" data-sector="relevo" aria-label="Fechar camada de recursos">×</button></div><div class="economic-tabs">${sectors.map((d) => `<button data-trade-action="sector-map" data-sector="${d.key}" aria-pressed="${d.key === sector.key}" aria-label="Potencial de ${d.name.toLowerCase()}" title="${d.name}">${sectorIcon(d.key)}</button>`).join("")}</div><strong class="economic-sector-name">${sector.name} · potencial geográfico</strong><div class="economic-scale"><span>Menor potencial</span><i style="--sector:${sector.color}"></i><span>Maior</span></div><button class="secondary" data-view="comercio" aria-label="Produção e comércio"><span class="economic-link-full">Produção e comércio ↗</span><span class="economic-link-short" aria-hidden="true">Comércio ↗</span></button>`
      : "";
  }
  return { update, updateMap };
}
