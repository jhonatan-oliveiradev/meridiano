import {
  tutorialSteps,
  readTutorial,
  moveTutorial,
  placeCoach,
} from "./onboarding-model.js";
const key = "meridiano:tutorial:v1";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const count = (v) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(v);
export function initOnboarding({
  getState,
  setView,
  pause,
  persist,
  newCountry,
  hasSession,
  initialRoute,
}) {
  const app = $(".app"),
    home = $("#welcome"),
    tour = $("#tutorial"),
    coach = $("#tutorialCoach"),
    spot = $("#tutorialSpot"),
    arrow = $("#tutorialArrow");
  let progress;
  try {
    progress = readTutorial(localStorage.getItem(key));
  } catch {
    progress = readTutorial(null);
  }
  let running = false,
    target = null,
    frame = 0,
    returnFocus = null,
    previousView = "territorio",
    observer = null;
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(progress));
    } catch {}
  }
  function homeContent() {
    const s = getState(),
      q = s.quarter;
    $("#welcomeCountry").textContent = s.name;
    $("#welcomeSystem").textContent = `${s.government} · ${s.economy}`;
    $("#welcomePeriod").textContent =
      `${2027 + Math.floor(q / 4)} / T${(q % 4) + 1}`;
    $("#welcomePopulation").textContent =
      `${count(s.metrics.population)} milhões de habitantes`;
    $("#welcomePlay").textContent = hasSession
      ? `Continuar ${s.name} →`
      : `Começar em ${s.name} →`;
    $("#welcomeSaveNote").textContent = hasSession
      ? "Sua sessão está neste navegador."
      : "Um país está pronto para você começar. Ou crie o seu.";
    $("#welcomeLearn").textContent =
      progress.status === "completed"
        ? "Rever tutorial"
        : progress.index > 0
          ? `Retomar tutorial · ${progress.index + 1}/${tutorialSteps.length}`
          : "Aprender jogando";
    $("#welcomeMap").innerHTML = [...document.querySelectorAll("#regions path")]
      .map(
        (p, i) =>
          `<path d="${esc(p.getAttribute("d") || "")}" fill="${["#73914b", "#8ca659", "#607f48", "#a0b76e"][i % 4]}"/>`,
      )
      .join("");
  }
  function enter({ teach = false } = {}) {
    home.hidden = true;
    document.body.classList.remove("entry-active");
    app.inert = false;
    hasSession = true;
    persist();
    setView("territorio");
    if (teach || progress.status === "new")
      start(progress.status === "completed");
    else $("#pageTitle").focus({ preventScroll: true });
  }
  function open() {
    if (running) stop(false);
    pause();
    previousView = location.hash.slice(1) || "territorio";
    homeContent();
    home.hidden = false;
    app.inert = true;
    document.body.classList.add("entry-active");
    history.replaceState(null, "", "#inicio");
    document.title = "Meridiano — Seu próximo governo";
    $("#welcomePlay").focus({ preventScroll: true });
  }
  function position() {
    frame = 0;
    if (!running) return;
    const vw = document.documentElement.clientWidth,
      vh = window.visualViewport?.height ?? innerHeight;
    let r = target?.getBoundingClientRect();
    const valid =
      r && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh;
    if (!valid)
      r = { left: vw / 2 - 20, right: vw / 2 + 20, top: 36, bottom: 76 };
    const bounds = {
      left: Math.max(8, r.left - 6),
      top: Math.max(8, r.top - 6),
      right: Math.min(vw - 8, r.right + 6),
      bottom: Math.min(vh - 8, r.bottom + 6),
    };
    spot.hidden = !valid;
    Object.assign(spot.style, {
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${Math.max(0, bounds.right - bounds.left)}px`,
      height: `${Math.max(0, bounds.bottom - bounds.top)}px`,
    });
    coach.style.width = `${Math.min(350, vw - 24)}px`;
    coach.style.maxHeight = `${vh - 24}px`;
    const p = placeCoach(bounds, vw, vh, 350, coach.offsetHeight);
    Object.assign(coach.style, { left: `${p.x}px`, top: `${p.y}px` });
    const cx = p.x + p.width / 2,
      cy = p.y + p.height / 2,
      tx = (bounds.left + bounds.right) / 2,
      ty = (bounds.top + bounds.bottom) / 2;
    const overlap =
      p.x < bounds.right &&
      p.x + p.width > bounds.left &&
      p.y < bounds.bottom &&
      p.y + p.height > bounds.top;
    arrow.hidden = !valid || overlap;
    arrow.style.left = `${p.side === "left" ? p.x + p.width + 8 : p.side === "right" ? p.x - 8 : cx}px`;
    arrow.style.top = `${p.side === "above" ? p.y + p.height + 8 : p.side === "below" ? p.y - 8 : cy}px`;
    arrow.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(ty - cy, tx - cx)}rad)`;
  }
  function schedule() {
    if (running && !frame) frame = requestAnimationFrame(position);
  }
  function renderStep() {
    observer?.disconnect();
    const step = tutorialSteps[progress.index];
    setView(step.view);
    $("#tutorialTitle").textContent = step.title;
    $("#tutorialText").textContent = step.text;
    $("#tutorialTask").textContent = step.task;
    $("#tutorialCounter").textContent =
      `${String(progress.index + 1).padStart(2, "0")} / ${String(tutorialSteps.length).padStart(2, "0")}`;
    $("#tutorialProgress").max = tutorialSteps.length;
    $("#tutorialProgress").value = progress.index + 1;
    $("#tutorialBack").disabled = progress.index === 0;
    $("#tutorialNext").textContent =
      progress.index === tutorialSteps.length - 1
        ? "Começar a governar →"
        : "Próximo →";
    target = $(step.target) || (step.fallback ? $(step.fallback) : null);
    // Focus one policy rather than dimming an entire scrolling workspace.
    if (step.target === "#policies")
      target = target?.firstElementChild ?? target;
    target?.scrollIntoView({ block: "center", behavior: "instant" });
    observer = new ResizeObserver(schedule);
    if (target) observer.observe(target);
    observer.observe(coach);
    position();
    $("#tutorialNext").focus({ preventScroll: true });
  }
  function start(restart = false) {
    if (running) return;
    pause();
    returnFocus = document.activeElement;
    previousView = location.hash.slice(1) || "territorio";
    home.hidden = true;
    document.body.classList.remove("entry-active");
    document.body.classList.add("tutorial-active");
    app.inert = true;
    running = true;
    progress = moveTutorial(progress, restart ? "restart" : "resume");
    save();
    tour.hidden = false;
    renderStep();
  }
  function stop(completed) {
    if (!running) return;
    if (!completed) progress = moveTutorial(progress, "skip");
    save();
    running = false;
    observer?.disconnect();
    cancelAnimationFrame(frame);
    frame = 0;
    tour.hidden = true;
    document.body.classList.remove("tutorial-active");
    app.inert = false;
    setView(
      completed
        ? "territorio"
        : previousView === "inicio"
          ? "territorio"
          : previousView,
    );
    const focus =
      returnFocus?.isConnected && returnFocus.getClientRects().length
        ? returnFocus
        : $("#pageTitle");
    focus.focus({ preventScroll: true });
  }
  $("#welcomePlay").onclick = () => enter();
  $("#welcomeLearn").onclick = () => enter({ teach: true });
  $("#welcomeNew").onclick = () => newCountry();
  $("#tutorialNext").onclick = () => {
    progress = moveTutorial(progress, "next");
    save();
    if (progress.status === "completed") stop(true);
    else renderStep();
  };
  $("#tutorialBack").onclick = () => {
    progress = moveTutorial(progress, "back");
    save();
    renderStep();
  };
  $("#tutorialSkip").onclick = () => stop(false);
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-entry-home]")) {
      e.preventDefault();
      if ($("#modal").open) $("#modal").close();
      open();
    }
    if (e.target.closest("[data-entry-tutorial]")) {
      if ($("#modal").open) $("#modal").close();
      start(progress.status === "completed");
    }
  });
  document.addEventListener("keydown", (e) => {
    const scope = running ? coach : !home.hidden ? home : null;
    if (!scope || $("#modal").open) return;
    if (e.key === "Escape" && running) {
      e.preventDefault();
      stop(false);
    }
    if (e.key === "Tab") {
      const buttons = [
        ...scope.querySelectorAll("button:not(:disabled), a[href]"),
      ].filter((b) => b.getClientRects().length);
      const first = buttons[0],
        last = buttons.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          !scope.contains(document.activeElement))
      ) {
        e.preventDefault();
        last?.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          !scope.contains(document.activeElement))
      ) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
  addEventListener("resize", schedule);
  addEventListener("scroll", schedule, true);
  window.visualViewport?.addEventListener("resize", schedule);
  addEventListener("hashchange", () => {
    if (location.hash === "#inicio") open();
    else if (!home.hidden) {
      home.hidden = true;
      app.inert = false;
      document.body.classList.remove("entry-active");
    }
  });
  if (!initialRoute || initialRoute === "inicio") open();
  else {
    home.hidden = true;
    document.body.classList.remove("entry-active");
  }
  return { open, enter, start, isHome: () => !home.hidden };
}
