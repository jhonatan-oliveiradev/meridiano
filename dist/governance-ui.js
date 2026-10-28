import {
  societyGroups,
  cabinetProposals,
  governmentCycles,
  driverMetrics,
} from "./governance.js";
import { crisisTracks, crisisNames } from "./crisis-followup.js";
import { forecastPolicies } from "./simulation.js";
import { publicWorks } from "./public-works.js";
import { regionsOf } from "./model.js";

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n, d = 2) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d }).format(n);
const signed = (n) =>
  `${n > 0 ? "+" : ""}${fmt(Math.abs(n) < 0.000001 ? 0 : n, 3)}`;
const period = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
const labels = {
  gdp: "PIB",
  unemployment: "Desemprego",
  inflation: "Inflação",
  approval: "Aprovação nacional",
  investigation: "Capacidade de investigação",
  preventionCapacity: "Rede de prevenção",
  reportedCrime: "Ocorrências registradas",
  poverty: "Pobreza",
  welfare: "Bem-estar",
  debt: "Dívida / PIB",
  crime: "Violência",
  trust: "Confiança na polícia",
  servicesPressure: "Pressão nos serviços",
};
const unit = (k) =>
  ["poverty", "debt", "unemployment", "inflation"].includes(k)
    ? "p.p."
    : k === "gdp"
      ? "bi M$"
      : "pontos";

