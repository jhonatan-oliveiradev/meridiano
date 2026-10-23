# Observable behavior
Source: user conversation, approved atlas and synthetic simulation concept. No external accounts, billing, permissions or server records in v0.1.
## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native select | DESIGN.md | Platform popup | Browser keyboard |
| Form | countryForm in index.html | User approved country settings | Native controls, custom inline error | Browser invalid/save |
| Scrollbar | style.css global | DESIGN.md | Root, panels | Browser narrow |
| Toast | notify in app.js | This document | Info, warning | Browser live feedback |
| CRUD | scenario functions in app.js | Local-only scenario model | Save, load, export, remove | Browser save/load |
## Workflows
Map click or region list selects region and exposes local indicators. Layers change map encoding and legend. Policy changes apply on next quarter, staged settings persist. Quarter advancement updates simulation, bounded to 40 years. Saved scenarios are snapshots in localStorage; save failures keep current session and show message. Loading restores terrain seed and all metrics. Export JSON works without storage. New country retains saved snapshots and asks explicit confirmation about replacing the active unsaved simulation. Native dialog owns focus trap, Escape and focus restoration; close button always available. Nonmodal region panel never traps focus. Locale is pt-BR, synthetic currency M$, periods by quarter. Methods state equations and limitations. No validated real-world forecasts.

## v0.2 user-approved additions
Source: user request for Gemini adviser, Apple-like design, dark/light themes and playable interactions.

- Theme: theme controls in app.js own light/dark/system preference. Bootstrap in index.html resolves the initial theme before paint. Storage errors retain session behavior. On narrow screens the two explicit theme choices remain visible.
- Adviser: dist/advisor.js owns request lifecycle and result rendering. POST /api/advisor sends an allowlisted snapshot and optional question; key is server-only. The user must deliberately consult; no automatic Gemini requests during playback. Results are plain text. Changing state aborts pending requests and marks displayed answers stale. Cancel, retry, timeout, missing configuration and quota errors leave the simulation available. Cache holds at most eight snapshot/question results in memory.
- Loading: buttons cannot launch duplicate requests; a cancellable loading row is visible. A missing key shows an unavailable state, not fabricated advice. Opening a dialog pauses playback. Playback also stops when the document is hidden or the 40-year horizon is reached.
- 3D: terrain3d.js owns the optional Three.js scene; switching to 2D disposes renderer, controls, geometry, materials, observers and events. On-demand rendering only, no idle animation loop. WebGL failure returns to SVG and explains why. State selectors, zoom and recenter controls remain available. Mobile regional detail is placed after the map. The 3D scale bar is hidden because perspective does not preserve a single scale.
- API: same-origin POST with JSON content and a custom header; bounded payload, strict snapshot ranges, output validation and short timeout. Per-IP warm-instance throttling is a best-effort limit, not a durable distributed quota. No server-side account or authorization model is introduced. Provider quotas and deployment firewall controls remain deployment responsibilities.


## v0.3 user-approved additions
Source: current request for viewport fit, custom fonts, Creative Studio colors, random countries and a government-specific cabinet/avatar.

Desktop root cannot scroll: sidebar, content views and region inspector own overflow. Mobile retains natural page scroll. Fonts are locally hosted variable WOFF2 with swap fallback.

The new-country dialog has “Gerar país aleatório”. It updates a draft and shows a preview without changing the active simulation. The existing explicit create action commits the draft; Cancel discards it. A seed reproduces the generator algorithm, not later user overrides. Generated name, government, economic orientation, external context, population, metrics, policies and capacity are recorded at quarter zero. Government and ideology remain independent from economic bonuses. Manual edits to name, government, context, population and seed are respected.

country.js owns office mapping: democratic republic → finance minister; parliamentary republic / constitutional monarchy → prime minister; direct democracy → council coordinator; authoritarian regime → planning chief. These are fictional game roles, not universal constitutional claims. Existing #conselheiro links keep working. Title updates everywhere visible and in the provider instruction.

Nilo remains optional decoration around the existing usable adviser. Click/keyboard activation greets; requests show a thinking pose, successful results a happy pose, failures a recoverable state. Local SVG assets load on first visibility. No third-party runtime, tracker or automatic AI call is added. Blinking and motion pause offscreen/hidden and with reduced motion. SVG files and original exported definitions are kept as project assets.


