const assetPromises = new Map();
async function avatarAssets(character) {
  if (!assetPromises.has(character))
    assetPromises.set(
      character,
      Promise.all(
        ["neutral", "happy", "thinking"].map(async (key) => {
          const response = await fetch(
            "assets/" + character + "-" + key + ".svg",
          );
          if (!response.ok) throw Error();
          const svg = new DOMParser().parseFromString(
            await response.text(),
            "image/svg+xml",
          ).documentElement;
          if (svg.localName !== "svg") throw Error();
          svg
            .querySelectorAll("script,foreignObject,style,iframe,image,use")
            .forEach((el) => el.remove());
          for (const el of [svg, ...svg.querySelectorAll("*")])
            for (const a of [...el.attributes])
              if (
                a.name.startsWith("on") ||
                a.name === "href" ||
                a.name === "xlink:href"
              )
                el.removeAttribute(a.name);
          return [key, document.importNode(svg, true)];
        }),
      )
        .then((entries) => new Map(entries))
        .catch((error) => {
          assetPromises.delete(character);
          throw error;
        }),
    );
  return assetPromises.get(character);
}
function clonePose(svg, prefix) {
  const copy = svg.cloneNode(true),
    ids = new Map();
  for (const el of copy.querySelectorAll("[id]")) {
    const id = el.id;
    ids.set(id, prefix + "-" + id);
    el.id = ids.get(id);
  }
  for (const el of [copy, ...copy.querySelectorAll("*")])
    for (const a of [...el.attributes])
      if (a.value.includes("url(#"))
        el.setAttribute(
          a.name,
          a.value.replace(/url\(#([^)]+)\)/g, (all, id) =>
            ids.has(id) ? `url(#${ids.get(id)})` : all,
          ),
        );
  return copy;
}
export function initCabinetAvatar({
  button: buttonSelector = "#cabinetAvatar",
  art: artSelector = "#avatarArt",
  message: messageSelector = "#avatarMessage",
} = {}) {
  const button = document.querySelector(buttonSelector),
    art = document.querySelector(artSelector),
    message = document.querySelector(messageSelector);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let state = "idle",
    helloTimer;
  const messages = {
    idle: "Vamos conferir os números?",
    thinking: "Estou conferindo o cenário.",
    happy: "A análise está pronta.",
    speaking: "Vamos olhar para estes resultados.",
    error: "Podemos tentar novamente.",
  };
  function setState(next) {
    clearTimeout(helloTimer);
    state = next;
    button.dataset.state = next;
    drawPose();
    message.textContent = messages[next] || messages.idle;
  }
  let character = "nilo",
    identityVersion = 0;
  let assetsLoading = false;
  let assets = new Map();
  let rendered = null;
  function drawPose() {
    const key =
      state === "happy" || state === "speaking"
        ? "happy"
        : state === "thinking"
          ? "thinking"
          : "neutral";
    if (rendered === key || !assets.has(key)) return;
    art.replaceChildren(clonePose(assets.get(key), button.id));
    rendered = key;
  }
  async function loadAssets() {
    if (assetsLoading) return;
    assetsLoading = true;
    const version = identityVersion;
    try {
      const loaded = await avatarAssets(character);
      if (version !== identityVersion) return;
      assets = loaded;
      button.classList.remove("avatar-fallback");
      drawPose();
    } catch {
      if (version !== identityVersion) return;
      art.textContent = character[0].toUpperCase();
      button.classList.add("avatar-fallback");
    }
  }
  function greet() {
    if (state === "thinking" || state === "speaking") return;
    clearTimeout(helloTimer);
    setState("happy");
    message.textContent = "Olá. Qual dado vamos analisar?";
    helloTimer = setTimeout(() => setState("idle"), 2800);
  }
  button.onclick = greet;
  button.addEventListener("pointermove", (e) => {
    if (
      reduced.matches ||
      e.pointerType === "touch" ||
      !matchMedia("(hover:hover) and (pointer:fine)").matches
    )
      return;
    const r = button.getBoundingClientRect();
    button.style.setProperty(
      "--gaze-x",
      ((e.clientX - r.left) / r.width - 0.5) * 7 + "px",
    );
    button.style.setProperty(
      "--gaze-y",
      ((e.clientY - r.top) / r.height - 0.5) * 5 + "px",
    );
    button.style.setProperty(
      "--lean-x",
      ((e.clientY - r.top) / r.height - 0.5) * -10 + "deg",
    );
    button.style.setProperty(
      "--lean-y",
      ((e.clientX - r.left) / r.width - 0.5) * 12 + "deg",
    );
  });
  button.addEventListener("pointerleave", () => {
    button.style.setProperty("--gaze-x", "0px");
    button.style.setProperty("--gaze-y", "0px");
    button.style.setProperty("--lean-x", "0deg");
    button.style.setProperty("--lean-y", "0deg");
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
    setCharacter(next) {
      if (
        !["nilo", "lia", "caio", "iara", "davi"].includes(next) ||
        next === character
      )
        return;
      character = next;
      identityVersion++;
      clearTimeout(helloTimer);
      assetsLoading = false;
      assets = new Map();
      rendered = null;
      art.replaceChildren();
      button.classList.remove("avatar-fallback");
      setState("idle");
      loadAssets();
    },
    greet,
    spin() {
      if (state === "thinking" || state === "speaking") return;
      greet();
      if (!reduced.matches) {
        art.getAnimations().forEach((a) => a.cancel());
        art.animate(
          [
            { transform: "rotate(0deg) scale(1)" },
            { transform: "rotate(180deg) scale(.86)" },
            { transform: "rotate(360deg) scale(1)" },
          ],
          { duration: 650, easing: "cubic-bezier(.22,.8,.2,1)" },
        );
      }
    },
    dispose() {
      clearTimeout(helloTimer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