export function renderQuarterExplanation(s) {
  const r = s.lastReport;
  if (!r?.drivers)
    return '<p class="governance-note">A decomposição aparece no próximo trimestre avançado nesta versão.</p>';
  return `<section class="quarter-explanation"><h4>O que moveu os números</h4><p>Abra um indicador para conferir a composição da mudança.</p>${driverMetrics.map((k) => `<details data-explain="${k}"><summary>${labels[k]} <strong>${signed(r.after[k] - r.before[k])} ${unit(k)}</strong></summary><div class="governance-table"><table><caption>${labels[k]} · ${period(r.quarter)}</caption><thead><tr><th>Fator</th><th>Contribuição</th></tr></thead><tbody>${r.drivers.map((d) => `<tr><th scope="row">${esc(d.name)}</th><td>${signed(d.delta[k])} ${unit(k)}</td></tr>`).join("")}</tbody><tfoot><tr><th>Total no trimestre</th><td>${signed(r.after[k] - r.before[k])} ${unit(k)}</td></tr></tfoot></table></div></details>`).join("")}<p class="governance-note">Comparação sequencial das regras do jogo: contexto → ajustes → programas → produção e comércio → acompanhamento → resposta. As parcelas somam a mudança; como os efeitos interagem, sua distribuição depende dessa ordem. Valores exibidos são arredondados. Não é uma estimativa causal do mundo real.</p></section>`;
}
export function initGovernanceUI({
  getState,
  setState,
  openModal,
  closeModal,
  notify,
  getCities,
  selectRegion,
  setView,
}) {
  const review = document.createElement("section");
  review.className = "governance-board";
  review.id = "governanceReview";
  review.setAttribute("aria-label", "Consequências e população");
  document.querySelector("#quarterReview").after(review);
  const council = document.createElement("section");
  council.className = "governance-board council-board";
  council.id = "cabinetCouncil";
  council.setAttribute("aria-label", "Reunião do gabinete");
  document.querySelector("#cabinetScope").after(council);
  const cycles = document.createElement("section");
  cycles.className = "governance-board";
  cycles.id = "governmentCycles";
  cycles.setAttribute("aria-label", "Ciclos de governo");
  document.querySelector("#planArchive").after(cycles);
  const ns = "http://www.w3.org/2000/svg",
    works = document.createElementNS(ns, "g");
  works.id = "publicWorks";
  works.setAttribute("clip-path", "url(#landClip)");
  document.querySelector("#investmentMarkers").before(works);
  let pending = null;
  function showProposal(key) {
    const s = getState(),
      p = cabinetProposals(s).find((p) => p.key === key);
    if (!p?.available) return;
    const f = forecastPolicies({
      ...s,
      policies: { ...s.policies, [p.key]: p.value },
      policyBaseline: { ...s.policies },
    });
    pending = { ...p, seed: s.seed, quarter: s.quarter };
    openModal(
      `<div class="cycle-dialog"><span class="eyebrow">PROPOSTA DE ${esc(p.name.toUpperCase())} · ${esc(p.area)}</span><h3 id="modalTitle">${esc(p.label)}</h3><p>${esc(p.why)}</p><p><b>Ajuste:</b> ${fmt(p.before)} → ${fmt(p.value)} % do PIB ${p.key === "tax" ? "arrecadado" : "ao ano"}.</p><div class="proposal-tradeoff">${esc(p.tradeoff)}</div><p>Comparação até ${period(f.toQuarter)}, mantendo as demais políticas. Inclui respostas já escolhidas e acompanhamentos conhecidos; não prevê novos acontecimentos.</p><div class="governance-table"><table><thead><tr><th>Indicador</th><th>Diferença frente a manter o ajuste atual</th></tr></thead><tbody>${driverMetrics.map((k) => `<tr><th scope="row">${labels[k]}</th><td>${signed(f.delta[k])} ${unit(k)}</td></tr>`).join("")}</tbody></table></div><p>Variação da despesa anual: ${signed(f.annualCost)}% do PIB. Variação da receita anual: ${signed(f.annualRevenue)}% do PIB.</p><p class="governance-note">A proposta só altera a política se você confirmar. Os efeitos entram ao avançar o trimestre. Não contrata projetos automaticamente.</p><div class="modal-actions"><button class="secondary" data-close>Manter como está</button><button class="primary" data-game-action="apply-proposal">Aplicar ajuste</button></div></div>`,
    );
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-game-action]");
    if (!b) return;
    if (b.dataset.gameAction === "proposal") showProposal(b.dataset.policy);
    if (b.dataset.gameAction === "apply-proposal") {
      const s = getState(),
        p = pending;
      if (
        !p ||
        p.seed !== s.seed ||
        p.quarter !== s.quarter ||
        s.policies[p.key] !== p.before
      ) {
        notify("O cenário mudou. Compare a proposta novamente.");
        closeModal();
        return;
      }
      const n = structuredClone(s);
      n.policyBaseline ??= { ...s.policies };
      n.policies[p.key] = p.value;
      pending = null;
      setState(n);
      closeModal();
      setView("politicas");
      notify(`${p.label}: ajuste preparado para o próximo trimestre.`);
    }
  });
  works.addEventListener("keydown", (e) => {
    const target = e.target.closest("[data-invest-region]");
    if (target && ["Enter", " "].includes(e.key)) {
      e.preventDefault();
      setView("territorio");
      selectRegion(Number(target.dataset.investRegion));
    }
  });
  function mapWorks(s) {
    const phase = {
      planning: "Planejamento",
      building: "Em construção",
      ready: "Obra entregue",
      operating: "Em operação",
    };
    const symbols = {
      water: "≈",
      health: "+",
      education: "Aa",
      transport: "↔",
      agriculture: "✳",
      energy: "ϟ",
      mining: "◆",
      industry: "▦",
    };
    works.innerHTML = publicWorks(s, getCities())
      .map(
        (p) =>
          `<g class="public-work ${p.phase === "operating" ? "is-operating" : "is-building"}" data-invest-action="locate" data-invest-region="${p.region}" role="button" tabindex="0" aria-label="${esc(p.name)}: ${phase[p.phase]}, ${esc(regionsOf(s)[p.region].name)}"><title>${esc(p.name)} · ${phase[p.phase]} · representação esquemática</title>${p.path.length ? `<path class="public-link" d="${p.path.map((xy, i) => `${i ? "L" : "M"}${xy[0]},${xy[1]}`).join("")}"/>` : ""}<g transform="translate(${p.x},${p.y})"><rect x="-10" y="-10" width="20" height="20" rx="5"/><text text-anchor="middle" dy="3.5">${symbols[p.type]}</text></g></g>`,
      )
      .join("");
  }
  function update() {
    const s = getState(),
      groups = societyGroups(s),
      previous = s.lastReport?.policiesBefore
        ? societyGroups({
            ...s,
            metrics: s.lastReport.before,
            policies: s.lastReport.policiesBefore,
          })
        : null;
    const opened = new Set(
      [...review.querySelectorAll("details[open]")].map(
        (d) => d.dataset.explain,
      ),
    );
    const tracks = crisisTracks(s);
    review.innerHTML = `<span class="eyebrow">DECISÕES E CONSEQUÊNCIAS</span>${renderQuarterExplanation(s)}<section class="society-section"><h4>Como a população percebe o governo</h4><p>Índices sintéticos de apoio, de 0 a 100. Grupos se sobrepõem e não representam intenção de voto nem parcelas da população.</p><div class="society-grid">${groups
      .map((g) => {
        const before = previous?.find((p) => p.id === g.id)?.support;
        return `<article><h5>${esc(g.name)}</h5><strong>${g.support}<small>/100</small></strong><meter min="0" max="100" value="${g.support}" aria-label="Apoio estimado: ${esc(g.name)}"></meter><p>${esc(g.priority)}</p>${before !== undefined ? `<span>${signed(g.support - before)} pontos frente ao início do trimestre</span>` : ""}</article>`;
      })
      .join(
        "",
      )}</div><p class="governance-note">Essas perspectivas orientam o gabinete. A aprovação nacional continua sendo calculada pelo motor existente.</p></section><section class="crisis-tracker"><h4>Efeitos que continuam</h4>${tracks.length ? tracks.map((p) => `<article><b>${crisisNames[p.key]}</b><span>${p.remaining} trimestre${p.remaining === 1 ? "" : "s"} de acompanhamento · sem nova cobrança emergencial</span><small>Impactos adversos a ${fmt(p.strength * 100, 0)}% da referência após considerar a preparação. Benefícios por trimestre são preservados.</small></article>`).join("") : "<p>Nenhum acontecimento com efeitos posteriores em andamento.</p>"}${(
      s.crisisReport ?? []
    )
      .filter((p) => p.remaining === 0)
      .map((p) => `<p>Acompanhamento concluído: ${esc(p.title)}.</p>`)
      .join("")}</section>`;
    review
      .querySelectorAll("details")
      .forEach((d) => (d.open = opened.has(d.dataset.explain)));
    const priority = [...groups].sort((a, b) => a.support - b.support)[0];
    council.innerHTML = `<details><summary>Reunião do gabinete <span>4 alternativas para comparar</span></summary><p><b>Nilo:</b> a menor leitura de apoio está entre ${esc(priority.name.toLowerCase())}. A prioridade desse grupo é ${esc(priority.priority.toLowerCase())}. Compare as propostas antes de escolher.</p><div class="council-grid">${cabinetProposals(
      s,
    )
      .map(
        (p) =>
          `<article><span>${p.name} · ${p.area}</span><h5>${p.label}</h5><p>${p.why}</p><small>${p.tradeoff}</small><button class="secondary" data-game-action="proposal" data-policy="${p.key}" ${p.available ? "" : "disabled"}>${p.available ? "Comparar proposta ↗" : "Política no limite atual"}</button></article>`,
      )
      .join(
        "",
      )}</div><p class="governance-note">Propostas calculadas localmente pelo jogo, sem consulta à IA. As alternativas são independentes e não alteram o país até confirmação.</p></details>`;
    cycles.innerHTML = `<span class="eyebrow">HISTÓRICO DE GOVERNO</span><h4>Ciclos de quatro anos</h4><p>Um ciclo administrativo tem 16 trimestres. Seu encerramento não interrompe o país e não representa uma eleição.</p>${governmentCycles(
      s,
    )
      .reverse()
      .map(
        (c) =>
          `<details ${c.number === Math.max(1, Math.ceil(s.quarter / 16)) ? "open" : ""}><summary>Ciclo ${c.number} · ${c.complete ? "concluído" : "em andamento"}<span>${period(c.start)} → ${period(c.end)}</span></summary>${
            c.before && c.after
              ? `<div class="governance-table"><table><thead><tr><th>Indicador</th><th>Início</th><th>${c.complete ? "Encerramento" : "Atual"}</th></tr></thead><tbody>${driverMetrics
                  .filter(
                    (k) =>
                      Number.isFinite(c.before[k]) &&
                      Number.isFinite(c.after[k]),
                  )
                  .map(
                    (k) =>
                      `<tr><th scope="row">${labels[k]} (${k === "gdp" ? "bi M$" : ["poverty", "debt", "unemployment", "inflation"].includes(k) ? "%" : "/100"})</th><td>${fmt(c.before[k])}</td><td>${fmt(c.after[k])}</td></tr>`,
                  )
                  .join("")}</tbody></table></div>`
              : "<p>O histórico salvo não tem todos os dados deste ciclo. Não foi reconstruído um ponto de partida fictício.</p>"
          }<p>${c.programs} programa${c.programs === 1 ? "" : "s"} entrou${c.programs === 1 ? "" : "ram"} em operação neste ciclo.</p>${c.goals.length ? `<ul>${c.goals.map((g) => `<li>${esc(g.label)} · meta ${fmt(g.target)} · ${esc(g.status)}</li>`).join("")}</ul>` : "<p>Nenhuma meta registrada para este ciclo.</p>"}${c.challenges?.length ? `<p><b>Alertas no balanço:</b> ${c.challenges.map(esc).join("; ")}.</p>` : c.challenges ? "<p>Nenhum dos quatro alertas de dívida, pobreza, violência e pressão nos serviços foi acionado no fechamento atual.</p>" : ""}${c.complete ? "<p>O próximo avanço continua o governo com o mesmo país, programas e histórico.</p>" : ""}</details>`,
      )
      .join("")}`;
    mapWorks(s);
  }
  return { update };
}
