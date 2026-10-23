# Gabinete · v0.9

| Área | Responsabilidade | Programas para propostas |
|---|---|---|
| Nilo | Coordenar prioridades e consultar as áreas | Todos |
| Fazenda | Orçamento, dívida e financiamento | Todos |
| Saúde | Acesso a serviços e atenção básica | Saúde |
| Infraestrutura | Saneamento, mobilidade e execução | Saneamento e transporte |

Na república democrática, Nilo passa a Chefe de Gabinete; nos demais regimes mantém um cargo de coordenação compatível. Os ministérios são áreas de consulta, sem personagens ou agentes autônomos adicionais. Secretarias estaduais ficam para uma etapa posterior.

## Ferramentas

`dist/cabinet-tools.js` reúne papéis e funções puras compartilhadas pelo servidor e navegador. `investigate_states` ordena índices reais, preservando o índice do estado; `inspect_budget` usa o orçamento do próximo trimestre; `compare_investments` produz até seis cotações; `prepare_investment` prepara uma cotação. Países legados não recebem densidade inventada.

A API aceita até três pedidos por consulta e devolve suas receitas e dados. O navegador recalcula as receitas; não usa valores, HTML, URLs ou comandos do modelo para executar ações. Argumentos extras, ferramentas desconhecidas e programas fora do escopo produzem avisos sem ações. Custos, prazo, bloqueios e elegibilidade vêm de `quoteInvestment`.

Ver estado abre o território e seleciona o estado. Revisar contratação usa `investmentUI.showQuote`, que recalcula a elegibilidade antes de abrir a proposta. Só o botão de confirmação do diálogo contrata. Nenhuma consulta tem efeitos econômicos.

## Conversa e obsolescência

A seleção de área é local, persistida separadamente do cenário. Trocar de área cancela a resposta pendente, limpa resultados e conserva o rascunho. Cache inclui área, pergunta e impressão digital do cenário. Mudanças no cenário interrompem respostas antigas e desabilitam as ações de cards obsoletos. Cancelar no cliente não garante interromper trabalho já recebido pelo provedor.

O texto continua sendo apresentado progressivamente depois da resposta JSON completa. O compositor recolhe e expande com as transições existentes; Enter envia e Ctrl/Command + Enter insere uma quebra. Preferência por movimento reduzido conserva a alternativa imediata.

Não há novas dependências, segredos ou migração dos saves. As áreas usam os indicadores existentes: Saúde não dispõe de mortalidade, hospitais ou demografia por idade; Infraestrutura não calcula tráfego real. A simulação continua sintética e experimental.
