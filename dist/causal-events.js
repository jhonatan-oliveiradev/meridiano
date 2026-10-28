export const causalIncidents = [
  {
    key: "energy",
    title: "A rede elétrica não acompanha a demanda",
    detail:
      "Consumo e produção disputam uma rede limitada. A restrição já reduz a capacidade produtiva neste estado.",
    choices: [
      {
        id: "repair",
        label: "Reparar a rede e mobilizar equipes",
        detail:
          "Recupera 18 pontos da condição da rede no próximo trimestre; não instala geração permanente.",
        effect: { cost: 0.35 },
        systems: { grid: 18 },
      },
      {
        id: "ration",
        label: "Racionar o consumo com prioridade aos serviços",
        detail:
          "Preserva atendimento essencial, com perda de bem-estar; a ampliação estrutural precisa de investimento.",
        effect: { cost: 0.08, welfare: -0.2 },
        systems: { energyRation: 1 },
      },
      {
        id: "wait",
        label: "Manter a operação atual",
        detail:
          "Sem gasto extraordinário. A produção continua limitada pela rede.",
        effect: {},
      },
    ],
  },
  {
    key: "food",
    title: "O abastecimento de alimentos ficou insuficiente",
    detail:
      "A produção, os estoques e as importações disponíveis não atenderam todo o consumo interno.",
    choices: [
      {
        id: "buy",
        label: "Autorizar compras emergenciais por um trimestre",
        detail:
          "Subsídio de distribuição e autorização temporária de importação: amplia em 50% o limite externo de alimentos, inclusive se as compras regulares estiverem suspensas. Oferta externa ainda limita o atendimento.",
        effect: { cost: 0.3 },
        systems: { food: 1 },
      },
      {
        id: "income",
        label: "Ampliar a renda básica em M$ 50 mensais",
        detail:
          "Mudança recorrente na política nacional. Protege renda, mas não cria alimentos; reveja o orçamento e a produção.",
        effect: {},
        policyChange: { income: 50 },
      },
      {
        id: "wait",
        label: "Manter as políticas atuais",
        detail:
          "Sem nova medida. A escassez continua pressionando preços conforme os fluxos do próximo trimestre.",
        effect: {},
      },
    ],
  },
  {
    key: "employment",
    title: "A recuperação não está chegando ao emprego",
    detail:
      "O desemprego elevado pede uma decisão entre qualificação, apoio à produção e preservação do orçamento.",
    choices: [
      {
        id: "training",
        label: "Reforçar serviços e formação em 0,5 p.p. do PIB",
        detail:
          "Amplia a política nacional de serviços. A capacidade cresce gradualmente; não garante contratação imediata.",
        effect: {},
        policyChange: { services: 0.5 },
      },
      {
        id: "connections",
        label: "Reforçar infraestrutura em 0,5 p.p. do PIB",
        detail:
          "Despesa recorrente com redes e execução. Empresas ainda dependem de demanda para produzir e contratar.",
        effect: {},
        policyChange: { infrastructure: 0.5 },
      },
      {
        id: "wait",
        label: "Acompanhar sem ampliar despesas",
        detail:
          "Sem ajuste de política. O emprego segue a atividade e os demais fatores do modelo.",
        effect: {},
      },
    ],
  },
  {
    key: "prices",
    title: "O custo de vida está pressionando as famílias",
    detail:
      "A inflação elevada exige distinguir falta de oferta, atividade econômica e proteção da renda.",
    choices: [
      {
        id: "supply",
        label: "Facilitar compras emergenciais de alimentos",
        detail:
          "Autorização temporária e subsídio à distribuição. Pode aliviar a falta de alimentos; não resolve toda a inflação.",
        effect: { cost: 0.2 },
        systems: { food: 1 },
      },
      {
        id: "support",
        label: "Ampliar a renda básica em M$ 50 mensais",
        detail:
          "Protege a renda disponível e aumenta a despesa recorrente. Transferência não amplia a oferta física.",
        effect: {},
        policyChange: { income: 50 },
      },
      {
        id: "wait",
        label: "Manter a orientação atual",
        detail:
          "Sem gasto extraordinário; preços seguem abastecimento, contexto e políticas existentes.",
        effect: {},
      },
    ],
  },
  {
    key: "fiscal",
    title: "O espaço fiscal está se estreitando",
    detail:
      "Dívida elevada e despesas básicas acima da arrecadação reduzem a margem para novas políticas.",
    choices: [
      {
        id: "revenue",
        label: "Aumentar a tributação em 1 p.p. do PIB",
        detail:
          "Mudança recorrente. Reforça receitas, com efeitos sobre a atividade considerados pelo modelo.",
        effect: {},
        policyChange: { tax: 1 },
      },
      {
        id: "reprioritize",
        label: "Reduzir infraestrutura em 0,5 p.p. do PIB",
        detail:
          "Reduz despesas futuras, mas limita manutenção, capacidade logística e execução.",
        effect: {},
        policyChange: { infrastructure: -0.5 },
      },
      {
        id: "wait",
        label: "Manter as políticas e o financiamento",
        detail:
          "O déficit continua financiado por dívida; não há crédito extraordinário para cobri-lo.",
        effect: {},
      },
    ],
  },
].map((e) => ({ ...e, region: "Visão nacional", eligible: () => false }));
export function networkChoices(key, choices) {
  if (key === "water")
    return choices.map((c) => ({
      ...c,
      effect:
        c.id === "relief"
          ? { cost: 0.6 }
          : c.id === "ration"
            ? { cost: 0.1, welfare: -0.2 }
            : {},
      systems:
        c.id === "relief"
          ? { water: 25 }
          : c.id === "ration"
            ? { ration: 1 }
            : {},
    }));
  if (key === "freight")
    return choices.map((c) => ({
      ...c,
      effect:
        c.id === "routes"
          ? { cost: 0.5 }
          : c.id === "shifts"
            ? { cost: 0.2 }
            : {},
      systems:
        c.id === "routes"
          ? { transport: 0.4 }
          : c.id === "shifts"
            ? { transport: 0.2 }
            : {},
    }));
  if (key === "investment")
    return choices.map((c) => ({
      ...c,
      effect:
        c.id === "connect"
          ? { cost: 0.7 }
          : c.id === "coordinate"
            ? { cost: 0.2 }
            : {},
      systems:
        c.id === "connect"
          ? { industry: 0.12 }
          : c.id === "coordinate"
            ? { industry: 0.05 }
            : {},
      detail:
        c.id === "decline"
          ? "Sem apoio ou ampliação produtiva. O orçamento permanece disponível."
          : "Apoio às conexões públicas: após dois trimestres completos de implantação, a capacidade privada de manufaturas aumenta. Produção depende de energia, insumos e demanda.",
    }));
  return choices;
}
