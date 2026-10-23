# Regional Investments Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans task-by-task. Execução nesta sessão pelo agente principal, conforme desenvolvimento já autorizado.

**Goal:** Entregar contratação, execução e efeitos de investimentos estaduais.
**Architecture:** Ledger puro sem DOM controla custos e fases; API de jogo calcula propostas com dados regionais; adaptador DOM integra comparação e carteira. Modelo e projeções consomem o mesmo ledger. Mapas, balanço e Nilo recebem resumos.
**Tech Stack:** ESM, DOM/CSS, SVG, Node test; sem dependências novas.
**Spec:** docs/superpowers/specs/2026-10-23-regional-investments-design.md

## Global Constraints
- Quatro tipos, três implantações simultâneas, um tipo por estado.
- T160 é o horizonte; política fiscal existente financia pagamentos e manutenção.
- Cenários sem carteira preservados. Nenhum dado ou segredo novo de ambiente.

## Review Focus
- Capacidade baixa muda prazo e nunca cobra acima do contratado.
- Entrega e operação são trimestres diferentes.
- Decisões pendentes e projeções não consomem o cenário original.
- Cliques repetidos e propostas no limite do horizonte não duplicam contrato.
- Salvar/carregar e contexto de IA conservam ledger limitado sem campos extras.

### Task 1: Regras, contabilidade e projeção
Files: create dist/investment-ledger.js, dist/investments.js, tests/investments.test.js; modify model.js, simulation.js.
Interfaces: projectDefs; investmentFinance(s); advanceInvestments(s); investmentEffects(s, region?); quoteInvestment(s,index,type); startInvestment(s,index,type); cancelInvestment(s,id).
- [x] Escrever testes para fases, pagamento exato, manutenção, benefícios, limite/duplicados/cancelamento, baixo acesso, projeção, legado e serialização.
- [x] Executar falha inicial; implementar regras e integração; executar testes existentes e novos.

### Task 2: Interface territorial e carteira
Files: create dist/investment-ui.js, dist/investments.css; modify app.js, index.html, decision-ui.js, atlas-data.js, atlas-map.js.
Interfaces: initInvestmentUI({getState,setState,getSelected,selectRegion,openModal,closeModal,setView,notify}).update(); markers e projetos agregados por estado.
- [x] Implementar comparação, proposta revisável, contratação, carteira, cancelamento e marco de progresso no mapa.
- [x] Mostrar contas e investimentos no balanço, com manutenção e fase explícitas.
- [x] Verificar desktop/mobile, teclado, temas, persistência e ausência de WebGL.

### Task 3: Contexto, documentação e entrega
Files: advisor.js, server/advisor.js, tests/advisor.test.js, build.mjs, README e docs.
- [x] Incluir carteira compacta e validação com limites/somas; conferir orçamento enviado ao provedor com mock.
- [x] Rodar testes, sintaxe, formatação e build; capturar interface; documentar regras/limites.
- [x] Publicar somente arquivos desta tarefa em branch a partir da main atual; abrir PR e conferir CI.

## Limitação de verificação
QA de GPU do Atlas/Three continua pendente; SVG, geometria/GeoJSON e fallback cobertos. Sem aparelho físico de toque ou emulação de preferência do sistema para movimento reduzido.
