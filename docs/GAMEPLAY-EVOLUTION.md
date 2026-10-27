# Consequências, território e governo

Escopo aprovado: seis melhorias propostas na conversa, implementadas na ordem de dependência. Não substituir o motor por respostas de IA nem alterar silenciosamente políticas. Cenários salvos continuam válidos; campos opcionais novos só aparecem ao avançar/resolver decisões.

1. Balanço: explicar variações com comparação determinística sequencial entre políticas anteriores, ajustes, investimentos, crises em acompanhamento e resposta escolhida. As parcelas somam a variação real. A ordem é explicitada; não são efeitos causais independentes nem estimativas sobre o mundo real.
2. Território: equipamentos simbólicos por programa e trechos modernizados nas estradas sintéticas existentes. Obra em construção difere de entrega e operação. Mesmo dado no SVG e Atlas; controles de teclado abrem o estado. Sem inventar malha física, rotas funcionais ou pessoas adicionais.
3. Crises: respostas novas podem ter até dois trimestres posteriores; custos extraordinários são cobrados uma vez. Capacidade e programas operacionais pertinentes reduzem a duração/severidade calculada na resposta. Projeção e avanço real compartilham a rotina. Decisões antigas já agendadas sem acompanhamento preservam os efeitos anteriores.
4. População: quatro perspectivas com apoio sintético 0–100, prioridades explícitas e comparação com o trimestre anterior. Grupos se sobrepõem, sem tamanho populacional ou pesquisa real. Apoio influencia a leitura e a priorização do gabinete; não substitui a aprovação nacional do motor.
5. Gabinete: Nilo sintetiza alternativas de Fazenda, Saúde, Infraestrutura e Segurança. Cada proposta abre uma comparação real de quatro trimestres e custo; aplicação exige botão explícito. Usa regras locais, sem chamada de IA, contratação ou avanço automático.
6. Ciclos de governo: balanço a cada 16 trimestres, com situação inicial/final, metas, programas e desafios. Ciclo administrativo de quatro anos para todos os regimes, sem afirmar eleição em ditaduras. Ao encerrar o ciclo, o jogo continua com o mesmo país e histórico. Relatórios derivados da história, com dados ausentes tratados como indisponíveis.

## Plano de implementação

- [x] Criar e testar módulos puros de acompanhamento de crises, decomposição, grupos, propostas e ciclos; incluir legado, persistência, horizonte, limites e imutabilidade.
- [x] Integrar crises em projectQuarter, sem multiplicar cobranças ou permitir projeção diferente do avanço.
- [x] Integrar leitura do governo a Indicadores, propostas ao Gabinete e ciclos ao Plano de governo. Propostas não aplicam mudanças até confirmação.
- [x] Renderizar equipamentos/trechos nos dois mapas a partir do mesmo modelo; preservar dados da geografia e reduzir animação desnecessária.
- [x] Executar suite completa, syntax, build, formatação e revisão do diff; QA de jogo normal e transições desktop/mobile.
- [x] Publicar feature branch para dev, sem merge automático. Documentar limitações e verificações reais.


## Verificação desta entrega

- 105 testes passaram: legado, API e novas regras, incluindo soma dos 13 indicadores, imutabilidade, persistência, expiração e cobrança única, efeitos adversos amortecidos, grupos limitados, ciclos e geografia preservada.
- Syntax check, build e Prettier dos arquivos alterados passaram; sem novas dependências.
- QA pela interface: comparar e confirmar proposta de Saúde sem avançar tempo; avançar e verificar fatores; responder crise e acompanhar expiração; contratar mobilidade, chegar à operação no mapa 2D; completar 16 trimestres, recarregar e iniciar o ciclo seguinte mantendo o país.
- QA responsivo em iframe de 390 × 844: gabinete em uma coluna e largura do documento igual à largura disponível, sem rolagem lateral. Não equivale a teste de toque em aparelho físico.
- WebGL indisponível neste navegador: ao tentar 3D, o aplicativo mostrou a mensagem de indisponibilidade e manteve 2D. Atlas e visual 3D receberam o modelo de equipamentos, mas não foram homologados visualmente em GPU real nesta sessão.
- Screenshot: screenshots/gameplay-quarter-explanation.jpg. Publicação em branch de feature, com PR destinado a dev; sem merge ou promoção automática para produção.

## Limites deliberados

Perspectivas sociais são quatro índices locais sobrepostos, não agentes individuais nem eleitorado. Não alteram diretamente a aprovação agregada. Alternativas dos ministros usam incrementos definidos e cálculos do motor, não planos livres da IA. Obras são símbolos e trechos existentes destacados, sem tráfego ou roteamento funcional. O relatório de ciclo usa quatro limiares explícitos de alerta; não constitui um sistema eleitoral ou um placar de vitória. Crises têm horizonte curto e determinístico, sem previsão do mundo real. Decisões antigas já agendadas preservam sua duração anterior.
