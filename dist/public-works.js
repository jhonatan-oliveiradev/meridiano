import { regionsOf } from "./model.js";
import { projectFor } from "./investment-ledger.js";
export function publicWorks(s, cities = s.territory?.cities ?? []) {
  const regions = regionsOf(s),
    roads = s.territory?.roads ?? [];
  return (s.investments ?? [])
    .filter((p) => regions[p.region] && projectFor(p.type))
    .map((p) => {
      const r = regions[p.region],
        local = cities.filter((c) => c.region === p.region),
        order = ["water", "health", "education", "transport"].indexOf(p.type),
        anchor = local[order % Math.max(1, local.length)] ?? r;
      const nearest = roads.length
        ? [...roads]
            .filter((path) => Array.isArray(path) && path.length > 1)
            .sort(
              (a, b) =>
                Math.hypot(a[0][0] - anchor.x, a[0][1] - anchor.y) -
                Math.hypot(b[0][0] - anchor.x, b[0][1] - anchor.y),
            )[0]
        : null;
      return {
        id: p.id,
        region: p.region,
        type: p.type,
        name: projectFor(p.type).name,
        phase: p.phase,
        x: anchor.x,
        y: anchor.y,
        path: p.type === "transport" && nearest ? nearest : [],
      };
    });
}
