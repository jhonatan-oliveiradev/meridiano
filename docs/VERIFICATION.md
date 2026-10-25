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

- 45 testes aprovados: determinismo e diversidade, conservação nacional/estadual/municipal de população e área, moradores urbanos/rurais, cidades dentro da terra e do estado, densidade, rios descendentes e limites de entrada. Inclui 120 países aleatórios no fluxo API/simulação e testes CPU de geometria Three v2.
- O mesmo litoral é conservado ao variar somente a população inicial. Avançar mantém a geografia e conserva as participações locais. Cenário legado permanece com seis estados, sem área ou densidade fabricadas.
- GeoJSON do Atlas usa as mesmas fronteiras e população; coordenadas finitas. Acontecimentos v2 referenciam estados existentes. Contexto do Nilo limitado e validado, sem polígonos/campos extras, conferido com transporte de provedor simulado em teste automatizado; nenhuma chave real usada.
- Browser: cenário antigo Aurora abriu sem conversão. Novo país Serra do Horizonte (semente 40315, 67 milhões, área 720.000 km², alongado) apresentou nove estados e densidade nacional 93,1 hab./km². Selecionar Pedra Branca da Serra mostrou 9.045 km², 156,8 hab./km² e 79% de população urbana. Divisas e dados preservados ao recarregar.
- Camada de densidade e seletores operáveis. Desktop 1363×936: document client/scroll 1363×936, sem overflow externo; temas claro e escuro inspecionados. Iframe mobile 390×844: document client/scroll width 380/380, rolagem vertical natural (1475px), camada operável. Não equivale a toque em dispositivo físico.
- O browser não fornece WebGL: Atlas exibiu fallback SVG com dados preservados; 3D retornou para 2D. Renderização, rótulos nativos, worker e desempenho GPU MapLibre/Three permanecem pendentes de QA em dispositivo compatível. Não foi declarado FPS.
- Pacotes e worker locais; `.mjs` servido com MIME JavaScript no servidor local. Licenças principais e transitivas preservadas. Sem tiles externos, migração, rotas econômicas ou economia municipal autônoma. Arquivo temporário de QA removido.

## v0.8 · investimentos regionais

- 53 testes aprovados: ciclo completo, pagamento exato, manutenção após entrega, benefícios operacionais, capacidade baixa, cancelamento, duplicados, três vagas, horizonte, dívida sem cobrança dupla, projeção/save/load e índices estaduais/municipais/GeoJSON. Contexto do Nilo testado com transporte simulado, campos extras descartados, ledger inválido rejeitado e carteira máxima de 48 programas abaixo de 24 KB.
- Browser: comparação por acesso; proposta de saneamento em Horizonte por M$ 2,876 bi, alcance de 2,01 milhões e operação estimada em seis trimestres. Cancelar antes do primeiro avanço restaurou o orçamento sem cobrança; nova contratação iniciou a construção com M$ 287,6 mi pagos em 2027/T2.
- Três avanços acumularam M$ 2,57 bi pagos; última parcela de M$ 301,2 mi entregou em 2028/T2 sem manutenção. Operação começou em 2028/T3, com aproximadamente M$ 25,2 mi/trimestre de manutenção e benefício local. Novo programa de saúde em Monte Belo exibiu carteira com fases diferentes.
- Recarregar preservou fase e valor pago. Salvar e retomar cenários em construção (2028/T1) e operação (2028/T3) restaurou corretamente custos, fase e decisão pendente. Decisões continuaram bloqueando o avanço até resposta.
- Desktop 1363×936: documento client/scroll 1363×936, com rolagem somente no painel; temas claro e escuro inspecionados. Mobile em iframe 390×844: documento client/scroll width 380/380; proposta com diálogo client/scroll width 334/334 e rolagem vertical interna. Comparação, seleção, proposta e Escape conferidos; não equivale a teste físico de toque.
- SVG e GeoJSON de projetos cobertos; a indisponibilidade de WebGL no browser de QA continua impedindo comprovar renderização GPU do Atlas/Three. Não há novos modelos de prédios no 3D. Movimento reduzido desativa a animação de entrada dos cards; preferência do sistema não foi emulada.
- Sem novas dependências, segredos ou configurações. Arquivo temporário mobile removido antes do build. Regras e limites em INVESTMENTS.md.

