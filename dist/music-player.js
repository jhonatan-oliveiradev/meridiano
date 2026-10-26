import { musicTracks } from "./music-tracks.js";
import { createMusicController } from "./music-controller.js";

const root = document.querySelector("#musicPlayer");
const icon = (path) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
const icons = {
  play: icon('<path d="m9 5 11 7-11 7Z"/>'),
  pause: icon('<path d="M8 5v14M16 5v14"/>'),
  previous: icon('<path d="M5 5v14m14-14L8 12l11 7Z"/>'),
  next: icon('<path d="M19 5v14M5 5l11 7-11 7Z"/>'),
  shuffle: icon(
    '<path d="M3 7h3c5 0 7 10 12 10h3m-4-4 4 4-4 4M3 17h3c1.5 0 3-1 4-3m4-4c1-2 2-3 4-3h3m-4-4 4 4-4 4"/>',
  ),
  volume: icon(
    '<path d="M3 9h4l5-4v14l-5-4H3Zm13-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  ),
  muted: icon('<path d="M3 9h4l5-4v14l-5-4H3Zm13 0 5 6m-5 0 5-6"/>'),
};
const bars =
  '<span class="music-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';
const clock = (n) =>
  `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;

if (root) {
  root.innerHTML = `
    <button class="music-trigger" id="musicTrigger" type="button" aria-label="Abrir player de música" aria-expanded="false" aria-controls="musicPanel">${bars}<span>Música</span></button>
    <section class="music-panel" id="musicPanel" aria-label="Player de música" inert>
      <div class="music-heading"><div><span class="eyebrow">RÁDIO MERIDIANO</span><h3>Trilha sonora</h3></div><button type="button" class="music-icon" id="musicClose" aria-label="Recolher player">${icon('<path d="m6 6 12 12M6 18 18 6"/>')}</button></div>
      <div class="music-now"><div class="music-art" aria-hidden="true"><span class="music-orbit"></span>${bars}</div><div><span class="music-caption" id="musicCaption">LO-FI · 12 FAIXAS</span><strong id="musicTitle"></strong><span id="musicArtist"></span></div></div>
      <div class="music-scrubber"><label class="sr-only" for="musicSeek">Posição na faixa</label><input id="musicSeek" type="range" min="0" max="1" step="1" value="0" disabled><div><span id="musicTime">0:00</span><span id="musicDuration"></span></div></div>
      <div class="music-controls"><button type="button" class="music-icon" id="musicShuffle" aria-label="Reprodução aleatória" aria-pressed="false">${icons.shuffle}</button><button type="button" class="music-icon" id="musicPrevious" aria-label="Faixa anterior">${icons.previous}</button><button type="button" class="music-play" id="musicPlay" aria-label="Reproduzir música">${icons.play}</button><button type="button" class="music-icon" id="musicNext" aria-label="Próxima faixa">${icons.next}</button><span class="music-repeat" title="A lista recomeça ao terminar">↻<span class="sr-only">Repetir lista</span></span></div>
      <div class="music-volume"><button type="button" class="music-icon" id="musicMute" aria-label="Silenciar música" aria-pressed="false">${icons.volume}</button><label class="sr-only" for="musicVolume">Volume da música</label><input id="musicVolume" type="range" min="0" max="100" value="35"><output id="musicVolumeLabel" for="musicVolume">35%</output></div>
      <p class="music-status" id="musicStatus" role="status">Dê play para ouvir enquanto governa.</p>
      <div class="music-list-heading"><span>NA FREQUÊNCIA</span><span>12 faixas</span></div><ol class="music-list" id="musicList" aria-label="Escolher faixa"></ol>
    </section>`;
  const $ = (id) => root.querySelector(`#${id}`);
  const panel = $("musicPanel"),
    trigger = $("musicTrigger"),
    audio = new Audio();
  audio.hidden = true;
  root.append(audio);
  let storage;
  try {
    storage = localStorage;
  } catch {}
  let lastIndex = -1,
    lastStatus = "",
    hasPlayed = false;
  const controller = createMusicController(audio, musicTracks, {
    storage,
    onChange: render,
  });
  const rows = musicTracks.map((track, i) => {
    const li = document.createElement("li"),
      button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<span class="music-number">${String(i + 1).padStart(2, "0")}</span><span class="music-track-copy"><strong></strong><span></span></span><span class="music-length">${clock(track.duration)}</span>`;
    button.querySelector("strong").textContent = track.title;
    button.querySelector(".music-track-copy > span").textContent = track.artist;
    button.setAttribute(
      "aria-label",
      `Reproduzir ${track.title}, ${track.artist}`,
    );
    button.addEventListener("click", () => controller.select(i, true));
    li.append(button);
    $("musicList").append(li);
    return button;
  });
  function render(s) {
    root.dataset.playing = String(s.playing && s.status === "playing");
    root.dataset.status = s.status;
    $("musicTitle").textContent = s.track.title;
    $("musicArtist").textContent = s.track.artist;
    $("musicCaption").textContent =
      s.status === "playing" ? "NO AR · LO-FI" : "LO-FI · 12 FAIXAS";
    $("musicPlay").innerHTML = ["playing", "loading"].includes(s.status)
      ? icons.pause
      : icons.play;
    $("musicPlay").setAttribute(
      "aria-label",
      ["playing", "loading"].includes(s.status)
        ? "Pausar música"
        : s.status === "error"
          ? "Tentar reproduzir novamente"
          : "Reproduzir música",
    );
    trigger.setAttribute(
      "aria-label",
      `${s.playing ? "Tocando" : "Música"}: ${s.track.title}. Abrir player`,
    );
    trigger.title = `${s.track.title} · ${s.track.artist}`;
    $("musicShuffle").setAttribute("aria-pressed", String(s.shuffle));
    $("musicMute").setAttribute("aria-pressed", String(s.muted));
    $("musicMute").setAttribute(
      "aria-label",
      s.muted ? "Ativar som" : "Silenciar música",
    );
    $("musicMute").innerHTML =
      s.muted || !s.volume ? icons.muted : icons.volume;
    $("musicVolume").value = Math.round(s.volume * 100);
    $("musicVolumeLabel").textContent = s.muted
      ? "Mudo"
      : `${Math.round(s.volume * 100)}%`;
    $("musicSeek").disabled = !s.duration;
    $("musicSeek").max = s.duration || 1;
    $("musicSeek").value = s.time;
    $("musicSeek").setAttribute(
      "aria-valuetext",
      `${clock(s.time)} de ${clock(s.duration || s.track.duration)}`,
    );
    $("musicTime").textContent = clock(s.time);
    $("musicDuration").textContent = clock(s.duration || s.track.duration);
    if (s.status !== lastStatus || s.index !== lastIndex) {
      if (s.playing) hasPlayed = true;
      $("musicStatus").textContent =
        s.status === "error"
          ? "Não foi possível tocar a faixa. Tente dar play novamente."
          : s.status === "loading"
            ? "Carregando faixa…"
            : s.playing
              ? "Tocando agora."
              : hasPlayed
                ? "Música pausada."
                : "Dê play para ouvir enquanto governa.";
      rows?.forEach((button, i) => {
        if (i === s.index) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
      if ("mediaSession" in navigator) {
        if (
          (s.index !== lastIndex || (s.playing && lastStatus !== "playing")) &&
          hasPlayed &&
          "MediaMetadata" in window
        )
          navigator.mediaSession.metadata = new MediaMetadata({
            title: s.track.title,
            artist: s.track.artist,
            album: "Rádio Meridiano",
          });
        navigator.mediaSession.playbackState = s.playing ? "playing" : "paused";
      }
    }
    lastStatus = s.status;
    lastIndex = s.index;
  }
  function open(value, restore = false) {
    root.dataset.open = String(value);
    panel.inert = !value;
    trigger.setAttribute("aria-expanded", String(value));
    if (value) $("musicClose").focus({ preventScroll: true });
    else if (restore) trigger.focus({ preventScroll: true });
  }
  trigger.onclick = () => open(root.dataset.open !== "true");
  $("musicClose").onclick = () => open(false, true);
  $("musicPlay").onclick = () => controller.toggle();
  $("musicNext").onclick = () => controller.next();
  $("musicPrevious").onclick = () => controller.previous();
  $("musicShuffle").onclick = () =>
    controller.setShuffle(!controller.snapshot().shuffle);
  $("musicMute").onclick = () => controller.toggleMute();
  $("musicVolume").oninput = (e) =>
    controller.setVolume(Number(e.target.value) / 100);
  $("musicSeek").oninput = (e) => controller.seek(Number(e.target.value));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.dataset.open === "true") {
      e.preventDefault();
      open(false, true);
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (!root.contains(e.target)) open(false);
  });
  document.addEventListener(
    "visibilitychange",
    () => (root.dataset.hidden = String(document.hidden)),
  );
  if ("mediaSession" in navigator) {
    for (const [action, handler] of Object.entries({
      play: () => controller.play(),
      pause: () => controller.pause(),
      previoustrack: () => controller.previous(),
      nexttrack: () => controller.next(),
      seekto: (e) => controller.seek(e.seekTime),
    }))
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {}
  }
  render(controller.snapshot());
}
