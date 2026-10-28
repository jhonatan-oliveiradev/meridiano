import { sectors } from "./trade.js";
import * as maplibre from "./vendor/maplibre-gl.mjs";
import { atlasData } from "./atlas-data.js";

export function createAtlasMap(
  host,
  { state, cities, onSelect, onError, reducedMotion },
) {
  if (!document.querySelector("[data-maplibre-style]")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "vendor/maplibre-gl.css";
    link.dataset.maplibreStyle = "";
    document.head.append(link);
  }
  let disposed = false,
    ready = false,
    current = state,
    layer = "relevo",
    selected = 0;
  const dark = () => document.documentElement.dataset.theme === "dark";
  const palette = () => ({
    water: dark() ? "#101d19" : "#dfebe3",
    land: dark() ? "#344c3c" : "#a9c492",
    ink: dark() ? "#edf5de" : "#203d31",
    border: dark() ? "#a8bc8c" : "#697e54",
  });
  const map = new maplibre.Map({
    container: host,
    pixelRatio: Math.min(devicePixelRatio || 1, 1.5),
    center: [0, 0],
    zoom: 4,
    style: {
      version: 8,
      "font-faces": {
        "Manrope Regular": [
          {
            url: new URL(
              "fonts/manrope-latin-wght-normal.woff2",
              document.baseURI,
            ).href,
          },
        ],
      },
      sources: {},
      layers: [
        {
          id: "background",
          type: "background",
          paint: { "background-color": palette().water },
        },
      ],
    },
    attributionControl: false,
    renderWorldCopies: false,
    maxPitch: 60,
    minZoom: 1,
    maxZoom: 14,
    localIdeographFontFamily: "Manrope, sans-serif",
    canvasContextAttributes: { powerPreference: "low-power" },
  });
  map.addControl(
    new maplibre.NavigationControl({ visualizePitch: true }),
    "bottom-left",
  );
  map.addControl(
    new maplibre.ScaleControl({ maxWidth: 100, unit: "metric" }),
    "bottom-right",
  );
  let cachedState = null,
    cachedData = null;
  function data() {
    if (current !== cachedState) {
      cachedState = current;
      cachedData = atlasData(current, cities);
    }
    return cachedData;
  }
  function reset() {
    const bounds = new maplibre.LngLatBounds();
    for (const point of data().bounds) bounds.extend(point);
    map.fitBounds(bounds, {
      padding: { top: 60, right: 65, bottom: 65, left: 65 },
      duration: reducedMotion.matches ? 0 : 500,
    });
  }
  function recolor() {
    if (!ready || disposed) return;
    const p = palette();
    map.setPaintProperty("background", "background-color", p.water);
    let fill = p.land;
    if (layer === "densidade" && current.territory)
      fill = [
        "interpolate",
        ["linear"],
        ["get", "density"],
        0,
        "#cbdca3",
        100,
        "#94b54a",
        500,
        "#527839",
        1500,
        "#da7635",
        8000,
        "#a53f39",
      ];
    if (layer === "populacao")
      fill = [
        "interpolate",
        ["linear"],
        ["get", "population"],
        0,
        "#d6e6b8",
        5,
        "#83a05b",
        30,
        "#38644f",
      ];
    if (layer === "renda")
      fill = [
        "interpolate",
        ["linear"],
        ["get", "income"],
        0,
        "#e5dba4",
        20000,
        "#8da965",
        50000,
        "#326852",
      ];
    if (layer === "bemestar")
      fill = [
        "interpolate",
        ["linear"],
        ["get", "welfare"],
        0,
        "#ba9155",
        50,
        "#a3b67a",
        100,
        "#34735d",
      ];
    const resource = sectors.find((d) => d.key === layer);
    if (resource)
      fill = [
        "interpolate",
        ["linear"],
        ["get", resource.key],
        0,
        "#254d42",
        1,
        resource.color,
      ];
    map.setPaintProperty("state-fill", "fill-color", fill);
    for (const id of ["economicSites", "economicRoutes"])
      map.setLayoutProperty(id, "visibility", resource ? "visible" : "none");
    map.setFilter("economicRoutes", ["==", ["get", "index"], selected]);
    if (resource)
      map.setPaintProperty("economicRoutes", "line-color", resource.color);
    map.setLayoutProperty(
      "municipal-fill",
      "visibility",
      layer === "densidade" && current.territory ? "visible" : "none",
    );
    map.setPaintProperty("state-borders", "line-color", p.border);
    for (const id of ["state-labels", "major-labels", "minor-labels"]) {
      map.setPaintProperty(id, "text-color", p.ink);
      map.setPaintProperty(id, "text-halo-color", p.water);
    }
    map.setFilter("selected-border", ["==", ["get", "index"], selected]);
  }
  function load() {
    if (disposed) return;
    ready = true;
    const d = data();
    for (const key of [
      "country",
      "projects",
      "publicWorks",
      "publicLinks",
      "economicSites",
      "economicRoutes",
      "states",
      "municipalities",
      "cities",
      "rivers",
      "roads",
      "streets",
      "labels",
    ])
      map.addSource(key, { type: "geojson", data: d[key] });
    map.addLayer({
      id: "state-fill",
      type: "fill",
      source: "states",
      paint: { "fill-color": palette().land },
    });
    map.addLayer({
      id: "municipal-fill",
      type: "fill",
      source: "municipalities",
      paint: {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["get", "density"],
          0,
          "#d0dfa9",
          100,
          "#a8be60",
          500,
          "#567e39",
          2000,
          "#df7c38",
          8000,
          "#ab3e40",
        ],
      },
    });
    map.addLayer({
      id: "rivers",
      type: "line",
      source: "rivers",
      paint: {
        "line-color": "#83bbc7",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1, 10, 4],
      },
    });
    map.addLayer({
      id: "streets",
      type: "line",
      source: "streets",
      minzoom: 7,
      paint: { "line-color": "#d7bc87", "line-width": 1, "line-opacity": 0.5 },
    });
    map.addLayer({
      id: "roads",
      type: "line",
      source: "roads",
      paint: {
        "line-color": "#d6b173",
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 10, 2],
        "line-opacity": 0.7,
      },
    });
    map.addLayer({
      id: "municipal-borders",
      type: "line",
      source: "municipalities",
      minzoom: 6,
      paint: {
        "line-color": "#6b895c",
        "line-width": 0.6,
        "line-opacity": 0.5,
      },
    });
    map.addLayer({
      id: "state-borders",
      type: "line",
      source: "states",
      paint: { "line-color": palette().border, "line-width": 1 },
    });
    map.addLayer({
      id: "selected-border",
      type: "line",
      source: "states",
      paint: { "line-color": "#c7ff3d", "line-width": 2 },
    });
    map.addLayer({
      id: "cities",
      type: "circle",
      source: "cities",
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "population"],
          0,
          2,
          1,
          4,
          10,
          7,
        ],
        "circle-color": [
          "case",
          ["==", ["get", "capital"], 1],
          "#c7ff3d",
          "#f1f4dc",
        ],
        "circle-stroke-color": "#2a5141",
        "circle-stroke-width": 1,
      },
    });
    map.addLayer({
      id: "publicLinks",
      type: "line",
      source: "publicLinks",
      paint: {
        "line-color": [
          "case",
          ["==", ["get", "phase"], "operating"],
          "#c7ff3d",
          "#e3ae63",
        ],
        "line-width": 4,
        "line-opacity": 0.85,
      },
    });
    map.addLayer({
      id: "publicWorks",
      type: "circle",
      source: "publicWorks",
      paint: {
        "circle-radius": 7,
        "circle-color": [
          "case",
          ["==", ["get", "phase"], "operating"],
          "#c7ff3d",
          "#e3ae63",
        ],
        "circle-stroke-color": "#15261c",
        "circle-stroke-width": 2,
      },
    });
    map.addLayer({
      id: "economicRoutes",
      type: "line",
      source: "economicRoutes",
      layout: { visibility: "none" },
      paint: {
        "line-color": "#c7ff3d",
        "line-width": 2.5,
        "line-dasharray": [3, 3],
        "line-opacity": 0.8,
      },
    });
    map.addLayer({
      id: "economicSites",
      type: "circle",
      source: "economicSites",
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 9,
        "circle-color": "#c7ff3d",
        "circle-stroke-color": "#20372d",
        "circle-stroke-width": 2,
      },
    });
    map.addLayer({
      id: "projects",
      type: "circle",
      source: "projects",
      paint: {
        "circle-radius": 10,
        "circle-color": [
          "case",
          ["==", ["get", "operating"], 1],
          "#c7ff3d",
          "#f0b66b",
        ],
        "circle-stroke-color": "#15261c",
        "circle-stroke-width": 1.5,
      },
    });
    for (const [id, source, minzoom, maxzoom, filter, size] of [
      ["state-labels", "labels", 0, 7, undefined, 12],
      ["major-labels", "cities", 3, 24, ["==", ["get", "major"], 1], 12],
      ["minor-labels", "cities", 7, 24, ["==", ["get", "major"], 0], 11],
    ]) {
      map.addLayer({
        id,
        type: "symbol",
        source,
        minzoom,
        maxzoom,
        ...(filter ? { filter } : {}),
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Manrope Regular"],
          "text-size": size,
          "text-offset": id === "state-labels" ? [0, -2] : [0, 1.2],
          "text-anchor": id === "state-labels" ? "center" : "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": palette().ink,
          "text-halo-color": palette().water,
          "text-halo-width": 1.5,
        },
      });
    }
    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [
          "publicWorks",
          "publicLinks",
          "economicSites",
          "economicRoutes",
          "projects",
          "cities",
          "municipal-fill",
          "state-fill",
        ],
      });
      const f = features[0];
      if (!f) return;
      const i = Number(f.properties.index);
      if (f.layer.id === "cities" || f.layer.id === "municipal-fill") {
        const c = cities[i];
        onSelect(c.region, c);
      } else onSelect(i, null);
    });
    map.on("mousemove", (e) => {
      map.getCanvas().style.cursor = map.queryRenderedFeatures(e.point, {
        layers: ["cities", "state-fill"],
      }).length
        ? "pointer"
        : "";
    });
    recolor();
    reset();
  }
  map.on("load", load);
  map.on("error", () => {
    if (!disposed)
      onError(
        "O Atlas não pôde usar a aceleração gráfica. O mapa vetorial continua disponível.",
      );
  });
  const resize = new ResizeObserver(() => {
    if (!disposed) map.resize();
  });
  resize.observe(host);
  return {
    update(s, options = {}) {
      current = s;
      layer = options.layer ?? layer;
      selected = options.selected ?? selected;
      if (ready) {
        const changed = cachedState !== current;
        const d = data();
        if (changed)
          for (const key of [
            "states",
            "municipalities",
            "cities",
            "projects",
            "publicWorks",
            "publicLinks",
            "economicSites",
            "economicRoutes",
          ])
            map.getSource(key).setData(d[key]);
        recolor();
      }
    },
    setTheme: recolor,
    reset,
    zoomBy(delta) {
      map.zoomTo(map.getZoom() + delta, {
        duration: reducedMotion.matches ? 0 : 220,
      });
    },
    focus(index, city = null) {
      const r = city ?? current.territory?.regions[index];
      if (!r) return;
      map.flyTo({
        center: data().project([r.x, r.y]),
        zoom: Math.max(map.getZoom(), 8),
        duration: reducedMotion.matches ? 0 : 650,
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      resize.disconnect();
      map.remove();
    },
  };
}
