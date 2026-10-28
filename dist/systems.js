// Synthetic quarterly networks. No random(), clock, I/O or dependence on ideology.
const clamp = (v, a = 0, b = 1) =>
  Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
const finite = (v, fallback) => (Number.isFinite(v) ? v : fallback);
const noise = (seed, q, region) => {
  let h =
    Math.imul((seed | 0) ^ Math.imul(q + 71, 2654435761), 16777619) ^
    Math.imul(region + 3, 2246822519);
  h = Math.imul(h ^ (h >>> 16), 3266489917);
  return (h >>> 0) / 4294967296;
};
export function validSystems(s) {
  return (
    s?.version === 1 &&
    Number.isInteger(s.quarter) &&
    s.quarter >= 0 &&
    s.quarter <= 160 &&
    Number.isInteger(s.startedAt) &&
    s.startedAt >= 0 &&
    s.startedAt <= s.quarter &&
    Array.isArray(s.regions) &&
    s.regions.length > 0 &&
    s.regions.length <= 24 &&
    s.regions.every(
      (r, i) =>
        r &&
        r.region === i &&
        typeof r.name === "string" &&
        [
          "water",
          "grid",
          "backlog",
          "anchorPopulation",
          "waterYield",
          "energyPotential",
          "share",
        ].every((k) => Number.isFinite(r[k])) &&
        Number.isFinite(r.waterService) &&
        r.waterService >= 0 &&
        r.waterService <= 1 &&
        Number.isFinite(r.energyService) &&
        r.energyService >= 0 &&
        r.energyService <= 1 &&
        r.waterYield >= 0 &&
        r.waterYield <= 1 &&
        r.energyPotential >= 0 &&
        r.energyPotential <= 1 &&
        r.water >= 0 &&
        r.water <= 400 &&
        r.grid >= 0 &&
        r.grid <= 100 &&
        r.backlog >= 0 &&
        r.backlog <= 200 &&
        r.anchorPopulation > 0 &&
        r.share > 0 &&
        r.share <= 1,
    )
  );
}
export function createSystems(s) {
  if (
    !Array.isArray(s.trade?.resources) ||
    !s.trade.resources.length ||
    s.trade.resources.length > 24 ||
    !s.trade.resources.every(
      (r) =>
        r &&
        typeof r.name === "string" &&
        Number.isFinite(r.share) &&
        r.share > 0 &&
        r.share <= 1 &&
        Number.isFinite(r.energy),
    )
  )
    return null;
  return {
    version: 1,
    startedAt: s.quarter,
    quarter: s.quarter,
    history: [],
    regions: s.trade.resources.map((r, i) => ({
      region: i,
      name: r.name,
      share: r.share,
      coast: clamp(r.coast ?? 0.3),
      waterYield: clamp(r.water ?? 0.5),
      energyPotential: clamp(r.energy),
      anchorPopulation: s.metrics.population,
      water: 95,
      grid: 85,
      backlog: 0,
      waterService: 1,
      energyService: 1,
      storageCapacity: 160,
      privateCapacity: 0,
      readyStreak: 0,
      pipeline: null,
    })),
  };
}
const program = (s, i, type) =>
  Math.max(
    0,
    ...(s.investments ?? [])
      .filter(
        (p) => p.region === i && p.type === type && p.phase === "operating",
      )
      .map((p) =>
        clamp(
          finite(p.coverage, type === "water" ? 0.35 : 0.4) /
            (type === "water" ? 0.35 : 0.4),
        ),
      ),
  );
