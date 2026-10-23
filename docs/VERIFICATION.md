# Verificação v0.1

- `npm run check`: sintaxe dos módulos validada.
- `npm test`: seis testes passam (reprodução, imutabilidade, transferências/fisco, extremos por 160 trimestres, agregação populacional e geografia).
- Verificação adicional de 499 sementes: nenhuma cidade fora do litoral.
- Auditoria estática premium em modo estrito: zero achados.
- Browser desktop: renderização do mapa, slider por teclado, avanço temporal, gráfico, salvamento de snapshot, comparação, seleção de estado/município, configuração e erro de nome vazio.
- Incompatibilidade de `crypto.randomUUID` em HTTP corrigida com fallback local.
- Captura em `docs/screenshots/atlas.jpg`.

Limites: viewport móvel físico não foi exercitado nesta rodada; regras responsivas estão implementadas. Não foi feita auditoria completa WCAG nem validação científica. Falhas/quota do armazenamento possuem tratamento, mas não foram induzidas no browser. Exportação cria JSON; importação ainda não disponível.
