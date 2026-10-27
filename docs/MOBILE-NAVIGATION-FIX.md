# Navegação mobile — correção de 26/10/2026

A regra mobile `.rail .nav-toggle { display:none }` era sobrescrita pela posterior `.rail .rail-btn { display:flex }`, com mesma especificidade. O controle desktop aparecia como item extra na grade de duas colunas. Ao tocar, alterava nav-expanded, cuja expansão só existe em >=761px; não havia resultado visual.

A correção usa `.rail > .rail-btn.nav-toggle` somente no bloco mobile existente. Os seis destinos e a ajuda ocupam as sete posições previstas. Nenhuma lógica de navegação ou expansão desktop muda.

Reprodução antes: mobile 390×844, display flex, toque alterna aria-expanded sem mudança de layout. Depois: display none; ajuda visível e toque abre o modal. Desktop 1363×936: controle continua visível, clique expande/recolhe e largura expandida de 180px. QA em Chrome com viewport mobile em iframe, sem teste físico no Safari/iOS. Captura em screenshots/mobile-navigation-fix.jpg. Prettier, diff check, syntax e build aprovados; sem testes de implementação CSS novos.
