// Fictional productive units (UP), quarterly flows; prices are billions of M$ per UP.
// No fetch, randomness or model import: the same snapshot always clears the same market.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sum = (a) => a.reduce((x, y) => x + y, 0);
export const sectors = [
  {
    key: "food",
    name: "Alimentos",
    symbol: "✳",
    color: "#b9df60",
    share: 0.085,
    need: 0.065,
    project: "agriculture",
  },
  {
    key: "energy",
    name: "Energia",
    symbol: "ϟ",
    color: "#ffbb60",
    share: 0.115,
    need: 0.065,
    project: "energy",
  },
  {
    key: "minerals",
    name: "Minerais",
    symbol: "◆",
    color: "#a7b2ed",
    share: 0.095,
    need: 0.035,
    project: "mining",
  },
  {
    key: "manufactures",
    name: "Manufaturas",
    symbol: "▦",
    color: "#71d6ca",
    share: 0.14,
    need: 0.1,
    project: "industry",
  },
];
function random(seed) {
  let x = seed >>> 0;
  return () => {
    x += 0x6d2b79f5;
    let z = x;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
export function createTrade(s, regions) {
  const rand = random(s.seed ^ 0x6d657269),
    land = s.territory?.land ?? [];
  const resources = regions.map((r, index) => {
    const coast = land.length
      ? 1 -
        clamp(
          Math.min(...land.map((p) => Math.hypot(p[0] - r.x, p[1] - r.y))) /
            140,
          0,
          1,
        )
      : r.sector?.includes("Portos")
        ? 1
        : 0.3;
    const mountain = clamp((r.terrain - 1) / 0.6, 0, 1),
      water = clamp(0.2 + rand() * 0.55 + (1 - mountain) * 0.15, 0.1, 0.95);
    return {
      index,
      name: r.name,
      x: r.x,
      y: r.y,
      share: r.share,
      water,
      coast,
      food: clamp(
        0.15 + rand() * 0.35 + water * 0.35 - mountain * 0.15,
        0.05,
        0.98,
      ),
      energy: clamp(
        0.2 + rand() * 0.45 + water * 0.15 + coast * 0.1,
        0.05,
        0.98,
      ),
      minerals: clamp(0.1 + rand() * 0.45 + mountain * 0.35, 0.05, 0.98),
      manufactures: clamp(
        0.15 + rand() * 0.3 + r.access * 0.3 + coast * 0.15,
        0.05,
        0.98,
      ),
    };
  });
  return {
    version: 1,
    anchorGdp: s.metrics.gdp,
    anchorPopulation: s.metrics.population,
    resources,
    stocks: Object.fromEntries(sectors.map((d) => [d.key, 0])),
    policy: Object.fromEntries(
      sectors.map((d) => [
        d.key,
        { reserveMonths: 1, exportShare: 0.7, imports: true },
      ]),
    ),
    contracts: [],
    closed: [],
    lastValueAdded: null,
    history: [],
  };
}
export function validTrade(t) {
  return (
    !!t &&
    t.version === 1 &&
    Number.isFinite(t.anchorGdp) &&
    t.anchorGdp > 0 &&
    t.anchorGdp <= 1e9 &&
    Number.isFinite(t.anchorPopulation) &&
    t.anchorPopulation > 0 &&
    t.anchorPopulation <= 1000 &&
    Array.isArray(t.resources) &&
    t.resources.length > 0 &&
    t.resources.length <= 24 &&
    t.resources.every(
      (r, i) =>
        r.index === i &&
        Number.isFinite(r.share) &&
        r.share > 0 &&
        r.share <= 1 &&
        sectors.every(
          (d) => Number.isFinite(r[d.key]) && r[d.key] >= 0 && r[d.key] <= 1,
        ),
    ) &&
    sectors.every(
      (d) =>
        Number.isFinite(t.stocks?.[d.key]) &&
        t.stocks[d.key] >= 0 &&
        t.stocks[d.key] <= 1e9 &&
        Number.isFinite(t.policy?.[d.key]?.reserveMonths) &&
        t.policy[d.key].reserveMonths >= 0 &&
        t.policy[d.key].reserveMonths <= 6 &&
        Number.isFinite(t.policy[d.key].exportShare) &&
        t.policy[d.key].exportShare >= 0 &&
        t.policy[d.key].exportShare <= 1 &&
        typeof t.policy[d.key].imports === "boolean",
    ) &&
    Array.isArray(t.contracts) &&
    t.contracts.length <= 3 &&
    (t.lastValueAdded === null ||
      (Number.isFinite(t.lastValueAdded) && Math.abs(t.lastValueAdded) <= 1e9))
  );
}
export function resourceAt(s, index) {
  return validTrade(s.trade) ? (s.trade.resources[index] ?? null) : null;
}
export function setTradePolicy(s, key, patch) {
  if (
    !validTrade(s.trade) ||
    !sectors.some((d) => d.key === key) ||
    s.quarter >= 160
  )
    return s;
  if (
    !patch ||
    !Number.isFinite(patch.reserveMonths) ||
    patch.reserveMonths < 0 ||
    patch.reserveMonths > 6 ||
    !Number.isFinite(patch.exportShare) ||
    patch.exportShare < 0 ||
    patch.exportShare > 1 ||
    typeof patch.imports !== "boolean"
  )
    return s;
  const n = structuredClone(s);
  n.trade.policy[key] = {
    reserveMonths: patch.reserveMonths,
    exportShare: patch.exportShare,
    imports: patch.imports,
  };
  return n;
}
function activeContracts(t, q) {
  return t.contracts.filter(
    (c) =>
      sectors.some((d) => d.key === c.key) &&
      typeof c.id === "string" &&
      Number.isFinite(c.quantity) &&
      c.quantity > 0 &&
      c.quantity <= t.anchorGdp &&
      Number.isFinite(c.price) &&
      c.price >= 0.5 &&
      c.price <= 2 &&
      Number.isInteger(c.startedAt) &&
      c.startedAt <= q &&
      Number.isInteger(c.endsAt) &&
      c.endsAt > q &&
      c.endsAt <= 160,
  );
}
export function tradeQuarter(s) {
  if (!validTrade(s.trade)) return null;
  const t = structuredClone(s.trade),
    q = s.quarter,
    pop = clamp(s.metrics.population / t.anchorPopulation, 0.2, 5),
    external =
      { estavel: 1, recessao: 0.72, expansao: 1.2, sancoes: 0.48 }[
        s.external
      ] ?? 1;
  const connected = (s.investments ?? [])
    .filter((p) => p.type === "transport" && p.phase === "operating")
    .reduce((n, p) => n + p.regionShare * Math.min(1, p.coverage / 0.4), 0);
  const logistics = clamp(
      0.35 +
        connected * 0.25 +
        (s.policies.infrastructure ?? 3) * 0.045 +
        (s.capacity ?? 0.65) * 0.25,
      0.3,
      1,
    ),
    contracts = activeContracts(t, q);
  const regional = t.resources.map((r) => ({
    region: r.index,
    name: r.name,
    x: r.x,
    y: r.y,
    output: {},
  }));
  const flows = sectors.map((d, i) => {
    const production = sum(
      t.resources.map((r, j) => {
        const program = (s.investments ?? []).filter(
          (p) =>
            p.region === j && p.type === d.project && p.phase === "operating",
        );
        const expansion = program.length ? 0.7 : 0;
        const amount =
          ((t.anchorGdp * r.share * d.share) / 4) *
          (0.35 + r[d.key]) *
          (0.65 + (s.capacity ?? 0.65) * 0.55) *
          (1 + expansion) *
          (1 + (s.policies.services - 8) * 0.012);
        regional[j].output[d.key] = amount;
        return amount;
      }),
    );
    const cycle = 1 + Math.sin((s.seed % 43) + q * 0.55 + i * 2) * 0.12;
    const demand = ((t.anchorGdp * (0.025 + i * 0.006)) / 4) * external * cycle;
    const price = clamp(
      (0.9 + (cycle - 1) * 0.8 + (1 - external) * 0.3) *
        (d.key === "food" && s.external === "recessao" ? 1.1 : 1),
      0.65,
      1.5,
    );
    const need = ((t.anchorGdp * d.need) / 4) * pop;
    return {
      key: d.key,
      opening: t.stocks[d.key],
      production,
      imports: 0,
      domestic: 0,
      inputs: 0,
      exports: 0,
      closing: 0,
      need,
      unmet: 0,
      demand,
      price,
      reserve: (need * t.policy[d.key].reserveMonths) / 3,
      surplus: 0,
      exportValue: 0,
      importValue: 0,
      agreements: [],
    };
  });
  const by = Object.fromEntries(flows.map((f) => [f.key, f]));
  for (const f of flows) {
    f.capacity = f.production;
    f.demand = Math.max(
      f.demand,
      sum(contracts.filter((c) => c.key === f.key).map((c) => c.quantity)),
    );
  }
  const factoryPlan = Math.min(
    by.manufactures.capacity,
    Math.max(
      0,
      by.manufactures.need +
        by.manufactures.reserve +
        by.manufactures.demand * t.policy.manufactures.exportShare -
        by.manufactures.opening,
    ),
  );
  for (const f of flows) {
    const intermediate =
      f.key === "energy"
        ? factoryPlan * 0.12
        : f.key === "minerals"
          ? factoryPlan * 0.22
          : 0;
    f.production = Math.min(
      f.capacity,
      Math.max(
        0,
        f.need +
          intermediate +
          f.reserve +
          f.demand * t.policy[f.key].exportShare -
          f.opening,
      ),
    );
    for (const r of regional)
      r.output[f.key] *= f.capacity ? f.production / f.capacity : 0;
    const marketSupply =
      ((t.anchorGdp *
        (0.03 + sectors.findIndex((d) => d.key === f.key) * 0.006)) /
        4) *
        (1 + Math.sin(q * 0.41 + (s.seed % 29)) * 0.18) +
      f.production * 0.15;
    f.price = clamp(
      0.75 + (0.35 * f.demand) / Math.max(0.001, marketSupply),
      0.65,
      1.5,
    );
  }
  const available = Object.fromEntries(
    flows.map((f) => [f.key, f.opening + f.production]),
  );
  // Industry is assembled after prioritising domestic energy/mineral requirements.
  available.manufactures = by.manufactures.opening;
  const importLimits = Object.fromEntries(
    flows.map((f) => [f.key, ((t.anchorGdp * 0.055) / 4) * external]),
  );
  function importTo(f, needed) {
    if (!t.policy[f.key].imports) return;
    const buy = Math.max(0, Math.min(needed, importLimits[f.key] - f.imports));
    f.imports += buy;
    available[f.key] += buy;
  }
  function serve(f) {
    importTo(f, f.need - available[f.key]);
    f.domestic = Math.min(f.need, available[f.key]);
    available[f.key] -= f.domestic;
    f.unmet = f.need - f.domestic;
  }
  for (const f of flows.slice(0, 3)) serve(f);
  const factory = by.manufactures,
    capacity = factory.production;
  for (const [key, ratio] of [
    ["energy", 0.12],
    ["minerals", 0.22],
  ])
    importTo(by[key], capacity * ratio - available[key]);
  const produced = Math.min(
    capacity,
    available.energy / 0.12,
    available.minerals / 0.22,
  );
  factory.production = produced;
  for (const [key, ratio] of [
    ["energy", 0.12],
    ["minerals", 0.22],
  ]) {
    by[key].inputs = produced * ratio;
    available[key] -= by[key].inputs;
  }
  const utilization = capacity ? produced / capacity : 0;
  for (const r of regional) r.output.manufactures *= utilization;
  available.manufactures += produced;
  serve(factory);
  let exports = 0,
    imports = 0;
  for (const f of flows) {
    const policy = t.policy[f.key],
      local = contracts.filter((c) => c.key === f.key),
      committed = sum(local.map((c) => c.quantity));
    f.surplus = Math.max(0, available[f.key] - f.reserve);
    const exportLimit = Math.min(
      f.surplus * policy.exportShare,
      ((t.anchorGdp * 0.09) / 4) * logistics,
    );
    f.demand = Math.max(f.demand, committed);
    let left = Math.min(exportLimit, f.demand);
    for (const c of local) {
      const delivered = Math.min(left, c.quantity);
      left -= delivered;
      f.agreements.push({
        id: c.id,
        quantity: c.quantity,
        delivered,
        price: c.price,
      });
      f.exportValue += delivered * c.price;
    }
    const delivered = sum(f.agreements.map((c) => c.delivered)),
      spot = Math.min(left, Math.max(0, f.demand - delivered));
    f.exports = delivered + spot;
    f.exportValue += spot * f.price;
    f.closing = Math.max(0, available[f.key] - f.exports);
    // Storage has a finite carrying capacity; discarded excess stays visible in the ledger.
    f.discarded = Math.max(0, f.closing - t.anchorGdp * 0.25);
    f.closing -= f.discarded;
    f.importValue = f.imports * f.price * 1.08;
    exports += f.exportValue;
    imports += f.importValue;
    t.stocks[f.key] = f.closing;
  }
  const valueAdded = sum(flows.map((f) => f.production - f.inputs)),
    previous = t.lastValueAdded;
  const growth =
    previous === null
      ? 0
      : clamp(
          ((valueAdded - previous) * 1600) / Math.max(0.001, s.metrics.gdp),
          -2.5,
          2.5,
        );
  const shortage =
    sum(flows.map((f) => f.unmet)) /
    Math.max(0.001, sum(flows.map((f) => f.need)));
  const report = {
    quarter: q + 1,
    flows,
    regional,
    exports,
    imports,
    balance: exports - imports,
    valueAdded,
    previousValueAdded: previous,
    growth,
    shortage,
    logistics,
    taxIncluded: (valueAdded * s.policies.tax) / 100,
  };
  t.lastValueAdded = valueAdded;
  t.closed = [
    ...(Array.isArray(t.closed) ? t.closed : []),
    ...contracts.filter((c) => c.endsAt === q + 1),
  ].slice(-12);
  t.contracts = contracts.filter((c) => c.endsAt > q + 1);
  t.history = [
    ...(Array.isArray(t.history) ? t.history : []),
    { quarter: q + 1, exports, imports, balance: report.balance, valueAdded },
  ].slice(-161);
  return { trade: t, report };
}
export function quoteAgreement(s, key, duration = 4) {
  const base = {
    key,
    duration,
    seed: s.seed,
    quarter: s.quarter,
    allowed: false,
  };
  if (
    !validTrade(s.trade) ||
    !sectors.some((d) => d.key === key) ||
    ![4, 8].includes(duration) ||
    s.quarter + duration > 160
  )
    return {
      ...base,
      reason: "Escolha um prazo que caiba no horizonte da partida.",
    };
  if (
    activeContracts(s.trade, s.quarter).length >= 3 ||
    activeContracts(s.trade, s.quarter).some((c) => c.key === key)
  )
    return {
      ...base,
      reason: "Já há acordo neste setor ou as três vagas estão ocupadas.",
    };
  const f = tradeQuarter(s).report.flows.find((f) => f.key === key),
    quantity = Math.floor(f.exports * 0.5 * 1000) / 1000;
  if (quantity <= 0)
    return {
      ...base,
      reason:
        "Não há excedente exportável com a política e a capacidade atuais.",
    };
  return {
    ...base,
    allowed: true,
    quantity,
    price: Math.round(f.price * 0.97 * 1000) / 1000,
    endsAt: s.quarter + duration,
    reason: "",
  };
}
export function signAgreement(s, quote) {
  if (!quote || quote.seed !== s.seed || quote.quarter !== s.quarter) return s;
  const reviewed = quoteAgreement(s, quote.key, quote.duration);
  if (
    !reviewed.allowed ||
    reviewed.quantity !== quote.quantity ||
    reviewed.price !== quote.price
  )
    return s;
  const n = structuredClone(s);
  n.trade.contracts.push({
    id: `${s.seed}:${s.quarter}:${quote.key}`,
    key: quote.key,
    quantity: quote.quantity,
    price: quote.price,
    startedAt: s.quarter,
    endsAt: reviewed.endsAt,
  });
  return n;
}
export function tradeSnapshot(s) {
  if (!validTrade(s.trade)) return null;
  const r = s.tradeReport ?? tradeQuarter(s).report;
  return {
    quarter: r.quarter,
    preview: !s.tradeReport,
    exports: r.exports,
    imports: r.imports,
    balance: r.balance,
    growth: r.growth,
    shortage: r.shortage,
    flows: r.flows.map((f) => ({
      key: f.key,
      capacity: f.capacity,
      production: f.production,
      domestic: f.domestic,
      imports: f.imports,
      exports: f.exports,
      closing: f.closing,
      unmet: f.unmet,
      price: f.price,
    })),
    contracts: activeContracts(s.trade, s.quarter).map(
      ({ key, quantity, price, endsAt }) => ({ key, quantity, price, endsAt }),
    ),
  };
}
export function validateTradeSummary(value) {
  if (!value || typeof value !== "object")
    throw new RangeError("Invalid trade summary");
  const number = (n, min, max) => {
    if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max)
      throw new RangeError("Invalid trade number");
    return n;
  };
  const quarter = number(value.quarter, 0, 160);
  if (
    !Number.isInteger(quarter) ||
    typeof value.preview !== "boolean" ||
    !Array.isArray(value.flows) ||
    value.flows.length !== 4 ||
    new Set(value.flows.map((f) => f?.key)).size !== 4 ||
    !Array.isArray(value.contracts) ||
    value.contracts.length > 3
  )
    throw new RangeError("Invalid trade fields");
  const flows = value.flows.map((f) => {
    if (!sectors.some((d) => d.key === f?.key))
      throw new RangeError("Invalid sector");
    return {
      key: f.key,
      ...Object.fromEntries(
        [
          "capacity",
          "production",
          "domestic",
          "imports",
          "exports",
          "closing",
          "unmet",
        ].map((k) => [k, number(f[k], 0, 1e9)]),
      ),
      price: number(f.price, 0.5, 2),
    };
  });
  const contracts = value.contracts.map((c) => {
    if (!sectors.some((d) => d.key === c?.key))
      throw new RangeError("Invalid agreement");
    return {
      key: c.key,
      quantity: number(c.quantity, 0, 1e9),
      price: number(c.price, 0.5, 2),
      endsAt: number(c.endsAt, quarter, 160),
    };
  });
  return {
    quarter,
    preview: value.preview,
    exports: number(value.exports, 0, 1e9),
    imports: number(value.imports, 0, 1e9),
    balance: number(value.balance, -1e9, 1e9),
    growth: number(value.growth, -2.5, 2.5),
    shortage: number(value.shortage, 0, 1),
    flows,
    contracts,
  };
}
