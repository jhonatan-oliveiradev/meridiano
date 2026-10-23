# Investimentos regionais v0.8

O jogador escolhe um estado, compara acesso a serviços, avalia propostas e acompanha execução e efeitos. As intervenções são programas estaduais, não edifícios posicionados em ruas. Selecionar um município mantém o destino estadual explícito. Não há nova biblioteca, serviço ou variável de ambiente.

## Propostas e coeficientes

| Programa | Parcela máxima atendida | Capital (% do PIB estadual) | Manutenção anual (% do contrato) | Trabalho de construção | Acesso local | Bem-estar local | Redução de pobreza local | Crescimento nacional anualizado antes da ponderação |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Água e saneamento | 35% | 2,4% | 3,5% | 3 | +8 pontos | +3 pontos | 1,2 p.p. | 0 |
| Atenção básica | 30% | 1,8% | 9% | 2 | +6 pontos | +4 pontos | 0,5 p.p. | 0 |
| Escolas e formação | 25% | 2% | 7% | 4 | +4 pontos | +2 pontos | 0,7 p.p. | +0,3 p.p. |
| Mobilidade regional | 40% | 3,2% | 4% | 5 | +7 pontos | +1,5 pontos | 0,3 p.p. | +0,5 p.p. |

Coeficientes ilustrativos, sem calibração. O acesso atual resume as redes de serviço; não há diagnóstico de saneamento/saúde/educação separado. Cobertura proposta = mínimo entre a parcela máxima e o déficit de acesso, com piso de 5% da população estadual. O piso permite melhorias da rede mesmo em estados de alto acesso; indicadores continuam limitados pelo motor. Não implica medição de pessoas anteriormente sem atendimento.

Fração efetiva = cobertura / parcela máxima. Dificuldade = 1 + (relevo estadual − 1) × 0,35. Custo em bilhões de M$ = PIB nacional × participação estadual × coeficiente de capital / 100 × fração efetiva × dificuldade, arredondado a 0,001 bi, com piso de 0,001 bi. Manutenção anual = custo × taxa da tabela. Contrato fixa custo nominal, manutenção, participação e estimativa inicial de pessoas; não há inflação de obras, reajustes ou orçamento estadual separado. Públicos dos programas se sobrepõem e não devem ser somados.

## Fases e pagamentos

1. **Planejamento:** contrato ainda sem cobrança. O primeiro avanço paga 10% e inicia a construção. Cancelamento somente nesta fase, sem custo.
2. **Construção:** cada trimestre executa `capacidade / 0,65 / dificuldade` unidades de trabalho. Capacidade é a do início do trimestre, limitada a 0,35–0,95. O restante de 90% é pago proporcionalmente ao trabalho; a última parcela fecha exatamente o custo contratado.
3. **Entrega concluída:** obra 100% paga. Ainda não há benefício nem cobrança de manutenção no balanço da entrega. A carteira já informa a manutenção a pagar no próximo trimestre.
4. **Em operação:** o avanço seguinte à entrega cobra manutenção anual/4 e ativa os benefícios.

Prazo estimado de operação = um trimestre de planejamento + teto(trabalho restante/ritmo atual) + um trimestre para operação. É estimativa, alterável pelas políticas e pela capacidade futura, não uma garantia. A barra de execução inclui 10% do planejamento e 90% da construção. Não há sorteios ocultos de atraso.

Até três implantações (planejamento, construção ou entregue) simultâneas e um contrato por tipo/estado, inclusive após concluído. Bloquear nova contratação se a operação estimada exceder o trimestre 160. Uma mudança futura de capacidade pode deixar obra inacabada ao chegar ao horizonte; o jogo não força conclusão. Decisões pendentes pausam o avanço inteiro. Não há suspensão, desativação ou cancelamento depois do primeiro pagamento nesta versão.

## Orçamento e efeitos

`investmentFinance(s)` calcula a parcela e a manutenção do próximo trimestre. Orçamento anual equivalente adiciona `(parcela + manutenção trimestral) × 4 / PIB × 100` à despesa. A equação de dívida existente divide o saldo anual por quatro: cobrança única, sem outro custo extraordinário. O equivalente anual não projeta quatro parcelas iguais; detalhes da carteira apresentam o cronograma trimestral. Déficit usa a mesma dívida nacional, com os limites já existentes do motor.

Benefícios operacionais locais = coeficientes da tabela × fração efetiva, somados ao acesso, à pobreza e ao bem-estar regionais existentes, sujeitos aos limites dos indicadores. Municípios seguem os índices do estado e recebem o ganho de acesso. Efeitos nacionais ponderam os coeficientes pela participação estadual: pobreza e bem-estar alteram metas de ajuste gradual; educação e mobilidade somam ao crescimento anualizado. Os índices locais usam o pano de fundo nacional mais o modificador local; não constituem partição contábil independente. Não há migração, nova economia regional, trânsito, traçado viário funcional ou edifícios físicos.

A função `advance` calcula a conta e avança o ledger sobre uma cópia do estado antes dos indicadores. Projeção e avanço real passam pela mesma função; projetar não paga nem progride no cenário original. Sem carteira, equações e métricas antigas permanecem iguais. Geografia e população não são recriadas por contratos.

## Interface, persistência e Nilo

Painel estadual abre propostas; comparação ordena estados por acesso e mostra população e contratos. Políticas abriga a carteira com fase, progresso, parcelas, alcance e manutenção. Marcadores SVG/Atlas mostram estados com contratos; Three mantém seleção e índices regionais, sem modelos de edifícios. Balanço e boletim anunciam construção, entrega e operação. Temas e movimento reduzido respeitados.

Carteira opcional, serializável e limitada a 48 contratos. Cenários antigos podem contratar sem recriar o mapa. Nilo recebe campos permitidos e resumo de programas; servidor valida tipos, fases, estado, participação, manutenção, trabalho, valor pago e datas, e recalcula o orçamento pelo mesmo ledger. O contexto máximo de 48 programas cabe no limite de 24 KB. A IA não executa contratações. Não houve uso de chave real na verificação automatizada.
