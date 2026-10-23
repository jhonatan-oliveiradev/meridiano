export function rng(seed) {
  let a = seed | 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function landPoints(seed) {
  const rand = rng(seed),
    phase = rand() * 6.28;
  return Array.from({ length: 144 }, (_, i) => {
    let t = (i / 144) * Math.PI * 2;
    const r =
      1 +
      0.11 * Math.sin(3 * t + phase) +
      0.055 * Math.cos(7 * t + phase) +
      0.022 * Math.sin(19 * t + phase);
    return [
      460 + Math.cos(t) * 285 * r + Math.sin(t * 2) * 20,
      370 + Math.sin(t) * 282 * r,
    ];
  });
}
export function polygonPath(points) {
  return (
    "M" +
    points.map((p) => p.map((v) => v.toFixed(2)).join(",")).join("L") +
    "Z"
  );
}
export function contains(points, x, y) {
  let c = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    let a = points[i],
      b = points[j];
    if (
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    )
      c = !c;
  }
  return c;
}
export function voronoiCell(site, sites) {
  let poly = [
    [0, 0],
    [1000, 0],
    [1000, 760],
    [0, 760],
  ];
  for (const other of sites) {
    if (other === site) continue;
    let dx = other.x - site.x,
      dy = other.y - site.y,
      c = (other.x ** 2 + other.y ** 2 - site.x ** 2 - site.y ** 2) / 2;
    let next = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length],
        da = dx * a[0] + dy * a[1] - c,
        db = dx * b[0] + dy * b[1] - c;
      if (da <= 0) next.push(a);
      if (da <= 0 !== db <= 0) {
        let t = da / (da - db);
        next.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
    }
    poly = next;
    if (!poly.length) break;
  }
  return poly;
}
export function elevation(x, y, seed) {
  let a = seed * 0.017;
  const ridgeX = 300 + Math.sin(y * 0.008 + a) * 53;
  let h =
    Math.exp(-(((x - ridgeX) / 67) ** 2)) *
    (0.55 + 0.25 * Math.sin(y * 0.015 + a) ** 2);
  h +=
    0.13 * Math.sin(x * 0.014 + y * 0.009 + a) +
    0.1 * Math.cos(y * 0.023 - x * 0.008) +
    0.055 * Math.sin(x * 0.065 + Math.sin(y * 0.04) * 2) +
    0.025 * Math.sin(x * 0.17 + y * 0.12);
  return Math.max(0, Math.min(1, h + 0.19));
}
export function generateCities(seed, regions, land) {
  const random = rng(seed + 9),
    cities = [];
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    cities.push({
      x: r.x + 8,
      y: r.y + 13,
      name: r.capital,
      region: i,
      capital: i === 3,
      major: true,
    });
    let count = 8 + Math.floor(random() * 5),
      attempt = 0;
    while (count && attempt++ < 500) {
      let x = 165 + random() * 610,
        y = 85 + random() * 570;
      let nearest = regions.reduce((a, b) =>
        (a.x - x) ** 2 + (a.y - y) ** 2 < (b.x - x) ** 2 + (b.y - y) ** 2
          ? a
          : b,
      );
      if (
        nearest !== r ||
        !contains(land, x, y) ||
        cities.some((c) => Math.hypot(c.x - x, c.y - y) < 29)
      )
        continue;
      cities.push({
        x,
        y,
        region: i,
        major: false,
        name:
          [
            "São Bento",
            "Boa Vista",
            "Vila Nova",
            "Horizonte",
            "Águas Claras",
            "Jardim do Sol",
            "Santa Rosa",
            "Cedro",
            "Ribeirão",
            "Monte Belo",
            "Estrela",
            "Pinheiros",
          ][count - 1] +
          " " +
          ["da Serra", "do Norte", "da Costa", "do Vale", "do Oeste", "do Sul"][
            i
          ],
      });
      count--;
    }
  }
  return cities;
}
