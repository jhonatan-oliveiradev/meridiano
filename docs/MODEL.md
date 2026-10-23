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

Países v2 recebem geografia persistida na criação. Área e população inicial influenciam o número de estados e municípios; costa, altitude, declividade e proximidade da água influenciam a ocupação. Células Voronoi recortadas formam as divisões, deformadas pela mesma transformação que o litoral. As participações urbanas e rurais somam a população nacional, e as áreas municipais somam as estaduais. Densidade = população municipal × 1.000.000 / área em km². Veja [Território](TERRITORY.md) para regras e limitações.

Acesso e perfil relativo de renda definem diferenças regionais; infraestrutura melhora o acesso com menor retorno nas serras. Municípios possuem população, área, urbanização, densidade e acesso próprios; renda, pobreza e bem-estar ainda derivam do estado. Não há dinâmica econômica regional autônoma. As participações populacionais permanecem constantes durante os turnos: crescimento uniforme, sem migração. A renda regional é um índice relativo, sem contabilidade setorial calibrada.

Cenários legados sem `territory` preservam seis centros estaduais fixos, litoral e relevo originais, participações fixas e divisão igualitária da população entre os municípios. Nenhuma área ou densidade é inventada para esses cenários.

## Limites

Governo e ideologia são descritivos, sem bônus ou penalidade automáticos. Não existem agentes, eleições, migração, faixas etárias, produção setorial, comércio bilateral, distribuição de renda por domicílio ou causalidade estimada. A aprovação é calculada, mas ainda não exibida nem usada em decisões. Sem intervalos de incerteza; determinismo não implica precisão científica.
