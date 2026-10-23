import { initCabinetAvatar } from "./cabinet-avatar.js";
import { elapsedTimer } from "./interactions.js";
import { createTextReveal } from "./text-reveal.js";
const $ = (s) => document.querySelector(s);
const date = (q) => `${2027 + Math.floor(q / 4)} · ${(q % 4) + 1}º trimestre`;
const fmt = (n) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
export function snapshotOf(s) {
  return {
    name: s.name,
    government: s.government,
    economy: s.economy,
    external: s.external,
    seed: s.seed,
    quarter: s.quarter,
    policies: { ...s.policies },
    metrics: { ...s.metrics },
    capacity: s.capacity,
    previous: s.history.length > 1 ? { ...s.history.at(-2) } : null,
  };
}
export function initAdvisor({ getState, notify }) {
  const avatar = initCabinetAvatar();
  const largeAvatar = initCabinetAvatar({
    button: "#largeCabinetAvatar",
    art: "#largeAvatarArt",
    message: "#largeAvatarMessage",
  });
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const reveal = createTextReveal({ reducedMotion: () => reduced.matches });
  const scroll = $("#advisorScroll");
  let writing = false,
    followAnswer = true,
    lastScrollTop = 0;
  function avatarState(state) {
    avatar.setState(state);
    largeAvatar.setState(state);
    $("#niloWave").disabled = state === "thinking" || state === "speaking";
    $("#niloSpin").disabled = state === "thinking" || state === "speaking";
  }
  function setWriting(on) {
    writing = on;
    $("#revealControls").hidden = !on;
    result.setAttribute("aria-busy", String(on));
    if (!on)
      result
        .querySelectorAll(".typing-fragment")
        .forEach((node) => node.classList.remove("typing-fragment"));
    if (on) {
      avatarState("speaking");
      status.textContent = "Nilo está respondendo…";
    } else if (!active) {
      avatarState("happy");
      status.textContent = "Resposta concluída";
    }
  }
  // Follow new text only while the reader stays at the end. Scrolling upward
  // takes control away from the animation without hiding the composer.
  scroll.addEventListener(
    "scroll",
    () => {
      if (!writing) return;
      if (scroll.scrollTop < lastScrollTop - 2) followAnswer = false;
      else if (
        scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop <
        32
      )
        followAnswer = true;
      lastScrollTop = scroll.scrollTop;
    },
    { passive: true },
  );
  $("#finishReveal").onclick = () => reveal.finish();
  $("#niloWave").onclick = () => {
    avatar.greet();
    largeAvatar.greet();
  };
  $("#niloSpin").onclick = () => {
    avatar.greet();
    largeAvatar.spin();
  };
  reduced.addEventListener("change", () => {
    if (reduced.matches) reveal.finish();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reveal.finish();
  });
  const elapsed = elapsedTimer($("#adviceElapsed"));
  let active = null,
    fingerprint = "",
    answerFingerprint = "",
    available = null;
  const cache = new Map();
  const status = $("#advisorStatus"),
    error = $("#advisorError"),
    result = $("#advisorResult");
  function stateChanged(s) {
    const next = JSON.stringify(snapshotOf(s));
    if (next !== fingerprint) {
      reveal.finish();
      active?.abort();
      active = null;
      busy(false);
      fingerprint = next;
      error.textContent = "";
      $("#advisorStale").hidden =
        !answerFingerprint || answerFingerprint === next;
    }
    $("#advisorCountry").textContent = s.name;
    $("#advisorPeriod").textContent = date(s.quarter);
    $("#composerContext").textContent = `${s.name} · T${(s.quarter % 4) + 1}`;
    $("#advisorBrief").replaceChildren(
      ...[
        [
          "Pobreza",
          fmt(s.metrics.poverty) + "%",
          "Como reduzir a pobreza sem ampliar muito o déficit?",
        ],
        [
          "Dívida / PIB",
          fmt(s.metrics.debt) + "%",
          "O que pressiona a dívida deste país?",
        ],
        [
          "Bem-estar",
          fmt(s.metrics.welfare) + "/100",
          "Quais políticas posso testar para melhorar o bem-estar?",
        ],
      ].map(([label, value, question]) => {
        const el = document.createElement("button"),
          n = document.createElement("span"),
          v = document.createElement("strong"),
          arrow = document.createElement("span");
        el.type = "button";
        n.textContent = label;
        v.textContent = value;
        arrow.textContent = "↗";
        arrow.className = "brief-arrow";
        el.append(n, v, arrow);
        el.onclick = () => {
          $("#advisorQuestion").value = question;
          $("#advisorQuestion").focus();
        };
        return el;
      }),
    );
    $("#advisorFacts").replaceChildren(
      ...[
        ["População", fmt(s.metrics.population) + " milhões"],
        ["Pobreza", fmt(s.metrics.poverty) + "%"],
        ["Dívida / PIB", fmt(s.metrics.debt) + "%"],
      ].map(([k, v]) => {
        const el = document.createElement("div"),
          label = document.createElement("span"),
          value = document.createElement("strong");
        label.textContent = k;
        value.textContent = v;
        el.append(label, value);
        return el;
      }),
    );
  }
  function busy(on) {
    if (on) elapsed.start();
    else elapsed.stop();
    avatarState(on ? "thinking" : writing ? "speaking" : "idle");
    $("#advisorForm").classList.toggle("is-sending", on);
    $("#advisorEmpty").hidden = on || result.childElementCount > 0;
    $("#analyzeQuarter").disabled = on;
    $("#askAdvisor").disabled = on;
    $("#cancelAdvice").hidden = !on;
    $("#advisorLoading").hidden = !on;
    result.setAttribute("aria-busy", String(on || writing));
    status.textContent = on
      ? "Analisando cenário…"
      : available === false
        ? "Não conectado"
        : available === true
          ? writing
            ? "Nilo está respondendo…"
            : "Pronto para conversar"
          : "Verificando conexão…";
  }
  function render(answer, quarter) {
    reveal.cancel();
    $("#advisorEmpty").hidden = true;
    result.replaceChildren();
    const header = document.createElement("div");
    header.className = "advice-meta";
    header.textContent = `Nilo · ${date(quarter)}`;
    const title = document.createElement("h3");
    title.textContent = answer.title;
    const summary = document.createElement("p");
    summary.className = "advice-summary";
    summary.textContent = answer.summary;
    result.append(header, title, summary);
    result.classList.remove("answer-arrived");
    requestAnimationFrame(() => result.classList.add("answer-arrived"));
    for (const o of answer.observations) {
      const block = document.createElement("section"),
        h = document.createElement("h4"),
        p = document.createElement("p");
      block.className = "advice-observation";
      h.textContent = o.heading;
      p.textContent = o.detail;
      block.append(h, p);
      result.append(block);
    }
    for (const [label, items] of [
      ["Custos e limites", answer.tradeoffs],
      ["O que testar", answer.nextSteps],
    ]) {
      if (!items.length) continue;
      const section = document.createElement("section"),
        h = document.createElement("h4"),
        list = document.createElement("ul");
      h.textContent = label;
      section.className = "advice-list";
      for (const text of items) {
        const li = document.createElement("li");
        li.textContent = text;
        list.append(li);
      }
      section.append(h, list);
      result.append(section);
    }
    const parts = [...result.querySelectorAll("h3,h4,p,li")].map((node) => ({
      node,
      text: node.textContent,
    }));
    for (const section of result.querySelectorAll("section"))
      section.hidden = true;
    for (const li of result.querySelectorAll("li")) li.hidden = true;
    scroll.scrollTop = 0;
    lastScrollTop = 0;
    followAnswer = true;
    setWriting(true);
    reveal.start(parts, {
      onPart(node) {
        result
          .querySelector(".typing-fragment")
          ?.classList.remove("typing-fragment");
        node.classList.add("typing-fragment");
        node.closest("section")?.removeAttribute("hidden");
        node.hidden = false;
      },
      onProgress() {
        if (followAnswer) scroll.scrollTop = scroll.scrollHeight;
      },
      onDone() {
        setWriting(false);
        notify("Resposta de Nilo concluída.");
      },
    });
  }
  async function ask(mode) {
    const input = $("#advisorQuestion"),
      question = input.value.trim();
    if (mode === "question" && !question) {
      error.textContent = "Escreva uma pergunta sobre o país.";
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    if (active) return;
    reveal.finish();
    input.removeAttribute("aria-invalid");
    error.textContent = "";
    const snapshot = snapshotOf(getState()),
      stamp = JSON.stringify(snapshot),
      key = stamp + mode + question;
    if (cache.has(key)) {
      const data = cache.get(key);
      render(data.answer, data.quarter);
      answerFingerprint = stamp;
      $("#advisorStale").hidden = true;
      return;
    }
    const controller = new AbortController();
    active = controller;
    busy(true);
    const timeout = setTimeout(() => controller.abort("timeout"), 22000);
    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-meridiano-client": "1",
        },
        body: JSON.stringify({ mode, question, snapshot }),
        signal: controller.signal,
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          "O conselheiro está indisponível neste ambiente. A simulação continua funcionando.",
        );
      }
      if (!response.ok) {
        if (data.code === "NOT_CONFIGURED") available = false;
        status.textContent = "Consulta não concluída";
        throw new Error(
          (data.message || "Não foi possível consultar o gabinete.") +
            (data.code ? ` (${data.code})` : ""),
        );
      }
      if (stamp !== fingerprint || controller.signal.aborted) return;
      if (
        !data.answer ||
        !Array.isArray(data.answer.observations) ||
        !Array.isArray(data.answer.tradeoffs) ||
        !Array.isArray(data.answer.nextSteps)
      )
        throw new Error("A resposta veio incompleta. Tente novamente.");
      available = true;
      cache.set(key, data);
      if (cache.size > 8) cache.delete(cache.keys().next().value);
      render(data.answer, data.quarter);
      answerFingerprint = stamp;
      $("#advisorStale").hidden = true;
    } catch (e) {
      if (active === controller) {
        if (controller.signal.reason === "timeout")
          error.textContent =
            "A consulta demorou mais que o esperado. Tente novamente.";
        else if (!controller.signal.aborted) error.textContent = e.message;
      }
    } finally {
      clearTimeout(timeout);
      if (active === controller) {
        active = null;
        busy(false);
        avatarState(
          error.textContent ? "error" : writing ? "speaking" : "happy",
        );
        if (error.textContent) status.textContent = "Consulta não concluída";
      }
    }
  }
  $("#analyzeQuarter").onclick = () => ask("analysis");
  $("#advisorForm").addEventListener("submit", (e) => {
    e.preventDefault();
    ask("question");
  });
  $("#advisorQuestion").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      ask("question");
    }
  });
  $("#cancelAdvice").onclick = () => {
    active?.abort();
    active = null;
    busy(false);
    status.textContent = "Consulta cancelada";
  };
  document.querySelectorAll("[data-question]").forEach(
    (b) =>
      (b.onclick = () => {
        $("#advisorQuestion").value = b.dataset.question;
        $("#advisorQuestion").focus();
      }),
  );
  fetch("/api/advisor")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data) {
        available = !!data.available;
        if (!active) busy(false);
      }
    })
    .catch(() => {});
  stateChanged(getState());
  return {
    stateChanged,
    cancel() {
      active?.abort();
      elapsed.stop();
      reveal.finish();
      avatarState("idle");
    },
  };
}