## v0.9 · gabinete e ferramentas

- 60 testes aprovados. Novos casos cobrem escopos, índices, parâmetros extras, imutabilidade, cotações iguais ao motor, duplicados, legado sem densidade, limite de três pedidos, explicação final sem recursão, prazo compartilhado e migração dentro de três chamadas. Syntax check, Prettier e build aprovados.
- Browser: Saúde comparou dois estados, bloqueou o programa já contratado em Monte Belo e abriu a proposta de Vila Serena com os mesmos M$ 3,46 bi / 2,81 milhões do card. Fechar o diálogo manteve a carteira original; nenhuma consulta contratou automaticamente. Fazenda exibiu orçamento real; Infraestrutura exibiu quatro cotações no mobile.
- Com transporte simulado somente no processo local de QA: pergunta por Enter limpou o campo, recolheu o compositor e retornou explicação de Saúde com card calculado. Rascunho foi preservado ao trocar para Fazenda e resultados da área anterior foram limpos. O preâmbulo simulado foi removido e o servidor restaurado antes do build; nenhuma chave real usada. Integração com conta/quota reais do Google não foi testada.
- Desktop 1363×936: documento client/scroll 1363×936. Temas claro e escuro inspecionados. Desktop compacto em iframe 1363×600: client/scroll 1363×600; leitor expandido com 190px, sem rolagem externa. Mobile em iframe 390×844: largura client/scroll 380/380, cards 240/240 sem overflow horizontal; rolagem vertical natural. Não equivale a toque em hardware físico.
- Sem novas dependências ou configuração. Os limites de WebGL e de emulação de movimento reduzido das versões anteriores permanecem. Arquivo de QA removido. Regras em CABINET.md; captura em screenshots/cabinet-v09.jpg.

## Identidades das secretarias · 2026-10-23

- Lia (Fazenda), Caio (Saúde) e Iara (Infraestrutura) criados na interface pública do Avatar Lab. Três definições portáteis e nove SVGs originais Photo Mode preservados; nove SVGs de apresentação recompostos pelo script próprio. Nenhum runtime novo incorporado.
- Browser: selecionar Lia atualizou nome/cargo/avatar pequeno e grande/compositor; troca rápida Caio → Iara terminou com gradientes da Iara nas duas instâncias. IDs independentes por instância conferidos. Recarregar preservou a pessoa selecionada. Cumprimentar Caio ativou happy; giro da Iara conferido. Comparação de Saúde continuou produzindo os cards calculados e bloqueando duplicados.
- Desktop 1363×936: documento client/scroll 1363×936, sem overflow externo. Mobile em iframe 390×844: documento client/scroll width 380/380; seletor 296/296, sem overflow horizontal. Rolagem vertical natural; personagem grande oculto conforme breakpoint existente. Não houve teste físico de toque.
- 60 testes aprovados; syntax check, Prettier, build e diff check aprovados. Sem alteração das regras econômicas, identificadores de área, saves ou configuração da API. Não foi feita consulta com chave real. Limitações de WebGL/reduced motion das verificações anteriores permanecem.
- Captura: screenshots/secretaries.jpg. Arquivo temporário de QA removido antes do build final.

## Nome do país em uma linha · 2026-10-23

