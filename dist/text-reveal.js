// Progressive presentation of an already received answer; no simulated network
// streaming. Scheduler injection keeps cancellation and reduced motion testable.
export function createTextReveal({
  reducedMotion = () => false,
  schedule = (fn, ms) => setTimeout(fn, ms),
  unschedule = (id) => clearTimeout(id),
  frameMs = 20,
} = {}) {
  let timer,
    job = null;
  function cancel() {
    unschedule(timer);
    job = null;
  }
  function finish() {
    if (!job) return;
    unschedule(timer);
    const current = job;
    job = null;
    for (const part of current.parts) {
      current.onPart(part.node);
      part.node.textContent = part.text;
    }
    current.onProgress();
    current.onDone();
  }
  function start(
    parts,
    { onPart = () => {}, onProgress = () => {}, onDone = () => {} } = {},
  ) {
    cancel();
    const entries = parts.map(({ node, text }) => ({
      node,
      text,
      chars: Array.from(text),
      position: 0,
    }));
    const total = entries.reduce((n, p) => n + p.chars.length, 0);
    job = { parts: entries, index: 0, onPart, onProgress, onDone };
    if (reducedMotion() || !total) {
      finish();
      return;
    }
    for (const part of entries) part.node.textContent = "";
    const current = job;
    const duration = Math.min(6500, Math.max(1000, total * 2.2));
    const step = Math.max(1, Math.ceil(total / (duration / frameMs)));
    function tick() {
      if (job !== current) return;
      let budget = step;
      while (budget > 0 && current.index < entries.length) {
        const p = entries[current.index];
        if (!p.position) onPart(p.node);
        const count = Math.min(budget, p.chars.length - p.position);
        p.position += count;
        budget -= count;
        p.node.textContent = p.chars.slice(0, p.position).join("");
        if (p.position === p.chars.length) current.index++;
      }
      onProgress();
      if (current.index === entries.length) {
        job = null;
        onDone();
      } else timer = schedule(tick, frameMs);
    }
    tick();
  }
  return {
    start,
    finish,
    cancel,
    get active() {
      return !!job;
    },
  };
}
