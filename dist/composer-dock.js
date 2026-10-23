import { initAiBlob } from "./ai-blob.js";

export function initComposerDock(reduced) {
  const root = document.querySelector("#composerDock");
  const form = document.querySelector("#advisorForm");
  const input = document.querySelector("#advisorQuestion");
  const toggle = document.querySelector("#expandComposer");
  const collapse = document.querySelector("#minimizeComposer");
  const blob = initAiBlob(document.querySelector("#composerBlob"), reduced);
  let compact = false,
    responding = false;
  function setCompact(on, focus = false) {
    const focusedForm = form.contains(document.activeElement);
    const focusedToggle = document.activeElement === toggle;
    compact = on;
    root.dataset.compact = String(on);
    form.inert = on;
    toggle.setAttribute("aria-expanded", String(!on));
    toggle.setAttribute("aria-hidden", String(!on));
    toggle.tabIndex = on ? 0 : -1;
    if (on && (focus || focusedForm)) toggle.focus({ preventScroll: true });
    if (!on && (focus || focusedToggle)) input.focus({ preventScroll: true });
    blob.setState({ shown: compact, responding });
  }
  const observer = new ResizeObserver((entries) => {
    root.style.setProperty(
      "--composer-width",
      `${entries[0].contentRect.width}px`,
    );
  });
  observer.observe(root);
  toggle.onclick = () => setCompact(false, true);
  collapse.onclick = () => setCompact(true, true);
  function onKey(e) {
    if (e.key === "Escape" && !compact && !e.isComposing) {
      e.preventDefault();
      e.stopPropagation();
      setCompact(true, true);
    }
  }
  root.addEventListener("keydown", onKey);
  setCompact(false);
  return {
    begin() {
      setCompact(true);
    },
    expand({ focus = false } = {}) {
      setCompact(false, focus);
    },
    setResponding(on) {
      responding = on;
      root.dataset.responding = String(on);
      blob.setState({ shown: compact, responding });
    },
    reset() {
      responding = false;
      root.dataset.responding = "false";
      setCompact(false);
    },
    destroy() {
      observer.disconnect();
      root.removeEventListener("keydown", onKey);
      blob.destroy();
    },
  };
}