export function evolveSystems(s, response = {}) {
  const source = validSystems(s.systems) ? s.systems : createSystems(s);
  if (!source) return null;
  const out = structuredClone(source),
    q = s.quarter,
    infra = clamp(s.policies.infrastructure, 0, 10),
    execution = clamp(s.capacity ?? 0.65, 0.35, 0.95);
  const cargo = Math.max(
    0,
    finite(s.tradeReport?.exports, 0) +
      finite(s.tradeReport?.imports, 0) +
      0.18 *
        (s.tradeReport?.flows ?? []).reduce(
          (n, f) => n + Math.max(0, finite(f.production, 0)),
          0,
        ),
  );
  const cargoWeight = source.regions.reduce(
    (n, r) => n + r.share * (0.4 + (r.coast ?? 0.3) * 1.2),
    0,
  );
  const responseRegion = Number.isInteger(response.region)
    ? response.region
    : -1;
  const totalGdp = Math.max(1, s.trade?.anchorGdp ?? s.metrics.gdp);
  out.regions = source.regions.map((old, i) => {
    const local = i === responseRegion || responseRegion === -1;
    const waterWorks = program(s, i, "water"),
      powerWorks = program(s, i, "energy"),
      roads = program(s, i, "transport");
    const pop = clamp(s.metrics.population / old.anchorPopulation, 0.3, 4),
      year = Math.floor(q / 4);
    const dryYear = noise(s.seed, year, 23) < 0.24;
    const seasonal = 0.8 + 0.35 * Math.sin(((q % 4) * Math.PI) / 2 + i * 0.8);
    const rain = clamp(
      (0.8 + noise(s.seed, year, i) * 0.5) * seasonal * (dryYear ? 0.4 : 1),
      0.12,
      1.65,
    );
    const storageCapacity = 160 + waterWorks * 120;
    const opening = clamp(old.water, 0, 400);
    const industrial =
      program(s, i, "industry") * 0.2 +
      program(s, i, "agriculture") * 0.15 +
      clamp(old.privateCapacity, 0, 0.35);
    const need =
      (48 * pop + industrial * 25) *
      (1 - waterWorks * 0.18) *
      (local && response.ration ? 0.8 : 1);
    const inflow =
      62 * rain * (0.7 + old.waterYield * 0.6) * (1 + waterWorks * 0.25);
    const relief = local ? clamp(response.water, 0, 35) : 0;
    const used = Math.min(need, opening + inflow + relief),
      spill = Math.max(0, opening + inflow + relief - used - storageCapacity),
      water = opening + inflow + relief - used - spill;
    const grossEnergyDemand =
      0.58 + industrial + program(s, i, "mining") * 0.2 + (pop - 1) * 0.15;
    const energyDemand =
      grossEnergyDemand * (local && response.energyRation ? 0.82 : 1);
    const energyCapacity =
      0.45 + old.energyPotential * 0.55 + infra * 0.035 + powerWorks * 0.5;
    const overload = Math.max(0, energyDemand / energyCapacity - 1);
    const grid = clamp(
      old.grid +
        (infra * 0.9 - 2.5) * execution -
        overload * 8 +
        (local ? clamp(response.grid, 0, 20) : 0),
      0,
      100,
    );
    const energyService = clamp(
      (energyCapacity / energyDemand) * (0.65 + grid * 0.0035),
      0.25,
      1,
    );
    const transportCapacity =
      totalGdp *
      old.share *
      0.055 *
      (0.55 + infra * 0.09 + execution * 0.4 + roads * 0.9) *
      (1 + (local ? clamp(response.transport, 0, 0.5) : 0));
    const load =
        ((cargo * old.share * (0.4 + (old.coast ?? 0.3) * 1.2)) /
          Math.max(0.001, cargoWeight)) *
        (1 + industrial * 0.3),
      ratio = load / Math.max(0.001, transportCapacity);
    const backlog = clamp(
      old.backlog +
        Math.max(0, ratio - 1) * 35 -
        Math.max(0, 1 - ratio) * (18 + roads * 22),
      0,
      200,
    );
    let privateCapacity = clamp(old.privateCapacity, 0, 0.35),
      pipeline =
        old.pipeline?.remaining > 0
          ? {
              remaining: Math.min(4, old.pipeline.remaining) - 1,
              boost: clamp(old.pipeline.boost, 0, 0.15),
            }
          : null;
    if (pipeline?.remaining === 0) {
      privateCapacity = clamp(privateCapacity + pipeline.boost, 0, 0.35);
      pipeline = null;
    }
    if (local && response.industry && !pipeline)
      pipeline = { remaining: 2, boost: clamp(response.industry, 0, 0.15) };
    const waterService = clamp(used / Math.max(0.001, need));
    const healthy =
      waterService > 0.97 &&
      water / need > 0.8 &&
      energyService > 0.98 &&
      ratio < 0.85 &&
      backlog < 5;
    return {
      ...old,
      water,
      grid,
      backlog,
      storageCapacity,
      opening,
      inflow,
      relief,
      used,
      spill,
      need,
      rain,
      dryYear,
      waterService,
      waterRation: !!(local && response.ration),
      energyRation: !!(local && response.energyRation),
      energyService,
      energyDemand,
      energyCapacity,
      transportCapacity,
      load,
      privateCapacity,
      pipeline,
      commissioned:
        !!old.pipeline &&
        !pipeline &&
        privateCapacity > (old.privateCapacity ?? 0),
      readyStreak: healthy ? Math.min(160, (old.readyStreak ?? 0) + 1) : 0,
    };
  });
  out.quarter = q + 1;
  const average = (k) =>
    out.regions.reduce((n, r) => n + r.share * r[k], 0) /
    out.regions.reduce((n, r) => n + r.share, 0);
  out.summary = {
    water: average("waterService"),
    energy: average("energyService"),
    backlog: average("backlog"),
    rain: average("rain"),
  };
  out.history = [
    ...(Array.isArray(source.history) ? source.history : []).slice(-159),
    { quarter: q + 1, ...out.summary },
  ];
  return out;
}
export function systemFactors(s, i) {
  if (!validSystems(s.systems))
    return { food: 1, energy: 1, minerals: 1, manufactures: 1, logistics: 1 };
  const r = s.systems.regions[i];
  if (!r)
    return { food: 1, energy: 1, minerals: 1, manufactures: 1, logistics: 1 };
  const water = clamp(r.waterService ?? 1, 0.2, 1),
    energy = clamp(r.energyService ?? 1, 0.25, 1);
  return {
    food: water * (0.85 + energy * 0.15) * (r.waterRation ? 0.9 : 1),
    energy: 0.7 + energy * 0.3,
    minerals: 0.6 + energy * 0.4,
    manufactures:
      energy *
      (1 + clamp(r.privateCapacity, 0, 0.35)) *
      (r.energyRation ? 0.9 : 1),
    logistics: clamp(1 - r.backlog / 250, 0.2, 1),
  };
}
export function eventCandidates(s) {
  if (!validSystems(s.systems)) return [];
  const list = [],
    recent = Array.isArray(s.eventMemory)
      ? s.eventMemory.filter(
          (e) => e && Number.isInteger(e.quarter) && typeof e.key === "string",
        )
      : [];
  const add = (key, r, score, cause, opportunity = false) => {
    const cooldown = opportunity ? 12 : 6;
    if (
      score < 0.25 ||
      recent.some((e) => e.key === key && s.quarter - e.quarter < cooldown)
    )
      return;
    list.push({
      key,
      region: r.region,
      regionName: [
        "food",
        "services",
        "security",
        "employment",
        "prices",
        "fiscal",
      ].includes(key)
        ? "Visão nacional"
        : r.name,
      score: clamp(score, 0, 2),
      cause,
      opportunity,
    });
  };
  for (const r of s.systems.regions) {
    add(
      "water",
      r,
      (1 - r.waterService) * 1.5 +
        Math.max(0, 0.55 - r.water / Math.max(1, r.need ?? 48)),
      `Chuva em ${Math.round((r.rain ?? 1) * 100)}% da referência; reserva de água equivalente a ${(r.water / Math.max(1, r.need ?? 48)).toFixed(1).replace(".", ",")} trimestre de demanda. Atendimento em ${Math.round(r.waterService * 100)}%.`,
    );
    add(
      "energy",
      r,
      (1 - r.energyService) * 2,
      `A rede atende ${Math.round(r.energyService * 100)}% da demanda. Carga ${r.energyDemand?.toFixed(2)?.replace(".", ",") ?? "—"}; capacidade ${r.energyCapacity?.toFixed(2)?.replace(".", ",") ?? "—"} em unidades de rede.`,
    );
    add(
      "freight",
      r,
      r.backlog / 65,
      `Carga de ${(r.load ?? 0).toFixed(2).replace(".", ",")} UP para capacidade de ${(r.transportCapacity ?? 0).toFixed(2).replace(".", ",")} UP por trimestre; fila logística em ${Math.round(r.backlog)}/200.`,
    );
    if (
      s.quarter + 3 <= 160 &&
      (r.readyStreak ?? 0) >= 3 &&
      r.privateCapacity < 0.35 &&
      !r.pipeline &&
      s.metrics.debt < 105
    )
      add(
        "investment",
        r,
        0.4 + Math.min(0.3, r.readyStreak * 0.025),
        `Água e energia confiáveis, capacidade logística livre e três ou mais trimestres de estabilidade neste estado.`,
        true,
      );
  }
  const worst = [...s.systems.regions].sort(
    (a, b) => a.waterService - b.waterService,
  )[0];
  const food = s.tradeReport?.flows?.find((f) => f.key === "food");
  if (food)
    add(
      "food",
      worst,
      (food.unmet / Math.max(0.001, food.need)) * 2,
      `O consumo interno de alimentos deixou ${food.unmet.toFixed(2).replace(".", ",")} UP sem atendimento; importações ${food.imports.toFixed(2).replace(".", ",")} UP e estoque ${food.closing.toFixed(2).replace(".", ",")} UP.`,
    );
  const m = s.metrics;
  add(
    "services",
    worst,
    Math.max(0, (m.servicesPressure ?? 35) - 55) / 35,
    `Pressão nos serviços em ${Math.round(m.servicesPressure ?? 35)}/100; execução em ${Math.round(s.capacity * 100)}%.`,
  );
  add(
    "security",
    worst,
    Math.max(0, (m.crime ?? 45) - 52) / 30,
    `Violência em ${(m.crime ?? 45).toFixed(1).replace(".", ",")}/100 e confiança em ${(m.trust ?? 55).toFixed(1).replace(".", ",")}/100.`,
  );
  add(
    "employment",
    worst,
    Math.max(0, m.unemployment - 11) / 12,
    `Desemprego em ${m.unemployment.toFixed(1).replace(".", ",")}%; atividade e qualificação limitam a contratação.`,
  );
  add(
    "prices",
    worst,
    Math.max(0, m.inflation - 7) / 12,
    `Inflação anual em ${m.inflation.toFixed(1).replace(".", ",")}%; abastecimento e contexto econômico pressionam os preços.`,
  );
  const deficit = Number.isFinite(s.systems.fiscal?.balance)
    ? -s.systems.fiscal.balance
    : 11 + s.policies.services + s.policies.infrastructure - s.policies.tax;
  if (deficit > 0)
    add(
      "fiscal",
      worst,
      Math.max(0, m.debt - 95) / 80,
      `Dívida em ${m.debt.toFixed(1).replace(".", ",")}% do PIB e déficit anual de ${deficit.toFixed(1).replace(".", ",")}% do PIB, incluindo as despesas e juros apurados no orçamento.`,
    );
  // One candidate per topic; the most exposed state is selected, not an unrelated label.
  return [...new Set(list.map((e) => e.key))].map(
    (key) =>
      list
        .filter((e) => e.key === key)
        .sort((a, b) => b.score - a.score || a.region - b.region)[0],
  );
}
export function chooseSystemEvent(s) {
  const pool = eventCandidates(s);
  if (!pool.length || s.quarter >= 160) return null;
  const recent = Array.isArray(s.eventMemory)
    ? s.eventMemory.filter(
        (e) => e && Number.isInteger(e.quarter) && typeof e.key === "string",
      )
    : [];
  if (recent.some((e) => s.quarter - e.quarter < 2)) return null;
  const scored = pool.map((e) => ({
    ...e,
    weight:
      e.score *
      (0.75 + noise(s.seed, s.quarter, e.region + e.key.length) * 0.5) *
      (e.opportunity ? 0.8 : 1),
  }));
  return scored.sort(
    (a, b) => b.weight - a.weight || a.key.localeCompare(b.key),
  )[0];
}
export function systemsSnapshot(s) {
  if (!validSystems(s.systems)) return null;
  const n = s.systems;
  return {
    version: 1,
    quarter: n.quarter,
    startedAt: n.startedAt,
    regions: n.regions.map((r) => ({
      region: r.region,
      name: r.name,
      waterService: r.waterService,
      energyService: r.energyService,
      water: r.water,
      storageCapacity: r.storageCapacity,
      backlog: r.backlog,
      rain: r.rain ?? 1,
      privateCapacity: r.privateCapacity ?? 0,
      readyStreak: r.readyStreak ?? 0,
    })),
  };
}
export function validateSystemsSummary(value) {
  if (
    value?.version !== 1 ||
    !Number.isInteger(value.quarter) ||
    value.quarter < 0 ||
    value.quarter > 160 ||
    !Number.isInteger(value.startedAt) ||
    value.startedAt < 0 ||
    value.startedAt > value.quarter ||
    !Array.isArray(value.regions) ||
    !value.regions.length ||
    value.regions.length > 24
  )
    throw Error("invalid networks");
  const number = (v, min, max) => {
    if (!Number.isFinite(v) || v < min || v > max)
      throw Error("invalid networks");
    return v;
  };
  return {
    version: 1,
    quarter: value.quarter,
    startedAt: value.startedAt,
    regions: value.regions.map((r, i) => {
      if (r.region !== i || typeof r.name !== "string" || r.name.length > 80)
        throw Error("invalid networks");
      return {
        region: i,
        name: r.name,
        waterService: number(r.waterService, 0, 1),
        energyService: number(r.energyService, 0, 1),
        water: number(r.water, 0, 400),
        storageCapacity: number(r.storageCapacity, 0, 400),
        backlog: number(r.backlog, 0, 200),
        rain: number(r.rain, 0, 2),
        privateCapacity: number(r.privateCapacity, 0, 0.35),
        readyStreak: number(r.readyStreak, 0, 160),
      };
    }),
  };
}
