import { migrateConsequences } from "./consequences.js";
import { advanceGoals } from "./government-plan.js";
import { advance, budget, policyDefs, regionsOf } from "./model.js";
import {
  followupFor,
  crisisEffect,
  combineEffects,
  advanceCrisisTracks,
} from "./crisis-followup.js";
import { quarterDrivers, driverMetrics } from "./governance.js";

// Fictional game rules. Immediate effects last one turn; optional follow-ups are bounded.
// Emergency cost is charged once as a percentage of GDP.
const incidents = [
  {
    key: "security",
    title: "Comunidades pedem proteção",
    region: "Vale Central",
    detail:
      "A violência e a baixa confiança dificultam a resposta local. Escolha uma ação para o próximo trimestre.",
    eligible: (s) =>
      (s.metrics.crime ?? 45) > 50 || (s.metrics.trust ?? 55) < 45,
    choices: [
      {
        id: "investigate",
        label: "Reforçar perícia e atendimento às vítimas",
        detail:
          "Apoio temporário às investigações e à cooperação da população.",
        effect: { cost: 0.4, crime: -0.3, trust: 0.5 },
      },
      {
        id: "operation",
        label: "Realizar uma operação emergencial",
        detail:
          "Resposta imediata com custo de confiança. Não amplia a capacidade permanente.",
        effect: { cost: 0.25, crime: -0.5, trust: -1 },
      },
      {
        id: "wait",
        label: "Manter a estrutura atual",
        detail: "Sem gasto extraordinário; o trimestre absorve a pressão.",
        effect: { crime: 0.4, servicesPressure: 0.3 },
      },
    ],
  },
  {
    key: "water",
    title: "Reservatórios em baixa",
    region: "Campos do Norte",
    detail:
      "A falta de chuva ameaça a produção agrícola. As cidades pedem apoio para manter o abastecimento.",
    eligible: (s) =>
      s.external === "recessao" ||
      s.external === "sancoes" ||
      s.policies.infrastructure < 5,
    choices: [
      {
        id: "relief",
        label: "Financiar o abastecimento",
        detail: "Água e apoio emergencial às comunidades rurais.",
        effect: { cost: 0.6, growth: -0.2, inflation: 0.1, poverty: 0.1 },
      },
      {
        id: "ration",
        label: "Organizar o racionamento",
        detail:
          "Preserva as reservas, com interrupções na produção e no cotidiano.",
        effect: { cost: 0.1, growth: -0.5, welfare: -0.5 },
      },
      {
        id: "wait",
        label: "Manter o orçamento atual",
        detail: "Sem gasto extraordinário; o país absorve a perda de produção.",
        effect: { growth: -0.9, inflation: 0.4, poverty: 0.5, welfare: -0.4 },
      },
    ],
  },
  {
    key: "services",
    title: "Filas nos serviços públicos",
    region: "Fronteira Oeste",
    detail:
      "A rede de atendimento não acompanha a demanda. Equipes locais solicitaram reforço temporário.",
    eligible: (s) => s.capacity < 0.8 || s.policies.services < 10,
    choices: [
      {
        id: "teams",
        label: "Enviar equipes de reforço",
        detail: "Contratação temporária e ampliação dos atendimentos.",
        effect: { cost: 0.4, welfare: 0.7, poverty: -0.1 },
      },
      {
        id: "priority",
        label: "Priorizar os casos urgentes",
        detail:
          "Reorganiza a fila com uma equipe de triagem, sem ampliar a rede.",
        effect: { cost: 0.1, welfare: 0.1 },
      },
      {
        id: "wait",
        label: "Manter a operação atual",
        detail:
          "A demanda permanece na fila e reduz a qualidade percebida do serviço.",
        effect: { welfare: -0.6 },
      },
    ],
  },
  {
    key: "freight",
    title: "Entregas paradas no porto",
    region: "Costa Verde",
    detail:
      "Um gargalo no transporte atrasou insumos e exportações. O setor produtivo pede uma resposta do governo.",
    eligible: () => true,
    choices: [
      {
        id: "routes",
        label: "Abrir rotas alternativas",
        detail:
          "O governo cobre parte do custo de transporte por outras rotas.",
        effect: { cost: 0.5, growth: 0.2 },
      },
      {
        id: "shifts",
        label: "Reforçar os turnos do porto",
        detail: "Equipes temporárias reduzem parte do atraso.",
        effect: { cost: 0.2, growth: -0.2, inflation: 0.1 },
      },
      {
        id: "wait",
        label: "Aguardar a normalização",
        detail:
          "Sem gasto extra; atrasos afetam a atividade e os preços neste trimestre.",
        effect: { growth: -0.7, inflation: 0.3 },
      },
    ],
  },
  {
    key: "investment",
    title: "Uma fábrica procura endereço",
    region: "Terras do Sul",
    detail:
      "Um novo projeto industrial depende de conexões de energia e transporte. O investimento pode avançar com apoio público.",
    eligible: (s) => s.policies.infrastructure >= 3 && s.metrics.debt < 100,
    choices: [
      {
        id: "connect",
        label: "Financiar as conexões",
        detail: "Executar as obras permite antecipar a instalação da fábrica.",
        effect: { cost: 0.7, growth: 1, welfare: 0.2 },
      },
      {
        id: "coordinate",
        label: "Compartilhar a implantação",
        detail: "Apoio público menor, com um início de operação mais lento.",
        effect: { cost: 0.2, growth: 0.4 },
      },
      {
        id: "decline",
        label: "Dispensar o apoio público",
        detail:
          "O projeto não avança neste trimestre; o orçamento permanece disponível.",
        effect: {},
      },
    ],
  },
];
function incidentRegion(s, key) {
  const score = (r) =>
    key === "water"
      ? (r.sector.includes("Ag") ? 2 : 0) + r.terrain
      : key === "services"
        ? r.share / r.access
        : key === "freight"
          ? (r.sector.includes("Portos") ? 2 : 0) + r.access
          : r.share;
  return [...regionsOf(s)].sort((a, b) => score(b) - score(a))[0].name;
}
export function decisionFor(s) {
  const pending = s.pendingDecision;
  if (!pending) return null;
  const template = incidents.find((e) => e.key === pending.key);
  if (!template) return null;
  const { eligible, ...event } = template;
  return {
    ...structuredClone(event),
    choices: event.choices.map((c) => ({
      ...structuredClone(c),
      followup: followupFor(s, event.key, c.id),
    })),
    ...(s.territory ? { region: incidentRegion(s, event.key) } : {}),
    id: pending.id,
    quarter: pending.quarter,
  };
}
function nextDecision(s) {
  if (s.quarter >= 160 || s.quarter % 3 !== 1) return null;
  const eligible = incidents.filter((e) => e.eligible(s));
  const previous = s.decisionLog?.at(-1)?.key;
  const pool = eligible.filter((e) => e.key !== previous);
  const options = pool.length ? pool : eligible;
  const event = options[(s.seed + Math.floor(s.quarter / 3)) % options.length];
  return {
    key: event.key,
    id: `${s.seed}:${s.quarter}:${event.key}`,
    quarter: s.quarter,
  };
}
export function resolveDecision(s, eventId, choiceId) {
  const event = decisionFor(s);
  const choice = event?.choices.find((c) => c.id === choiceId);
  if (!choice || event.id !== eventId) return s;
  const n = structuredClone(s);
  n.pendingDecision = null;
  n.scheduledDecision = {
    id: event.id,
    key: event.key,
    title: event.title,
    region: event.region,
    choice: choice.label,
    effect: choice.effect,
    followup: followupFor(s, event.key, choice.id),
    chosenAt: s.quarter,
  };
  n.decisionLog = [...(s.decisionLog ?? []), n.scheduledDecision].slice(-160);
  n.events = n.events.map((item) =>
    item.title === event.title
      ? {
          ...item,
          detail: `Resposta escolhida: ${choice.label}. Será executada no próximo trimestre.`,
        }
      : item,
  );
  return n;
}
export function projectQuarter(s) {
  if (s.quarter >= 160) return s;
  const n = advance(
    s,
    combineEffects(s.scheduledDecision?.effect, crisisEffect(s)),
  );
  advanceCrisisTracks(s, n);
  return n;
}
function trajectory(s, horizon) {
  let n = structuredClone(s);
  for (let i = 0; i < horizon; i++) {
    n = projectQuarter(n);
    n.scheduledDecision = null;
  }
  return n;
}
export function forecastPolicies(s) {
  const baseline = s.policyBaseline ?? s.policies;
  const horizon = Math.min(4, Math.max(0, 160 - s.quarter));
  const changed = trajectory(s, horizon),
    unchanged = trajectory({ ...s, policies: { ...baseline } }, horizon);
  const currentBudget = budget(s),
    oldBudget = budget({ ...s, policies: baseline });
  return {
    horizon,
    toQuarter: s.quarter + horizon,
    changes: policyDefs
      .filter((p) => s.policies[p.key] !== baseline[p.key])
      .map((p) => ({
        key: p.key,
        name: p.name,
        before: baseline[p.key],
        after: s.policies[p.key],
      })),
    annualCost: currentBudget.spending - oldBudget.spending,
    annualRevenue: currentBudget.revenue - oldBudget.revenue,
    next: projectQuarter(s).metrics,
    current: changed.metrics,
    baseline: unchanged.metrics,
    delta: Object.fromEntries(
      driverMetrics.map((k) => [k, changed.metrics[k] - unchanged.metrics[k]]),
    ),
  };
}
export function advanceTurn(s) {
  if (s.quarter >= 160 || decisionFor(s)) return s;
  s = migrateConsequences(s);
  const n = projectQuarter(s);
  const baseline = s.policyBaseline ?? s.policies;
  n.lastReport = {
    quarter: n.quarter,
    before: { ...s.metrics },
    after: { ...n.metrics },
    expected: { ...n.metrics },
    changes: policyDefs
      .filter((p) => s.policies[p.key] !== baseline[p.key])
      .map((p) => ({
        key: p.key,
        name: p.name,
        before: baseline[p.key],
        after: s.policies[p.key],
      })),
    decision: s.scheduledDecision ?? null,
    drivers: quarterDrivers(s, n),
    policiesBefore: { ...baseline },
  };
  n.policyBaseline = { ...n.policies };
  n.scheduledDecision = null;
  if (s.scheduledDecision)
    n.events.push({
      title: `Executado: ${s.scheduledDecision.choice}`,
      detail: `${s.scheduledDecision.title}. Custo extraordinário: ${(s.scheduledDecision.effect.cost ?? 0).toFixed(1).replace(".", ",")}% do PIB, financiado por dívida uma única vez.`,
    });
  for (const c of n.crisisReport ?? [])
    n.events.push({
      title: `${c.remaining ? "Em acompanhamento" : "Acompanhamento concluído"}: ${c.title}`,
      detail: c.remaining
        ? `${c.remaining} trimestre de efeitos posteriores ainda previsto. Não há nova cobrança emergencial.`
        : "Os efeitos extraordinários deste acompanhamento terminaram.",
    });
  if (n.quarter % 16 === 0)
    n.events.unshift({
      title: `Ciclo de governo ${n.quarter / 16} encerrado`,
      detail:
        "Consulte o balanço no Plano de governo. O país continua com o mesmo histórico.",
    });
  n.pendingDecision = nextDecision(n);
  const event = decisionFor(n);
  if (event)
    n.events.unshift({
      title: event.title,
      detail: `${event.region}: há uma decisão aguardando sua escolha. O efeito entra no próximo trimestre.`,
    });
  return advanceGoals(s, n);
}
