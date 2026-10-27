import { advance, policyDefs, budget } from "./model.js";
import { crisisEffect } from "./crisis-followup.js";
import { goalsOf, goalDef } from "./government-plan.js";

export const driverMetrics = [
  "gdp",
  "unemployment",
  "inflation",
  "approval",
  "investigation",
  "preventionCapacity",
  "reportedCrime",
  "poverty",
  "welfare",
  "debt",
  "crime",
  "trust",
  "servicesPressure",
];
export function quarterDrivers(s, after) {
  const base = {
    ...s,
    policies: { ...(s.policyBaseline ?? s.policies) },
    investments: [],
    scheduledDecision: null,
    crisisTracks: [],
  };
  const reference = advance(base);
  const policies = advance({ ...base, policies: s.policies });
  const programs = advance({
    ...base,
    policies: s.policies,
    investments: s.investments,
  });
  const crises = advance(
    { ...base, policies: s.policies, investments: s.investments },
    crisisEffect(s),
  );
  const stages = [s, reference, policies, programs, crises, after];
  return [
    "Políticas mantidas e contexto",
    "Ajustes deste trimestre",
    "Investimentos regionais",
    "Crises em acompanhamento",
    "Resposta escolhida",
  ].map((name, i) => ({
    name,
    delta: Object.fromEntries(
      driverMetrics.map((k) => [
        k,
        stages[i + 1].metrics[k] - stages[i].metrics[k],
      ]),
    ),
  }));
}
const bounded = (n) => Math.round(Math.max(0, Math.min(100, n)));
export function societyGroups(s) {
  const m = s.metrics,
    p = s.policies;
  return [
    {
      id: "workers",
      name: "Trabalhadores",
      priority: "Emprego, renda e proteção no trabalho",
      support: bounded(
        70 -
          m.unemployment * 2 -
          m.inflation +
          (p.labor - 50) * 0.3 +
          p.income * 0.015,
      ),
    },
    {
      id: "business",
      name: "Empreendedores",
      priority: "Atividade econômica, conexões e previsibilidade fiscal",
      support: bounded(
        58 +
          (p.infrastructure - 3) * 2 -
          (p.tax - 28) * 1.2 -
          (p.labor - 50) * 0.12 -
          (m.debt - 60) * 0.2,
      ),
    },
    {
      id: "retired",
      name: "Aposentados",
      priority: "Previdência, atendimento e custo de vida",
      support: bounded(
        50 +
          (p.pension - 65) * 0.6 +
          (p.services - 8) * 2 -
          (m.inflation - 4) * 2,
      ),
    },
    {
      id: "services",
      name: "Famílias que dependem dos serviços públicos",
      priority: "Acesso, proteção social e segurança cotidiana",
      support: bounded(
        65 -
          m.poverty * 0.8 +
          (p.services - 8) * 3 +
          p.income * 0.02 -
          (m.crime ?? 45) * 0.15,
      ),
    },
  ];
}
export function cabinetProposals(s) {
  const defs = [
    {
      role: "finance",
      name: "Lia",
      area: "Fazenda",
      key: "tax",
      amount: 1,
      why: "Reforçar a arrecadação para financiar as prioridades.",
      tradeoff:
        "A carga tributária aumenta; o motor também considera seu efeito sobre a atividade.",
    },
    {
      role: "health",
      name: "Caio",
      area: "Saúde",
      key: "services",
      amount: 1,
      why: "Ampliar a rede e a capacidade dos serviços públicos.",
      tradeoff:
        "A despesa é recorrente e os resultados se acumulam gradualmente.",
    },
    {
      role: "infrastructure",
      name: "Iara",
      area: "Infraestrutura",
      key: "infrastructure",
      amount: 1,
      why: "Melhorar conexões e acesso no território.",
      tradeoff:
        "Exige financiamento recorrente; regiões difíceis respondem menos.",
    },
    {
      role: "security",
      name: "Davi",
      area: "Segurança pública",
      key: "prevention",
      amount: 0.2,
      why: "Construir a rede de prevenção da violência.",
      tradeoff:
        "A proteção leva tempo para amadurecer e exige orçamento contínuo.",
    },
  ];
  return defs.map((d) => {
    const p = policyDefs.find((p) => p.key === d.key),
      value = Math.min(
        p.max,
        Math.round((s.policies[d.key] + d.amount) * 10) / 10,
      );
    return {
      ...d,
      value,
      before: s.policies[d.key],
      label: p.name,
      available: value !== s.policies[d.key],
      annualBalance:
        budget({ ...s, policies: { ...s.policies, [d.key]: value } }).balance -
        budget(s).balance,
    };
  });
}
export function governmentCycles(s) {
  const rows = [];
  for (let start = 0; start <= s.quarter; start += 16) {
    if (start === s.quarter && s.quarter > 0) break;
    const end = Math.min(start + 16, s.quarter),
      before = s.history?.find((h) => h.quarter === start) ?? null,
      after = s.history?.find((h) => h.quarter === end) ?? null;
    rows.push({
      number: start / 16 + 1,
      start,
      end,
      complete: end === start + 16,
      before,
      after,
      challenges: after
        ? [
            ["debt", 85, "Dívida acima de 85% do PIB"],
            ["poverty", 25, "Pobreza acima de 25%"],
            ["crime", 50, "Violência acima de 50/100"],
            ["servicesPressure", 45, "Pressão nos serviços acima de 45/100"],
          ]
            .filter(
              ([key, threshold]) =>
                Number.isFinite(after[key]) && after[key] > threshold,
            )
            .map(([, , label]) => label)
        : null,
      programs: (s.investments ?? []).filter(
        (p) => p.operatingAt > start && p.operatingAt <= end,
      ).length,
      goals: goalsOf(s)
        .filter((g) => g.startedAt >= start && g.startedAt < start + 16)
        .map((g) => ({
          metric: g.metric,
          label: goalDef(g.metric).name,
          target: g.target,
          status:
            g.closedAt === undefined || g.closedAt > end
              ? "Em acompanhamento"
              : g.closedReason === "stopped"
                ? "Encerrada pelo jogador"
                : (g.samples.at(-1).value - g.target) *
                      goalDef(g.metric).direction >=
                    -1e-8
                  ? "Cumprida no prazo"
                  : "Prazo encerrado sem atingir a meta",
        })),
    });
  }
  return rows;
}
