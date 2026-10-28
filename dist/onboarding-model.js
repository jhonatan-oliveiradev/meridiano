export const tutorialSteps = [
  {
    view: "territorio",
    target: ".map-shell",
    title: "Este é o seu território",
    text: "Arraste o mapa e use o zoom para explorar. As camadas mostram onde vivem as pessoas, a renda e os recursos do país.",
    task: "Primeiro, conheça o terreno.",
  },
  {
    view: "territorio",
    target: "#stateSelect",
    title: "Cada estado tem suas necessidades",
    text: "Selecione um estado para consultar população, pobreza, serviços e potencial produtivo. Em Investir no estado, você vê custo e prazo antes de contratar.",
    task: "Compare antes de distribuir investimentos.",
  },
  {
    view: "politicas",
    target: "#policies",
    title: "As decisões começam aqui",
    text: "Ajuste impostos, serviços públicos e proteção social. Os controles preparam as políticas do próximo trimestre; os efeitos aparecem gradualmente.",
    task: "Uma mudança por vez facilita entender o resultado.",
  },
  {
    view: "politicas",
    target: "#policyBudget",
    title: "Toda política precisa caber no orçamento",
    text: "Compare receitas e despesas. Gastar acima da arrecadação aumenta a dívida; obras também exigem manutenção depois da entrega.",
    task: "Olhe o saldo antes de avançar.",
  },
  {
    view: "comercio",
    target: ".trade-heading",
    fallback: "#tradeContent",
    title: "Produzir, abastecer, exportar",
    text: "O potencial do território orienta a produção. O consumo interno vem antes das exportações; reservas, insumos e logística limitam as vendas. Cenários antigos precisam ativar esta economia aqui.",
    task: "Mais recursos não significam produção pronta.",
  },
  {
    view: "indicadores",
    target: "#indicatorCards .indicator-card",
    title: "Confira o que mudou",
    text: "Acompanhe economia, bem-estar e segurança. Depois de avançar, o balanço ajuda a separar os efeitos das políticas, investimentos e acontecimentos.",
    task: "Compare o resultado com o que você pretendia mudar.",
  },
  {
    view: "plano",
    target: ".plan-heading",
    title: "Dê uma direção ao governo",
    text: "Crie metas com indicador, alvo e prazo. O plano acompanha a distância até cada objetivo e ajuda o gabinete a priorizar propostas.",
    task: "Comece com uma meta que consiga acompanhar.",
  },
  {
    view: "conselheiro",
    target: "#cabinetTeam",
    fallback: ".advisor-layout",
    title: "Você tem um gabinete",
    text: "Nilo coordena os secretários. Cada área ajuda a investigar problemas e preparar propostas. Revise custos e efeitos antes de confirmar qualquer ação.",
    task: "Peça uma análise quando não souber por onde começar.",
  },
  {
    view: "territorio",
    target: "#advance",
    title: "Seu próximo passo: um trimestre",
    text: "Avançar trimestre abre a revisão das decisões. Confirme quando estiver pronto. Se surgir um acontecimento, o jogo espera sua resposta. Salve cenários para comparar caminhos depois.",
    task: "Explore, escolha, avance e compare.",
  },
];
const fresh = () => ({ version: 1, index: 0, status: "new" });
export function readTutorial(raw) {
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (
      p?.version !== 1 ||
      !Number.isInteger(p.index) ||
      p.index < 0 ||
      p.index >= tutorialSteps.length ||
      !["new", "active", "paused", "completed"].includes(p.status)
    )
      return fresh();
    if (p.status === "completed" && p.index !== tutorialSteps.length - 1)
      return fresh();
    return { version: 1, index: p.index, status: p.status };
  } catch {
    return fresh();
  }
}
export function moveTutorial(progress, action) {
  const p = readTutorial(progress);
  if (action === "restart") return { ...fresh(), status: "active" };
  if (action === "skip") return { ...p, status: "paused" };
  if (action === "back")
    return { ...p, index: Math.max(0, p.index - 1), status: "active" };
  if (action === "next")
    return p.index === tutorialSteps.length - 1
      ? { ...p, status: "completed" }
      : { ...p, index: p.index + 1, status: "active" };
  return { ...p, status: "active" };
}
export function placeCoach(r, vw, vh, cw = 350, ch = 290) {
  const width = Math.min(cw, vw - 24),
    height = Math.min(ch, vh - 24),
    gap = 20;
  let x = r.left,
    y = r.bottom + gap,
    side = "below";
  if (vh - r.bottom < height + gap && r.top >= height + gap) {
    y = r.top - height - gap;
    side = "above";
  } else if (vh - r.bottom < height + gap && vw - r.right >= width + gap) {
    x = r.right + gap;
    y = r.top;
    side = "right";
  } else if (vh - r.bottom < height + gap && r.left >= width + gap) {
    x = r.left - width - gap;
    y = r.top;
    side = "left";
  }
  return {
    x: Math.max(12, Math.min(x, vw - width - 12)),
    y: Math.max(12, Math.min(y, vh - height - 12)),
    width,
    height,
    side,
  };
}
