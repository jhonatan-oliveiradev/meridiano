# Painel do gabinete e controles do mapa · 27/10/2026

O cabeçalho sticky do conselheiro cobria o conteúdo rolado. O painel agora usa fluxo normal com padding de 20px, gutter estável e ações de pelo menos 44px, incluindo padding próprio no botão do plano. Seletores de estado, município, formulários e indicadores usam padding 10px 32px 10px 12px e altura mínima de 40px; controles compactos da timeline não mudam.

No desktop, a faixa abaixo do mapa reserva 64px para instruções, premissas e boletim. O boletim recolhido fica fora da cartografia, sem cobrir o cartão da região. No modo SVG/3D, o zoom fica à esquerda acima da legenda. No Atlas, controles nativos ficam acima da legenda e a escala acima da atribuição no canto oposto; os controles antigos de zoom/bússola ficam ocultos para evitar duplicidade. O boletim expandido continua sendo um overlay deliberado, acionado pelo usuário.

QA Chrome: desktop 1363×936 e iframe 1280×650, dois temas; painel rolado por navegação de teclado com scrollTop 418/626 e cabeçalho estático fora da área visível; mobile iframe 390×844 com clientWidth=scrollWidth=342 no painel e select de 40px. Sem scroll externo no desktop (clientHeight=scrollHeight=936). Mapa terminou em y796 e boletim começou em y806; zoom separado do cartão. O Atlas usou fallback vetorial neste browser, portanto os controles nativos WebGL foram revisados pelo CSS, sem validação visual em GPU/dispositivo físico. Sessão interrompida temporariamente e retomada antes da conclusão. Capturas em screenshots/map-layout.jpg e screenshots/cabinet-scroll-layout.jpg.

Prettier, syntax check, build e diff check aprovados. Nenhuma alteração de simulação, persistência ou API. HTML temporário de QA removido antes do build.
