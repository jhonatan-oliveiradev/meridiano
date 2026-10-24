import { goalDef, goalReading, planSummary } from "./government-plan.js";
import { regionsOf } from "./model.js";
import { projectFor, remainingTurns } from "./investment-ledger.js";
const fmt = (n) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
const money = (n) =>
  n >= 1
    ? `M$ ${fmt(n)} bi`
    : n >= 0.001 || n === 0
      ? `M$ ${fmt(n * 1000)} mi`
      : `M$ ${fmt(n * 1e6)} mil`;
export function goalPresentation(s, g) {
  const v = goalReading(s, g),
    d = goalDef(g.metric);
  const distance = Math.max(0, (g.target - v.current) * d.direction),
    delta = v.current - g.baseline;
  const unit =
    d.unit === "%"
      ? "p.p."
      : Math.round(Math.abs(delta) * 10) === 10
        ? "ponto"
        : "pontos";
  const gapUnit =
    d.unit === "%"
      ? "p.p."
      : Math.round(distance * 10) === 10
        ? "ponto"
        : "pontos";
  return {
    distance,
    delta,
    tone:
      Math.abs(delta) < 0.005
        ? "neutral"
        : delta * d.direction > 0
          ? "positive"
          : "negative",
    gap:
      distance < 1e-8
        ? "Alvo atingido"
        : distance < 0.1
          ? `Falta menos de 0,1 ${d.unit === "%" ? "p.p." : "ponto"} para a meta`
          : `${Math.round(distance * 10) === 10 ? "Falta" : "Faltam"} ${fmt(distance)} ${gapUnit} para a meta`,
    change:
      Math.abs(delta) < 1e-8
        ? "Sem variação desde o início"
        : Math.abs(delta) < 0.1
          ? `Variação menor que 0,1 ${d.unit === "%" ? "p.p." : "ponto"} desde o início`
          : `${delta > 0 ? "+" : ""}${fmt(delta)} ${unit} desde o início`,
  };
}
export function planHighlights(s) {
  const summary = planSummary(s),
    active = summary.goals.filter((g) => g.closedAt === undefined);
  const priority = [...active].sort(
    (a, b) =>
      (a.status === "behind" ? 0 : 1) - (b.status === "behind" ? 0 : 1) ||
      a.remaining - b.remaining ||
      a.progress - b.progress,
  )[0];
  const nilotext = priority
    ? `${priority.regionName} · ${priority.label}: ${goalPresentation(s, priority).gap.toLowerCase()}. Prazo em ${priority.remaining} trimestre${priority.remaining === 1 ? "" : "s"}.`
    : "Defina uma meta para organizar as próximas decisões.";
  const nextCost =
    summary.finance.constructionQuarter + summary.finance.upkeepQuarter;
  const previousCost = s.investmentReport
    ? s.investmentReport.constructionQuarter + s.investmentReport.upkeepQuarter
    : null;
  const change = previousCost === null ? null : nextCost - previousCost;
  const finance = `Saldo anualizado: ${fmt(summary.finance.balance)}% do PIB. Próximo trimestre: ${money(nextCost)} em obras e manutenção.${change !== null && Math.abs(change) > 0.0005 ? ` ${money(Math.abs(change))} a ${change > 0 ? "mais" : "menos"} que no último fechamento.` : ""}`;
  return [
    { id: "nilo", text: nilotext },
    { id: "finance", text: finance },
    ...["health", "infrastructure"].map((id) => {
      const assigned = active
        .filter((g) => g.owner === id)
        .sort((a, b) => a.remaining - b.remaining);
      const risk = summary.deliveryRisks.find((r) =>
        assigned.some((g) => g.id === r.goalId),
      );
      if (risk)
        return {
          id,
          text: `${projectFor(risk.type).name} em ${regionsOf(s)[risk.region].name}: operação estimada ${risk.operationTurns - risk.remaining} ${risk.operationTurns - risk.remaining === 1 ? "trimestre" : "trimestres"} após o prazo da meta, à capacidade atual.`,
        };
      const g = assigned[0];
      if (g) {
        const latest = g.samples.at(-1),
          previous = g.samples.at(-2),
          delta = previous ? latest.value - previous.value : 0;
        return {
          id,
          text: `${g.regionName}: ${previous && Math.abs(delta) >= 0.05 ? `acesso ${delta > 0 ? "subiu" : "caiu"} ${fmt(Math.abs(delta))} pontos no último fechamento.` : `${goalPresentation(s, g).gap.toLowerCase()}.`}`,
        };
      }
      const programs = (s.investments ?? []).filter((p) =>
        id === "health"
          ? p.type === "health"
          : ["water", "transport"].includes(p.type),
      );
      const p = programs.find((p) => p.phase !== "operating") ?? programs[0];
      return {
        id,
        text: p
          ? `${projectFor(p.type).name} em ${regionsOf(s)[p.region].name}: ${p.phase === "operating" ? "em operação." : `operação estimada em ${remainingTurns(s, p)} trimestres, à capacidade atual.`}`
          : "Nenhum programa desta área contratado. Defina uma meta de acesso para começar o acompanhamento.",
      };
    }),
  ];
}
