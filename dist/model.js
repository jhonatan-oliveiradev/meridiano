import {
  investmentFinance,
  advanceInvestments,
  investmentEffects,
} from "./investment-ledger.js";
// Experimental, deterministic model. Coefficients are illustrative, not estimates.
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const policyDefs = [
  {
    key: "income",
    name: "Renda básica",
    icon: "◉",
    description:
      "Transferência mensal para toda a população. Reduz a vulnerabilidade e exige financiamento permanente.",
    label: "Valor mensal por pessoa",
    min: 0,
    max: 800,
    step: 50,
    unit: "M$",
    default: 0,
  },
  {
    key: "pension",
    name: "Previdência pública",
    icon: "◷",
    description:
      "Renda para a população idosa. A cobertura amplia a proteção social e o gasto recorrente.",
    label: "Cobertura da população idosa",
    min: 0,
    max: 100,
    step: 5,
    unit: "%",
    default: 65,
  },
  {
    key: "labor",
    name: "Proteção trabalhista",
    icon: "⚒",
    description:
      "Direitos, fiscalização e proteção ao emprego. A implementação altera renda e custos de contratação.",
    label: "Intensidade de proteção",
    min: 0,
    max: 100,
    step: 5,
    unit: "/100",
    default: 50,
  },
  {
    key: "tax",
    name: "Tributação efetiva",
    icon: "▥",
    description:
      "Parcela da produção arrecadada. Financia políticas; alíquotas elevadas também afetam o investimento.",
    label: "Receita tributária / PIB",
    min: 10,
    max: 50,
    step: 1,
    unit: "%",
    default: 28,
  },
  {
    key: "services",
    name: "Saúde e educação",
    icon: "✚",
    description:
      "Investimento em serviços públicos. Os ganhos em capacidade e produtividade levam tempo para aparecer.",
    label: "Investimento anual / PIB",
    min: 2,
    max: 18,
    step: 1,
    unit: "%",
    default: 8,
  },
  {
    key: "infrastructure",
    name: "Infraestrutura territorial",
    icon: "⌁",
    description:
      "Estradas, saneamento e conexões. Regiões montanhosas demandam mais recursos para a mesma cobertura.",
    label: "Investimento anual / PIB",
    min: 0,
    max: 10,
    step: 0.5,
    unit: "%",
    default: 3,
  },
];
export const regionDefs = [
  {
    name: "Serra Alta",
    x: 312,
    y: 205,
    share: 0.1,
    income: 0.79,
    access: 0.64,
    terrain: 1.35,
    sector: "Mineração e turismo de montanha",
    description: "Serras, recursos minerais e cidades dispersas.",
    color: "#9a9c78",
    capital: "Pedra Clara",
  },
  {
    name: "Campos do Norte",
    x: 535,
    y: 190,
    share: 0.14,
    income: 0.78,
    access: 0.77,
    terrain: 1.05,
    sector: "Agricultura e energia renovável",
    description: "Planícies agrícolas e pequenos centros urbanos.",
    color: "#a6af7a",
    capital: "Campo Novo",
  },
  {
    name: "Costa Verde",
    x: 688,
    y: 314,
    share: 0.22,
    income: 1.16,
    access: 0.92,
    terrain: 1,
    sector: "Portos, comércio e serviços",
    description: "Uma costa conectada às rotas comerciais.",
    color: "#7f9f7a",
    capital: "Porto Verde",
  },
  {
    name: "Vale Central",
    x: 445,
    y: 352,
    share: 0.27,
    income: 1.18,
    access: 0.91,
    terrain: 1.05,
    sector: "Indústria, serviços e administração",
    description: "Indústria, serviços e administração.",
    color: "#b0ae73",
    capital: "Nova Aurora",
  },
  {
    name: "Fronteira Oeste",
    x: 268,
    y: 434,
    share: 0.09,
    income: 0.69,
    access: 0.56,
    terrain: 1.25,
    sector: "Agropecuária e extração florestal",
    description: "Baixa densidade e grandes distâncias entre serviços.",
    color: "#8a9b73",
    capital: "Rio Manso",
  },
  {
    name: "Terras do Sul",
    x: 496,
    y: 549,
    share: 0.18,
    income: 1.02,
    access: 0.82,
    terrain: 1.1,
    sector: "Agroindústria e tecnologia",
    description: "Cidades médias entre campos e colinas.",
    color: "#91a986",
    capital: "Santa Lúcia",
  },
];
export function initialState(config = {}) {
  const population = config.population ?? 24.8;
  const m = {
    population,
    gdp: population * 18.4,
    poverty: 24.6,
    unemployment: 8.7,
    inflation: 4.8,
    debt: 58,
    welfare: 62.4,
    approval: 57,
  };
  return {
    version: 1,
    name: config.name ?? "Aurora",
    government: config.government ?? "República democrática",
    economy: config.economy ?? "Economia mista",
    external: config.external ?? "estavel",
    seed: config.seed ?? 1042,
    quarter: 0,
    policies: Object.fromEntries(policyDefs.map((p) => [p.key, p.default])),
    capacity: 0.65,
    metrics: m,
    history: [{ quarter: 0, ...m }],
    events: [
      {
        title: "Seu país está pronto para começar",
        detail:
          "Explore o território, ajuste as políticas e avance o primeiro trimestre.",
      },
    ],
  };
}
export function budget(s) {
  const p = s.policies,
    m = s.metrics;
  const ubi = ((p.income * 12 * m.population) / (m.gdp * 1000)) * 100;
  const pension = p.pension * 0.075;
  const investment = investmentFinance(s);
  const projects =
    ((investment.constructionQuarter + investment.upkeepQuarter) * 400) / m.gdp;
  const spending =
    11 + p.services + p.infrastructure + ubi + pension + projects;
  const interest = m.debt * 0.055;
  return {
    ubi,
    pension,
    projects,
    investment,
    spending,
    interest,
    revenue: p.tax,
    balance: p.tax - spending - interest,
  };
}
export function advance(s, effect = {}) {
  if (s.quarter >= 160) return s;
  const n = structuredClone(s),
    p = n.policies,
    m = n.metrics,
    b = budget(n),
    prev = { ...m };
  const projectEvents = advanceInvestments(n) ?? [];
  const projectEffect = investmentEffects(n);
  n.capacity = clamp(
    n.capacity + 0.0009 * (p.services - 8) + 0.0005 * (p.infrastructure - 3),
    0.35,
    0.95,
  );
  const ext =
    { estavel: 0, recessao: -1.6, expansao: 1.3, sancoes: -2.4 }[n.external] ??
    0;
  const cycle = Math.sin((n.quarter + (n.seed % 17)) * 0.7) * 0.22;
  const annualGrowth = clamp(
    2 +
      (effect.growth ?? 0) +
      projectEffect.growth +
      0.12 * (p.infrastructure - 3) * n.capacity +
      0.12 * (p.services - 8) * n.capacity -
      0.045 * Math.max(0, p.tax - 32) -
      0.025 * Math.max(0, p.labor - 65) +
      Math.min(1, b.ubi * 0.07) +
      ext +
      cycle -
      0.03 * Math.max(0, m.debt - 85),
    -8,
    9,
  );
  m.gdp *= 1 + annualGrowth / 400;
  m.population *= 1.002;
  const povertyTarget = clamp(
    25 -
      projectEffect.poverty -
      1.3 * b.ubi * n.capacity -
      0.055 * (p.pension - 65) -
      0.065 * (p.labor - 50) -
      0.35 * (p.services - 8) * n.capacity +
      0.8 * (m.unemployment - 8.7),
    2,
    70,
  );
  m.poverty = clamp(
    m.poverty + (povertyTarget - m.poverty) * 0.13 + (effect.poverty ?? 0),
    0.5,
    90,
  );
  m.unemployment = clamp(
    m.unemployment -
      0.085 * (annualGrowth - 1.5) +
      0.006 * Math.max(0, p.labor - 70),
    1.5,
    35,
  );
  const inflationTarget = clamp(
    4 +
      0.09 * Math.max(0, -b.balance - 3) +
      b.ubi * 0.05 -
      0.04 * Math.max(0, p.tax - 28) +
      Math.max(0, -ext) * 0.35,
    0,
    30,
  );
  m.inflation = clamp(
    m.inflation +
      (inflationTarget - m.inflation) * 0.16 +
      (effect.inflation ?? 0),
    0,
    35,
  );
  m.debt = clamp(
    (m.debt - b.balance / 4 + (effect.cost ?? 0)) / (1 + annualGrowth / 400),
    0,
    250,
  );
  const access = regionsOf(n).reduce((a, r) => a + r.share * r.access, 0);
  const welfareTarget = clamp(
    58 +
      projectEffect.welfare +
      0.8 * (p.services - 8) * n.capacity +
      0.15 * (p.labor - 50) +
      0.065 * (p.pension - 65) +
      0.8 * b.ubi * n.capacity +
      0.45 * (24.6 - m.poverty) +
      access * 4 -
      0.7 * Math.max(0, m.inflation - 6),
    10,
    97,
  );
  m.welfare = clamp(
    m.welfare + (welfareTarget - m.welfare) * 0.1 + (effect.welfare ?? 0),
    0,
    100,
  );
  m.approval = clamp(
    52 +
      0.7 * (m.welfare - 60) -
      0.8 * (m.unemployment - 8) -
      0.7 * Math.max(0, m.inflation - 5),
    5,
    95,
  );
  n.quarter++;
  n.history.push({ quarter: n.quarter, ...m });
  n.investmentReport = {
    ...b.investment,
    annualizedShare: b.projects,
    transitions: projectEvents,
  };
  n.events = [
    {
      title: `Atividade econômica: ${annualGrowth >= 0 ? "+" : ""}${annualGrowth.toFixed(1).replace(".", ",")}% ao ano`,
      detail:
        "Taxa anualizada do trimestre; inclui investimento, tributação, contexto externo e ciclo determinístico.",
    },
    {
      title: `Pobreza ${m.poverty < prev.poverty ? "recuou" : "avançou"} ${Math.abs(
        m.poverty - prev.poverty,
      )
        .toFixed(2)
        .replace(".", ",")} p.p.`,
      detail:
        "Transferências e serviços interagem com execução e mercado de trabalho; o ajuste é gradual.",
    },
    {
      title: b.balance < 0 ? "Orçamento em déficit" : "Orçamento em superávit",
      detail: `Saldo anual projetado: ${b.balance.toFixed(1).replace(".", ",")}% do PIB, incluindo juros. A dívida absorve o saldo trimestral.`,
    },
  ];
  for (const event of projectEvents)
    n.events.push({
      title:
        event.phase === "operating"
          ? "Programa em operação"
          : event.phase === "ready"
            ? "Obra entregue"
            : "Construção iniciada",
      detail: `${regionsOf(n)[event.region].name}: ${event.type === "water" ? "água e saneamento" : event.type === "health" ? "atenção básica" : event.type === "education" ? "escolas e formação" : "mobilidade regional"}. ${event.phase === "ready" ? "Manutenção e benefícios começam no próximo trimestre." : event.phase === "operating" ? "Manutenção incluída no orçamento; benefícios em vigor." : "Pagamentos acompanham o avanço físico."}`,
    });
  return n;
}
export function regionalMetrics(s, index) {
  const r = regionsOf(s)[index],
    m = s.metrics,
    p = s.policies,
    project = investmentEffects(s, index);
  const execution = clamp(
    r.access +
      project.access / 100 +
      ((p.infrastructure - 3) * 0.008) / r.terrain,
    0.3,
    1,
  );
  return {
    population: m.population * r.share,
    income: (m.gdp / m.population) * 1000 * r.income,
    poverty: clamp(
      m.poverty -
        project.poverty +
        (1 - r.income) * 17 -
        (p.income / 800) * (1 - r.income) * 3,
      1,
      90,
    ),
    welfare: clamp(
      m.welfare + project.welfare + (execution - 0.8) * 24 + (r.income - 1) * 8,
      0,
      100,
    ),
    access: execution * 100,
    ...(r.areaKm2
      ? {
          areaKm2: r.areaKm2,
          density: (m.population * r.share * 1e6) / r.areaKm2,
        }
      : {}),
  };
}

export const regionsOf = (s) => s.territory?.regions ?? regionDefs;
export function municipalMetrics(s, city) {
  const regional = regionalMetrics(s, city.region);
  if (!s.territory || !city.populationShare) return regional;
  const population = s.metrics.population * city.populationShare;
  return {
    ...regional,
    population,
    areaKm2: city.areaKm2,
    density: (population * 1e6) / city.areaKm2,
    urbanization: (city.urbanShare / city.populationShare) * 100,
    urbanPopulation: s.metrics.population * city.urbanShare,
    access:
      clamp(
        city.access +
          investmentEffects(s, city.region).access / 100 +
          ((s.policies.infrastructure - 3) * 0.008) /
            regionsOf(s)[city.region].terrain,
        0.3,
        1,
      ) * 100,
  };
}
