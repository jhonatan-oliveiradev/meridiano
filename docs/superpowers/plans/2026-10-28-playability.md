# Cinco passos de jogabilidade

Ampliar a PR aberta do motor causal. Manter módulos puros de domínio e UI compatível com ESM/CSS existentes, sem dependências.

1. decision-review.js: registrar gasto único, mudança recorrente, contraste com a ausência da medida e efeitos ativos; renderizar no balanço e preservar últimas respostas. Não somar manutenção futura como despesa já paga nem prometer causalidade real.
2. challenges.js + playability-ui.js: três cenários autorais com condições de partida, prazo, objetivos sustentados e encerramento; começar mediante confirmação que preserva cenários salvos, acompanhar pelo Plano, continuar no modo livre após sucesso/falha. Reutilizar medição/metas existentes.
3. experiments.js + experiments-ui.js: checkpoint imutável e dois caminhos independentes da mesma fotografia, sincronização local da ramificação ativa, troca com confirmação, comparação no mesmo trimestre com curvas e tabela. Não considerar mesma semente suficiente para declarar mesmo início.
4. map-situation.js: sinais regionais de água, energia, filas, obras e entregas; camada de situação com legenda e descrição, marcadores SVG navegáveis e contexto no painel regional. Compartilhar cores com Atlas/3D, evitar sobreposição com ícones econômicos.
5. scripts/calibrate.mjs: partidas determinísticas com políticas e obras reais, cenários e estratégias contrastantes; registrar métricas, repetição, perdas de atendimento, custos e conclusão dos desafios. Ajustar apenas a partir dos resultados. Testes de comparações, checkpoints, objetivos e conservação.

Verificar testes completos, build/sintaxe/formatação e revisão desktop/mobile, incluindo o que ficou pendente no navegador anterior. Publicar na mesma PR para dev, sem merge ou promoção automática.

## Entrega verificada

- Cinco módulos funcionais integrados ao motor e às telas existentes; sem dependências ou chamadas adicionais de IA.
- 154 testes passaram, incluindo persistência/isolamento A/B, alinhamento temporal, regras sustentadas, resultado terminal fixo, gasto único e sinais regionais. Sintaxe e build passaram.
- `npm run calibrate`: 19 partidas, 852 trimestres, três desafios vencidos com estratégias factíveis; custos reais, conservação e intervalos de acontecimentos preservados. Resultados e limites em docs/CALIBRATION.md.
- QA desktop: catálogo → regras → preservação do país → novo desafio → Plano; criação A/B → avanço → troca → recarga → comparação no trimestre comum; select de indicadores; água 34% → 86%, custo único M$ 2,74 bi; camada Situação e temas claro/escuro. Recuperada a verificação visual da resposta que ficou pendente na etapa anterior.
- QA responsivo: iframe temporário de 390 × 844 no Chrome, Plano, catálogo, cenários, comparação e select; largura interna 380px igual à largura do documento (10px reservados à barra), sem vazamento horizontal. Harness removido. Não representa homologação em Safari/iOS ou dispositivo físico. Sem validação GPU adicional de Atlas/3D.
- Evidências em docs/screenshots/playability. Publicação na PR #43 para dev; sem merge/promover produção.
