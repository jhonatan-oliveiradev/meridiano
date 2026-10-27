# Ciclo de decisões — v0.6

## Antes de avançar

Em Políticas, a comparação parte do cenário atual e calcula até quatro trimestres (ou o tempo restante até 160) por dois caminhos: políticas do início do trimestre e políticas editadas. Capacidade, contexto externo e ciclo são iguais nos dois caminhos. A resposta já escolhida entra uma vez em ambos; acompanhamentos conhecidos seguem sua duração restante. Acontecimentos futuros e respostas ainda não escolhidas ficam fora da projeção. Desfazer restaura apenas as políticas deste trimestre.

O gasto e a receita apresentados são variações de fluxos anuais em % do PIB atual; diferenças de pobreza e dívida são pontos percentuais, e bem-estar usa pontos. Os detalhes de cada política identificam os grupos afetados e o tempo de ajuste conforme o modelo existente.

## Avançar e avaliar

`advanceTurn` coordena o motor econômico `advance`. O balanço persiste antes/depois, políticas alteradas, projeção do trimestre com condições conhecidas e decisão executada. Projeção e execução usam as mesmas regras determinísticas, portanto coincidem quando as condições são mantidas. Isso verifica consistência interna e não mede acurácia econômica real.

O balanço abre após avanço manual; durante reprodução automática fica disponível no botão da linha do tempo e nos Indicadores. O histórico de métricas continua completo; a interface de balanço mostra o último trimestre.

## Acontecimentos

Primeiro avanço e depois a cada três trimestres, exceto no último turno: selecionar um item elegível pela semente e trimestre, evitando repetir o último tipo respondido quando há alternativa. Não existe probabilidade oculta ou nova chamada de IA. Regiões identificam a origem narrativa; nesta etapa os efeitos atuam em indicadores nacionais.

Catálogo em `dist/simulation.js`:

- Reservatórios: recessão, sanções ou infraestrutura abaixo de 5% do PIB.
- Filas de atendimento: capacidade abaixo de 80% ou serviços abaixo de 10% do PIB.
- Porto: sempre elegível, oferece resposta de contingência.
- Fábrica: infraestrutura de pelo menos 3% do PIB e dívida abaixo de 100% do PIB.

Cada acontecimento oferece três respostas, incluindo uma sem gasto extraordinário. Fechar ou adiar não escolhe automaticamente e não avança o tempo. A reprodução pausa. Resolver exige IDs do evento e da opção válidos; tentativas repetidas não aplicam novamente.

A opção escolhida fica agendada para o próximo avanço. `cost` soma ao numerador da dívida em % do PIB uma vez; `growth` altera o crescimento anualizado daquele trimestre; `inflation` e `poverty` somam p.p.; `welfare` soma pontos, respeitando os limites existentes. Os modificadores imediatos duram um turno; respostas novas também podem ter até dois trimestres de acompanhamento, sem repetir o custo extraordinário. Preparação e programas pertinentes amortecem impactos adversos e podem encurtar esse período; benefícios por trimestre são preservados. Mudanças nos estoques seguem influenciando a trajetória. Todos os valores são fictícios e visíveis antes da escolha.

## Persistência e compatibilidade

Campos opcionais no cenário v1: `policyBaseline`, `pendingDecision`, `scheduledDecision`, `decisionLog`, `lastReport`, `crisisTracks`, `crisisReport`. Estados antigos ganham a linha de base na abertura da tela de políticas, sem inventar mudanças passadas. Salvar, retomar e recarregar preservam decisões e efeitos agendados. Sem dependências, segredos ou migrações de backend novos.

## Próximas etapas

Aprofundar economia regional, forças políticas e histórico do Nilo permanece fora desta entrega. O conselheiro recebe indicadores e acompanhamentos conhecidos validados. Perspectivas sintéticas e propostas locais estão documentadas em GAMEPLAY-EVOLUTION.md; não há memória narrativa livre nem execução automática.
