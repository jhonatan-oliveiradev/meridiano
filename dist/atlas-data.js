import { stateSituation } from "./map-situation.js";
import { resourceAt, sectors, validTrade } from "./trade.js";
import { clipping } from "./vendor/geography-engine.js";
import { landFor, voronoiCell } from "./geography.js";
import { regionsOf, regionalMetrics, municipalMetrics } from "./model.js";
import { publicWorks } from "./public-works.js";
const fc = (features) => ({ type: "FeatureCollection", features });
export function atlasData(state, cities) {
  const regions = regionsOf(state),
    land = landFor(state),
    scale = (state.territory?.kmPerUnit ?? 1) * 1000;
  const project = ([x, y]) => [
    ((((x - 460) * scale) / 6378137) * 180) / Math.PI,
    ((2 * Math.atan(Math.exp(((370 - y) * scale) / 6378137)) - Math.PI / 2) *
      180) /
      Math.PI,
  ];
  const feature = (geometry, properties) => ({
    type: "Feature",
    geometry,
    properties,
  });
  const polygon = (multi, props) =>
    feature(
      {
        type: "MultiPolygon",
        coordinates: multi.map((p) => p.map((r) => r.map(project))),
      },
      props,
    );
  const country = [[[...land, land[0]]]];
  const states = regions.map((r, i) =>
    polygon(
      r.shape ?? clipping.intersection(country, [[voronoiCell(r, regions)]]),
      {
        index: i,
        name: r.name,
        ...regionalMetrics(state, i),
        situation: stateSituation(state, i).level,
        ...Object.fromEntries(
          sectors.map((d) => [d.key, resourceAt(state, i)?.[d.key] ?? 0]),
        ),
      },
    ),
  );
  const municipalities = state.territory
    ? cities.map((c, i) =>
        polygon(c.shape, {
          index: i,
          region: c.region,
          name: c.name,
          ...municipalMetrics(state, c),
        }),
      )
    : [];
  const points = cities.map((c, i) =>
    feature(
      { type: "Point", coordinates: project([c.x, c.y]) },
      {
        index: i,
        region: c.region,
        name: c.name,
        major: c.major ? 1 : 0,
        capital: c.capital ? 1 : 0,
        population: state.territory
          ? municipalMetrics(state, c).population
          : regionalMetrics(state, c.region).population /
            cities.filter((v) => v.region === c.region).length,
      },
    ),
  );
  const line = (path) =>
    feature({ type: "LineString", coordinates: path.map(project) }, {});
  const works = publicWorks(state, cities);
  const resources = validTrade(state.trade) ? state.trade.resources : [],
    port = [...resources].sort((a, b) => b.coast - a.coast)[0];
  return {
    economicSites: fc(
      resources.map((r) =>
        feature(
          { type: "Point", coordinates: project([r.x - 18, r.y - 24]) },
          { index: r.index, name: r.name },
        ),
      ),
    ),
    economicRoutes: fc(
      resources.map((r) =>
        feature(
          {
            type: "LineString",
            coordinates: [
              [r.x, r.y],
              [port.x, port.y],
              [925, 115],
            ].map(project),
          },
          { index: r.index },
        ),
      ),
    ),
    publicWorks: fc(
      works.map((p) =>
        feature(
          { type: "Point", coordinates: project([p.x, p.y]) },
          { index: p.region, name: p.name, phase: p.phase, type: p.type },
        ),
      ),
    ),
    publicLinks: fc(
      works
        .filter((p) => p.path.length > 1)
        .map((p) =>
          feature(
            { type: "LineString", coordinates: p.path.map(project) },
            { index: p.region, phase: p.phase },
          ),
        ),
    ),
    country: fc([polygon(country, { name: state.name })]),
    states: fc(states),
    municipalities: fc(municipalities),
    cities: fc(points),
    projects: fc(
      regions.flatMap((r, i) => {
        const ps = (state.investments ?? []).filter((p) => p.region === i);
        return ps.length
          ? [
              feature(
                { type: "Point", coordinates: project([r.x + 15, r.y + 15]) },
                {
                  index: i,
                  count: ps.length,
                  operating: ps.every((p) => p.phase === "operating") ? 1 : 0,
                },
              ),
            ]
          : [];
      }),
    ),
    rivers: fc((state.territory?.rivers ?? []).map(line)),
    roads: fc((state.territory?.roads ?? []).map(line)),
    streets: fc((state.territory?.streets ?? []).map(line)),
    labels: fc(
      regions.map((r, i) =>
        feature(
          { type: "Point", coordinates: project([r.x, r.y]) },
          { index: i, name: r.name },
        ),
      ),
    ),
    bounds: land.map(project),
    project,
  };
}
