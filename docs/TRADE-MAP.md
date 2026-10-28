# Produção, comércio e atlas econômico

Implementação na PR #35, junto da prevenção estrutural. Sem dependências ou variáveis de ambiente novas.

## Recursos e compatibilidade

Cada país novo recebe quatro potenciais por estado, de 0 a 1: alimentos, energia, minerais e manufaturas. A semente, relevo, acesso estrutural, proximidade do litoral e disponibilidade hídrica sintética compõem os valores. Esses potenciais e a referência econômica inicial ficam salvos em `trade` versão 1. Não são reservas minerais medidas nem classificações agronômicas reais.

Cenários antigos sem `trade` mantêm a trajetória anterior. Em Políticas → Produção e comércio, o jogador ativa explicitamente o módulo. Isso gera recursos pela semente e geografia existentes, sem mudar divisas ou inventar histórico anterior. A primeira apuração estabelece a referência de valor agregado, evitando um salto inicial de PIB. Recursos, políticas, estoques, acordos e histórico seguem na exportação/importação de cenários já existente.

## Produção e abastecimento

Quatro setores usam unidades produtivas (UP): uma UP corresponde a M$ 1 bilhão aos preços de referência. Não são toneladas ou energia física. Todos os fluxos são trimestrais.

- Capacidade depende dos recursos, capacidade de execução e serviços públicos. Cada programa produtivo operacional amplia em 70% a capacidade do setor no estado.
- Agricultura, energia, mineração e indústria reutilizam carteira, limite de três implantações, pagamentos de obra e manutenção. A cobertura produtiva tem escala territorial; a UI não estima empregos nem moradores beneficiados.
- Produção planejada atende consumo, insumos, recomposição de reserva e oportunidades externas, limitada à capacidade. Estoques existentes reduzem a necessidade de produzir.
- Primeiro se atende consumo interno de produtos primários. A indústria usa 0,12 UP de energia e 0,22 UP de minerais por UP produzida; oferta/importação de insumos limita a produção efetiva. Depois se atende o consumo de manufaturas.
- Importações automáticas, quando permitidas, são limitadas pela oferta externa. São compras dos agentes econômicos e não despesas públicas. Escassez não atendida acrescenta até 0,2 ponto à inflação do trimestre.
- Cada setor tem reserva desejada de 0/1/3/6 meses e parcela exportável de 0/25/50/70/100% do excedente. Consumo e reservas têm prioridade. A prévia compara exportação, importação e estoque antes da confirmação.
- Quantidades fecham por setor: abertura + produção + importação = consumo + insumos + exportação + descarte + fechamento. Armazenamento tem limite de 25% do PIB de referência em UP por setor; descarte de excesso permanece no relatório do motor.

## Mercado e acordos

Oferta, demanda e preços são sintéticos e determinísticos. Contexto externo altera demanda e disponibilidade de importação; a oferta de referência e a produção influenciam preços. A logística depende de infraestrutura, capacidade e programas operacionais de transporte. Apenas excedente disponível pode ser vendido e o escoamento tem limite.

A cotação oferece metade do excedente exportável estimado do setor, por quatro ou oito trimestres, com desconto de 3% frente ao preço corrente. Até três acordos ativos e um por setor. Preço e volume são fixados; assinatura não adianta dinheiro. O acordo reserva demanda, sem somar a mesma venda também ao mercado à vista. Consumo e reservas mantêm prioridade; falta de produção ou logística causa entrega parcial e receita proporcional. Após a última entrega, o acordo encerra e não se renova. O resumo de entregas aparece no fechamento do setor. Não há multa contratual, moeda estrangeira, câmbio ou negociação diplomática bilateral nesta versão.

## PIB e orçamento

A contribuição produtiva usa a variação trimestral de valor agregado aos preços de referência: soma da produção menos insumos industriais. Isso evita somar a produção primária, o insumo e a manufatura integralmente como renda nova. A variação anualizada entra no crescimento, limitada a ±2,5 p.p.; o limite geral do motor continua valendo. O primeiro trimestre inicializa a referência. O fator é separado no balanço em “Produção e comércio exterior”.

