// Fictional public-program rules. Money is billions of M$, never real-world estimates.
export const projectDefs = [
  {
    key: "water",
    name: "Água e saneamento",
    short: "Saneamento",
    detail: "Ampliação das redes de água e esgoto nas comunidades atendidas.",
    coverage: 0.35,
    capital: 2.4,
    upkeep: 0.035,
    work: 3,
    access: 8,
    welfare: 3,
    poverty: 1.2,
    growth: 0,
  },
  {
    key: "health",
    name: "Atenção básica",
    short: "Saúde",
    detail: "Unidades e equipes para atendimento próximo de casa.",
    coverage: 0.3,
    capital: 1.8,
    upkeep: 0.09,
    work: 2,
    access: 6,
    welfare: 4,
    poverty: 0.5,
    growth: 0,
  },
  {
    key: "education",
    name: "Escolas e formação",
    short: "Educação",
    detail: "Vagas, equipamentos e formação de equipes na rede de ensino.",
    coverage: 0.25,
    capital: 2,
    upkeep: 0.07,
    work: 4,
    access: 4,
    welfare: 2,
    poverty: 0.7,
    growth: 0.3,
  },
  {
    key: "transport",
    name: "Mobilidade regional",
    short: "Mobilidade",
    detail: "Conexões e transporte público entre os centros do estado.",
    coverage: 0.4,
    capital: 3.2,
    upkeep: 0.04,
    work: 5,
    access: 7,
    welfare: 1.5,
    poverty: 0.3,
    growth: 0.5,
  },
];
export const projectFor = (key) => projectDefs.find((p) => p.key === key);
export const activeInvestments = (s) =>
  (s.investments ?? []).filter((p) => p.phase !== "operating");
export const workRate = (s, p) =>
  Math.max(0.35, Math.min(0.95, s.capacity)) / 0.65 / p.terrain;
export function projectProgress(p) {
  return p.phase === "planning"
    ? 0
    : p.phase === "ready" || p.phase === "operating"
      ? 1
      : 0.1 + (0.9 * p.work) / p.workRequired;
}
export function remainingTurns(s, p) {
  if (p.phase === "operating") return 0;
  if (p.phase === "ready") return 1;
  return (
    (p.phase === "planning" ? 1 : 0) +
    Math.ceil(Math.max(0, p.workRequired - p.work - 1e-9) / workRate(s, p)) +
    1
  );
}
function nextProject(s, p) {
  const n = { ...p };
  let construction = 0,
    upkeep = 0;
  if (p.phase === "planning") {
    n.phase = "building";
    n.paid = p.cost * 0.1;
    construction = n.paid;
  } else if (p.phase === "building") {
    n.work = Math.min(p.workRequired, p.work + workRate(s, p));
    if (p.workRequired - n.work < 1e-9) n.work = p.workRequired;
    n.paid =
      n.work === p.workRequired
        ? p.cost
        : p.cost * (0.1 + (0.9 * n.work) / p.workRequired);
    construction = n.paid - p.paid;
    if (n.work === p.workRequired) {
      n.phase = "ready";
      n.completedAt = s.quarter + 1;
    }
  } else if (p.phase === "ready" || p.phase === "operating") {
    upkeep = p.upkeepAnnual / 4;
    n.phase = "operating";
    n.operatingAt ??= s.quarter + 1;
  }
  return { project: n, construction, upkeep };
}
export function investmentFinance(s) {
  return (s.investments ?? []).reduce(
    (sum, p) => {
      const next = nextProject(s, p);
      sum.constructionQuarter += next.construction;
      sum.upkeepQuarter += next.upkeep;
      sum.upkeepAnnualCommitted += p.upkeepAnnual;
      sum.remainingCapital += p.cost - p.paid;
      return sum;
    },
    {
      constructionQuarter: 0,
      upkeepQuarter: 0,
      upkeepAnnualCommitted: 0,
      remainingCapital: 0,
    },
  );
}
export function advanceInvestments(s) {
  if (!s.investments?.length) return;
  const events = [];
  s.investments = s.investments.map((p) => {
    const next = nextProject(s, p).project;
    if (next.phase !== p.phase)
      events.push({
        id: p.id,
        type: p.type,
        region: p.region,
        phase: next.phase,
      });
    return next;
  });
  return events;
}
export function investmentEffects(s, region) {
  const out = { access: 0, welfare: 0, poverty: 0, growth: 0 };
  for (const p of s.investments ?? []) {
    if (
      p.phase !== "operating" ||
      (region !== undefined && p.region !== region)
    )
      continue;
    const def = projectFor(p.type);
    if (!def) continue;
    const weight =
      (p.coverage / def.coverage) * (region === undefined ? p.regionShare : 1);
    for (const key of Object.keys(out)) out[key] += def[key] * weight;
  }
  return out;
}
export const investmentFields = [
  "id",
  "type",
  "region",
  "regionShare",
  "coverage",
  "people",
  "cost",
  "upkeepAnnual",
  "terrain",
  "workRequired",
  "work",
  "paid",
  "phase",
  "startedAt",
  "completedAt",
  "operatingAt",
];
export function investmentSnapshot(s) {
  return (s.investments ?? []).map((p) =>
    Object.fromEntries(
      investmentFields.filter((k) => p[k] !== undefined).map((k) => [k, p[k]]),
    ),
  );
}
