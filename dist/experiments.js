const canonical = (v) =>
  v && typeof v === "object"
    ? Array.isArray(v)
      ? v.map(canonical)
      : Object.fromEntries(
          Object.keys(v)
            .sort()
            .filter((k) => v[k] !== undefined)
            .map((k) => [k, canonical(v[k])]),
        )
    : v;
function signature(s) {
  const copy = structuredClone(s);
  delete copy.experiment;
  const text = JSON.stringify(canonical(copy));
  let a = 2166136261,
    b = 333555777;
  for (const c of text) {
    a = Math.imul(a ^ c.charCodeAt(0), 16777619);
    b = Math.imul(b ^ c.charCodeAt(0), 2246822519);
  }
  return (
    (a >>> 0).toString(16).padStart(8, "0") +
    (b >>> 0).toString(16).padStart(8, "0")
  );
}
export function branchInfo(s) {
  const e = s?.experiment;
  return e?.version === 1 &&
    typeof e.rootId === "string" &&
    typeof e.branchId === "string" &&
    typeof e.label === "string" &&
    e.label.length <= 70 &&
    /^[a-f0-9]{16}$/.test(e.originSignature) &&
    Number.isInteger(e.originQuarter) &&
    e.originQuarter >= 0 &&
    e.originQuarter <= s.quarter &&
    e.originSeed === s.seed
    ? e
    : null;
}
export function makeExperiment(s, { rootId, aId, bId, name }) {
  if (
    ![rootId, aId, bId].every(
      (v) => typeof v === "string" && v.length > 0 && v.length <= 80,
    ) ||
    new Set([rootId, aId, bId]).size !== 3 ||
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 60
  )
    throw Error("Experimento inválido");
  const origin = structuredClone(s);
  delete origin.experiment;
  const common = {
    version: 1,
    rootId,
    originQuarter: s.quarter,
    originSeed: s.seed,
    originSignature: signature(origin),
  };
  const branch = (id, label) => ({
    id,
    name: `${name} · ${label}`,
    kind: "branch",
    state: {
      ...structuredClone(origin),
      experiment: { ...common, branchId: id, label },
    },
  });
  return {
    origin: {
      id: rootId,
      name: `${name} · ponto de partida`,
      kind: "origin",
      state: origin,
    },
    a: branch(aId, "Caminho A"),
    b: branch(bId, "Caminho B"),
  };
}
export function syncBranch(s, saved) {
  const e = branchInfo(s);
  if (!e) return saved;
  return saved.map((item) =>
    item.id === e.branchId && branchInfo(item.state)?.rootId === e.rootId
      ? { ...item, state: structuredClone(s) }
      : item,
  );
}
export function compareBranches(a, b) {
  const x = branchInfo(a),
    y = branchInfo(b);
  if (
    !x ||
    !y ||
    x.rootId !== y.rootId ||
    x.originSignature !== y.originSignature ||
    x.originQuarter !== y.originQuarter ||
    x.originSeed !== y.originSeed
  )
    return { related: false };
  const map = new Map((b.history ?? []).map((h) => [h.quarter, h]));
  const points = (a.history ?? [])
    .filter(
      (h) =>
        h.quarter >= x.originQuarter &&
        h.quarter <= Math.min(a.quarter, b.quarter) &&
        map.has(h.quarter),
    )
    .map((h) => ({ quarter: h.quarter, a: h, b: map.get(h.quarter) }))
    .sort((a, b) => a.quarter - b.quarter);
  if (!points.length) return { related: false };
  const last = points.at(-1);
  return {
    related: true,
    originQuarter: x.originQuarter,
    quarter: last.quarter,
    a: last.a,
    b: last.b,
    points,
    extraA: a.quarter - last.quarter,
    extraB: b.quarter - last.quarter,
  };
}
