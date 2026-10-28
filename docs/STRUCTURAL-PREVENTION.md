# Prevenção estrutural

Objetivo aprovado: investimentos duradouros precisam reduzir o ciclo de emergências repetidas e tornar sua entrega perceptível.

A entrega reaproveita Água e saneamento, Atenção básica, Escolas e formação e Mobilidade regional. Não adiciona um reservatório físico ou cadeia de água não modelada: redes e pressões são índices esquemáticos do jogo.

## Regras

- Cada janela de acontecimento continua determinística pela semente e trimestre. Uma pressão sintética de 30 a 99,9/100 é confrontada com a proteção do estado menos protegido. Um projeto em outro estado não protege esse estado.
- Proteção comum: capacidade × 0,15 + política pertinente normalizada × 0,25 + acesso regional inicial × 0,25 + redes entregues. Política pertinente: serviços/18 para filas, infraestrutura/10 para água e transporte. Acesso regional é o índice estrutural 0–1 do território; não se afirma uma medição separada de água.
- Redes operacionais: água, saúde e transporte contribuem até 0,6; educação até 0,15 para serviços. A contribuição é proporcional ao alcance contratado frente à cobertura de referência do programa e à população local atual, limitada a 1 por tipo. Contratos repetidos não acumulam o mesmo tipo. Crescimento populacional dilui a cobertura.
- Segurança usa as capacidades nacionais existentes: prevenção × 0,005 + investigação × 0,002 + confiança × 0,001. Políticas sustentadas formam essas capacidades pelo motor existente.
- Proteção total limitada a 0,92. Se absorver a pressão, gera boletim e balanço sem resposta obrigatória ou gasto extraordinário; o risco climático/operacional continua existindo.
- Se a pressão superar a proteção, impactos adversos e custos imediatos são multiplicados por max(0,15; 1 − proteção). Benefícios positivos não são reduzidos. O acompanhamento local considera a mesma preparação, com horizonte de até dois trimestres e sem repetir o custo.
- Manutenção permanece automática conforme o contrato existente; não há uma opção fictícia de suspender manutenção. Obra em implantação não concede proteção antecipada. Instalação industrial é oportunidade e não recebe o filtro de crise.
- A situação nova guarda sua avaliação na decisão pendente, mantendo o valor revisado. Pendências antigas sem avaliação e respostas já agendadas preservam os efeitos anteriores. Sem migração destrutiva, dependência ou variável de ambiente nova.

## Interface e verificação

A proposta informa proteção local antes/depois estimada e manutenção antes da confirmação. A decisão permite revisar investimentos preventivos sem escolher resposta nem contratar automaticamente; voltar ao avanço reabre a emergência pendente. O balanço e o boletim identificam situações absorvidas.

Testes cobrem localização, cobertura, obra ainda em construção, população, recorrência em 40 anos, eventos extremos, benefícios preservados, gasto emergencial ajustado uma vez, legado, persistência e emergência absorvida que não bloqueia o tempo. 112 testes passaram, incluindo a suíte existente; syntax check, build e formatação dos arquivos alterados passaram. QA no navegador: proposta de saneamento mostrou proteção de 35 para 87/100 antes da contratação; avanço normal abriu nova crise com proteção e pressão visíveis e custos revisados. O fluxo manteve os programas anteriores e a cobrança de manutenção. Situações absorvidas foram verificadas por teste integrado do motor, não por uma partida completa nova de 40 anos no navegador. Screenshot: screenshots/structural-prevention.jpg.

## Comércio exterior: evolução na mesma PR

A proposta abaixo foi aprovada e sua primeira etapa foi implementada na mesma PR. Consulte [Produção, comércio e mapa](TRADE-MAP.md) para regras entregues, verificações e limites. O mercado é agregado; negociação bilateral e tecnologia avançada continuam como expansões posteriores.

1. Recursos reproduzíveis por estado na criação: aptidão agrícola, disponibilidade hídrica, potencial energético e depósitos minerais; mapas e dados coerentes. Preservar geografia dos cenários antigos e explicitar geração dos campos novos.
2. Produção por setor, capacidade instalada, consumo interno, estoques e necessidade de importação. Começar com alimentos, energia, matérias-primas e manufaturas; tecnologia avançada depende de encadeamento industrial, infraestrutura e formação, não só depósitos minerais.
3. Exportar apenas excedente disponível, limitado por logística e demanda externa. Permitir reserva interna, importação de insumos e acordos de prazo definido, com preço, volume e risco visíveis.
4. Contabilidade: vendas externas não viram integralmente receita do governo. Calcular valor agregado sem contar insumos duas vezes; renda, atividade e arrecadação afetam a capacidade de financiar políticas. Separar PIB, balança comercial e orçamento público. Importações não são uma penalidade automática se viabilizarem produção.
5. Nilo e Fazenda explicam dependência de produtos/parceiros, custos, limitações e efeitos de cenários antes da confirmação. Recursos, cadeias e acordos são regras sintéticas, sem previsão econômica real.
