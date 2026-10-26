# Rádio Meridiano

Player opcional e independente do motor. Entrada na timeline desktop e botão fixo acima da navegação mobile, à esquerda para não cobrir os controles do mapa ou o campo recolhido do gabinete. Painel com lista e transição curta; claro/escuro, teclado, Escape e preferência de movimento reduzido. O visualizador é decorativo: animação CSS apenas enquanto toca e com a aba visível; não representa análise espectral do áudio.

HTMLAudioElement único, com preload=none e sem src na inicialização. A lista é um manifesto local, sem chamadas externas. Escolher na lista inicia reprodução; anterior/próxima preservam a intenção atual. Lista sequencial circular ou aleatória sem repetição imediata. Anterior volta ao início após três segundos; antes disso retorna à faixa anterior do histórico. Falhas pausam com ação explícita de tentar novamente. A integração opcional Media Session disponibiliza controles do sistema onde suportados.

Preferências em meridiano:music:v1: identificador da faixa, volume, silenciado e aleatório. Persistência defensiva; nunca salvar intenção de tocar. Recarregar exige play, enquanto navegar dentro do app não recria o player. Não entra nos cenários JSON e não altera simulação, IA ou tempo do país. Volume padrão 35%; controles de volume por elemento podem depender da plataforma no iOS.

## Faixas

12 MP3 fornecidos pelo proprietário no arquivo music.zip, 28 minutos no total. Arquivos originais sem tags embutidas ou documento de licença no ZIP; títulos e identificadores dos artistas são derivados dos nomes recebidos. Não se atribui licença presumida. Os nomes originais são mantidos no caminho dos arquivos. Preservar a comprovação de autorização/origem junto dos documentos do projeto.

Derivados de reprodução: FFmpeg/libmp3lame, 128 kbps, estéreo, 44.1 kHz, sem tags de encoder copiadas do original. Cerca de 26,3 MB no conjunto (originais 53,6 MB). Não carregar/precachear a playlist toda; o navegador busca apenas a faixa escolhida e pode pedir trechos. Vercel serve os arquivos estáticos; o servidor local responde 200/206/416, MIME audio/mpeg e Accept-Ranges.

Para incluir outra faixa: acrescentar o MP3 a dist/assets/music e a entrada em dist/music-tracks.js com id estável, título, artista, src relativo e duração em segundos. O build exige cada caminho do manifesto. Não adicionar serviços, chaves de API ou dependências para o player.
