// Cult UI AI Blob Warp, adapted to vanilla ESM using the same Paper Warp shader.
// Cult UI: MIT; Paper Shaders: Apache-2.0. See THIRD_PARTY.md.
export function initAiBlob(host, reduced) {
  let mount = null,
    loading = null,
    destroyed = false;
  let shown = false,
    responding = false,
    inView = false;
  const root = host.closest(".composer-dock");
  function update() {
    const live = shown && inView && !document.hidden && !reduced.matches;
    root.dataset.blobLive = String(live);
    mount?.setSpeed(live ? (responding ? 0.65 : 0.16) : 0);
  }
  async function load() {
    if (loading || mount || destroyed) return;
    loading = Promise.all([
      import("./vendor/paper/shader-mount.js"),
      import("./vendor/paper/shaders/warp.js"),
      import("./vendor/paper/get-shader-color-from-string.js"),
      import("./vendor/paper/get-shader-noise-texture.js"),
    ]);
    try {
      const [
        { ShaderMount },
        { warpFragmentShader },
        { getShaderColorFromString },
        { getShaderNoiseTexture },
      ] = await loading;
      if (destroyed) return;
      const colors = ["#c7ff3d", "#47730b", "#ff5a19", "#eaffb0"].map(
        getShaderColorFromString,
      );
      mount = new ShaderMount(
        host,
        warpFragmentShader,
        {
          u_colors: colors,
          u_colorsCount: colors.length,
          u_proportion: 0.54,
          u_softness: 1,
          u_distortion: 0.25,
          u_swirl: 0.8,
          u_swirlIterations: 8,
          u_shape: 0,
          u_shapeScale: 1,
          u_scale: 0.2,
          u_rotation: 0,
          u_offsetX: 0,
          u_offsetY: 0,
          u_originX: 0.5,
          u_originY: 0.5,
          u_worldWidth: 0,
          u_worldHeight: 0,
          u_fit: 0,
          u_noiseTexture: getShaderNoiseTexture(),
        },
        { alpha: true, powerPreference: "low-power" },
        0,
        3200,
        1,
        12544,
      );
      host.dataset.shader = "ready";
      update();
    } catch {
      // Keep the gradient and control usable when WebGL or module loading fails.
      host.replaceChildren();
      host.dataset.shader = "fallback";
    }
  }
  const observer = new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    update();
  });
  observer.observe(root);
  reduced.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);
  return {
    setState(next) {
      shown = next.shown;
      responding = next.responding;
      if (shown) void load();
      update();
    },
    destroy() {
      destroyed = true;
      observer.disconnect();
      reduced.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      mount?.dispose();
      mount = null;
    },
  };
}
