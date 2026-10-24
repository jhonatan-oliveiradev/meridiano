# Plano de governo · v0.10

O plano registra objetivos do jogador e acompanha indicadores existentes. Não muda políticas, orçamento, contratos ou tempo. Funciona sem chave de IA.

## Metas e responsabilidades

- Até três metas ativas e doze no total por país, incluindo as encerradas.
- Prazo de 4, 8 ou 12 trimestres, respeitando o horizonte de 160 trimestres do cenário.
- Acesso a serviços de um estado: responsabilidade escolhida entre Caio e Iara. É o índice regional agregado do motor, sem separar hospitais, escolas ou saneamento.
- Pobreza e bem-estar nacionais: Nilo. Dívida/PIB: Lia. Valores vêm das métricas, não da IA.
- A meta deve melhorar o valor atual. Cada indicador pode ter apenas uma meta ativa no mesmo território. Não há revisão retroativa do valor inicial, alvo ou prazo; encerrar preserva o histórico.

## Registros e avaliação

A criação salva o valor inicial. Somente `advanceTurn` registra um novo valor por trimestre, depois da economia e das obras. Acontecimentos pendentes impedem o avanço; projeções de políticas não geram registros. As amostras acompanham o ciclo real de planejamento, construção, entrega e operação dos investimentos existentes.

Enquanto ativa, a leitura atual acompanha as políticas atuais, inclusive ajustes ainda não avançados. A tabela conserva os valores registrados. O progresso é a fração da distância inicial até o alvo, limitada a 0–100% visualmente; variações negativas continuam visíveis no valor e no delta. “Abaixo do ritmo” compara com uma trajetória linear ao longo do prazo. Não é uma projeção, garantia nem estimativa probabilística.

Atingir o alvo antes do prazo não congela a meta: o indicador pode regredir. No trimestre de vencimento, o valor registrado determina “Cumprida no prazo” ou “Prazo encerrado”; o resultado é arquivado e não muda com políticas posteriores. O balanço inclui as leituras do fechamento. A conclusão aparece no boletim.

Encerrar manualmente libera a vaga e preserva os registros trimestrais. Não cancela obras nem devolve gastos; o arquivo usa o último valor registrado. Limite total de doze evita histórico ilimitado nesta versão.

## Gabinete e decisões

Nilo reúne o progresso. Lia mostra o saldo anualizado, os pagamentos de obras e a manutenção do próximo trimestre. Caio e Iara contam metas atribuídas e obras no estado cuja operação estimada fica depois do prazo. Essas leituras são determinísticas; não são pareceres independentes de quatro agentes.

Próximas decisões apresenta cotações dos programas pertinentes à secretaria, calculadas no estado da meta. Duplicados e limites da carteira mantêm os bloqueios existentes. Revisar abre `investmentUI.showQuote`, que recalcula a elegibilidade; só o jogador confirma a contratação. Metas nacionais levam à comparação de políticas.

Consultar o responsável abre o gabinete com área e pergunta preenchidas. O jogador envia quando quiser. O contexto da IA leva até três metas ativas e as duas últimas encerradas; o servidor valida campos, responsáveis, limites e sequência de amostras, recompõe a leitura e filtra metas de Saúde/Infraestrutura por responsabilidade. Nilo e Fazenda têm leitura geral. Não existe ferramenta de IA para criar metas ou contratar programas.

## Persistência e limites

`goals` é opcional no snapshot v1. Saves antigos continuam sem metas; os novos incluem amostras e arquivo no mesmo fluxo de salvamento, retomada e exportação. Novo país começa sem metas. O consumidor de UI ignora um conjunto inválido; a API rejeita dados malformados e descarta campos não permitidos. Não há nova configuração, dependência ou banco.

Os dados são sintéticos. Acesso regional ainda depende do índice base, de políticas nacionais e dos programas; esta versão não cria economia regional autônoma ou indicadores de saúde específicos. Prazo de obra considera a capacidade atual, que pode mudar. A avaliação não atribui causalidade exclusiva a uma obra.

## Leitura e retorno ao contexto

Os cards mostram a distância até o alvo e a variação desde o início. A cor considera a direção desejada de cada indicador: reduzir pobreza/dívida ou elevar bem-estar/acesso. Valores positivos menores que 0,1 não aparecem como alvo atingido.

O acompanhamento do gabinete usa dados do motor: Nilo prioriza metas abaixo do ritmo e prazos próximos; Fazenda mostra saldo e compromissos do próximo trimestre; Saúde e Infraestrutura apontam metas da área e programas contratados. Esses resumos não exigem uma consulta de IA.

Consultar uma pessoa, revisar políticas ou abrir uma proposta a partir de uma meta habilita **Voltar à meta**. O retorno recupera o card, os detalhes abertos, a rolagem e o foco. O contexto é descartado ao trocar de país ou retornar ao plano; não é persistido entre recargas.
