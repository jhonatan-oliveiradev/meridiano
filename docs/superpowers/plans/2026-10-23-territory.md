# Territory implementation plan

**Goal:** Criar geografia v2 reproduzível e demografia local conservativa, com Atlas interativo.
**Architecture:** `territory.js` gera polígonos e dados imutáveis; `geography.js` fornece relevo e acesso legado/v2; `model.js` calcula índices locais com fallback. App e Three usam o mesmo território. `atlas-map.js` adapta os dados para MapLibre sem fontes externas.
**Tech Stack:** ESM, D3 Delaunay, simplex-noise, polygon-clipping, MapLibre, Three, esbuild somente no build.
**Spec:** docs/superpowers/specs/2026-10-23-territory-design.md

## Constraints
Cenários v1 intocados; sem novos segredos; gerar uma vez por país. Rótulos e posições reproduzíveis. Sem prometer migração, estradas econômicas ou calibração real.

## Review focus
Sementes extremas, população 1–500 milhões, município costeiro minúsculo, retomada de cenário antigo, ausência de WebGL, troca rápida de renderizador durante import.

## Tasks
- [x] Testar diversidade, somas, inclusão espacial, densidade, reprodução e persistência.
- [x] Implementar gerador e referências de território em `geography.js`, `territory.js`, `country.js` e `model.js`.
- [x] Adaptar SVG/Three e painel municipal, configuração e camada de densidade no app.
- [x] Integrar Atlas MapLibre local sob demanda com seleção, zoom e fallback SVG.
- [x] Verificar testes/sintaxe/formatação/build e fluxos no browser, documentar e publicar PR.

## Verification limitation
Browser sem WebGL: fallback conferido, geometria Three/GeoJSON testados em CPU. Renderização GPU e desempenho em dispositivo físico permanecem pendentes; documentados em docs/VERIFICATION.md.