## v0.4 · interação

- A área de conteúdo usa toda a largura disponível. Somente o texto corrido tem limite de leitura.
- O demonstrativo de políticas é uma projeção anual e acompanha os controles; efeitos continuam entrando no próximo trimestre.
- A ilha anuncia somente eventos produzidos pelo modelo no trimestre simulado. Não há notícias reais ou eventos aleatórios inventados por IA. Pode recolher, reabrir, fechar com Escape ou ir aos indicadores.
- Cartões de indicadores selecionam a série. Pontos do gráfico oferecem valor por mouse/foco e navegação pelas setas.
- O compositor limpa o campo no envio aceito, por botão ou Enter; Ctrl/Cmd+Enter insere uma nova linha. Exibe espera e tempo somente enquanto uma requisição está ativa; cancelamento não apaga uma análise anterior.
- O modo Atlas exibe rede viária fictícia. O traçado é decorativo e não altera os cálculos de execução/transporte.
- Motion reduzido elimina loops e entradas decorativas. Os controles e dados permanecem disponíveis.


## v0.5 · resposta e personagem

- Metadados da resposta usam Nilo e o período; a marca do provedor não aparece no estado normal do gabinete.
- Somente a área de leitura rola. A resposta extensa não reduz a altura do compositor nem do textarea.
- Revelação progressiva pode ser concluída pelo botão Mostrar resposta completa. Rolar para cima interrompe o acompanhamento automático; trocar o cenário ou ocultar a aba conclui a apresentação. O leitor de tela não recebe cada fragmento como uma notificação.
- Movimento reduzido apresenta todo o texto imediatamente. Não há atraso artificial na chamada de rede.
- Nilo maior aparece a partir de 1280 px, numa coluna que não disputa altura com o compositor. Cumprimento e giro funcionam por teclado; ficam indisponíveis durante a consulta/revelação. Não há rastreamento por câmera.

## v0.6 · ciclo de decisões

- Previsão compara até quatro trimestres com as políticas no início do trimestre; mostra também o próximo trimestre nos detalhes. Inclui decisões escolhidas, sem inventar respostas a pendências nem acontecimentos futuros.
- Desfazer restaura apenas as políticas editadas; decisões já escolhidas continuam agendadas.
- Avanço manual abre balanço; reprodução disponibiliza o balanço sem interromper cada turno. Acontecimentos pendentes interrompem a reprodução e bloqueiam o avanço até uma resposta válida.
- Escolhas mostram custo extraordinário e modificadores antes da confirmação. Fechar ou decidir depois conserva a pendência. Uma resposta vale uma vez no próximo trimestre.
- Balanço e pendência ficam acessíveis na linha de tempo desktop e em Indicadores; no celular, a ação de avanço e a ilha permitem resolver o acontecimento.
- Salvar, retomar e recarregar conservam campos novos opcionais sem invalidar cenários v1. Grupos e prazos são descritos como regras sintéticas; acontecimentos têm origem regional narrativa e impacto nacional nesta etapa.

## Compositor compacto

- Consulta aceita recolhe o painel em um blob no canto; controles recolhidos ficam `inert`, fora da navegação por teclado. A área liberada aumenta a altura de leitura.
- O botão Escrever para Nilo expande e foca o textarea, inclusive durante a resposta. Rascunhos são preservados; abrir manualmente impede um novo recolhimento na chegada/conclusão da mesma resposta.
- O painel permanece compacto ao terminar a resposta. Botão Recolher e Escape permitem voltar ao modo de leitura. Erro, cancelamento e troca de cenário retornam ao painel expandido.
- Transição de 440ms entre a superfície expandida e o círculo, com conteúdo em crossfade para evitar distorcer texto. O layout é animado somente durante essa troca de estado, para efetivamente devolver espaço ao leitor.
- Movimento reduzido desativa deslocamentos/pulso e pausa o shader. WebGL indisponível mantém um gradiente e todas as ações utilizáveis. Não existe captura de voz ou microfone.
