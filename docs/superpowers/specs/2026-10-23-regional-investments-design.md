# Investimentos regionais

Objetivo autorizado: selecionar estado, comparar necessidades, contratar projeto, acompanhar execução e observar efeitos locais e nacionais. Complementar o ciclo existente de políticas, orçamento e decisões sem recriar geografia ou partidas.

## Abordagem
Adotar programas estaduais com regras determinísticas e custos no orçamento nacional. Obras municipais detalhadas exigiriam economia e malha de serviços locais ainda inexistentes; efeitos instantâneos não entregariam o acompanhamento aprovado. Decisões de implementação: quatro programas (saneamento, atenção básica, educação e mobilidade), um de cada tipo por estado, até três em implantação simultânea.

## Contrato de jogo
Custos em bilhões de M$, fixados na contratação conforme PIB estadual sintético, fração atendida e relevo. Informar custo total, população inicial atendida, previsão de entrega/operação e manutenção anual antes de contratar. São valores adicionais às políticas nacionais. Não há caixa separado: déficit aumenta dívida pela mesma equação existente. Pagamento de 10% no planejamento; restante acompanha avanço físico. Capacidade administrativa e relevo determinam velocidade, sem sorteios ocultos. A estimativa usa a capacidade atual e pode mudar conforme políticas.

Fases: planejamento → construção → entregue → operação. Um trimestre para planejamento; construção acumula unidades de trabalho; operação no avanço seguinte à entrega, quando começa manutenção e benefício. Cancelar apenas no planejamento, antes de cobrança. Projetos concluídos não podem ser repetidos. Bloquear contratação se a operação estimada ultrapassar T160. Decisões pendentes continuam pausando o tempo.

Benefícios operacionais: acesso, pobreza e bem-estar locais e modificadores nacionais ponderados pela participação estadual; educação/mobilidade também alteram crescimento anualizado. Usar metas graduais do motor para benefícios nacionais, sem somar o benefício inteiro todo trimestre. Não modelar economia regional autônoma, migração, rotas, edificações físicas ou receitas municipais. População atendida é a estimativa fixada na contratação; não se soma entre programas porque públicos se sobrepõem.

## Interface e persistência
Ação no painel do estado, inclusive ao selecionar município com destino estadual explícito. Comparação de todos os estados por acesso a serviços e propostas com custo/prazo/alcance. Carteira em Políticas, progresso/fases/custos e resumos no mapa, no balanço e no boletim. Transições discretas com movimento reduzido, modais operáveis por teclado, rolagem interna no desktop. Sem biblioteca nova.

Campos opcionais: cenários antigos começam sem carteira, sem mudar seus números até contratar. Operações puras e cenários serializáveis. Projeção e avanço usam exatamente o mesmo processo. Contexto do Nilo recebe carteira limitada e validada, sem executar contratações. Não enviar geometria adicional.

## Aceitação
Somar pagamentos ao custo contratado sem duplicação; manutenção somente após entrega; nenhuma melhoria durante construção; benefícios apenas com operação; cancelamento sem custo antes da obra; duplicados/limite/estado inválido não alteram cenário. Replay, save/load e projeção idênticos. Testes de legado, horizonte, capacidade baixa, persistência, financiamento, contexto da IA e fluxos desktop/mobile. Publicar PR, sem merge automático.