Exportações e importações compõem a balança comercial; receita de vendas não é crédito ao Tesouro. A base do PIB altera a arrecadação em moeda no orçamento existente, sem criar uma segunda cobrança sobre as mesmas vendas. O módulo é uma aproximação de jogo, sem calibração macroeconômica real, e não uma implementação completa das contas nacionais.

## Interface e mapa

- Acesso por Políticas → Produção e comércio exterior ou pelo painel de recursos no mapa. Mantém a navegação inferior compacta.
- Indicadores de vendas, compras, saldo, logística; quatro livros de estoque/produção; histórico em barras com tabela acessível; política revisada antes de aplicar; acordos com confirmação explícita.
- Mapa 2D com cores contínuas por potencial, ícones de setores, seleção por clique/Enter/Espaço e quantidade produzida no estado selecionado. O painel regional mostra os quatro potenciais e o acesso à carteira.
- Arcos animados somente quando o setor registra exportações, como representação esquemática até o mercado agregado. Não são estradas funcionais, rotas calculadas ou países reais. Movimento reduzido desativa a animação; telas ocultas pausam o movimento.
- Atlas recebe recursos, pontos e linhas equivalentes; Three.js recebe a mesma classificação de recursos e instalações produtivas. A validação visual desta sessão usa SVG: WebGL indisponível no navegador de teste.
- Em largura de 390px, a barra econômica tem aproximadamente 80px de altura, deixando o mapa livre. Painel de estado continua abaixo do mapa; sem rolagem horizontal da página.

## Conselheiro e API

Nilo recebe um resumo validado de produção, estoque, comércio, escassez e acordos. Não recebe a geometria nem usa IA para calcular preços ou executar ações. Programas produtivos estão disponíveis nas ferramentas autorizadas de Coordenação, Fazenda e Infraestrutura. As cotações do gabinete não contratam automaticamente.

A carteira máxima passou de 48 para 96 programas (12 estados × 8 tipos). O limite de requisição foi ampliado de 24 para 48 KB na API e no servidor local; há validação de tipos, duplicatas, fases e limites. A carteira completa mais metas e resumo econômico é coberta por teste. Credenciais e integração com o provedor permanecem como antes.

## Verificação

123 testes passaram na revisão final; inclui repetição determinística de 160 trimestres com crises, políticas e contratos, conservação de unidades, prioridade de reservas, insumos industriais, preços, fases produtivas, expiração, cotação adulterada e fronteira do conselheiro. Build, syntax, Prettier dos arquivos alterados e diff check passaram.

QA por interface: acordo revisto e assinado; entrega registrada; política de alimentos comparada antes de aplicar; mapa alternado entre recursos; contratação industrial e avanço com camada econômica aberta. A revisão encontrou e corrigiu uma legenda que interrompia o balanço nas camadas novas. Verificação mobile por iframe de 390 × 844, sem simular que isso substitui teste em aparelho físico.

## Limites e próximas cadeias

Minerais são potencial de extração, sem esgotamento geológico. Não há produção específica de microchips, países parceiros, diplomacia, tarifas, câmbio ou simulação industrial física. Manufaturas dependem dos dois insumos e da capacidade existentes; tecnologia avançada exige uma expansão própria. Acordos são ofertas do mercado agregado, com volume/cotação calculados, sem negociação livre de preço.


Na partida de QA, a indústria contratada em Porto Claro entrou em operação após dez trimestres, registrou +70% de capacidade e manutenção de M$ 40,8 mi por trimestre. O acordo encerrou após a última entrega e os dados persistiram ao recarregar. Avanço manual e automático foram conferidos com camada econômica aberta; seleção do estado pelo teclado funcionou. O desktop manteve 100vh sem rolagem do documento (936px de altura nesta sessão). Controles de zoom e painel econômico ficaram separados por 32px na verificação final. Evidências: screenshots/trade-map.jpg e screenshots/trade-ledger.jpg. A comparação de política comercial mostrou a mudança esperada nas exportações/estoques antes da confirmação.
