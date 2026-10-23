# Conselheiro Gemini

## Ativar na Vercel

1. Integre a branch da PR ao fluxo de deploy escolhido. A branch `main` inicial contém somente o README enquanto a PR não for integrada.
2. Preset **Other**, diretório raiz do repositório, instalação `npm ci`, build `npm run build`, saída `build`.
3. Em **Settings → Environment Variables**, crie `GEMINI_API_KEY` com sua chave. Habilite nos ambientes desejados (Preview e/ou Production). Não use prefixo público. Não coloque a chave no chat nem no repositório.
4. Opcional: `GEMINI_MODEL=gemini-2.5-flash-lite`. É o padrão configurado no código. A disponibilidade e as cotas pertencem à sua conta Google e podem mudar.
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

Erros do provedor e detalhes internos não são repassados ao usuário. O cliente tem cache em memória por snapshot/pergunta, cancelamento e descarte de respostas antigas. Cancelar no navegador impede o uso da resposta; não garante interrupção imediata de processamento já recebido pelo Google.

## Referências de implementação

- https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- https://ai.google.dev/gemini-api/docs/pricing
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/functions/configuring-functions/duration
