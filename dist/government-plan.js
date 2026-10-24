import { regionalMetrics, regionsOf, budget } from "./model.js";
import { remainingTurns, investmentFinance } from "./investment-ledger.js";
export const goalDefs = [
  {
    key: "crime",
    name: "Violência",
    unit: "/100",
    direction: -1,
    min: 0,
    max: 100,
  },
  {
    key: "access",
    name: "Acesso a serviços",
    unit: "/100",
    direction: 1,
    min: 0,
    max: 100,
  },
  {
    key: "poverty",
    name: "Pobreza",
    unit: "%",
    direction: -1,
    min: 0.5,
    max: 90,
  },
  {
    key: "welfare",
    name: "Bem-estar",
    unit: "/100",
    direction: 1,
    min: 0,
    max: 100,
  },
  {
    key: "debt",
    name: "Dívida / PIB",
    unit: "%",
    direction: -1,
    min: 0,
    max: 250,
  },
];
export const goalDef = (key) => goalDefs.find((d) => d.key === key);
const finite = (v, min, max) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
export function goalValue(s, metric, region) {
  return metric === "access"
    ? regionalMetrics(s, region).access
    : s.metrics[metric];
}
// Allowlisted, bounded optional save data; no player/model text or executable instructions.
export function validateGoals(raw, s) {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > 12) throw Error("Invalid goals");
  const ids = new Set();
  const goals = raw.map((g) => {
    const d = goalDef(g?.metric);
    if (
      !d ||
      typeof g.id !== "string" ||
      !/^\d+:\d+:\d+$/.test(g.id) ||
      g.id.length > 40 ||
      ids.has(g.id) ||
      !Number.isInteger(g.startedAt) ||
      g.startedAt < 0 ||
      g.startedAt > s.quarter ||
      !Number.isInteger(g.dueAt) ||
      ![4, 8, 12].includes(g.dueAt - g.startedAt) ||
      g.dueAt > 160 ||
      !finite(g.baseline, d.min, d.max) ||
      !finite(g.target, d.min, d.max) ||
      (g.target - g.baseline) * d.direction <= 0 ||
      (g.metric === "access"
        ? !Number.isInteger(g.region) ||
          !regionsOf(s)[g.region] ||
          !["health", "infrastructure"].includes(g.owner)
        : g.region !== null ||
          g.owner !==
            (g.metric === "debt"
              ? "finance"
              : g.metric === "crime"
                ? "security"
                : "nilo")) ||
      !Array.isArray(g.samples) ||
      !g.samples.length ||
      g.samples.length > 13
    )
      throw Error("Invalid goal");
    ids.add(g.id);
    const end = g.closedAt ?? s.quarter;
    if (
      !Number.isInteger(end) ||
      end < g.startedAt ||
      end > Math.min(g.dueAt, s.quarter) ||
      (g.closedAt !== undefined &&
        !["deadline", "stopped"].includes(g.closedReason)) ||
      (g.closedAt === undefined &&
        (g.closedReason !== undefined || s.quarter >= g.dueAt)) ||
      (g.closedReason === "deadline" && end !== g.dueAt) ||
      g.samples.length !== end - g.startedAt + 1
    )
      throw Error("Invalid goal history");
    const samples = g.samples.map((p, i) => {
      if (p?.quarter !== g.startedAt + i || !finite(p.value, d.min, d.max))
        throw Error("Invalid sample");
      return { quarter: p.quarter, value: p.value };
    });
    if (samples[0].value !== g.baseline) throw Error("Invalid baseline");
    return {
      id: g.id,
      metric: g.metric,
      region: g.region,
      owner: g.owner,
      baseline: g.baseline,
      target: g.target,
      startedAt: g.startedAt,
      dueAt: g.dueAt,
      samples,
      ...(g.closedAt === undefined
        ? {}
        : { closedAt: g.closedAt, closedReason: g.closedReason }),
    };
  });
  if (goals.filter((g) => g.closedAt === undefined).length > 3)
    throw Error("Too many goals");
  return goals;
}
export function goalsOf(s) {
  try {
    return validateGoals(s.goals, s);
  } catch {
    return [];
  }
}
export function createGoal(
  s,
  { metric, region = null, owner, horizon, target },
) {
  const d = goalDef(metric),
    goals = goalsOf(s);
  if (
    !d ||
    ![4, 8, 12].includes(horizon) ||
    s.quarter + horizon > 160 ||
    goals.length >= 12 ||
    goals.filter((g) => g.closedAt === undefined).length >= 3 ||
    (metric === "access" &&
      (!Number.isInteger(region) ||
        !regionsOf(s)[region] ||
        !["health", "infrastructure"].includes(owner))) ||
    (metric !== "access" && region !== null) ||
    !finite(target, d.min, d.max)
  )
    return s;
  const baseline = goalValue(s, metric, region);
  if (
    (target - baseline) * d.direction <= 0 ||
    goals.some(
      (g) =>
        g.closedAt === undefined && g.metric === metric && g.region === region,
    )
  )
    return s;
  const n = structuredClone(s);
  n.goals = [
    ...goals,
    {
      id: `${s.seed}:${s.quarter}:${goals.length}`,
      metric,
      region,
      owner:
        metric === "access"
          ? owner
          : metric === "debt"
            ? "finance"
            : metric === "crime"
              ? "security"
              : "nilo",
      baseline,
      target,
      startedAt: s.quarter,
      dueAt: s.quarter + horizon,
      samples: [{ quarter: s.quarter, value: baseline }],
    },
  ];
  return n;
}
export function closeGoal(s, id) {
  const goals = goalsOf(s),
    g = goals.find((g) => g.id === id);
  if (!g || g.closedAt !== undefined) return s;
  const n = structuredClone(s);
  n.goals = goals.map((g) =>
    g.id === id ? { ...g, closedAt: s.quarter, closedReason: "stopped" } : g,
  );
  return n;
}
export function advanceGoals(before, after) {
  if (after.quarter !== before.quarter + 1 || before.goals === undefined)
    return after;
  after.goals = goalsOf(before).map((g) =>
    g.closedAt !== undefined
      ? g
      : {
          ...g,
          samples: [
            ...g.samples,
            {
              quarter: after.quarter,
              value: goalValue(after, g.metric, g.region),
            },
          ],
          ...(after.quarter >= g.dueAt
            ? { closedAt: after.quarter, closedReason: "deadline" }
            : {}),
        },
  );
  after.lastReport.goalUpdates = after.goals
    .filter((g) => g.closedAt === undefined || g.closedAt === after.quarter)
    .map((g) => {
      const v = goalReading(after, g);
      return {
        metric: g.metric,
        region: g.region,
        owner: g.owner,
        value: v.current,
        target: g.target,
        status: v.status,
        dueAt: g.dueAt,
      };
    });
  for (const g of after.goals.filter(
    (g) => g.closedAt === after.quarter && g.closedReason === "deadline",
  )) {
    const v = goalReading(after, g);
    after.events.push({
      title: `${v.status === "met" ? "Meta cumprida" : "Prazo da meta encerrado"}: ${v.label}`,
      detail: `${v.regionName}: ${v.current.toFixed(1)}${v.unit}, meta ${g.target.toFixed(1)}${v.unit}. O histórico está no plano de governo.`,
    });
  }
  return after;
}
export function goalReading(s, g) {
  const d = goalDef(g.metric),
    closed = g.closedAt !== undefined;
  const current = closed
    ? g.samples.at(-1).value
    : goalValue(s, g.metric, g.region);
  const reached = (current - g.target) * d.direction >= -1e-8;
  const elapsed = (closed ? g.closedAt : s.quarter) - g.startedAt;
  const progress = (current - g.baseline) / (g.target - g.baseline);
  const expected = elapsed / (g.dueAt - g.startedAt);
  return {
    ...g,
    label: d.name,
    unit: d.unit,
    regionName: g.region === null ? "País" : regionsOf(s)[g.region].name,
    current,
    progress: Math.max(0, Math.min(1, progress)),
    remaining: Math.max(0, g.dueAt - s.quarter),
    status:
      g.closedReason === "stopped"
        ? "stopped"
        : closed
          ? reached
            ? "met"
            : "missed"
          : reached
            ? "reached"
            : elapsed > 0 && progress + 0.001 < expected
              ? "behind"
              : "tracking",
  };
}
export function planSummary(s, role = "nilo") {
  const goals = goalsOf(s)
    .filter((g) => role === "nilo" || role === "finance" || g.owner === role)
    .map((g) => goalReading(s, g));
  const finance = investmentFinance(s),
    b = budget(s);
  return {
    goals,
    finance: {
      balance: b.balance,
      debt: s.metrics.debt,
      constructionQuarter: finance.constructionQuarter,
      upkeepQuarter: finance.upkeepQuarter,
    },
    deliveryRisks: goals
      .filter((g) => g.closedAt === undefined && g.region !== null)
      .flatMap((g) =>
        (s.investments ?? [])
          .filter(
            (p) =>
              p.region === g.region &&
              p.phase !== "operating" &&
              remainingTurns(s, p) > g.remaining,
          )
          .map((p) => ({
            goalId: g.id,
            type: p.type,
            region: g.region,
            operationTurns: remainingTurns(s, p),
            remaining: g.remaining,
          })),
      ),
  };
}
