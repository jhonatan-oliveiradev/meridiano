import { cabinetFor } from "./country.js";
import { cabinetRoles, roleFor, runCabinetTool } from "./cabinet-tools.js";
const $ = (s) => document.querySelector(s);
const node = (tag, text, className) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
};
const fmt = (v, d = 1) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d }).format(v);
const money = (v) =>
  v >= 1 ? `M$ ${fmt(v, 2)} bi` : `M$ ${fmt(v * 1000, 1)} mi`;
const people = (v) =>
  v >= 1 ? `${fmt(v, 2)} milhões` : `${fmt(v * 1000, 0)} mil`;
export function initCabinetPanel({
  getState,
  getRole,
  setRole,
  getStamp,
  onQuick,
  onIdentity,
  onSelect,
  onPrepare,
  notify,
}) {
  const root = $("#cabinetResults");
  function button(label, action) {
    const b = node("button", label, "secondary");
    b.type = "button";
    b.dataset.cabinetAction = "";
    b.onclick = action;
    return b;
  }
  function updateIdentity() {
    const role = roleFor(getRole());
    const title = role.title || cabinetFor(getState().government).title;
    document
      .querySelectorAll("[data-cabinet-name]")
      .forEach((el) => (el.textContent = role.name));
    document
      .querySelectorAll("[data-active-cabinet-title]")
      .forEach((el) => (el.textContent = title));
    $(".nilo-stage").setAttribute("aria-label", `${role.name}, ${title}`);
    $("#cabinetAvatar").setAttribute("aria-label", `Cumprimentar ${role.name}`);
    $("#largeCabinetAvatar").setAttribute(
      "aria-label",
      `Cumprimentar ${role.name} em destaque`,
    );
    $("#niloSpin").setAttribute("aria-label", `Fazer ${role.name} girar`);
    $(".composer-avatar img").src = `assets/${role.avatar}-neutral.svg`;
    onIdentity?.(role);
  }
  function updateRole() {
    const role = roleFor(getRole());
    $("#cabinetTeam").replaceChildren(
      ...cabinetRoles.map((r) => {
        const b = node("button", undefined, "cabinet-member");
        const img = node("img");
        img.src = `assets/${r.avatar}-neutral.svg`;
        img.alt = "";
        img.width = 30;
        img.height = 30;
        const label = node("span");
        label.append(node("strong", r.name), node("small", r.area));
        b.append(img, label);
        b.type = "button";
        b.setAttribute("aria-pressed", String(r.id === role.id));
        b.setAttribute("aria-label", `Consultar ${r.name} · ${r.area}`);
        b.onclick = () => setRole(r.id);
        return b;
      }),
    );
    updateIdentity();
    $("#cabinetScope").textContent = role.scope;
    $("#cabinetActiveOffice").textContent = role.office;
    $("#cabinetComposerTitle").textContent = `Converse com ${role.name}`;
    $("#advisorScroll").setAttribute("aria-label", `Conversa com ${role.name}`);
    $("#expandComposer").setAttribute(
      "aria-label",
      `Escrever para ${role.name}`,
    );
    $(".composer-hint").textContent = `Escrever para ${role.name}`;
    const questions = {
      nilo: [
        [
          "Qual estado precisa de atenção?",
          "Investigue os estados com menor acesso a serviços.",
        ],
        [
          "Quais investimentos comparar?",
          "Compare saneamento e atenção básica nos dois estados com menor acesso.",
        ],
        [
          "Preparar uma proposta",
          "Prepare uma proposta de saneamento para o estado com menor acesso.",
        ],
      ],
      finance: [
        [
          "O que pressiona o orçamento?",
          "Consulte o orçamento e explique o financiamento das obras.",
        ],
        [
          "Quanto custam as propostas?",
          "Compare o investimento e a manutenção de saneamento e saúde nos dois estados com menor acesso.",
        ],
        [
          "Quais os compromissos atuais?",
          "Explique as parcelas e a manutenção já contratadas no orçamento.",
        ],
      ],
      health: [
        [
          "Onde ampliar o atendimento?",
          "Investigue os estados com menor acesso a serviços.",
        ],
        [
          "Comparar atenção básica",
          "Compare atenção básica nos dois estados com menor acesso.",
        ],
        [
          "Preparar atendimento",
          "Prepare uma proposta de atenção básica para o estado com menor acesso.",
        ],
      ],
      infrastructure: [
        [
          "Onde investir em saneamento?",
          "Investigue os estados com menor acesso e avalie saneamento.",
        ],
        [
          "Comparar saneamento e mobilidade",
          "Compare saneamento e mobilidade nos dois estados com menor acesso.",
        ],
        [
          "Preparar saneamento",
          "Prepare uma proposta de saneamento para o estado com menor acesso.",
        ],
      ],
    };
    document
      .querySelectorAll(".suggested-questions [data-question]")
      .forEach((b, i) => {
        const q = questions[role.id][i];
        if (q) {
          b.textContent = q[0] + " ↗";
          b.dataset.question = q[1];
        }
      });

    const quick = $("#cabinetQuickTools");
    quick.replaceChildren();
    const make = (label, request) => {
      const b = node("button", label, "cabinet-quick");
      b.type = "button";
      b.onclick = () =>
        onQuick(typeof request === "function" ? request() : request);
      quick.append(b);
    };
    make("Investigar estados", {
      name: "investigate_states",
      args: { metric: "access", direction: "asc", limit: 3 },
    });
    if (role.tools.includes("inspect_budget"))
      make("Consultar orçamento", { name: "inspect_budget", args: {} });
    make("Comparar investimentos", () => ({
      name: "compare_investments",
      args: {
        regions: runCabinetTool(getState(), role.id, {
          name: "investigate_states",
          args: { limit: 2 },
        }).data.rows.map((r) => r.index),
        programs: role.programs.slice(0, 2),
      },
    }));
  }
  function invalidate() {
    root.classList.add("cabinet-results-stale");
    root.querySelectorAll("button").forEach((b) => (b.disabled = true));
  }
  function clear() {
    root.replaceChildren();
    root.hidden = true;
    root.classList.remove("cabinet-results-stale");
  }
  function render(recipes, stamp, roleId) {
    clear();
    if (!recipes?.length) return;
    root.hidden = false;
    const guard = (fn) => () => {
      if (stamp !== getStamp() || roleId !== getRole()) {
        invalidate();
        notify(
          "O cenário mudou. Consulte novamente para revisar os dados atuais.",
        );
        return;
      }
      fn();
    };
    function facts(items) {
      const dl = node("dl");
      for (const [k, v] of items) {
        const row = node("div");
        row.append(node("dt", k), node("dd", v));
        dl.append(row);
      }
      return dl;
    }
    for (const wire of recipes.slice(0, 3)) {
      const item = wire.request
        ? runCabinetTool(getState(), roleId, wire.request)
        : { kind: "notice", message: "Consulta indisponível para esta área." };
      const group = node("section", undefined, "cabinet-tool-group");
      const member = roleFor(item.department ?? roleId);
      const source = member ? `${member.name} · ${member.area}` : "Gabinete";
      group.append(
        node(
          "span",
          `${source} · dados calculados pelo jogo`,
          "cabinet-tool-source",
        ),
      );
      if (item.kind === "notice") {
        group.append(node("p", item.message));
        root.append(group);
        continue;
      }
      if (item.kind === "budget") {
        const b = item.data,
          card = node("article", undefined, "cabinet-data-card");
        card.append(
          node("h4", "Contas do próximo trimestre"),
          facts([
            ["Receita anual / PIB", `${fmt(b.revenue)}%`],
            ["Despesa + juros / PIB", `${fmt(b.spending + b.interest)}%`],
            ["Saldo anualizado / PIB", `${fmt(b.balance, 2)}%`],
            [
              "Obras e manutenção no trimestre",
              money(
                b.investment.constructionQuarter + b.investment.upkeepQuarter,
              ),
            ],
            ["Dívida / PIB", `${fmt(b.debt)}%`],
          ]),
          node(
            "p",
            "Obras e manutenção do próximo trimestre entram em equivalente anual no saldo.",
            "cabinet-card-note",
          ),
        );
        group.append(card);
      }
      if (item.kind === "states") {
        const names = {
          access: "Acesso a serviços",
          poverty: "Pobreza",
          population: "População",
          density: "Densidade",
        };
        group.append(
          node(
            "h4",
            `${names[item.data.metric]} · ${item.data.direction === "asc" ? "menores" : "maiores"} valores`,
          ),
        );
        const grid = node("div", undefined, "cabinet-card-grid");
        for (const r of item.data.rows) {
          const card = node("article", undefined, "cabinet-data-card");
          card.append(
            node("h5", r.name),
            facts([
              ["Acesso", `${fmt(r.access, 0)}/100`],
              ["População", people(r.population)],
              ["Pobreza", `${fmt(r.poverty)}%`],
              ...(r.density !== undefined
                ? [["Densidade", `${fmt(r.density)} hab./km²`]]
                : []),
            ]),
            button(
              "Ver no mapa ↗",
              guard(() => onSelect(r.index)),
            ),
          );
          grid.append(card);
        }
        group.append(grid);
      }
      if (item.kind === "comparison" || item.kind === "proposal") {
        group.append(
          node(
            "h4",
            item.kind === "proposal"
              ? "Proposta para revisão"
              : "Investimentos para comparar",
          ),
        );
        const grid = node("div", undefined, "cabinet-card-grid");
        for (const q of item.data.quotes) {
          const card = node("article", undefined, "cabinet-data-card");
          card.append(
            node("span", q.regionName, "cabinet-card-region"),
            node("h5", q.name),
            facts([
              ["Investimento total", money(q.cost)],
              ["Manutenção anual", money(q.upkeepAnnual)],
              ["Operação estimada", `${q.operationTurns} trimestres`],
              ["Alcance inicial", people(q.people)],
              ["Ganho de acesso", `Até +${fmt(q.benefits.access)} pontos`],
            ]),
          );
          if (!q.allowed) card.append(node("p", q.reason, "cabinet-card-note"));
          const review = button(
            "Revisar contratação ↗",
            guard(() => onPrepare(q.region, q.type)),
          );
          review.disabled = !q.allowed;
          card.append(
            review,
            button(
              "Ver estado ↗",
              guard(() => onSelect(q.region)),
            ),
          );
          grid.append(card);
        }
        group.append(
          grid,
          node(
            "p",
            "O prazo usa a capacidade atual. Revisar abre a proposta; a contratação depende da sua confirmação.",
            "cabinet-card-note",
          ),
        );
      }
      root.append(group);
    }
  }
  updateRole();
  clear();
  return { render, invalidate, clear, updateRole, updateIdentity };
}
