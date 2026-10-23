# Gabinete e ferramentas do conselheiro

Escopo aprovado: Nilo coordena Fazenda, Saúde e Infraestrutura; investigar estados, comparar investimentos e preparar propostas. Um modelo com perfis especializados, sem agentes autônomos concorrentes. Não acrescentar Educação ou secretarias estaduais fictícias antes de funções próprias. Cargos do coordenador seguem o sistema de governo.

Ferramentas de leitura compartilham regras ESM entre cliente/servidor: investigar estados por indicadores disponíveis, consultar orçamento, comparar até seis propostas, preparar uma proposta. Saúde acessa atenção básica, Infraestrutura saneamento/mobilidade; Fazenda lê financiamento de todos os programas; Nilo agrega as áreas. Contratação, avanço e alterações de política não são ferramentas disponíveis.

IA usa JSON estruturado para pedir até três ferramentas. O servidor valida nome e argumentos, executa somente consultas permitidas e faz no máximo uma segunda chamada para explicar os resultados. Mesmo prazo total, quota lógica existente e limite de três chamadas de provedor incluindo eventual migração do modelo legado. Resultado final não pode pedir novas ferramentas. Sem ferramenta solicitada, manter análise textual compatível. Erros não expõem conteúdo bruto do provedor.

Cards usam números do motor, não texto numérico da IA. A resposta inclui receitas de consulta; cliente as recalcula na mesma impressão do cenário. Mudanças de país, políticas, obras ou trimestre desabilitam ações antigas. Trocar área cancela consulta e preserva rascunho. Cache inclui área e cenário. Dados são apresentados como texto/DOM, sem HTML do modelo.

Ações Ver no mapa e Revisar contratação são locais. Revisar abre a proposta já existente, recalculada na hora; somente seu botão de confirmação contrata. Atalhos explícitos de consulta ao jogo funcionam sem API, com autoria Dados do jogo. Sem alterar disponibilidade declarada da IA. Preservar Nilo, escrita progressiva, Enter/enviar, Ctrl+Enter/quebra, input limpo e compositor recolhível.

Verificar limites e escopos, snapshots imutáveis, bloqueios de projeto, legado, duas etapas e prazo compartilhado, migração com limite, não recursão, erros/cancelamento, cartas antigas, tema/teclado/mobile/100vh. Publicar PR, sem merge automático. GPU permanece fora desta entrega.
