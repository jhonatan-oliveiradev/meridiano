# Meridiano

Um laboratório para criar países fictícios, explorar seus territórios e experimentar políticas públicas.

![Atlas territorial do Meridiano](docs/screenshots/atlas.jpg)

## Primeira versão

- Atlas procedural por semente, relevo sombreado e curvas de nível.
- Seis estados, municípios, capitais, rios e conexões esquemáticas.
- Seleção territorial por mapa, lista ou controles nativos acessíveis; zoom, arraste e centralização.
- Camadas de relevo, população, renda e bem-estar.
- Configuração de país, sistema político, orientação econômica e contexto externo.
- Renda básica, previdência, proteção trabalhista, tributação, saúde/educação e infraestrutura.
- Simulação trimestral de indicadores, orçamento, dívida e capacidade de execução; horizonte de 40 anos.
- Histórico gráfico, relatórios trimestrais, snapshots locais, comparação e exportação JSON.

## Executar

Requer Node.js 20 ou superior. Não há dependências de produção ou chaves de API.

```sh
npm run dev
```

Abra `http://localhost:4173`. O servidor local é apenas para desenvolvimento.

```sh
npm run check
npm test
npm run build
```

O build copia os arquivos estáticos de `dist/` para `build/`. Para Vercel: preset **Other**, comando `npm run build`, diretório de saída `build`. A configuração está em `vercel.json`. Não é necessário instalar pacotes.

## Estrutura

| Arquivo | Responsabilidade |
| --- | --- |
| `dist/index.html` | Estrutura e controles da aplicação |
| `dist/style.css` | Tokens, layout responsivo e cartografia |
| `dist/app.js` | Interface, estado, persistência e renderização |
| `dist/model.js` | Equações e parâmetros da simulação |
| `dist/geography.js` | Gerador determinístico e divisões Voronoi |
| `tests/model.test.js` | Invariantes, efeitos fiscais e geografia |
| `docs/MODEL.md` | Premissas e limites |
| `DESIGN.md` | Identidade visual e tokens |
| `UX-CONTRACT.md` | Comportamentos e acessibilidade |

## Natureza do modelo

**Modelo experimental, sem calibração empírica. Não produz previsões econômicas.** Todos os dados são sintéticos e os coeficientes são hipóteses explícitas. As relações não devem ser interpretadas como evidências sobre países ou ideologias reais.

Nesta versão, governo e orientação econômica são metadados independentes. Os controles de políticas e o contexto externo determinam as trajetórias. Municípios compartilham índices estaduais e recebem parcelas iguais da população do estado. As coordenadas dos centros estaduais são fixas; a semente varia litoral, relevo e distribuição municipal. Rios e estradas são esquemáticos.

Dados ficam neste navegador, sem conta ou sincronização. São mantidos até 20 snapshots; um novo salvamento substitui o mais antigo quando o limite é atingido. Exporte cópias para conservar o trabalho. A importação JSON ainda não foi implementada.

## Próximas etapas

1. Validar a experiência e a leitura do mapa com usuários.
2. Evoluir a geografia: bacias hidrográficas, conexões e cidades condicionadas ao relevo.
3. Separar economia, demografia e serviços por região e agregar resultados nacionais.
4. Adicionar parâmetros editáveis, faixas de incerteza e comparação com mesmas condições iniciais.
5. Modelar instituições, eleições, relações externas e comércio entre países.
6. Calibrar cenários com fontes e metodologia documentadas antes de qualquer pretensão preditiva.

O nome Meridiano é provisório. Sem licença de distribuição definida nesta etapa.
