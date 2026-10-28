import { preventionAt } from "./prevention.js";
// Fictional, bounded continuations. No recurring emergency charge.
const tails = {
  water: {
    wait: { growth: -0.35, inflation: 0.2, poverty: 0.15, welfare: -0.2 },
    ration: { growth: -0.15, welfare: -0.1 },
    relief: { growth: -0.05, welfare: 0.1 },
  },
  services: {
    wait: { welfare: -0.3, servicesPressure: 0.3 },
    priority: { welfare: 0.05 },
    teams: { welfare: 0.3, servicesPressure: -0.4 },
  },
  freight: {
    wait: { growth: -0.3, inflation: 0.15 },
    shifts: { growth: -0.05 },
    routes: { growth: 0.15 },
  },
  investment: {
    connect: { growth: 0.35 },
    coordinate: { growth: 0.15 },
    decline: {},
  },
  security: {
    investigate: { crime: -0.2, trust: 0.25 },
    operation: { crime: -0.1, trust: -0.4 },
    wait: { crime: 0.25, servicesPressure: 0.1 },
  },
};
export const crisisNames = {
  water: "Reservatórios em baixa",
  services: "Filas nos serviços públicos",
  freight: "Entregas paradas no porto",
  investment: "Instalação industrial",
  security: "Proteção das comunidades",
};
const relevant = {
  water: ["water"],
  services: ["health", "education"],
  freight: ["transport"],
  investment: ["transport"],
  security: [],
};
export function followupFor(s, key, choiceId, region) {
  if (!tails[key]?.[choiceId] || !Object.keys(tails[key][choiceId]).length)
    return null;
  const network = (s.investments ?? []).some(
    (p) =>
      p.phase === "operating" &&
      relevant[key].includes(p.type) &&
      (region === undefined || p.region === region),
  );
  const capacity = Math.max(0.35, Math.min(0.95, s.capacity ?? 0.65));
  const local = Number.isInteger(region) ? preventionAt(s, key, region) : null;
  const strength = local
    ? Math.max(0.35, 1 - local.protection)
    : Math.max(0.35, 1 - (capacity - 0.35) * 0.5 - (network ? 0.3 : 0));
  return { key, choiceId, strength, turns: strength < 0.6 ? 1 : 2 };
}
export function crisisTracks(s) {
  if (!Array.isArray(s.crisisTracks)) return [];
  return s.crisisTracks
    .slice(0, 8)
    .filter(
      (p) =>
        p &&
        typeof p.id === "string" &&
        p.id.startsWith(`${s.seed}:`) &&
        p.id.length < 80 &&
        tails[p.key]?.[p.choiceId] &&
        Number.isInteger(p.remaining) &&
        p.remaining > 0 &&
        p.remaining <= 2 &&
        Number.isFinite(p.strength) &&
        p.strength >= 0.35 &&
        p.strength <= 1 &&
        Number.isInteger(p.startedAt) &&
        p.startedAt >= 0 &&
        p.startedAt <= s.quarter,
    );
}
export function trackEffect(p) {
  return Object.fromEntries(
    Object.entries(tails[p.key]?.[p.choiceId] ?? {}).map(([k, v]) => [
      k,
      v *
        (["growth", "welfare", "trust"].includes(k)
          ? v < 0
            ? p.strength
            : 1
          : v > 0
            ? p.strength
            : 1),
    ]),
  );
}
export function combineEffects(...items) {
  const out = {};
  for (const e of items)
    for (const [k, v] of Object.entries(e ?? {}))
      if (
        [
          "cost",
          "growth",
          "inflation",
          "poverty",
          "welfare",
          "crime",
          "trust",
          "servicesPressure",
        ].includes(k) &&
        Number.isFinite(v)
      )
        out[k] = (out[k] ?? 0) + v;
  return out;
}
export function crisisEffect(s) {
  return combineEffects(...crisisTracks(s).map(trackEffect));
}
export function advanceCrisisTracks(s, n) {
  const previous = crisisTracks(s);
  n.crisisReport = previous.map((p) => ({
    title: crisisNames[p.key],
    effect: trackEffect(p),
    remaining: p.remaining - 1,
  }));
  n.crisisTracks = previous
    .filter((p) => p.remaining > 1)
    .map((p) => ({ ...p, remaining: p.remaining - 1 }));
  const d = s.scheduledDecision,
    f = d?.followup;
  if (
    f &&
    tails[f.key]?.[f.choiceId] &&
    Number.isFinite(f.strength) &&
    f.strength >= 0.35 &&
    f.strength <= 1 &&
    [1, 2].includes(f.turns) &&
    n.quarter < 160
  ) {
    const entry = {
      ...f,
      id: d.id,
      startedAt: n.quarter,
      remaining: Math.min(f.turns, 160 - n.quarter),
    };
    if (!n.crisisTracks.some((p) => p.id === entry.id))
      n.crisisTracks.push(entry);
  }
}
