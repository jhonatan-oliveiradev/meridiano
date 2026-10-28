# Motor causal: redes e acontecimentos

Implementar água, rede elétrica e logística por estado, com balanço trimestral, memória, clima determinístico, respostas emergenciais e capacidade de obras em operação. Produção e exportações devem respeitar as restrições físicas, sem bônus de PIB duplicado. A seleção de eventos usa pressão, cooldown e histórico, sem agenda fixa. Incluir emprego, preços, alimentos, fiscal e oportunidades industriais conquistadas.

Arquivos: systems.js (motor puro), systems-ui.js/css (diagnóstico e histórico), simulation.js (catálogo e elegibilidade), model.js/trade.js (aplicação), country.js/app.js (integração), testes de causalidade/persistência/40 anos e documentação. Sem bibliotecas novas.

Compatibilidade: economia produtiva existente recebe estado inicial de redes no próximo avanço, sem reescrever histórico. Cenários legados sem produção conservam o modelo até ativarem Produção e comércio. Decisões antigas pendentes/agendadas mantêm efeitos. Novas decisões congelam causa e resposta física. Reproduzir mesma semente e escolhas; forecasts não consomem recursos. Nenhuma promoção automática.

Verificação: conservação da água e UP, investimento em planejamento sem benefício antecipado, resposta cobrada uma vez, efeitos físicos persistentes, capacidade versus carga, elegibilidade factual, antirrepetição, oportunidade condicionada, limites/migração, decomposição e ciclos longos. QA desktop/mobile com diagnóstico acessível pelo mapa e comércio.

## Entrega

Motor, diagnóstico e contexto validado do gabinete implementados. 146 testes passaram, incluindo conservação, evolução física, políticas recorrentes, resposta única, oportunidade com implantação, horizonte e replay/decomposição por 40 anos. Build, sintaxe, formatação dos arquivos alterados e diff check passaram. Revisão pela interface cobriu estabilidade → oportunidade → implantação → +12% de capacidade, ocorrência hídrica com causa medida, cotação estrutural e execução com gasto único. Revisão visual final e mobile pendentes devido à indisponibilidade do navegador de validação; ver docs/CAUSAL-ENGINE.md. Publicar PR de revisão para dev, sem merge ou promoção automática.
