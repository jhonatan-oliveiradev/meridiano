export function initCabinetAvatar() {
  const button = document.querySelector("#cabinetAvatar"),
    art = document.querySelector("#avatarArt"),
    message = document.querySelector("#avatarMessage");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let state = "idle",
    helloTimer;
  const messages = {
    idle: "Vamos conferir os números?",
    thinking: "Estou conferindo o cenário.",
    happy: "A análise está pronta.",
    error: "Podemos tentar novamente.",
  };
  function setState(next) {
    state = next;
    button.dataset.state = next;
    drawPose();
    message.textContent = messages[next] || messages.idle;
  }
  let assetsLoading = false;
  const assets = new Map();
  let rendered = null;
  function drawPose() {
    const key =
      state === "happy"
        ? "happy"
        : state === "thinking"
          ? "thinking"
          : "neutral";
    if (rendered === key || !assets.has(key)) return;
    art.replaceChildren(assets.get(key).cloneNode(true));
    rendered = key;
  }
  async function loadAssets() {
    if (assetsLoading) return;
    assetsLoading = true;
    try {
      await Promise.all(
        ["neutral", "happy", "thinking"].map(async (key) => {
          const response = await fetch("assets/nilo-" + key + ".svg");
          if (!response.ok) throw Error();
          const text = await response.text();
          const svg = new DOMParser().parseFromString(
            text,
            "image/svg+xml",
          ).documentElement;
          if (svg.localName !== "svg") throw Error();
          svg
            .querySelectorAll("script,foreignObject,style,iframe,image,use")
            .forEach((el) => el.remove());
          svg.querySelectorAll("*").forEach((el) =>
            [...el.attributes].forEach((a) => {
              if (
                a.name.startsWith("on") ||
                a.name === "href" ||
                a.name === "xlink:href"
              )
                el.removeAttribute(a.name);
            }),
          );
          assets.set(key, document.importNode(svg, true));
        }),
      );
      drawPose();
    } catch {
      art.textContent = "N";
      button.classList.add("avatar-fallback");
    }
  }
  function greet() {
    if (state === "thinking") return;
    clearTimeout(helloTimer);
    setState("happy");
    message.textContent = "Olá. Qual dado vamos analisar?";
    helloTimer = setTimeout(() => setState("idle"), 2800);
  }
  button.onclick = greet;
  button.addEventListener("pointermove", (e) => {
    if (reduced.matches) return;
    const r = button.getBoundingClientRect();
    button.style.setProperty(
      "--gaze-x",
      ((e.clientX - r.left) / r.width - 0.5) * 7 + "px",
    );
    button.style.setProperty(
      "--gaze-y",
      ((e.clientY - r.top) / r.height - 0.5) * 5 + "px",
    );
  });
  button.addEventListener("pointerleave", () => {
    button.style.setProperty("--gaze-x", "0px");
    button.style.setProperty("--gaze-y", "0px");
  });
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) loadAssets();
    button.classList.toggle(
      "avatar-paused",
      !entry.isIntersecting || document.hidden,
    );
  });
  observer.observe(button);
  const visibility = () =>
    button.classList.toggle(
      "avatar-paused",
      document.hidden || !button.getBoundingClientRect().height,
    );
  document.addEventListener("visibilitychange", visibility);
  setState("idle");
  return {
    setState,
    dispose() {
      clearTimeout(helloTimer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
