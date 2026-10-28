import { regionsOf, regionalMetrics } from "./model.js";
import {
  projectDefs,
  projectFor,
  activeInvestments,
  workRate,
  remainingTurns,
} from "./investment-ledger.js";
export function quoteInvestment(s, index, type) {
  const r = regionsOf(s)[index],
    def = projectFor(type);
  if (!Number.isInteger(index) || !r || !def)
    return {
      allowed: false,
      reason: "Escolha um estado e um programa válidos.",
    };
  const local = regionalMetrics(s, index),
    coverage = def.productive
      ? def.coverage
      : Math.min(def.coverage, Math.max(0.05, 1 - local.access / 100));
  const terrain = 1 + (r.terrain - 1) * 0.35,
    fraction = coverage / def.coverage;
  const cost = Math.max(
    0.001,
    Math.round(
      ((s.metrics.gdp * r.share * def.capital) / 100) *
        fraction *
        terrain *
        1000,
    ) / 1000,
  );
  const q = {
    region: index,
    regionName: r.name,
    type,
    name: def.name,
    coverage,
    people: s.metrics.population * r.share * coverage,
    regionShare: r.share,
    cost,
    upkeepAnnual: cost * def.upkeep,
    terrain,
    workRequired: def.work,
    work: 0,
    phase: "planning",
    fraction,
  };
  q.deliveryTurns = 1 + Math.ceil(def.work / workRate(s, q) - 1e-9);
  q.operationTurns = q.deliveryTurns + 1;
  q.benefits = {
    access: def.access * fraction,
    welfare: def.welfare * fraction,
    poverty: def.poverty * fraction,
    growth: def.growth * fraction,
  };
  q.reason =
    def.productive && !s.trade && !s.tradeSummary
      ? "Ative Produção e comércio antes de contratar um programa produtivo."
      : (s.investments ?? []).some((p) => p.region === index && p.type === type)
        ? "Este programa já foi contratado neste estado."
        : activeInvestments(s).length >= 3
          ? "As três vagas de implantação estão ocupadas. Aguarde uma entrega entrar em operação."
          : s.quarter + q.operationTurns > 160
            ? "Não há tempo estimado para iniciar a operação antes do limite de 40 anos."
            : "";
  q.allowed = !q.reason;
  return q;
}
export function startInvestment(s, index, type) {
  const q = quoteInvestment(s, index, type);
  if (!q.allowed) return s;
  const n = structuredClone(s);
  n.investments ??= [];
  const p = {
    id: `${s.seed}:${s.quarter}:${index}:${type}`,
    type,
    region: index,
    regionShare: q.regionShare,
    coverage: q.coverage,
    people: q.people,
    cost: q.cost,
    upkeepAnnual: q.upkeepAnnual,
    terrain: q.terrain,
    workRequired: q.workRequired,
    work: 0,
    paid: 0,
    phase: "planning",
    startedAt: s.quarter,
  };
  n.investments.push(p);
  return n;
}
export function cancelInvestment(s, id) {
  const p = s.investments?.find((p) => p.id === id);
  if (!p || p.phase !== "planning" || p.paid !== 0) return s;
  const n = structuredClone(s);
  n.investments = n.investments.filter((p) => p.id !== id);
  return n;
}
export function regionalNeeds(s) {
  return regionsOf(s)
    .map((r, index) => ({
      index,
      name: r.name,
      ...regionalMetrics(s, index),
      projects: (s.investments ?? []).filter((p) => p.region === index).length,
    }))
    .sort((a, b) => a.access - b.access || a.index - b.index);
}
export { projectDefs, remainingTurns };
