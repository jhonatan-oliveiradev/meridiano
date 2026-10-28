import { createCountry } from "./country.js";
import { createGoal, goalValue } from "./government-plan.js";
export const challengeDefs = [
  {
    key: "fiscal",
    name: "Recuperar as contas",
    description:
      "Uma dívida alta e um orçamento apertado. Recupere espaço para governar preservando os serviços.",
    seed: 40315,
    turns: 24,
    setup: { debt: 112, tax: 26, services: 11, infrastructure: 4 },
    hint: "Tributação, juros e despesas recorrentes precisam fechar a conta. Cortes podem custar bem-estar.",
    rules: [
      { key: "debt", label: "Dívida no prazo", max: 95, unit: "% do PIB" },
      { key: "welfare", label: "Bem-estar no prazo", min: 55, unit: "/100" },
    ],
  },
  {
    key: "water",
    name: "Atravessar os períodos secos",
    description:
      "Reservas pequenas e redes vulneráveis. Prepare o abastecimento sem depender apenas de apoio emergencial.",
    seed: 719,
    turns: 32,
    setup: { debt: 66, tax: 32, services: 8, infrastructure: 2 },
    hint: "Obras demoram e precisam de água para recarregar as reservas. Planeje a sequência de estados atendidos.",
    rules: [
      {
        key: "water",
        label: "Água atendida: média dos últimos 4 trimestres",
        min: 0.92,
        unit: "%",
        window: 4,
      },
      { key: "debt", label: "Dívida no prazo", max: 110, unit: "% do PIB" },
    ],
  },
  {
    key: "industry",
    name: "Produzir sem sobrecarregar",
    description:
      "Instale dois parques industriais e mantenha água e energia para que possam operar.",
    seed: 75101,
    turns: 28,
    setup: { debt: 58, tax: 32, services: 9, infrastructure: 4 },
    hint: "A indústria consome energia e água. Infraestrutura precisa acompanhar a expansão e a manutenção entra no orçamento.",
    rules: [
      {
        key: "industry",
        label: "Parques de manufaturas em operação",
        min: 2,
        unit: " parques",
      },
      {
        key: "water",
        label: "Água atendida: média dos últimos 4 trimestres",
        min: 0.95,
        unit: "%",
        window: 4,
      },
      {
        key: "energy",
        label: "Energia atendida: média dos últimos 4 trimestres",
        min: 0.95,
        unit: "%",
        window: 4,
      },
      { key: "debt", label: "Dívida no prazo", max: 120, unit: "% do PIB" },
    ],
  },
];
export function startChallenge(key) {
  const d = challengeDefs.find((d) => d.key === key);
  if (!d) throw Error("Desafio desconhecido");
  let s = createCountry({
    seed: d.seed,
    name: { fiscal: "Aurora", water: "Veredas", industry: "Solária" }[key],
  });
  s.metrics.debt = d.setup.debt;
  for (const k of ["tax", "services", "infrastructure"])
    s.policies[k] = d.setup[k];
  s.history = [{ quarter: 0, ...s.metrics }];
  s.policyBaseline = { ...s.policies };
  s.challenge = {
    version: 1,
    key,
    startedAt: 0,
    dueAt: d.turns,
    status: "playing",
  };
  // An interim goal uses the existing government-plan system; final challenge rules remain explicit.
  if (key === "fiscal")
    s = createGoal(s, { metric: "debt", target: 105, horizon: 12 });
  if (key === "industry")
    s = createGoal(s, {
      metric: "access",
      region: s.territory.capitalRegion,
      target: Math.min(
        99,
        goalValue(s, "access", s.territory.capitalRegion) + 3,
      ),
      horizon: 12,
    });
  return s;
}
export function assessChallenge(s) {
  const c = s.challenge,
    d = challengeDefs.find((d) => d.key === c?.key);
  if (
    !d ||
    c.version !== 1 ||
    !Number.isInteger(c.startedAt) ||
    c.startedAt < 0 ||
    c.startedAt > s.quarter ||
    c.dueAt !== c.startedAt + d.turns ||
    c.dueAt > 160
  )
    return null;
  if (["won", "lost"].includes(c.status) && c.result?.key === d.key)
    return structuredClone(c.result);
  const rows = d.rules.map((r) => {
    let value;
    if (r.window) {
      const h = (s.systems?.history ?? [])
        .filter(
          (h) => h.quarter > s.quarter - r.window && h.quarter <= s.quarter,
        )
        .sort((a, b) => a.quarter - b.quarter);
      value =
        h.length === r.window &&
        new Set(h.map((x) => x.quarter)).size === r.window &&
        h.every((h) => Number.isFinite(h[r.key]))
          ? h.reduce((n, h) => n + h[r.key], 0) / r.window
          : null;
    } else if (r.key === "industry")
      value = (s.investments ?? []).filter(
        (p) => p.type === "industry" && p.phase === "operating",
      ).length;
    else value = goalValue(s, r.key, null);
    return {
      ...r,
      value,
      met:
        Number.isFinite(value) &&
        (r.min === undefined || value >= r.min) &&
        (r.max === undefined || value <= r.max),
    };
  });
  const failed = s.metrics.welfare < 35 || s.metrics.debt >= 200;
  const terminal = ["won", "lost"].includes(c.status) ? c.status : null;
  return {
    key: d.key,
    name: d.name,
    description: d.description,
    hint: d.hint,
    dueAt: c.dueAt,
    remaining: Math.max(0, c.dueAt - s.quarter),
    rows,
    status:
      terminal ??
      (failed
        ? "lost"
        : s.quarter >= c.dueAt
          ? rows.every((r) => r.met)
            ? "won"
            : "lost"
          : "playing"),
    reason: failed
      ? "O limite de dívida (200%) ou o piso de bem-estar (35/100) foi ultrapassado."
      : "Os critérios são avaliados no prazo final; as redes precisam manter atendimento nos quatro trimestres finais.",
  };
}