- Título lateral usa nowrap, largura flexível e fonte ajustada ao espaço medido. Recalcula após editar o nome, redimensionar e carregar fontes; mantém mínimo de 16px. Nomes que excedem esse limite recebem reticências, com nome completo no DOM/título nativo.
- Browser desktop 1363×936: Bolsonaristão completo com fonte 28,25px, uma linha de 32px de altura e largura client/scroll 177/177. Nome República das Ilhas do Horizonte Azul chegou ao limite de 16px e usou reticências; texto completo preservado.
- Iframe com largura 320px: nome extenso permaneceu em uma linha na área de título de 182px; ao editar para Aurora, fonte voltou a 28px. Nome do país de QA foi restaurado a Serra do Horizonte. Não foi feito teste de toque em aparelho físico; este ajuste não altera outras áreas do layout móvel.
- Syntax check, Prettier e build aprovados. Sem alteração de regras, saves, dependências ou variáveis de ambiente. Arquivo temporário de QA removido. Captura: screenshots/country-name.jpg.

## v0.10 · plano de governo

- 66 testes aprovados. Metas não alteram orçamento/contratos; criação, limites, duplicados, prazo, responsáveis, imutabilidade, bloqueio por acontecimentos, projeção sem registros, amostras por avanço, regressão antes do prazo, congelamento ao concluir, encerramento manual, doze arquivadas e roundtrip JSON cobertos. API rejeita dados inválidos, descarta extras, envia resumo calculado por área e comporta 48 programas + três metas ativas com histórico + duas encerradas + pergunta de 600 caracteres abaixo de 24 KB. Transporte de IA simulado somente em teste automatizado; nenhuma chave real usada.
- Browser: meta de acesso em Monte Belo de 70,4 para 76/100, sob Caio, criada em 2028/T4. Metas nacionais de pobreza e dívida completaram as três vagas e desabilitaram nova criação. O acontecimento pendente foi resolvido antes de avançar; balanço em 2029/T1 incluiu as três leituras. Histórico exibiu dois registros e recarregar preservou metas/responsáveis/prazos.
- Encerrar a meta de dívida no mobile preservou registros e liberou vaga; nova meta de Vila Serena foi atribuída à Iara. Proposta de saneamento abriu o diálogo existente e não foi contratada. Programa de Saúde já contratado em Monte Belo permaneceu bloqueado. Consultar Caio abriu a área correta com pergunta da meta preenchida, sem envio automático. Duplicado foi recusado com feedback no formulário.
- No prazo 2029/T4, a operação de atenção básica elevou acesso a 76,3/100 frente ao alvo de 76. Meta foi arquivada como cumprida, exibida no balanço e no boletim; cinco registros trimestrais conferidos no histórico. As demais metas continuaram ativas. Os registros são do motor sintético, sem atribuição causal empírica.
- Desktop 1363×936: documento client/scroll 1363×936; cards 467/467px. Desktop compacto em iframe 1363×600: documento 1363×600 sem overflow externo; painel 442px com rolagem interna. Temas claro/escuro inspecionados. Mobile em iframe 390×844: documento width 380/380, cards 294/294; formulário/diálogo 334/334 com rolagem vertical interna. Não equivale a teste físico de toque.
- Syntax check, Prettier, build e diff check aprovados. Arquivo de QA removido antes do build. Sem novas dependências, segredos, configuração ou migração obrigatória. Renderização WebGL e preferência de movimento reduzido do sistema não foram emuladas nesta tarefa. Regras em GOVERNMENT-PLAN.md; capturas em screenshots/government-plan.jpg e screenshots/goal-history.jpg.

## v0.10.1 · navegação, leitura e contexto

