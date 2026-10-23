# Modelo experimental v0.1

Fonte normativa das equações: `dist/model.js`. Valores fictícios em M$, população em milhões e PIB em bilhões. Turnos trimestrais; políticas e saldos expressos em base anual. Nenhum parâmetro foi estimado com dados empíricos.

## Contabilidade

Renda básica (% PIB) = benefício mensal × 12 × população / (PIB × 1000) × 100. Previdência (% PIB) = cobertura × 0,075. Despesa = 11 + serviços + infraestrutura + transferências + previdência. Juros (% PIB) = dívida/PIB × 0,055. Saldo = alíquota efetiva − despesa − juros. Dívida/PIB seguinte = (dívida/PIB − saldo/4) / (1 + crescimento anual/400).

Os 11 pontos fixos representam os demais gastos do Estado. Juros não variam com política monetária, prêmio de risco ou inflação. Não há balanço patrimonial nem mercado de títulos.

## Produção e população

Crescimento anual = 2 + 0,12 × (infraestrutura − 3) × capacidade + 0,12 × (serviços − 8) × capacidade − 0,045 × max(0, tributação − 32) − 0,025 × max(0, proteção − 65) + min(1, renda básica % PIB × 0,07) + contexto + ciclo − 0,03 × max(0, dívida − 85). Limitado entre −8% e 9%. PIB cresce à taxa anual/4. População cresce 0,2% por trimestre.

Contexto: estável = 0; recessão = −1,6; expansão = +1,3; sanções = −2,4 pontos. Ciclo = sen((trimestre + semente mod 17) × 0,7) × 0,22. É determinístico e igual para a mesma semente e políticas; não representa incerteza estatística.

## Defasagens

Capacidade inicial de 0,65. A cada trimestre varia em 0,0009 × (serviços − 8) + 0,0005 × (infraestrutura − 3), limitada entre 0,35 e 0,95. Pobreza, inflação e bem-estar caminham para metas definidas no código em passos de 13%, 16% e 10% da distância, respectivamente. Esses coeficientes são arbitrários e devem ser submetidos a análise de sensibilidade.

## Território

Seis centros estaduais fixos formam células Voronoi recortadas pelo litoral. Cada estado recebe cidades por rejeição e suas próprias divisões municipais, também recortadas na fronteira estadual. A semente altera a costa, o campo de altitude e a distribuição municipal. O relevo visual é um campo analítico com cristas; curvas de nível usam interseções de grade. O relevo de custo econômico é um parâmetro estadual simplificado, não uma integração do campo visual.

As participações populacionais estaduais somam 100%. Perfis fixos de renda e acesso produzem diferenças locais. Infraestrutura melhora o acesso com ganho inversamente proporcional ao custo do relevo. Índices regionais são derivações das métricas nacionais: não há ainda dinâmica econômica regional autônoma. A renda regional é um índice relativo; não é uma partição contábil calibrada do PIB. Municípios dividem igualmente a população estadual e usam os demais indicadores do estado.

## Limites

Governo e ideologia são descritivos, sem bônus ou penalidade automáticos. Não existem agentes, eleições, migração, faixas etárias, produção setorial, comércio bilateral, distribuição de renda por domicílio ou causalidade estimada. A aprovação é calculada, mas ainda não exibida nem usada em decisões. Sem intervalos de incerteza; determinismo não implica precisão científica.
