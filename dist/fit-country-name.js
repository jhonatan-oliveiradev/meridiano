// Keep the country's name readable on one line as the sidebar and fonts resize.
export function initCountryNameFit(heading) {
  let frame = 0;
  function fit() {
    frame = 0;
    heading.style.removeProperty("font-size");
    if (!heading.clientWidth) return;
    const maximum = parseFloat(getComputedStyle(heading).fontSize);
    const minimum = Math.min(16, maximum);
    if (heading.scrollWidth <= heading.clientWidth) return;
    let low = minimum,
      high = maximum;
    heading.style.fontSize = `${minimum}px`;
    if (heading.scrollWidth > heading.clientWidth) return;
    // Find the largest fitting size, rounded down to avoid fractional clipping.
    while (high - low > 0.25) {
      const mid = (low + high) / 2;
      heading.style.fontSize = `${mid}px`;
      if (heading.scrollWidth <= heading.clientWidth) low = mid;
      else high = mid;
    }
    heading.style.fontSize = `${Math.floor(low * 4) / 4}px`;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(fit);
  }
  let width = -1;
  const observer = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === width) return;
    width = entry.contentRect.width;
    schedule();
  });
  observer.observe(heading.parentElement);
  const mutations = new MutationObserver(() => {
    heading.title = heading.textContent;
    schedule();
  });
  mutations.observe(heading, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  heading.title = heading.textContent;
  window.addEventListener("resize", schedule, { passive: true });
  document.fonts.ready.then(schedule);
  schedule();
}