- 69 testes aprovados. Novos casos cobrem direção das métricas, distância sem arredondamento prematuro para sucesso, prioridades por prazo, imutabilidade, recortes por secretaria e compromissos do próximo trimestre. Syntax check e Prettier aprovados.
- Menu expansível com preferência local, Escape, rótulos e tooltips; ícone próprio para Plano. Mobile usa barra inferior com rótulos. Gabinete nomeado de forma consistente; cargos individuais preservados. Títulos repetidos removidos da apresentação e metodologia recolhível.
- Browser: meta → Iara preenche a pergunta sem enviar; retorno recupera foco e detalhes abertos. Proposta a partir da meta inclui retorno e não foi contratada. Valores do gabinete conferidos com programas existentes e meta de menor prazo. Sem consulta de API real nesta tarefa.
- Desktop 1363×936: documento client/scroll 1363×936. Temas claro/escuro e menu de 180px inspecionados. Desktop compacto em iframe 1363×600: documento 1363×600, ações do menu acessíveis até 584px. Mobile em iframe 390×844 e 320×740: larguras client/scroll 380/380 e 310/310; rótulos íntegros e rolagem natural. Não equivale a toque em aparelho físico.
- Sem novas dependências ou alterações das regras econômicas. WebGL e preferência de movimento reduzido do sistema não foram emulados. Captura: screenshots/product-polish.jpg.

## Favicon e acentuação do gabinete

- Favicon vetorial próprio com globo/meridiano verde-lima em fundo escuro; fallback ICO 16/32/48px e apple-touch-icon 180px. Referências explícitas no HTML, arquivos exigidos pelo build e MIME local correto para ICO/PNG.
- Prompt pede ortografia, acentuação, cedilhas e Unicode em todos os campos. Não há substituição automática de palavras, que poderia alterar nomes ou sentido. Testes verificam a resposta completa acentuada e a preservação dos termos do relato durante a digitação progressiva. O modelo real ainda precisa ser conferido; a instrução reduz o problema, mas não garante a grafia em toda geração.
- 69 testes aprovados; 21 testes direcionados de API/apresentação aprovados após ampliar os casos Unicode; syntax check, Prettier, build e diff check aprovados. Ícone inspecionado em PNG. Sem dependência nova ou variável de ambiente.

## v0.11 · consequências, segurança e prévia do trimestre

- 80 testes aprovados. Casos novos cobrem custos recorrentes e dívida sem cobrança dupla; formação de capacidade antes do efeito; controle/intensidade/confiança; aumento de registros com queda da violência; soma exata das parcelas e limites em 160 turnos; efeitos em atividade/bem-estar; neutralidade do regime; migração sem retroinventar histórico; igualdade entre prévia/resultado; persistência e ferramentas por área; validação numérica da API; metas e acontecimento de segurança com aplicação única.
- Browser: orçamento adicional de 7% do PIB/ano levou saldo de -2,07 a -9,07%. Prévia 2027/T2 apontou violência 44,84, investigação 44,056 e confiança 56,21; fechamento confirmou. Explicação da violência mostrou a parcela de -0,16 das operações apoiadas na investigação.
- Davi selecionado nas instâncias pequena/grande e no compositor; diagnóstico local funcionou sem chave. Metas de violência atribuídas ao Davi, consulta e persistência após reload conferidas. Gráfico/explicação no mobile com cabeçalho 306/306px; cenário antigo sem índice mostra Sem registro na comparação. Resposta ao acontecimento do porto preservada na prévia do trimestre seguinte, com custo extraordinário separado. Ferramentas locais recolhem o compositor para leitura, preservando o rascunho.
- Desktop 1363×936 e iframe 1363×600: dimensões client/scroll iguais, sem rolagem externa; dois temas inspecionados. Mobile em iframe 390×844: largura client/scroll 380/380, equipe em duas colunas; diálogo da prévia 334/334 com rolagem vertical interna. Não houve teste de toque em dispositivo físico; screenshot mobile indisponível no browser, conferência por DOM.
- Syntax check, Prettier, build e diff check aprovados. Sem novas dependências, segredos ou configuração. Testes de transporte são simulados; não houve consulta com chave real. WebGL e preferência de movimento reduzido do sistema não foram emulados. Captura: screenshots/security-public.jpg. Arquivo temporário de QA removido antes do build final.
- Regras, equações, referências e limites em CONSEQUENCES.md. A segurança é nacional e usa índices sintéticos; não há taxa criminal calibrada ou dado estadual.
