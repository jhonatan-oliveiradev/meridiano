# Verificação v0.2

- `npm run check`: sintaxe dos módulos de cliente, servidor e scripts.
- `npm test`: 16 testes (seis do modelo original, oito do Conselheiro/API, dois da geometria 3D).
- `npm run format:check`: formatação dos arquivos de implementação.
- `npm run build`: vendor local do Three.js e saída estática em build/; API permanece na raiz para a Vercel.
- Auditoria estática premium estrita sem achados na rodada de implementação.
- Browser desktop: temas claro/escuro, persistência após reload, navegação, painel do Conselheiro e estado sem chave. O caminho de sucesso Gemini, rate limit, timeout, saídas inválidas, origem e payload são exercitados por testes com transporte simulado, sem usar chave real.
- Browser em iframe de 390×844: viewport real do documento, sem overflow horizontal; painel regional abaixo do mapa. Não substitui teste físico de toque em iPhone/Android.
- Reprodução automática em 4× avançou trimestres; botão de pausa retornou aria-pressed=false.
- Browser WebGL: contexto desabilitado pelo ambiente (GL_VENDOR=Disabled). Retorno automático para SVG verificado. Renderização GPU, órbita, picking 3D e FPS **não validados** nesta máquina. A geometria foi validada sem GPU: reprodução, normais finitas, orçamento de vértices/triângulos e centroides terrestres.
- Recursos Three.js: DPR limitado a 1,5, desenho por demanda, observers e descarte explícito. São decisões de implementação, não resultados de benchmark.

Pendente: chamada Gemini com a chave real e deploy Vercel com a função Node; inspeção 3D em aparelho com WebGL habilitado; auditoria WCAG completa; benchmark em hardware do usuário. Sem validação científica do motor econômico.

## v0.3

- 19 automated tests: adds generator reproducibility, 120 randomized countries with policy/API/12-quarter invariants, and government-office mapping without numerical bonuses.
- Browser desktop 1363×936: root scrollHeight=clientHeight=936 and scrollWidth=clientWidth=1363.
- Browser iframe 1280×720: root 720/720, width 1280/1280; 1024×600: root 600/600, width 1024/1024. Mobile 390×844 allows natural vertical scrolling and no horizontal overflow.
- Browser: randomization fills preview, manual choice of parliamentary republic is preserved on creation, initial indicators differ from Aurora, and office becomes Primeiro-ministro. Nilo SVG loads; click changes greeting. Fonts, colors and both themes inspected. Original poses exported through Avatar Lab UI, not reconstructed from a screenshot.
- Existing limitations for live Gemini credentials and WebGL GPU validation still apply. No benchmark or scientific calibration claims.
