# Consequências e segurança pública · v0.11

O objetivo é experimentar escolhas com custos, defasagens e efeitos cruzados. Esta etapa acrescenta segurança pública, pressão nos serviços e explicações do fechamento. São índices nacionais sintéticos de 0 a 100, não taxas de homicídio, contagem de vítimas ou previsões. Governo e ideologia continuam descritivos, sem bônus ou penalidade automática.

## Escolhas

| Controle | Intervalo | Efeito no orçamento | Funcionamento |
| --- | --- | --- | --- |
| Investigação e policiamento | 0–4% do PIB/ano | adicional recorrente | Forma equipes e perícia gradualmente |
| Prevenção da violência | 0–2% | adicional recorrente | Forma rede comunitária em prazo maior |
| Controle e transparência policial | 0–1% | adicional recorrente | Recupera confiança e atenua a perda associada a operações intensas |
| Intensidade das operações | 0–100 | estrutura financiada pelos demais gastos | Atua apoiada na capacidade investigativa; acima de 50, pode reduzir a confiança |

Os três reforços somam-se à despesa anual. Os 11 pontos fixos anteriores já incluem a estrutura pública básica; reforço zero não significa ausência de polícia. O saldo anual é dividido por quatro na dívida trimestral, como antes. Respostas a acontecimentos cobram gasto extraordinário uma vez. Não há novo contrato regional de segurança nesta etapa.

## Equações e ordem

Fonte normativa: `dist/consequences.js`. Todos os coeficientes são de balanceamento e não foram ajustados a países reais. `C` é capacidade administrativa; `S`, `P`, `O`, `E` são os quatro controles acima. Valores de referência: violência V=45, investigação I=40, prevenção N=35, confiança T=55 e pressão R=35.

- Investigação aproxima-se de `clamp(40 + 13*S*C)` em 12% da distância por trimestre.
- Prevenção aproxima-se de `clamp(35 + 25*P*C)` em 8% da distância.
- Confiança: `ΔT = 0,1*(55 + 24*O*C − T) − 0,035*max(0,E−50)*(1−0,8*O) + resposta`.
- Violência: `ΔV = 0,08*(45−V) + 0,025*(pobreza−24,6) + 0,045*(desemprego−8,7) − 0,035*(I−40) − 0,025*(N−35) − 0,008*(E−50)*I/100 − 0,012*(T−55) + resposta`.
- Pressão: `ΔR = 0,12*(35 + 0,55*(pobreza−24,6) + 0,7*(desemprego−8,7) + 0,45*(V−45) − 2*(serviços−8)*C − R) + resposta`.
- Registro de ocorrências: `V seguinte * (0,35 + 0,005*T seguinte)`. Maior disposição para denunciar pode elevar registros mesmo com queda da violência. O índice não é uma contagem de crimes nem uma taxa populacional.
- Violência acima de 45 reduz o crescimento anual em `0,01*(V−45)` pontos percentuais. O alvo de bem-estar perde `0,08*max(0,V−45) + 0,06*max(0,R−35)` pontos, antes do ajuste gradual de 10% já existente.

Efeitos de investigação, prevenção e confiança sobre violência usam a capacidade do **início** do trimestre; um aumento de dotação não instala estrutura instantaneamente. Valores são limitados a 0–100. As explicações preservam as parcelas e eventual ajuste pelo limite; somam a variação antes de arredondar. A convergência de referência evita deriva ilimitada e representa contexto não modelado, não uma taxa natural universal de criminalidade. Vulnerabilidade e mercado de trabalho são pressões agregadas do cenário; não classificam pessoas ou grupos como criminosos.

## Experiência

- Avançar manualmente abre uma prévia com saldo, obras/manutenção, reforço de segurança, indicadores projetados, mudanças de fase, prazos de metas e resposta agendada. Confirmar usa o mesmo motor; se o cenário mudou enquanto o diálogo estava aberto, atualiza a prévia. Reprodução automática conserva o avanço direto e pausa em acontecimentos/diálogos.
- Indicadores oferece séries de violência, investigação, rede de prevenção, confiança, pressão e registros. **Entender este indicador** mostra a decomposição exata do último fechamento para esses índices; indicadores econômicos apresentam fatores e a leitura antes/depois, sem atribuição causal isolada.
- Davi, secretário de Segurança Pública, consulta diagnóstico nacional e orçamento. Não contrata obras ou executa operações. Nilo pode acessar o mesmo diagnóstico e supervisionar a área. As consultas locais funcionam sem chave; a interpretação por IA usa contexto numérico validado.
- Metas de violência pertencem ao Davi e usam os mesmos prazos, limites e registros do plano. Decisões de segurança podem surgir com violência alta ou confiança baixa, bloqueando o avanço até uma resposta.
- País aleatório sorteia condições e políticas de segurança de forma reproduzível, sem atribuí-las ao regime.

## Saves e API

Campos novos são opcionais em saves v1 e entradas legadas da API. A interface aplica padrões neutros, sem alterar saldos anteriores: reforços zero, operações 50 e índices de referência. O último registro passa a marcar o início do acompanhamento no trimestre atual; registros anteriores não são preenchidos. Histórico e relatório seguem no mesmo JSON. Balanços antigos omitem índices indisponíveis. A API aceita somente os campos numéricos permitidos, rejeita valores inválidos e recalcula a projeção/diagnóstico; não confia em relatório enviado pelo cliente. Ferramentas continuam com limite de três consultas e sem mutação.

## Referências e limites

As referências orientam a escolha de mecanismos, não os coeficientes ou o tamanho dos efeitos:

- [NIJ — Five Things About Deterrence](https://nij.ojp.gov/topics/articles/five-things-about-deterrence): distingue certeza de detecção de severidade da punição. O jogo não oferece aumento de pena como atalho universal.
- [UNODC — Collecting victim data](https://www.unodc.org/e4j/en/crime-prevention-criminal-justice/module-11/key-issues/4--collecting-victim-data.html): subnotificação, confiança e acesso afetam os registros administrativos.
- [College of Policing — Hot spots policing](https://www.college.police.uk/guidance/hot-spots-policing): estratégia, local e implementação importam. Não se transferem resultados de uma intervenção local para uma taxa nacional automática.
- [OMS — INSPIRE](https://www.who.int/teams/social-determinants-of-health/violence-prevention/inspire-technical-package): prevenção multissetorial da violência contra crianças e adolescentes; não sustenta uma estimativa numérica universal de criminalidade adulta.

Ainda não há criminalidade por estado, dinâmica de facções, desigualdade de renda individual, sistema prisional, justiça, eleições ou incerteza estatística. Pressão nos serviços é agregada, não estima tamanho de filas. Os índices não inferem condutas individuais. O comportamento é determinístico e auditável; realismo dos mecanismos não equivale a validação empírica.
