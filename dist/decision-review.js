import { budget } from "./model.js";
export function withoutResponse(s) {
  const n = structuredClone(s),
    d = n.scheduledDecision;
  n.scheduledDecision = null;
  for (const p of d?.policyUpdates ?? [])
    if (n.policies[p.key] === p.after) n.policies[p.key] = p.before;
  return n;
}
export function decisionReview(s, n, without) {
  const d = s.scheduledDecision;
  if (!d) return null;
  const a = budget(s),
    b = budget(withoutResponse(s));
  return {
    id: d.id,
    quarter: n.quarter,
    key: d.key,
    title: d.title,
    choice: d.choice,
    region: d.region,
    cause: d.cause ?? null,
    costShare: d.effect.cost ?? 0,
    cost: (s.metrics.gdp * (d.effect.cost ?? 0)) / 100,
    annualSpending: ((a.spending - b.spending) * s.metrics.gdp) / 100,
    annualRevenue: ((a.revenue - b.revenue) * s.metrics.gdp) / 100,
    updates: d.policyUpdates ?? [],
    delta: Object.fromEntries(
      Object.keys(n.metrics)
        .filter((k) => Number.isFinite(without.metrics[k]))
        .map((k) => [k, n.metrics[k] - without.metrics[k]]),
    ),
    networks: structuredClone(n.systems?.response ?? []),
  };
}
