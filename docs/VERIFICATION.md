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
