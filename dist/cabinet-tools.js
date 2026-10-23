import { regionsOf, regionalMetrics, budget } from "./model.js";
import { quoteInvestment } from "./investments.js";
import { projectFor, remainingTurns } from "./investment-ledger.js";
export const cabinetRoles = [
  {
    id: "nilo",
    name: "Nilo",
    area: "Coordenação",
    avatar: "nilo",
    office: "Coordenação do gabinete",
    scope: "Prioridades do país e trabalho entre as áreas.",
    programs: ["water", "health", "education", "transport"],
    tools: [
      "investigate_states",
      "inspect_budget",
      "compare_investments",
      "prepare_investment",
    ],
  },
  {
    id: "finance",
    name: "Lia",
    area: "Fazenda",
    avatar: "lia",
    title: "Secretária da Fazenda",
    office: "Secretaria da Fazenda",
    scope: "Orçamento, dívida e financiamento dos programas.",
    programs: ["water", "health", "education", "transport"],
    tools: [
      "inspect_budget",
      "investigate_states",
      "compare_investments",
      "prepare_investment",
    ],
  },
  {
    id: "health",
    name: "Caio",
    area: "Saúde",
    avatar: "caio",
    title: "Secretário da Saúde",
    office: "Secretaria da Saúde",
    scope: "Acesso a serviços e programas de atenção básica.",
    programs: ["health"],
    tools: ["investigate_states", "compare_investments", "prepare_investment"],
  },
  {
    id: "infrastructure",
    name: "Iara",
    area: "Infraestrutura",
    avatar: "iara",
    title: "Secretária de Infraestrutura",
    office: "Secretaria de Infraestrutura",
    scope: "Saneamento, mobilidade e execução das obras.",
    programs: ["water", "transport"],
    tools: ["investigate_states", "compare_investments", "prepare_investment"],
  },
];
export const roleFor = (id) => cabinetRoles.find((r) => r.id === id);
export const toolNames = [
  "investigate_states",
  "inspect_budget",
  "compare_investments",
  "prepare_investment",
];
const plain = (v) => v && typeof v === "object" && !Array.isArray(v);
const fields = (v, allowed) =>
  plain(v) && Object.keys(v).every((k) => allowed.includes(k));
const metrics = ["access", "poverty", "population", "density"];
export function runCabinetTool(s, roleId, request) {
  const role = roleFor(roleId);
  const denied = (message) => ({ kind: "notice", department: roleId, message });
  if (
    !role ||
    !fields(request, ["name", "args"]) ||
    !role.tools.includes(request.name)
  )
    return denied(
      "Esta consulta não pertence a esta área. Consulte Nilo ou Fazenda para a leitura geral.",
    );
  const args = request.args ?? {},
    regions = regionsOf(s);
  const validRegion = (i) =>
    Number.isInteger(i) && i >= 0 && i < regions.length;
  const quote = (i, key) => quoteInvestment(s, i, key);
  const result = (kind, data, normalized, department = roleId) => ({
    kind,
    department,
    request: { name: request.name, args: normalized },
    data,
  });
  const areaFor = (program) =>
    roleId !== "nilo"
      ? roleId
      : program === "health"
        ? "health"
        : program === "water" || program === "transport"
          ? "infrastructure"
          : "nilo";
  if (request.name === "inspect_budget") {
    if (!fields(args, []))
      return denied("A consulta às contas não aceita parâmetros adicionais.");
    return result(
      "budget",
      {
        ...budget(s),
        gdp: s.metrics.gdp,
        debt: s.metrics.debt,
        capacity: s.capacity,
        programs: (s.investments ?? []).map((p) => ({
          name: projectFor(p.type).name,
          region: regions[p.region].name,
          phase: p.phase,
          paid: p.paid,
          cost: p.cost,
          upkeepAnnual: p.upkeepAnnual,
          remainingTurns: remainingTurns(s, p),
        })),
      },
      {},
      roleId === "nilo" ? "finance" : roleId,
    );
  }
  if (request.name === "investigate_states") {
    const metric = args.metric ?? "access",
      direction = args.direction ?? (metric === "access" ? "asc" : "desc"),
      limit = args.limit ?? 3;
    if (
      !fields(args, ["metric", "direction", "limit"]) ||
      !metrics.includes(metric) ||
      !["asc", "desc"].includes(direction) ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 5
    )
      return denied("Escolha um indicador disponível e de um a cinco estados.");
    if (metric === "density" && !s.territory)
      return denied(
        "Este cenário antigo não possui áreas calculadas. Compare acesso, população ou pobreza.",
      );
    const rows = regions
      .map((r, index) => ({
        index,
        name: r.name,
        ...regionalMetrics(s, index),
      }))
      .sort(
        (a, b) =>
          (a[metric] - b[metric]) * (direction === "asc" ? 1 : -1) ||
          a.index - b.index,
      )
      .slice(0, limit);
    return result(
      "states",
      { metric, direction, rows },
      { metric, direction, limit },
    );
  }
  if (request.name === "prepare_investment") {
    if (
      !fields(args, ["region", "program"]) ||
      !validRegion(args.region) ||
      !role.programs.includes(args.program)
    )
      return denied(
        "Escolha um estado existente e um programa da área selecionada.",
      );
    return result(
      "proposal",
      { quotes: [quote(args.region, args.program)] },
      { region: args.region, program: args.program },
      areaFor(args.program),
    );
  }
  if (request.name === "compare_investments") {
    if (
      !fields(args, ["regions", "programs"]) ||
      !Array.isArray(args.regions) ||
      args.regions.length < 1 ||
      args.regions.length > 3 ||
      new Set(args.regions).size !== args.regions.length ||
      !args.regions.every(validRegion) ||
      !Array.isArray(args.programs) ||
      args.programs.length < 1 ||
      args.programs.length > 2 ||
      new Set(args.programs).size !== args.programs.length ||
      !args.programs.every((key) => role.programs.includes(key))
    )
      return denied(
        "Compare até três estados e dois programas permitidos nesta área.",
      );
    return result(
      "comparison",
      {
        quotes: args.regions.flatMap((i) =>
          args.programs.map((key) => quote(i, key)),
        ),
      },
      { regions: [...args.regions], programs: [...args.programs] },
    );
  }
  return denied("Consulta indisponível.");
}
export function cabinetBriefs(s) {
  const ordered = regionsOf(s)
    .map((r, index) => ({
      index,
      name: r.name,
      access: regionalMetrics(s, index).access,
    }))
    .sort((a, b) => a.access - b.access || a.index - b.index);
  const b = budget(s);
  return [
    {
      department: "finance",
      balance: b.balance,
      debt: s.metrics.debt,
      nextQuarter:
        b.investment.constructionQuarter + b.investment.upkeepQuarter,
    },
    { department: "health", priority: ordered[0], program: "health" },
    {
      department: "infrastructure",
      capacity: s.capacity,
      active: (s.investments ?? []).filter((p) => p.phase !== "operating")
        .length,
      priority: ordered[0],
    },
  ];
}
