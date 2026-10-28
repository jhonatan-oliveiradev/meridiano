# Entrada e tutorial do Meridiano

Direção: menu de jogo editorial, tipografia existente, mapa real do cenário em destaque, verde ácido como ação principal. Home responsiva com continuar/começar, novo país e aprender jogando. Sem serviços ou bibliotecas novas.

Tutorial: Nilo apresenta nove áreas com foco visual, seta, progresso, voltar, avançar e pular. Navega pelas telas reais sem executar decisões ou avançar o trimestre. Retoma etapa local interrompida, permite reiniciar; não modifica o estado econômico. Sessão pausada ao abrir entrada/tutorial. Foco contido e restaurado, Escape, reduced motion, viewport mobile e alvo fora da tela tratados.

1. Criar testes e modelo puro para progresso limitado, retomada, conclusão e posicionamento do coach dentro do viewport.
2. Criar onboarding.js/onboarding.css: entrada com mapa do cenário e dados atuais; coach com spotlight, seta, teclado, reposicionamento e recuperação local.
3. Integrar app.js/index.html: entrada antes do gerenciador, criação pelo formulário existente, continuar sem reset, acesso pela marca e ajuda; incluir arquivos no build.
4. Rodar testes/check/build/formatação e QA desktop/mobile: primeira visita, retorno, novo/cancelar, pular/retomar/concluir/rever, teclado e dados preservados.
5. Publicar branch e PR para dev, sem merge/deploy em produção.

## Validação

Implementado. 127 testes passaram. QA desktop 1363×936: entrada com documento em 100vh, criação e cancelamento, estado preservado após nove etapas, pular/retomar/concluir/rever, foco contido com Tab/Shift+Tab e Escape. QA em iframe 390×844: entrada com rolagem vertical sem transbordamento horizontal; nove etapas com coach dentro do viewport e alvos visíveis. Temas claro e escuro conferidos. Tutorial expositivo; não executa ações nem exige gastar recursos. Links diretos às telas continuam disponíveis.
