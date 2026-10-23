# Meridiano · v0.4

Visual: cartographic, tactile, composed. Keep the lime/ink palette, Nilo and local typefaces. Screens fill the available workspace; reading width is bounded inside prose, not on the whole page.

Motion: input feedback 140–180 ms, content 220–320 ms, island size changes 380 ms with a spring-like ease. One signature gesture per view. Reduced motion shows final states immediately; no fake analysis stages or delay.

- Cult UI Dynamic Island: port the compact/medium shell and state transitions to DOM/CSS for simulated quarter events. Expand on demand, dismiss, browse all events, keyboard support. Events are model output, not real-world news.
- Cult UI Prompt Composer: multiline message, context chip, loading line, Ctrl/Cmd+Enter and cancellation. Keep Nilo instead of an unrelated shader avatar. No inert attachment button.
- Cult UI Terminal Animation: adapt sequential lines to a quarter bulletin with real simulation results; no developer commands in the product.
- Cult UI Analytics Chart: gradient series, focusable data points and floating details; exact values remain available without hover.
- Cult UI Timer: elapsed request time, only while a real request is active.
- Cojeev Agent State: compact status field with expressive motion, adapted to Nilo's palette and real request states.
- Reicon: curated SVG symbols from the installed vanilla package, local assets, subtle selected/hover motion.
- Terraink uses MapLibre/OpenStreetMap. Keep Meridiano's fictional geography independent of real-world tiles; add deterministic local road/street detail and a cartographic layer.

The app remains vanilla ESM. These are source-informed framework adaptations, not React packages pasted into a non-React runtime. Sources and licenses are recorded in THIRD_PARTY.md.

## Compositor que se recolhe

- Intenção: entregar altura à resposta e manter a próxima mensagem a um clique, no canto inferior direito da coluna de leitura.
- Superfície única: largura total e 168px de altura viram um círculo de 56px; 144px em desktop baixo e 156px no celular. Duração 440ms, curva cubic-bezier(.22,.8,.22,1). Conteúdo sai em 100ms e entra com pequeno atraso para não comprimir as letras durante a forma.
- Apenas essa troca anima layout: o leitor realmente recebe a altura. O shader e o pulso ficam em camadas separadas e não competem pelas propriedades da transição.
- Consulta aceita recolhe; conclusão mantém leitura; reabertura manual vence o automatismo daquela consulta; erros/cancelamento retornam ao editor. Sugestões de pergunta expandem e focam o campo.
- Textarea recolhido fica inert. O foco vai ao controle compacto se estava no formulário; expandir devolve foco ao textarea. Escape recolhe e rascunho não é apagado pela troca de modo.
- Paper Warp nativo, mesmos parâmetros-base do AI Blob Warp da Cult UI, paleta NX. Importação local sob demanda, uma instância, limite de 12.544 pixels, pausa fora de vista/aba/estado expandido e preferência de movimento reduzido. CSS estático mantém a função sem WebGL.
