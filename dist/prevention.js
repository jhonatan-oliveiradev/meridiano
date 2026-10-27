import { regionsOf, clamp } from "./model.js";
import { projectFor } from "./investment-ledger.js";
const programs = {
  water: ["water"],
  services: ["health", "education"],
  freight: ["transport"],
  security: [],
};
export const preventionProgram = {
  water: "water",
  services: "health",
  freight: "transport",
};
export function preventionAt(s, key, region) {
  const r = regionsOf(s)[region];
  if (!r || !Object.hasOwn(programs, key)) return null;
  let network = 0;
  for (const type of programs[key]) {
    const def = projectFor(type);
    // Coverage is bounded by the current local population, so growth can erode protection.
    const delivered = Math.max(
      0,
      ...(s.investments ?? [])
        .filter(
          (p) =>
            p.region === region && p.type === type && p.phase === "operating",
        )
        .map((p) =>
          clamp(
            (Number.isFinite(p.people)
              ? p.people / (s.metrics.population * r.share)
              : p.coverage) / def.coverage,
            0,
            1,
          ),
        ),
    );
    network += delivered * (type === "education" ? 0.15 : 0.6);
  }
  const baseline =
    key === "security"
      ? (s.metrics.preventionCapacity ?? 35) * 0.005 +
        (s.metrics.investigation ?? 40) * 0.002 +
        (s.metrics.trust ?? 55) * 0.001
      : clamp(s.capacity ?? 0.65, 0.35, 0.95) * 0.15 +
        (clamp(
          s.policies[key === "services" ? "services" : "infrastructure"] ?? 0,
          0,
          key === "services" ? 18 : 10,
        ) /
          (key === "services" ? 18 : 10)) *
          0.25;
  return {
    key,
    region,
    regionName: r.name,
    protection: clamp(
      baseline +
        network +
        (key === "security" ? 0 : clamp(r.access, 0, 1) * 0.25),
      0,
      0.92,
    ),
    program: preventionProgram[key] ?? null,
  };
}
export function assessPrevention(s, key) {
  if (!Object.hasOwn(programs, key)) return null;
  // A synthetic exposure shared by regions. Same seed and quarter replay exactly.
  let hash = (s.seed + Math.imul(s.quarter + 1, 2654435761)) >>> 0;
  for (const c of key) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
  const intensity = 0.3 + (hash % 700) / 1000;
  const weakest = regionsOf(s)
    .map((_, i) => preventionAt(s, key, i))
    .sort((a, b) => a.protection - b.protection || a.region - b.region)[0];
  return { ...weakest, intensity, contained: weakest.protection >= intensity };
}
export function reviewedPrevention(s, key, p) {
  return p &&
    p.key === key &&
    Object.hasOwn(programs, key) &&
    Number.isInteger(p.region) &&
    regionsOf(s)[p.region] &&
    Number.isFinite(p.protection) &&
    p.protection >= 0 &&
    p.protection <= 0.92 &&
    Number.isFinite(p.intensity) &&
    p.intensity >= 0.3 &&
    p.intensity < 1
    ? {
        ...p,
        regionName: regionsOf(s)[p.region].name,
        program: preventionProgram[key] ?? null,
      }
    : null;
}
export function reduceAdverse(effect, factor) {
  return Object.fromEntries(
    Object.entries(effect).map(([key, value]) => {
      const adverse = ["growth", "welfare", "trust"].includes(key)
        ? value < 0
        : value > 0;
      return [key, value * (adverse ? clamp(factor, 0, 1) : 1)];
    }),
  );
}
