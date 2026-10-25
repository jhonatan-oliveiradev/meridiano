// Synthetic game indices and illustrative coefficients; never population crime rates.
export const consequenceDefaults = {
  crime: 45,
  trust: 55,
  investigation: 40,
  preventionCapacity: 35,
  servicesPressure: 35,
  reportedCrime: 28.125,
};
export const safetyPolicies = [
  {
    key: "security",
    name: "Investigação e policiamento",
    icon: "◈",
    description:
      "Reforço de equipes, perícia e investigação. O orçamento adicional forma capacidade ao longo dos trimestres.",
    label: "Reforço anual / PIB",
    min: 0,
    max: 4,
    step: 0.25,
    unit: "%",
    default: 0,
  },
  {
    key: "prevention",
    name: "Prevenção da violência",
    icon: "◉",
    description:
      "Mediação, proteção de jovens e apoio comunitário. A rede precisa ser construída antes de produzir resultados.",
    label: "Investimento anual / PIB",
    min: 0,
    max: 2,
    step: 0.25,
    unit: "%",
    default: 0,
  },
  {
    key: "oversight",
    name: "Controle e transparência policial",
    icon: "◇",
    description:
      "Corregedoria, formação e canais de denúncia. Aumenta a confiança gradualmente e exige financiamento.",
    label: "Reforço anual / PIB",
    min: 0,
    max: 1,
    step: 0.1,
    unit: "%",
    default: 0,
  },
  {
    key: "enforcement",
    name: "Intensidade das operações",
    icon: "⌁",
    description:
      "Operações dependem de investigação. Intensidade alta sem controle suficiente pode reduzir a confiança e a disposição para denunciar.",
    label: "Intensidade operacional",
    min: 0,
    max: 100,
    step: 5,
    unit: "/100",
    default: 50,
  },
];
export const consequenceMetrics = [
  ["crime", "Violência", "/100", -1],
  ["investigation", "Capacidade de investigação", "/100", 1],
  ["preventionCapacity", "Rede de prevenção", "/100", 1],
  ["trust", "Confiança na polícia", "/100", 1],
  ["servicesPressure", "Pressão nos serviços", "/100", -1],
  ["reportedCrime", "Ocorrências registradas", "/100", 0],
];
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
export function safetyValues(s) {
  return {
    ...consequenceDefaults,
    ...Object.fromEntries(
      Object.entries(s.metrics).filter(([k]) => k in consequenceDefaults),
    ),
  };
}
export function safetySettings(s) {
  return Object.fromEntries(
    safetyPolicies.map((p) => [p.key, s.policies[p.key] ?? p.default]),
  );
}
export function migrateConsequences(s) {
  const metrics = safetyValues(s),
    policies = safetySettings(s);
  const history =
    s.history?.length && !Number.isFinite(s.history.at(-1).crime)
      ? [...s.history.slice(0, -1), { ...s.history.at(-1), ...metrics }]
      : s.history;
  return {
    ...s,
    history,
    policies: { ...s.policies, ...policies },
    metrics: { ...s.metrics, ...metrics },
    ...(s.policyBaseline
      ? { policyBaseline: { ...policies, ...s.policyBaseline } }
      : {}),
  };
}
export function safetyCost(s) {
  const p = safetySettings(s);
  return p.security + p.prevention + p.oversight;
}
export function consequenceStep(s, effect = {}) {
  const v = safetyValues(s),
    p = safetySettings(s),
    m = s.metrics;
  const capacity = s.capacity ?? 0.65;
  const drivers = {},
    next = {};
  function evolve(key, parts) {
    const raw = v[key] + parts.reduce((n, p) => n + p.value, 0);
    next[key] = clamp(raw);
    if (next[key] !== raw)
      parts.push({ label: "Limite do índice", value: next[key] - raw });
    drivers[key] = parts;
  }
  evolve("investigation", [
    {
      label: "Formação de equipes e perícia",
      value: (clamp(40 + p.security * 13 * capacity) - v.investigation) * 0.12,
    },
  ]);
  evolve("preventionCapacity", [
    {
      label: "Expansão da rede de prevenção",
      value:
        (clamp(35 + p.prevention * 25 * capacity) - v.preventionCapacity) *
        0.08,
    },
  ]);
  evolve("trust", [
    {
      label: "Controle, transparência e confiança acumulada",
      value: (55 + p.oversight * 24 * capacity - v.trust) * 0.1,
    },
    {
      label: "Intensidade operacional sem controle suficiente",
      value: -Math.max(0, p.enforcement - 50) * 0.035 * (1 - p.oversight * 0.8),
    },
    { label: "Resposta ao acontecimento", value: effect.trust ?? 0 },
  ]);
  evolve("crime", [
    {
      label: "Convergência ao contexto de referência",
      value: (45 - v.crime) * 0.08,
    },
    {
      label: "Vulnerabilidade e mercado de trabalho",
      value: (m.poverty - 24.6) * 0.025 + (m.unemployment - 8.7) * 0.045,
    },
    {
      label: "Capacidade investigativa já instalada",
      value: -(v.investigation - 40) * 0.035,
    },
    {
      label: "Rede de prevenção já instalada",
      value: -(v.preventionCapacity - 35) * 0.025,
    },
    {
      label: "Operações apoiadas pela investigação",
      value: (-(p.enforcement - 50) * 0.008 * v.investigation) / 100,
    },
    {
      label: "Cooperação da população com a polícia",
      value: -(v.trust - 55) * 0.012,
    },
    { label: "Resposta ao acontecimento", value: effect.crime ?? 0 },
  ]);
  evolve("servicesPressure", [
    {
      label: "Demanda e capacidade de atendimento",
      value:
        (35 +
          (m.poverty - 24.6) * 0.55 +
          (m.unemployment - 8.7) * 0.7 +
          (v.crime - 45) * 0.45 -
          (s.policies.services - 8) * 2 * capacity -
          v.servicesPressure) *
        0.12,
    },
    { label: "Resposta ao acontecimento", value: effect.servicesPressure ?? 0 },
  ]);
  next.reportedCrime = next.crime * (0.35 + next.trust * 0.005);
  // Exact two-factor decomposition: violence first, then reporting propensity.
  drivers.reportedCrime = [
    {
      label: "Mudança na violência",
      value: (next.crime - v.crime) * (0.35 + v.trust * 0.005),
    },
    {
      label: "Disposição para registrar ocorrências",
      value: next.crime * (next.trust - v.trust) * 0.005,
    },
    {
      label: "Ajuste do índice de registro anterior",
      value: v.crime * (0.35 + v.trust * 0.005) - v.reportedCrime,
    },
  ];
  for (const parts of Object.values(drivers))
    for (const part of parts) if (Object.is(part.value, -0)) part.value = 0;
  return { before: v, next, drivers, additionalAnnualShare: safetyCost(s) };
}
