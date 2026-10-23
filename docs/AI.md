# IA do gabinete

## Ativar na Vercel

1. Integre a PR ao fluxo de deploy escolhido.
2. Preset **Other**, diretório raiz do repositório, instalação `npm ci`, build `npm run build`, saída `build`.
3. Em **Settings → Environment Variables**, crie `GEMINI_API_KEY` com sua chave. Habilite nos ambientes desejados (Preview e/ou Production). Não use prefixo público. Não coloque a chave no chat nem no repositório.
4. Opcional: `GEMINI_MODEL=gemini-3.5-flash-lite`. É o padrão configurado no código. A disponibilidade e as cotas pertencem à sua conta Google e podem mudar.
5. Faça um novo deploy para aplicar as variáveis. O endpoint `GET /api/advisor` informa somente se a chave está presente. Use “Analisar trimestre” para verificar autenticação e disponibilidade reais do modelo.

Não é necessário banco de dados. O endpoint está em `api/advisor.js`, função Node.js com duração máxima de 30 segundos. A chamada ao provedor tem timeout de 18 segundos, e o cliente aguarda no máximo 22 segundos.

## Desenvolvimento local

`npm ci` e `npm run dev`. Opcionalmente crie `.env.local` com as variáveis de `.env.example`; o servidor local a carrega quando a versão do Node oferece `process.loadEnvFile`. Node 22 ou superior é recomendado. Sem chave, o servidor devolve 503 com mensagem própria; o resto do produto continua disponível. Nunca copie `.env.local` para `dist/` ou `build/`.

## Dados e fronteiras

O navegador envia nome, regime, orientação, contexto externo, semente, trimestre, políticas, métricas atuais, métricas do turno anterior e capacidade. O servidor valida e recompõe os campos permitidos e calcula orçamento e dados regionais. Não envia snapshots salvos, outros dados do navegador ou a conversa do ChatGPT. Perguntas têm limite de 600 caracteres.

A chave só vai no cabeçalho `x-goog-api-key` da chamada servidor → Google; nunca em URL. O Gemini produz título, resumo, observações, limites e sugestões, com schema JSON e validação posterior. Nenhum texto do modelo é executado ou inserido como HTML. A IA não escreve no estado econômico, não aplica políticas e não gera eventos com efeitos nesta versão.

O prompt pede português direto, observações ancoradas em indicadores e ausência de causalidade ideológica automática. Isso reduz respostas genéricas, mas não garante correção factual ou ausência de alucinações. O motor continua sendo experimental. O plano gratuito Google pode usar conteúdo para melhoria dos produtos; evite inserir informações pessoais nas perguntas.

## Cotas e disponibilidade

Até quatro consultas por minuto por identidade de IP em cada instância aquecida. Esse controle em memória não é distribuído nem uma garantia contra abuso, reinicializações ou rotação de IP. Antes de abrir acesso público amplo, configure limites no provedor e regras de rate limiting no firewall da Vercel ou um limiter persistente. Esta versão é adequada para teste privado/baixo volume, sem promessa de gratuidade ilimitada.

Erros do provedor e detalhes internos não são repassados ao usuário. O cliente tem cache em memória por snapshot/área/pergunta, cancelamento e descarte de respostas antigas. Cancelar no navegador impede o uso da resposta; não garante interrupção imediata de processamento já recebido pelo Google.

## Referências de implementação

- https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- https://ai.google.dev/gemini-api/docs/pricing
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/functions/configuring-functions/duration


## v0.4 · diagnóstico

O padrão agora é `gemini-3.5-flash-lite`. A documentação do Google em 23/10/2026 restringe a família 2.5 a projetos que já a usavam; novos projetos devem usar modelos atuais. Se `GEMINI_MODEL` ainda aponta para a família 2.5 e o provedor informa modelo indisponível, há uma única tentativa no padrão atual, dentro do orçamento de tempo original. Falhas de chave, quota e permissão genérica não provocam troca de modelo.

- `PROVIDER_KEY`: chave inválida, expirada ou recusada pelo Google.
- `PROVIDER_ACCESS`: API/projeto sem permissão ou restrição da chave.
- `MODEL_UNAVAILABLE`: modelo não disponível para o projeto.
- `PROVIDER_LIMIT`: quota do Google; não confundir com `RATE_LIMIT`, o limite local por instância.
- `PROVIDER_REQUEST`: payload recusado; exige conferir a integração.
- `PROVIDER_NETWORK` / `TIMEOUT`: conexão ou prazo da chamada.

A função registra somente código e status nos logs, sem chave, pergunta, cenário ou mensagem bruta do Google. O GET indica presença da chave, não testa suas permissões. A interface apresenta o código de erro para que um problema de configuração não seja confundido com indisponibilidade temporária.

Referências oficiais: https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite · https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite · https://ai.google.dev/gemini-api/docs/pricing


## v0.9 · gabinete e ferramentas

Nilo coordena Fazenda, Saúde e Infraestrutura. Cada consulta usa uma área selecionada, com escopo e ferramentas permitidas pelo servidor. É o mesmo modelo configurado, sem chamadas independentes para cada ministério. Os resumos das áreas enviados ao Nilo são calculados pelo jogo, não pareceres gerados por outros agentes.

O modelo pode devolver até três pedidos estruturados de leitura. O servidor valida nomes, argumentos, índices e escopo, executa funções puras do motor e solicita uma explicação final. Há no máximo três chamadas ao provedor por consulta, incluindo a migração de modelo antigo, dentro do prazo compartilhado de 18 segundos. Uma resposta direta continua usando apenas uma chamada. Pedidos repetidos na explicação final são rejeitados.

As ferramentas investigam estados, consultam o orçamento, comparam programas e preparam propostas. Nenhuma contrata, avança o trimestre ou altera políticas. Os cards são recalculados no navegador com o cenário atual; editar o cenário invalida suas ações. Revisar contratação abre o diálogo existente, onde o jogador confirma.

Atalhos de dados funcionam sem chave e recebem a identificação “Dados do jogo”. A chave e o modelo existentes continuam válidos, sem configuração adicional. Orquestração e interface verificadas com transporte simulado; a compatibilidade com a conta e a quota reais do Google precisa ser conferida após o deploy.
