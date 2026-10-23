# Território v2

A geografia é criada uma vez e persistida com o país. Abrir um cenário antigo não o converte; um novo país ativa o gerador. Mesma semente, população inicial, área e formato reproduzem o território. Alterar apenas a população preserva o litoral, mas pode alterar divisões e cidades. Avançar o tempo preserva todas as divisas e posições.

## Geração

`territory.js` combina quatro perfis de contorno (ilha, continental, alongado e península), harmônicos de costa, rotação e relevo simplex. Não gera arquipélagos nesta versão. Perfil continental descreve a forma compacta do país, sem gerar vizinhos. A área pode ser informada entre 5.000 e 8.000.000 km²; omitida, é sorteada pela semente.

A área e o logaritmo da população inicial influenciam a divisão em 3–12 estados, com variação administrativa determinística. Sítios afastados formam células D3 Voronoi, recortadas pelo litoral com polygon-clipping. Uma deformação contínua aplicada a todos os elementos suaviza o aspecto das divisas. O relevo aplica a transformação inversa, mantendo rios e montanhas no mesmo lugar. Recortes usam coordenadas arredondadas a 1e-6 unidade, com segunda tentativa a 1e-4 para evitar falhas numéricas da biblioteca.

Rios partem de áreas elevadas e buscam pontos mais baixos; param onde não encontram descida. Não há bacias, erosão, cheias, reservatórios ou ciclo da água completo. Habitabilidade favorece terrenos menos íngremes e proximidade de costa/rios. Estados recebem participação populacional de acordo com essa grade. A distribuição não é estimada a partir de países reais.

O total desejado de municípios é `round(12 + 10 × sqrt(população em milhões))`, limitado a 20–240. Distribui-se entre estados conforme moradores, com pelo menos dois por estado. Assentamentos ficam no interior dos polígonos, afastados da borda. A capital nacional é a sede com maior população municipal inicial. Áreas sem centros adicionais continuam representadas pelas jurisdições existentes.

## Demografia e escala

A urbanização inicial nacional, entre 42% e 89% quando sorteada, é distribuída por uma hierarquia urbana de tamanhos diferentes. A parcela rural usa a habitabilidade dentro de cada município. Cada município possui participações urbana e rural; juntas somam a participação municipal, e todas as participações somam 1. Correções residuais de ponto flutuante preservam os totais.

Áreas são calculadas pelos polígonos e normalizadas à área nacional. A deformação por dois cisalhamentos preserva área analítica; a discretização das curvas pode introduzir pequenas diferenças entre a área visual amostrada e a metadada. Densidade inclui moradores urbanos e rurais. Manchas urbanas usam apenas a população urbana, uma densidade sintética de 1.800–6.000 moradores/km² e limite de 80% da área municipal. São símbolos circulares, não contornos de edificações.

População cresce pelo motor nacional, mantendo participações locais. Não há redistribuição espacial nem expansão das manchas ao longo dos turnos. Renda, pobreza e bem-estar municipais ainda seguem o estado; acesso varia por município. Índices não representam economia municipal autônoma.

## Renderização

SVG é o mapa inicial acessível; Three usa os mesmos polígonos e campo de altitude. Densidade no relevo 3D é agregada por estado; SVG e Atlas mostram polígonos municipais. Atlas carrega MapLibre, worker e CSS locais somente ao ser solicitado, com camadas GeoJSON, rótulos por zoom, seleção e escala. Não carrega tiles, sprites, ruas reais ou dados externos. Coordenadas do Atlas são uma projeção auxiliar de um plano fictício; não localizam o país no mundo real. Vias são esquemáticas e podem atravessar reentrâncias costeiras: não representam rotas válidas, conectividade econômica ou tempo de viagem.

Sem WebGL, Atlas mantém a representação vetorial SVG; 3D retorna a 2D. Instâncias são descartadas ao trocar renderizador, trocar país ou sair da página. Pixel ratio de renderização limitado a 1,5. Movimento reduzido desativa transições da câmera do Atlas. Não há metas de FPS confirmadas em dispositivo físico.

O Nilo recebe somente um resumo limitado a 12 estados, área, urbanização e quantidade de municípios. O servidor valida intervalos e somas e descarta campos extras; não transmite os polígonos. Acontecimentos escolhem um estado existente conforme perfil agrícola, acesso, litoral comercial ou população. Isso não cria efeitos econômicos regionais independentes.
