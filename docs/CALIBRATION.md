# Calibração de jogabilidade — 28/10/2026

Reproduzir: `npm run calibrate` (JSON em stdout). Resultados integrais em `calibration-results.json`. Regras sintéticas do jogo; estes números não são previsões nem calibração empírica de economia ou hidrologia.

## Método

19 partidas, 852 trimestres: quatro sementes (719, 40315, 75101, 91731), quatro estratégias por 48 trimestres, mais três desafios pelos seus prazos completos. Mesma escolha inicial de cada acontecimento, sem IA. Obras passam por orçamento, três vagas de implantação, planejamento, construção, entrega, operação e manutenção; nenhuma fase é concedida artificialmente.

- Reativa: tributação 32%, serviços 8%, infraestrutura 4%; respostas emergenciais, sem obras.
- Preparada: mesmas políticas; contratar saneamento por estado, depois energia e mobilidade, respeitando as vagas.
- Despesa alta: tributação 20%, serviços 18%, infraestrutura 10%, renda mínima 800; sem obras.
- Austeridade: tributação 36%, serviços 4%, infraestrutura zero; sem obras.

A comparação preparada versus reativa combina políticas iguais e investimentos diferentes. Ela inclui seus efeitos posteriores sobre acontecimentos e respostas; não isola cada obra individual.

## Abastecimento e custo da preparação

Perda acumulada é a soma de `1 - atendimento nacional de água` em 48 trimestres; zero significa atendimento integral. É adimensional, não volume de água. Dinheiro em bilhões de M$. Manutenção é somente o que foi efetivamente pago no período.

| Semente | Perda reativa | Perda preparada | Redução | Obras pagas | Manutenção paga | Dívida final: reativa → preparada |
| ------- | ------------: | --------------: | ------: | ----------: | --------------: | --------------------------------: |
| 719     |          4.76 |            3.56 |   25.1% |       35.64 |            8.53 |                     36.6% → 43.0% |
| 40315   |          7.97 |            2.63 |   67.0% |       31.08 |            6.18 |                     37.0% → 45.2% |
| 75101   |          4.95 |            0.63 |   87.3% |       37.21 |            9.23 |                     35.9% → 42.5% |
| 91731   |          1.53 |            0.04 |   97.6% |       30.90 |            5.83 |                     35.1% → 39.5% |

Prevenção reduziu perdas nas quatro sementes, com obras e manutenção positivas e dívida final maior que na estratégia reativa. Não elimina qualquer seca nem oferece proteção gratuita. Os acontecimentos de água caíram de 6–8 para 1–6 por partida.

Nos quatro países, despesa alta atingiu o teto de dívida de 250% e bem-estar de cerca de 96,8; o alto bem-estar não significa solvência. Austeridade zerou a dívida, mas acumulou 1,38–2,04 de perda elétrica e bem-estar de 57,8–58,1, abaixo da estratégia reativa. As escolhas expõem custos diferentes; estes testes não provam ausência de uma estratégia dominante em todo o espaço de políticas.

## Desafios jogáveis

Não afrouxamos os critérios finais para forçar vitória. Estratégias verificadas:

- Fiscal: tributação 38%, serviços 8%, infraestrutura 4%, primeiras respostas; dívida final 82,4% (meta ≤95%), bem-estar 60,7 (meta ≥55).
- Água: condições iniciais e sequência preparada; média de água nos quatro trimestres finais 100% (meta ≥92%), dívida 43,1% (meta ≤110%).
- Indústria: dois parques de manufaturas contratados primeiro; depois saneamento e energia, por estado. Dois parques em operação, água e energia médias 100%, dívida 60,2%.

Vitória/falha é fixada no prazo ou no limite antecipado de dívida/bem-estar, e não muda ao continuar no modo livre. A suíte testa também perda por não cumprir abastecimento sustentado e congelamento do resultado.

## Repetição e limites da amostra

O script verifica intervalo global mínimo de dois trimestres, seis entre ocorrências da mesma família e doze para oportunidades industriais. Foram observadas água, energia, investimento, preços e fiscal. As famílias de serviços, segurança, alimentos, emprego e logística continuam cobertas por testes de elegibilidade, mas estes perfis não as exercitam todas.

Não houve razão nesta amostra para alterar coeficientes físicos do motor. O avanço desta etapa é uma bateria reproduzível com critérios de regressão, custos reais de implantação e desafios com soluções verificadas. Próximas rodadas devem abranger outras escolhas de resposta, comércio, geografia, pressão nos serviços e ajuste fino da dificuldade com partidas humanas.
