# Inicialização da tela de entrada

A captura relatada continha apenas o HTML estático: mapa, nome, população, período e rótulo dinâmico do botão ainda não haviam sido preenchidos. Em produção, uma sessão nova carregou Aurora normalmente; nenhum erro da aplicação foi reproduzido. Não se atribui a falha original a uma causa específica sem evidência.

O feedback inicial dependia da importação de todo o grafo de módulos do jogo. Agora boot.js inicia de forma independente, mantém feedback estático e ações desabilitadas até app.js terminar, informa demora após 15 segundos e mostra recuperação se importação ou inicialização rejeitar. O link de recarregar também funciona sem o módulo de boot. Não limpa nem substitui dados salvos.

QA: atraso controlado e rejeição de módulo em fixtures temporárias, removidas antes do build. Demora informa recuperação, falha mantém ações bloqueadas, carregamento bem-sucedido revela oito regiões e dados de Aurora. Recarregar dispara nova abertura. Estado de falha em iframe 390×844 sem overflow horizontal. Testes cobrem ordem dos estados, falha, cancelamento de timeout e contrato da interface. Não houve mudança em produção.
