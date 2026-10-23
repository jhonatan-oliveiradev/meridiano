import { initialState, policyDefs } from "./model.js";
import { rng } from "./geography.js";
export const governments = [
  "República democrática",
  "República parlamentarista",
  "Monarquia constitucional",
  "Democracia direta",
  "Regime autoritário",
];
export function cabinetFor(government) {
  const roles = {
    "República democrática": {
      title: "Ministro da Fazenda",
      short: "Fazenda",
      office: "Ministério da Fazenda",
    },
    "República parlamentarista": {
      title: "Primeiro-ministro",
      short: "Primeiro-ministro",
      office: "Gabinete do Primeiro-ministro",
    },
    "Monarquia constitucional": {
      title: "Primeiro-ministro",
      short: "Primeiro-ministro",
      office: "Gabinete do Primeiro-ministro",
    },
    "Democracia direta": {
      title: "Coordenador do Conselho",
      short: "Conselho",
      office: "Conselho de Governo",
    },
    "Regime autoritário": {
      title: "Chefe de Planejamento",
      short: "Planejamento",
      office: "Secretaria de Planejamento",
    },
  };
  return {
    name: "Nilo",
    ...(roles[government] ?? roles["República democrática"]),
  };
}
export function randomCountry(seed) {
  if (!Number.isInteger(seed) || seed < 1 || seed > 99999)
    throw new RangeError("Semente inválida");
  const random = rng(seed),
    pick = (a) => a[Math.floor(random() * a.length)],
    between = (a, b, d = 1) => Number((a + random() * (b - a)).toFixed(d));
  const name = pick([
    "Valdora",
    "Solária",
    "Arvênia",
    "Montéria",
    "Lunária",
    "Serena",
    "Verídia",
    "Novera",
    "Altéria",
    "Caldora",
    "Bravena",
    "Orélia",
  ]);
  const s = initialState({
    name,
    seed,
    population: between(2, 140),
    government: pick(governments),
    economy: pick([
      "Economia mista",
      "Liberal",
      "Neoliberal",
      "Social-democrata",
      "Socialista",
    ]),
    external: pick(["estavel", "estavel", "recessao", "expansao", "sancoes"]),
  });
  const wealth = between(7, 48),
    poverty = between(8, 43);
  Object.assign(s.metrics, {
    gdp: s.metrics.population * wealth,
    poverty,
    unemployment: between(3, 17),
    inflation: between(1, 12),
    debt: between(18, 105),
    welfare: between(38, 81),
    approval: between(32, 74),
  });
  const domains = {
    income: [0, 0, 50, 100, 150, 200],
    pension: [35, 50, 65, 75, 90],
    labor: [25, 40, 55, 70, 85],
    tax: [22, 26, 30, 34, 38],
    services: [5, 7, 9, 11, 13],
    infrastructure: [1, 2, 3, 4, 5],
  };
  for (const p of policyDefs) s.policies[p.key] = pick(domains[p.key]);
  s.capacity = between(0.4, 0.85, 2);
  s.history = [{ quarter: 0, ...s.metrics }];
  s.generated = { seed, version: 1 };
  s.events = [
    {
      title: "Condições iniciais sorteadas",
      detail:
        "População, economia e políticas foram geradas para este país. Abra Políticas para ajustar as escolhas.",
    },
  ];
  return s;
}
