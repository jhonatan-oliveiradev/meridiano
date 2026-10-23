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


## v0.4

- Production issue reproduced with one fictional default-country POST: HTTP 502 / PROVIDER_ERROR; GET/UI confirmed a configured key. The previous implementation discarded Google's error details. Vercel runtime-log access returned 403; environment metadata access was also unavailable. No real key was read or copied. The legacy 2.5 access restriction is a likely cause, not a confirmed provider error body.
- Default changed to the documented current Flash-Lite; one bounded fallback for unavailable legacy 2.5 models, precise safe error codes and metadata-only server logging. Live success with the user's key remains to be confirmed after deployment.
- 24 automated tests passed. Five new cases cover error classification, bounded legacy migration/no model hopping on quota, actual timeout vs network, event fidelity and connected deterministic road/street geometry.
- Browser normal production code: quarter advances open the island with exact model events; Escape closes; card selects debt series; ArrowRight moves point focus and the exact readout. Atlas selection exposes fictional transport/street detail. Light/dark inspected; no application console errors (extension metadata noise excluded).
- Browser with a temporary local provider transport: actual frontend POST → local API handler → mocked Gemini response → structured rendering. Also API-key error code, Ctrl+Enter, active loading/timer and cancellation. The test prelude was removed; no mock mode, test key or fixture response is included in the shipped application.
- Layout: 1363×936 root equals viewport and content width equals main; iframe 1920×920 root 1920/1920 and 920/920; 1024×600 root 1024/1024 and 600/600. Mobile 390×844 document client/scroll width 380/380 (scrollbar); natural vertical scrolling. These are browser viewport checks, not physical touch/device tests.
- Motion CSS includes a reduced-motion alternate; static audit's missing-reduced-motion lead was a false negative (it scans a limited set of file types). Loops run only for active request state. GPU WebGL and FPS remain unverified as described in v0.2.


## v0.5

- Bug identificado: resposta e form dentro do mesmo flex com altura limitada permitiam encolher o compositor; havia também um min-height de breakpoint que podia competir com o espaço disponível. O gabinete agora usa linhas explícitas para leitor, compositor e nota; o Nilo maior ocupa uma coluna independente em todas as linhas.
- 28 testes automatizados: quatro novos casos de revelação ordenada/Unicode, conclusão imediata, movimento reduzido e cancelamento/substituição sem atualização antiga.
- Browser com transporte temporário simulado: resposta de 9.264 caracteres; em 1363×936 o compositor permaneceu com 168 px e o textarea com 64 px antes/durante/depois. A leitura rolou internamente. Metadados exibem Nilo; nenhuma ocorrência de Gemini no conteúdo normal do gabinete. SVGs simultâneos sem IDs duplicados.
- Escrita observada em progresso (aria-busy=true, cursor, 113 caracteres parciais e Nilo em speaking); Mostrar resposta completa apresentou o conteúdo integral e encerrou o estado. Cumprimento e giro por controles do personagem conferidos.
- Layout final: 1920×920 sem overflow externo, leitor com 293 px e personagem com 498 px, ambos sem transbordamento interno de layout. 1024×600 raiz 600/600 e largura 1024/1024. Mobile 390×844 mantém rolagem natural, personagem maior oculto; resposta extensa com compositor 156 px e textarea 56 px. Redução de movimento é coberta no controlador por teste injetado; preferência do sistema não foi emulada no browser.
- O mock foi restrito ao processo local de QA, sem modo de demonstração ou conteúdo fictício embutido no código entregue. Não houve mudança na API/provedor nem nas variáveis de ambiente.

## v0.6 · ciclo de decisões

- 35 testes aprovados. Sete casos novos cobrem projeção sem mutação, compatibilidade v1, limite de 160, decisões pendentes, serialização, IDs inválidos e repetidos, execução única, comparação com o próximo resultado, linha de base e replay de 40 anos.
- Browser: renda básica ajustada de 0 a M$ 200 mostrou redução relativa de pobreza e aumento de gasto/dívida; Desfazer restaurou a configuração. Outro ajuste de M$ 0 a M$ 50 apareceu no balanço seguinte, com os mesmos valores da projeção de um trimestre.
- Primeiro avanço apresentou o acontecimento do porto. Decidir depois manteve o tempo parado; recarregar preservou a pendência. Salvar e retomar a cópia restaurou a mesma decisão, trimestre e ações disponíveis.
- Abrir rotas alternativas foi agendado e executado no turno seguinte com custo extraordinário de 0,5% do PIB. Aguardar a normalização foi testado como alternativa sem gasto extraordinário.
- Reprodução automática avançou até o próximo acontecimento e parou em 2028/T1, com aria-pressed=false e ação Resolver acontecimento. Balanço pode ser reaberto pela linha do tempo e pelos Indicadores.
- Desktop 1363×936: raiz 1363×936 sem overflow externo, temas claro/escuro inspecionados. Celular em iframe de 390×844: largura client/scroll 380/380 (barra do navegador), rolagem vertical natural, política e diálogo de escolhas operáveis. Não equivale a um teste físico de toque.
- O contexto do Nilo agora é invalidado também quando um slider muda, antes do avanço. Consulta após edição verificada com transporte de provedor simulado apenas no processo de QA local; nenhuma mudança de provedor, chave real ou modo simulado integra o produto.
- Arquivos e preâmbulos de QA removidos do produto antes do build. Regras e limitações em DECISION-CYCLE.md. Sem novas dependências ou configuração de ambiente.

