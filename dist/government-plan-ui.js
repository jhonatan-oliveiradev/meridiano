import { goalPresentation, planHighlights } from "./plan-presentation.js";
import {
  goalDefs,
  goalDef,
  goalsOf,
  goalValue,
  createGoal,
  closeGoal,
  goalReading,
  planSummary,
} from "./government-plan.js";
import { regionsOf } from "./model.js";
import { roleFor } from "./cabinet-tools.js";
import { quoteInvestment } from "./investments.js";
import { projectFor } from "./investment-ledger.js";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
const money = (n) => (n >= 1 ? `M$ ${fmt(n)} bi` : `M$ ${fmt(n * 1000)} mi`);
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const date = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
const statuses = {
  tracking: "Em acompanhamento",
  behind: "Abaixo do ritmo",
  reached: "Meta alcançada",
  met: "Cumprida no prazo",
  missed: "Prazo encerrado",
  stopped: "Acompanhamento encerrado",
};
export function initGovernmentPlanUI({
  getState,
  setState,
  openModal,
  closeModal,
  setView,
  onPrepare,
  onPolicies,
  onConsult,
  notify,
}) {
  let rememberedPageScroll = 0;
  let rememberedScroll = 0,
    rememberedKey = "",
    expanded = new Set(),
    archiveOpen = false;
  const root = () => $("#view-plano");
  function remember() {
    if (!root().classList.contains("active")) return;
    rememberedScroll = root().scrollTop;
    rememberedPageScroll = window.scrollY;
    expanded = new Set(
      [...root().querySelectorAll("[data-plan-detail][open]")].map(
        (el) => el.dataset.planDetail,
      ),
    );
    archiveOpen = !!root().querySelector("#planArchive > details[open]");
  }
  function restore(id) {
    const target = [...root().querySelectorAll("[data-goal-id]")].find(
      (el) => el.dataset.goalId === id,
    );
    if (!target) return;
    if (target.closest("#planArchive")) target.closest("details").open = true;
    target.focus({ preventScroll: true });
    const a = target.getBoundingClientRect(),
      b = root().getBoundingClientRect();
    const bottom = Math.min(
      b.bottom,
      window.innerHeight - (matchMedia("(max-width: 760px)").matches ? 76 : 0),
    );
    if (a.bottom < Math.max(0, b.top) || a.top > bottom)
      target.scrollIntoView({ block: "center", behavior: "instant" });
  }
  function createDialog() {
    const s = getState(),
      active = goalsOf(s).filter((g) => g.closedAt === undefined);
    if (active.length >= 3 || goalsOf(s).length >= 12 || s.quarter > 156) {
      notify("Não há espaço ou prazo para outra meta neste cenário.");
      return;
    }
    openModal(
      `<div class="cycle-dialog plan-dialog"><span class="eyebrow">PLANO DE GOVERNO</span><h3 id="modalTitle">Definir uma meta</h3><p>Escolha o resultado que quer acompanhar. Os programas e as políticas continuam dependendo das suas decisões.</p><form id="goalForm"><label for="goalMetric">Indicador</label><select id="goalMetric">${goalDefs.map((d) => `<option value="${d.key}">${d.name}</option>`).join("")}</select><div id="goalRegionFields"><label for="goalRegion">Estado</label><select id="goalRegion">${regionsOf(
        s,
      )
        .map((r, i) => `<option value="${i}">${esc(r.name)}</option>`)
        .join(
          "",
        )}</select><label for="goalOwner">Responsável</label><select id="goalOwner"><option value="infrastructure">Iara · Infraestrutura</option><option value="health">Caio · Saúde</option></select></div><p id="goalBaseline"></p><label for="goalTarget" id="goalTargetLabel">Valor desejado</label><input id="goalTarget" type="number" step="0.1" required><label for="goalHorizon">Prazo</label><select id="goalHorizon">${[
        4, 8, 12,
      ]
        .filter((h) => s.quarter + h <= 160)
        .map(
          (h) =>
            `<option value="${h}">${h / 4} ${h === 4 ? "ano" : "anos"} · ${date(s.quarter + h)}</option>`,
        )
        .join(
          "",
        )}</select><p id="goalError" role="alert"></p><div class="modal-actions"><button class="secondary" type="button" data-close>Cancelar</button><button class="primary" type="submit">Adicionar ao plano</button></div></form></div>`,
    );
    const configure = () => {
      const metric = $("#goalMetric").value,
        d = goalDef(metric),
        regional = metric === "access",
        region = regional ? Number($("#goalRegion").value) : null;
      $("#goalRegionFields").hidden = !regional;
      const v = goalValue(getState(), metric, region),
        input = $("#goalTarget");
      $("#goalBaseline").textContent =
        `Agora: ${fmt(v)}${d.unit}. ${regional ? "O índice reúne o acesso a serviços; não mede hospitais ou saneamento separadamente." : `Responsável: ${roleFor(metric === "debt" ? "finance" : "nilo").name}.`}`;
      $("#goalTargetLabel").textContent =
        `${d.direction > 0 ? "Elevar para" : "Reduzir para"} (${d.unit})`;
      input.min = d.min;
      input.max = d.max;
      input.value = String(
        Math.round(Math.max(d.min, Math.min(d.max, v + d.direction * 5)) * 10) /
          10,
      );
      $("#goalError").textContent = "";
    };
    $("#goalMetric").onchange = configure;
    $("#goalRegion").onchange = configure;
    configure();
    $("#goalForm").onsubmit = (e) => {
      e.preventDefault();
      const metric = $("#goalMetric").value;
      const next = createGoal(getState(), {
        metric,
        region: metric === "access" ? Number($("#goalRegion").value) : null,
        owner: $("#goalOwner").value,
        horizon: Number($("#goalHorizon").value),
        target: Number($("#goalTarget").value),
      });
      if (next === getState()) {
        $("#goalError").textContent =
          "Escolha um avanço em relação ao valor atual. Cada indicador pode ter uma meta ativa por território.";
        return;
      }
      setState(next);
      closeModal();
      setView("plano");
      notify("Meta adicionada ao plano de governo.");
    };
  }
  function historyDialog(id) {
    const s = getState(),
      g = goalsOf(s).find((g) => g.id === id);
    if (!g) return;
    const v = goalReading(s, g);
    openModal(
      `<div class="cycle-dialog"><span class="eyebrow">${esc(v.regionName)}</span><h3 id="modalTitle">Histórico · ${v.label}</h3><p>Registros no fechamento de cada trimestre. A leitura atual pode mudar com os ajustes de políticas; eles só entram no histórico ao avançar.</p><div class="comparison"><table><thead><tr><th>Trimestre</th><th>Realizado</th><th>Meta final</th></tr></thead><tbody>${g.samples.map((p) => `<tr><th scope="row">${date(p.quarter)}</th><td>${fmt(p.value)}${v.unit}</td><td>${fmt(g.target)}${v.unit}</td></tr>`).join("")}</tbody></table></div><p>Prazo: ${date(g.dueAt)} · ${statuses[v.status]}.</p><div class="modal-actions">${g.closedAt === undefined ? `<button class="secondary" data-plan-stop="${g.id}">Encerrar meta</button>` : ""}<button class="primary" data-close>Voltar ao plano</button></div></div>`,
    );
  }
  function stopDialog(id) {
    const g = goalsOf(getState()).find((g) => g.id === id);
    if (!g || g.closedAt !== undefined) return;
    openModal(
      `<div class="cycle-dialog"><h3 id="modalTitle">Encerrar esta meta?</h3><p>O histórico fica no plano. Contratos e políticas continuam em vigor; encerrar o acompanhamento não cancela obras.</p><div class="modal-actions"><button class="secondary" data-close>Continuar acompanhando</button><button class="primary" id="confirmStopGoal">Encerrar meta</button></div></div>`,
    );
    $("#confirmStopGoal").onclick = () => {
      setState(closeGoal(getState(), id));
      closeModal();
      notify("Acompanhamento encerrado. Histórico preservado.");
    };
  }
  function render(capture = true) {
    if (capture) remember();
    const s = getState(),
      goals = goalsOf(s),
      active = goals.filter((g) => g.closedAt === undefined),
      summary = planSummary(s);
    const key = `${s.seed}:${s.name}:${goals.map((g) => g.id).join(",")}`;
    if (
      s.seed !== rememberedKey.split(":")[0] * 1 ||
      (goals.length === 0 && rememberedKey)
    ) {
      rememberedScroll = 0;
      rememberedPageScroll = 0;
      expanded.clear();
      archiveOpen = false;
    }
    rememberedKey = key;
    $("#planCounter").textContent =
      `${active.length}/3 metas ativas · ${date(s.quarter)}`;
    $("#addGovernmentGoal").disabled =
      active.length >= 3 || goals.length >= 12 || s.quarter > 156;
    $("#planCabinetSummary").textContent = active.length
      ? `${active.length} ${active.length === 1 ? "meta em acompanhamento" : "metas em acompanhamento"}`
      : "Nenhuma meta definida";
    const notes = planHighlights(s);
    $("#planBriefs").innerHTML = notes
      .map((n) => {
        const r = roleFor(n.id);
        return `<article class="plan-brief"><img src="assets/${r.avatar}-neutral.svg" width="36" height="36" alt=""><div><h4>${r.name} <small>${r.area}</small></h4><p>${esc(n.text)}</p><button class="text-button" data-plan-consult="${r.id}">Consultar ${r.name} ↗</button></div></article>`;
      })
      .join("");
    $("#planGoals").innerHTML = active.length
      ? active.map((g) => card(g, s, summary)).join("")
      : `<div class="plan-empty"><span class="eyebrow">SEU PRÓXIMO OBJETIVO</span><h4>O que você quer mudar neste país?</h4><p>Defina um indicador, um valor e um prazo. O gabinete acompanha o progresso; você decide quais políticas e programas aplicar.</p><button class="primary" data-plan-create ${goals.length >= 12 || s.quarter > 156 ? "disabled" : ""}>${goals.length ? "Definir nova meta" : "Definir primeira meta"}</button>${goals.length >= 12 ? "<p>Limite de 12 metas deste cenário alcançado. O histórico permanece disponível.</p>" : s.quarter > 156 ? "<p>Não há quatro trimestres disponíveis para iniciar outra meta.</p>" : ""}</div>`;
    $("#planArchive").innerHTML = goals.some((g) => g.closedAt !== undefined)
      ? `<details><summary>Histórico de metas · ${goals.length - active.length}</summary><div class="plan-archive">${goals
          .filter((g) => g.closedAt !== undefined)
          .reverse()
          .map((g) => {
            const v = goalReading(s, g);
            return `<article data-goal-id="${g.id}" tabindex="-1"><div><strong>${esc(v.regionName)} · ${v.label}</strong><p>${statuses[v.status]} · ${date(g.closedAt)} · ${fmt(v.current)}${v.unit} / meta ${fmt(g.target)}${v.unit}</p></div><button class="secondary" data-plan-history="${g.id}">Ver histórico</button></article>`;
          })
          .join("")}</div></details>`
      : "";
    root()
      .querySelectorAll("[data-plan-detail]")
      .forEach((el) => (el.open = expanded.has(el.dataset.planDetail)));
    const archive = root().querySelector("#planArchive > details");
    if (archive) archive.open = archiveOpen;
    if (root().classList.contains("active")) {
      root().scrollTop = rememberedScroll;
      if (matchMedia("(max-width: 760px)").matches)
        document.scrollingElement.scrollTop = rememberedPageScroll;
    }
  }
  function card(g, s, summary) {
    const v = goalReading(s, g),
      owner = roleFor(g.owner),
      d = goalDef(g.metric);
    const programs =
      g.region === null
        ? []
        : owner.programs.map((type) => quoteInvestment(s, g.region, type));
    const risk = summary.deliveryRisks.filter((r) => r.goalId === g.id);
    const presentation = goalPresentation(s, g);
    return `<article class="goal-card" data-goal-id="${g.id}" tabindex="-1" data-status="${v.status}"><header><div><span class="eyebrow">${esc(v.regionName)}</span><h4>${v.label}</h4></div><span class="goal-status">${statuses[v.status]}</span></header><div class="goal-values"><strong>${fmt(v.current)}<small>${v.unit}</small></strong><span>${d.direction > 0 ? "alcançar" : "reduzir a"} <b>${fmt(g.target)}${v.unit}</b></span></div><p class="goal-gap">${presentation.gap}</p><progress max="1" value="${v.progress}" aria-label="Progresso de ${esc(v.regionName)}: ${v.label}"></progress><div class="goal-baseline"><span>Início ${fmt(g.baseline)}${v.unit}</span><span class="goal-change" data-tone="${presentation.tone}">${presentation.tone === "neutral" ? "" : presentation.delta > 0 ? "↗ " : "↘ "}${presentation.change}</span></div><div class="goal-owner"><img src="assets/${owner.avatar}-neutral.svg" width="30" height="30" alt=""><span>${owner.name} · ${owner.area}</span><span>${count(v.remaining, "trimestre restante", "trimestres restantes")} · ${date(g.dueAt)}</span></div>${risk.length ? `<p class="plan-warning">${count(risk.length, "programa com operação estimada", "programas com operação estimada")} depois do prazo. A estimativa usa a capacidade atual; não é garantia de entrega.</p>` : ""}<details class="goal-options" data-plan-detail="${g.id}"><summary>${g.region === null ? "Políticas para revisar" : "Programas para esta meta"}</summary>${programs.length ? programs.map((q) => `<div><span>${projectFor(q.type).name}${q.reason ? `<small>${esc(q.reason)}</small>` : `<small>${money(q.cost)} · operação em ${q.operationTurns} trimestres</small>`}</span><button class="secondary" data-plan-program="${q.type}" data-plan-region="${g.region}" ${q.allowed ? "" : "disabled"}>Ver custos e prazo</button></div>`).join("") : `<p>Consulte a comparação de políticas antes de decidir. Definir uma meta não altera os controles.</p><button class="secondary" data-plan-policy="${g.id}">Revisar políticas ↗</button>`}<p class="plan-note">Programas podem contribuir para o indicador; não garantem atingir esta meta.</p></details><footer><button class="text-button" data-plan-history="${g.id}">Histórico ↗</button><button class="text-button" data-plan-ask="${g.id}">Consultar ${owner.name} ↗</button></footer></article>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "addGovernmentGoal" || b.hasAttribute("data-plan-create"))
      createDialog();
    if (b.dataset.planHistory) historyDialog(b.dataset.planHistory);
    if (b.dataset.planStop) stopDialog(b.dataset.planStop);
    if (b.dataset.planConsult)
      onConsult(
        b.dataset.planConsult,
        "Como está o plano de governo na sua área? Confira metas, progresso e limites antes de sugerir mudanças.",
      );
    if (b.dataset.planAsk) {
      remember();
      const g = goalsOf(getState()).find((g) => g.id === b.dataset.planAsk);
      if (g) {
        const v = goalReading(getState(), g);
        onConsult(
          g.owner,
          `Acompanhe a meta de ${v.label} em ${v.regionName}: ${fmt(g.target)}${v.unit} até ${date(g.dueAt)}. O que mudou e quais decisões devo avaliar?`,
          g.id,
        );
      }
    }
    if (b.dataset.planPolicy) {
      remember();
      onPolicies?.(b.dataset.planPolicy);
    }
    if (b.dataset.planProgram) {
      remember();
      onPrepare(
        Number(b.dataset.planRegion),
        b.dataset.planProgram,
        b.closest("[data-goal-id]")?.dataset.goalId,
      );
    }
  });
  return { render, remember, restore };
}
