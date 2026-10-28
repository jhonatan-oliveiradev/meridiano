import { createSystems, validSystems, eventCandidates } from "./systems.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n, d = 1) =>
  Number.isFinite(n)
    ? new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d }).format(n)
    : "—";
const period = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
export function initSystemsUI({ getState }) {
  const root = document.querySelector("#systemsContent");
  let index = 0;
  function update() {
    const s = getState(),
      active = validSystems(s.systems),
      networks = active ? s.systems : createSystems(s);
    if (!networks) {
      root.innerHTML =
        '<div class="systems-empty"><h3>Redes e abastecimento</h3><p>Este cenário conserva o modelo anterior. Ative a produção para começar a apuração de água, energia e logística a partir do próximo trimestre, preservando o histórico.</p><button class="primary" data-view="comercio">Abrir produção e comércio ↗</button></div>';
      return;
    }
    index = Math.min(index, networks.regions.length - 1);
    const r = networks.regions[index];
    const impact = (
      Array.isArray(networks.response) ? networks.response : []
    ).find((x) => x.region === index);
    const candidates = eventCandidates(s),
      memory = (s.eventMemory ?? []).slice(-10).reverse();
    const card = (title, value, unit, text, details) =>
      `<article class="system-card"><span class="eyebrow">${title}</span><strong>${value}<small>${unit}</small></strong><p>${text}</p><dl>${details.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl></article>`;
    root.innerHTML = `<header class="systems-heading"><div><span class="eyebrow">SALA DE SITUAÇÃO · ${period(s.quarter)}</span><h3>Redes e abastecimento</h3><p>O que o território suporta e onde a demanda está ultrapassando a estrutura.</p></div><button class="secondary" data-view="territorio">Voltar ao mapa ↗</button></header><div class="systems-toolbar"><label for="systemsStateSelect">Estado<select id="systemsStateSelect">${networks.regions.map((x, i) => `<option value="${i}" ${i === index ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label><button class="secondary" data-invest-action="offers" data-invest-region="${index}">Planejar investimento ↗</button></div><p class="systems-note">${active ? `Apuração de ${period(networks.quarter)}. Redes acompanhadas desde ${period(networks.startedAt)}.` : "Ponto de partida das redes. O primeiro balanço será calculado ao avançar o trimestre."} Unidades de água e rede são sintéticas; UP são as unidades produtivas do comércio.</p>${impact ? `<div class="network-response"><b>O que a resposta mudou neste trimestre</b><p>Com a mesma chuva, demanda e estrutura: água ${fmt(impact.waterBefore * 100, 0)}% sem a medida → ${fmt(impact.waterAfter * 100, 0)}% com a medida; reserva ${fmt(impact.reserveBefore)} → ${fmt(impact.reserveAfter)} u.a.; energia ${fmt(impact.energyBefore * 100, 0)}% → ${fmt(impact.energyAfter * 100, 0)}%; condição da rede ${fmt(impact.gridBefore, 0)} → ${fmt(impact.gridAfter, 0)}/100; fila ${fmt(impact.backlogBefore, 0)} → ${fmt(impact.backlogAfter, 0)}/200.${impact.installation ? " Uma implantação privada foi iniciada; a capacidade entra após o prazo." : ""}</p></div>` : ""}<div class="systems-grid">${card(
      "ÁGUA",
      fmt(r.waterService * 100, 0),
      "% atendido",
      r.waterService < 0.95
        ? "A falta de água limita a agricultura e pressiona os serviços."
        : "A demanda foi atendida; acompanhe a reserva para atravessar períodos secos.",
      [
        [
          "Reserva / capacidade",
          `${fmt(r.water)} / ${fmt(r.storageCapacity)} u.a.`,
        ],
        [
          "Chuva / referência",
          active ? `${fmt(r.rain * 100, 0)}%` : "Primeiro balanço pendente",
        ],
        ["Entrada + apoio", `${fmt(r.inflow)} + ${fmt(r.relief)} u.a.`],
        ["Consumo / demanda", `${fmt(r.used)} / ${fmt(r.need)} u.a.`],
        ["Excedente vertido", `${fmt(r.spill)} u.a.`],
      ],
    )}${card(
      "REDE ELÉTRICA",
      fmt(r.energyService * 100, 0),
      "% atendido",
      r.energyService < 0.95
        ? "A rede limita a produção de manufaturas, minerais e parte da agricultura."
        : "A rede atende a demanda atual; novas instalações aumentam o consumo.",
      [
        [
          "Carga / capacidade",
          `${fmt(r.energyDemand, 2)} / ${fmt(r.energyCapacity, 2)} u.r.`,
        ],
        ["Condição da rede", `${fmt(r.grid, 0)}/100`],
        [
          "Manutenção",
          `Política de infraestrutura: ${fmt(s.policies.infrastructure)}% do PIB`,
        ],
      ],
    )}${card(
      "LOGÍSTICA",
      fmt(r.backlog, 0),
      "/200 de fila",
      r.backlog > 20
        ? "A carga acumulada limita o escoamento das exportações; a fila continua no próximo trimestre."
        : "Sem acúmulo relevante. A capacidade livre ajuda a atrair produção.",
      [
        ["Carga do trimestre anterior", `${fmt(r.load, 2)} UP`],
        ["Capacidade do trimestre", `${fmt(r.transportCapacity, 2)} UP`],
        [
          "Uso da capacidade",
          `${fmt(((r.load ?? 0) / Math.max(0.001, r.transportCapacity ?? 1)) * 100, 0)}%`,
        ],
      ],
    )}${card(
      "OPORTUNIDADES",
      fmt(r.readyStreak ?? 0, 0),
      " trimestres estáveis",
      "Água, energia e logística confiáveis podem habilitar apoio à expansão privada. A produção precisa de insumos e compradores.",
      [
        [
          "Ampliação privada em operação",
          `${fmt((r.privateCapacity ?? 0) * 100, 0)}% em manufaturas`,
        ],
        [
          "Implantação apoiada",
          r.pipeline
            ? `${r.pipeline.remaining} trimestre(s) restante(s)`
            : "Nenhuma em andamento",
        ],
        ["Condição mínima", "3 trimestres de redes estáveis"],
      ],
    )}</div><section class="systems-watch"><h4>Pressões e oportunidades elegíveis</h4>${s.pendingDecision ? '<p>Há uma decisão aguardando sua resposta.</p><button class="secondary" data-cycle-action="decision">Revisar decisão pendente ↗</button>' : ""}${candidates.length ? candidates.map((e) => `<article><span>${e.opportunity ? "OPORTUNIDADE" : "ATENÇÃO"} · ${esc(e.regionName)}</span><p>${esc(e.cause)}</p></article>`).join("") : "<p>Nenhum novo acontecimento elegível neste trimestre. Problemas recentes têm intervalo de repetição; acompanhe as redes acima.</p>"}</section><section class="systems-history"><h4>Memória dos acontecimentos</h4>${
      memory.length
        ? memory
            .map((e) => {
              const response = (s.decisionLog ?? []).find((d) => d.id === e.id);
              return `<article><span>${period(e.quarter)} · ${esc(e.regionName ?? "País")}</span><p>${esc(e.cause ?? e.key)}</p><small>${response ? `Resposta: ${esc(response.choice)}` : "Decisão apresentada ao governo"}</small></article>`;
            })
            .join("")
        : "<p>Os próximos acontecimentos guardarão a causa e a resposta escolhida aqui.</p>"
    }</section><details class="systems-method"><summary>Histórico das redes e regras</summary><p>A chuva varia por semente, ano e estação; recessão e sanções não provocam seca. Água de entrada e apoio é consumida, armazenada ou vertida. Obras de água ampliam reserva e eficiência quando entram em operação. Energia depende de capacidade e manutenção; produção industrial aumenta a carga. A carga logística vem dos fluxos do trimestre anterior, com maior concentração nas conexões costeiras. Obras e turnos temporários ampliam a capacidade; filas acumulam até serem escoadas.</p><p>Uma nova ocorrência precisa de pressão observada. O mesmo assunto tem intervalo mínimo de seis trimestres; oportunidades, doze. Há no máximo uma nova decisão a cada dois trimestres. Esses intervalos evitam avisos repetidos, mas não apagam uma restrição ativa. Valores e relações são regras de jogo, sem calibração empírica.</p><div class="governance-table"><table><thead><tr><th>Trimestre</th><th>Água atendida</th><th>Energia atendida</th><th>Fila média</th></tr></thead><tbody>${(
      networks.history ?? []
    )
      .slice(-12)
      .map(
        (h) =>
          `<tr><th>${period(h.quarter)}</th><td>${fmt(h.water * 100, 0)}%</td><td>${fmt(h.energy * 100, 0)}%</td><td>${fmt(h.backlog, 0)}/200</td></tr>`,
      )
      .join("")}</tbody></table></div></details>`;
    document.querySelector("#systemsStateSelect").onchange = (e) => {
      index = Number(e.target.value);
      update();
      document.querySelector("#systemsStateSelect").focus();
    };
  }
  return { update };
}