## Compositor compacto · 2026-10-23

- Consulta pelo teclado e botão recolhe; resposta curta/longa continua no leitor e o painel permanece compacto ao terminar. Reabrir durante consulta e escrever um novo rascunho conservou texto, foco e modo expandido após a resposta.
- Recolher, Escape, expandir por Enter e repetição de estados conferidos por interface. Controles recolhidos ficam inert; foco passa ao botão Escrever para Nilo e retorna ao textarea.
- Cancelamento reabriu e focou o campo. Com servidor sem chave local, NOT_CONFIGURED também reabriu o campo e apresentou a mensagem existente. O transporte simulado foi usado apenas para as respostas bem-sucedidas no QA local e removido antes do build.
- Desktop 1363×936: leitor 334,84px → 446,84px; dock 168px → 56px. Raiz 1363×936 sem rolagem externa; temas claro e escuro inspecionados.
- Iframe mobile 390×844: leitor 360px → 460px; dock 156px → 56px; largura client/scroll 380/380, sem overflow horizontal. Expandir foca o input. Não houve teste físico de toque.
- O browser de QA recusou criação de contexto WebGL2: Paper Shaders: WebGL is not supported in this browser. Fallback CSS, clique, foco, erro e recolhimento foram validados; renderização e desempenho GPU do shader seguem pendentes em dispositivo com WebGL. Uniforms e ciclo de vida usam a API do pacote fixado 0.0.82, consultada no código instalado.
- Movimento reduzido tem alternativa sem transições/pulso e velocidade zero do shader; a preferência do sistema não foi emulada neste browser. Imports são locais e tardios; licenças Apache-2.0/NOTICE acompanham o vendor gerado. Sem dependências React/Motion novas.

## v0.7 · território e demografia

- 44 testes aprovados: determinismo e diversidade, conservação nacional/estadual/municipal de população e área, moradores urbanos/rurais, cidades dentro da terra e do estado, densidade, rios descendentes e limites de entrada. Inclui 120 países aleatórios no fluxo API/simulação e testes CPU de geometria Three v2.
- O mesmo litoral é conservado ao variar somente a população inicial. Avançar mantém a geografia e conserva as participações locais. Cenário legado permanece com seis estados, sem área ou densidade fabricadas.
- GeoJSON do Atlas usa as mesmas fronteiras e população; coordenadas finitas. Acontecimentos v2 referenciam estados existentes. Contexto do Nilo limitado e validado, sem polígonos/campos extras, conferido com transporte de provedor simulado em teste automatizado; nenhuma chave real usada.
- Browser: cenário antigo Aurora abriu sem conversão. Novo país Serra do Horizonte (semente 40315, 67 milhões, área 720.000 km², alongado) apresentou oito estados e densidade nacional 93,1 hab./km². Selecionar Pedra Branca da Serra mostrou 11.103 km², 124,5 hab./km² e 72% de população urbana. Divisas e dados preservados ao recarregar.
- Camada de densidade e seletores operáveis. Desktop 1363×936: document client/scroll 1363×936, sem overflow externo; temas claro e escuro inspecionados. Iframe mobile 390×844: document client/scroll width 380/380, rolagem vertical natural (1475px), camada operável. Não equivale a toque em dispositivo físico.
- O browser não fornece WebGL: Atlas exibiu fallback SVG com dados preservados; 3D retornou para 2D. Renderização, rótulos nativos, worker e desempenho GPU MapLibre/Three permanecem pendentes de QA em dispositivo compatível. Não foi declarado FPS.
- Pacotes e worker locais; `.mjs` servido com MIME JavaScript no servidor local. Licenças principais e transitivas preservadas. Sem tiles externos, migração, rotas econômicas ou economia municipal autônoma. Arquivo temporário de QA removido.
