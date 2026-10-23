# Fonts and character assets

- **Manrope** and **Space Grotesk**: locally hosted variable Latin fonts distributed through @fontsource-variable packages. Their SIL Open Font License files are copied to dist/fonts at build time. Fontsource: https://fontsource.org/fonts/manrope and https://fontsource.org/fonts/space-grotesk.
- **Three.js**: MIT; license retained in dist/vendor/THREE-LICENSE.txt by the build script.
- **Nilo**: created for Meridiano in https://avatars.bible-strong.app/ by configuring a new rounded cube (245×225×155, roundness 0.28), body #c7ff3d and eyes #111316. Avatar Lab author: Stéphane Montlouis-Calixte (@_smontlouis). Original portable .avatar.json and neutral/happy/thinking SVG Photo Mode exports are retained under docs/avatar-source. Meridiano's own prepare-avatar.py adds a lime tonal gradient, an unclipped frame, and eye-group selectors; cabinet-avatar.js provides UI reactions.

The Avatar Lab application and its published renderer packages are AGPL-3.0-only. Those runtime packages and their rendering code are not bundled in Meridiano. This integration uses the character data and artwork exported through the authoring interface, plus Meridiano's own DOM/CSS controller. It does not claim support for every animation in the Lab's runtime catalog. The exported .avatar.json remains available for further editing in the Lab.

**Color reference:** https://github.com/jhonatan-oliveiradev/nx-creative-studio, app/globals.css: #c7ff3d lime, #ff5a19 orange, #070807 background, #0d0f0d surface. No source UI components from that repository were copied.


## v0.4 interface research and adaptations

- **Reicon 1.2.5** by devchauhan, MIT. `scripts/vendor-reicon.mjs` extracts a curated set of outline paths from the installed vanilla package into the local `dist/assets/reicon.svg` sprite. No icon CDN or full catalog is shipped to the browser. License: `docs/licenses/reicon.txt`. https://reicon.dev · https://github.com/dqev/reicon
- **Cult UI** by Jordan Gilliam, MIT. Dynamic Island, Prompt Composer, Terminal Animation, Analytics Chart and Timer were studied from their public registry sources at https://www.cult-ui.com/r/{component-name}.json on 2026-10-23. `dist/interactions.js`, `dist/playful.css`, the composer markup and chart interactions are framework adaptations for Meridiano's existing DOM/ESM application: compact/expanded event shell, context-aware multiline input, line reveals, point details and elapsed request time. They do not import the original React runtime or claim API compatibility with the React primitives. Retained copyright/license: `docs/licenses/cult-ui.txt`.
- **Cojeev / 000h Agent State** (https://cojeev.com/ui/docs/agent-state/) informed the request-status field's compact, expressive movement. Meridiano uses its own CSS bars and Nilo's palette; no Cojeev component source is distributed.
- **Terraink** was researched at https://terraink.app and https://github.com/yousifamanuel/terraink. Its renderer is MapLibre GL JS with OpenStreetMap data. No Terraink code, branding, tiles or datasets are included. Meridiano's Atlas mode and road/street geometry remain locally generated fictional data, with no implied real-world coordinates, routing or travel-time model.

- **AI Blob Warp (Cult UI)**: circular frame, Warp parameters and transform pulse adapted from `https://www.cult-ui.com/r/ai-blob-warp.json` on 2026-10-23 into `dist/ai-blob.js` and `dist/conversation.css`. Retains the existing Cult UI MIT notice. The application uses the native ESM Paper shader instead of the React/Motion wrappers.
- **Paper Shaders 0.0.82** by Paper Design, Apache-2.0, pinned dependency with no transitive runtime dependencies. Only Warp and its runtime dependencies are copied by `scripts/vendor.mjs` into the generated local vendor directory. LICENSE and NOTICE accompany the distribution. Imports load lazily on first compact use; the 56px control renders at at most 12,544 physical pixels, pauses while expanded/offscreen/hidden or with reduced motion, and has a static CSS fallback. https://github.com/paper-design/shaders

## v0.7 · geografia e Atlas

- **D3 Delaunay 6.0.4** (ISC), **simplex-noise 4.0.3** (MIT) e **polygon-clipping 0.15.7** (MIT) formam o bundle ESM local `geography-engine.js`, gerado por esbuild 0.28.2 no build. Delaunator (ISC), robust-predicates (Unlicense) e splaytree (MIT) são dependências transitivas do gerador. Avisos embutidos são preservados e licenças são copiadas para `dist/vendor/`; splaytree publica sua licença no Readme, de onde o script a extrai.
- **MapLibre GL JS 6.15.0** (BSD-3-Clause, com avisos de terceiros no LICENSE.txt distribuído) é carregado sob demanda, junto do worker ESM e CSS locais. Licença copiada para `dist/vendor/maplibre-gl-LICENSE.txt`. Usa GeoJSON gerado pelo Meridiano e fonte Manrope local; sem tiles, glyph server, basemap ou sprites externos. https://maplibre.org/maplibre-gl-js/docs/
- Nenhum código ou recurso visual do Terraink foi copiado. A geração de terreno e as regras demográficas são próprias; não reproduzem dados geográficos reais.


## Personagens do gabinete · 2026-10-23

**Lia**, **Caio** e **Iara** foram criados na interface do Avatar Lab (mesmo autor e condições dos exports do Nilo acima). Lia: diamante 235×260×215, coral #ff8a58; Caio: esfera 240×240×240, verde-água #79d8cb; Iara: cápsula lilás #b6a0ef. Definições originais `.avatar.json` e poses Photo Mode 00 (neutral), 01 (thinking) e 13 (happy) permanecem em `docs/avatar-source`. Os nomes thinking/happy são estados de apresentação do Meridiano; não são nomes oficiais desses presets no Lab. O script próprio adiciona gradientes e seletores de olhos aos SVGs. Nenhum runtime ou código de renderização do Lab é distribuído.
