// Cult UI Dynamic Island / Terminal Animation / Timer adapted for vanilla ESM.
// MIT © 2023 Jordan-Gilliam. See docs/licenses/cult-ui.txt.
const period = (q) => `${2027 + Math.floor(q / 4)} · T${(q % 4) + 1}`;
export function quarterBulletin(state) {
  return state.events.map((e) => ({ ...e, period: period(state.quarter) }));
}
export function initEventIsland({ onDetails }) {
  const root = document.querySelector("#eventIsland");
  let current = null,
    timer;
  const trigger = root.querySelector(".island-trigger");
  function expanded(on) {
    clearTimeout(timer);
    root.dataset.expanded = String(on);
    trigger.setAttribute("aria-expanded", String(on));
    root.querySelector(".island-body").inert = !on;
  }
  function render(s, announce = false) {
    current = s;
    root.querySelector(".island-period").textContent = period(s.quarter);
    root.querySelector(".island-label").textContent = s.quarter
      ? "Boletim nacional"
      : "País em observação";
    root.querySelector(".island-country").textContent = s.name;
    const list = root.querySelector(".island-events");
    list.replaceChildren(
      ...quarterBulletin(s).map((e, i) => {
        const li = document.createElement("li"),
          title = document.createElement("strong"),
          p = document.createElement("p");
        title.textContent = e.title;
        p.textContent = e.detail;
        li.style.setProperty("--line", i);
        li.append(title, p);
        return li;
      }),
    );
    if (announce) {
      root.querySelector(".island-live").textContent =
        `${period(s.quarter)}. ${s.events.map((e) => e.title).join(". ")}`;
      expanded(true);
      timer = setTimeout(() => {
        if (!root.matches(":hover, :focus-within")) expanded(false);
      }, 6500);
    }
  }
  trigger.onclick = () => expanded(root.dataset.expanded !== "true");
  root.querySelector(".island-close").onclick = () => {
    expanded(false);
    trigger.focus();
  };
  root.querySelector(".island-details").onclick = () => {
    expanded(false);
    onDetails();
  };
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      expanded(false);
      trigger.focus();
    }
  });
  root.addEventListener("focusin", () => clearTimeout(timer));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) expanded(false);
  });
  expanded(false);
  return {
    update(s, announce = false) {
      render(s, announce);
    },
    destroy() {
      clearTimeout(timer);
    },
    get state() {
      return current;
    },
  };
}
export function elapsedTimer(output) {
  let timer = null,
    start = 0;
  return {
    start() {
      this.stop();
      start = performance.now();
      output.textContent = "00:00";
      output.hidden = false;
      timer = setInterval(() => {
        const seconds = Math.floor((performance.now() - start) / 1000);
        output.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
      }, 250);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    },
  };
}
export function renderBulletin(state) {
  const root = document.querySelector("#quarterBulletin");
  root.replaceChildren(
    ...quarterBulletin(state).map((e, i) => {
      const li = document.createElement("li"),
        n = document.createElement("span"),
        text = document.createElement("span");
      n.className = "bulletin-index";
      n.textContent = String(i + 1).padStart(2, "0");
      text.textContent = e.title;
      li.style.setProperty("--line", i);
      li.append(n, text);
      return li;
    }),
  );
  document.querySelector("#bulletinPeriod").textContent = period(state.quarter);
}
