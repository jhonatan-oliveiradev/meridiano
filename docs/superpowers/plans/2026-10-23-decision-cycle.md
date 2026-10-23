# Decision cycle implementation plan

**Goal:** Integrar previsão de políticas, balanço trimestral e acontecimentos com escolhas.
**Architecture:** Motor econômico existente recebe modificadores opcionais de um turno. `simulation.js` coordena projeção pura, comparação de políticas, acontecimentos determinísticos e resolução idempotente. `decision-ui.js` renderiza cartões e diálogos; app controla persistência, tempo e navegação.
**Tech Stack:** JavaScript ESM, CSS, Node test, HTML existente.
**Spec:** docs/superpowers/specs/2026-10-23-decision-cycle-design.md

## Constraints
Sem dependências novas; manter cenários v1, determinismo, 160 trimestres, altura desktop e movimento reduzido. Projeções excluem acontecimentos desconhecidos; efeitos extraordinários cobram uma única vez.

## Review focus
Cenários antigos sem campos novos; limite de 160; clique duplicado em escolha; projeção sem mutação ou cobrança; recarregamento e retomada de decisões pendentes.

## Tasks
- [x] Testar projeção comparativa pura, custo de transferências, efeito único, resolução inválida/duplicada, replay determinístico, compatibilidade v1 e limite de 160.
- [x] Implementar `forecastPolicies(state)`, `projectQuarter(state)`, `advanceTurn(state)` e `resolveDecision(state, eventId, choiceId)` em `dist/simulation.js`; modificadores limitados em `model.js`.
- [x] Integrar previsão com desfazer, balanço e decisões em `dist/decision-ui.js`, `dist/decisions.css`, `index.html`, `app.js` e ilha de eventos.
- [x] Verificar sintaxe, testes, formatação e build; testar controles, escolhas, pausa, persistência e layout no navegador.
- [x] Documentar regras e evidências, publicar branch e PR contra main pelo conector GitHub.
