const KEY = "meridiano:music:v1";
const clamp = (v) => Math.max(0, Math.min(1, v));

// Owns only audio and preferences: never reads or mutates the country's state.
export function createMusicController(audio, tracks, options = {}) {
  const { storage, random = Math.random, onChange = () => {} } = options;
  let prefs = {};
  try {
    prefs = JSON.parse(storage?.getItem(KEY) || "{}") || {};
  } catch {}
  let index = Math.max(
    0,
    tracks.findIndex((t) => t.id === prefs.trackId),
  );
  let volume = Number.isFinite(prefs.volume) ? clamp(prefs.volume) : 0.35;
  let shuffle = prefs.shuffle === true,
    muted = prefs.muted === true;
  let playing = false,
    wanted = false,
    status = "paused",
    loaded = -1,
    request = 0;
  const history = [];
  audio.preload = "none";
  audio.volume = volume;
  audio.muted = muted;
  const snapshot = () => ({
    index,
    track: tracks[index],
    volume,
    shuffle,
    muted,
    playing,
    status,
    time:
      loaded === index && Number.isFinite(audio.currentTime)
        ? audio.currentTime
        : 0,
    duration:
      loaded === index && Number.isFinite(audio.duration) ? audio.duration : 0,
  });
  const notify = () => onChange(snapshot());
  function save() {
    try {
      storage?.setItem(
        KEY,
        JSON.stringify({ trackId: tracks[index].id, volume, shuffle, muted }),
      );
    } catch {}
  }
  function pause() {
    wanted = false;
    request++;
    audio.pause();
    playing = false;
    status = "paused";
    notify();
  }
  async function play() {
    const token = ++request;
    wanted = true;
    status = "loading";
    notify();
    if (loaded !== index || audio.error) {
      audio.src = tracks[index].src;
      loaded = index;
      audio.load();
    }
    try {
      await audio.play();
    } catch {
      if (token !== request || !wanted) return;
      wanted = false;
      playing = false;
      status = "error";
      notify();
    }
  }
  function select(target, start = false, remember = true) {
    if (!Number.isInteger(target) || target < 0 || target >= tracks.length)
      return;
    const resume = wanted || start;
    if (remember && target !== index) history.push(index);
    if (history.length > 100) history.shift();
    pause();
    index = target;
    if (loaded !== index) {
      // Remove the previous resource without fetching the newly selected track.
      audio.removeAttribute?.("src");
      audio.load();
      loaded = -1;
    }
    save();
    notify();
    if (resume) void play();
  }
  function next() {
    const target =
      shuffle && tracks.length > 1
        ? (index + 1 + Math.floor(random() * (tracks.length - 1))) %
          tracks.length
        : (index + 1) % tracks.length;
    select(target);
  }
  function previous() {
    if (loaded === index && audio.currentTime > 3) {
      audio.currentTime = 0;
      notify();
      return;
    }
    select(
      history.pop() ?? (index + tracks.length - 1) % tracks.length,
      false,
      false,
    );
  }
  function setVolume(value) {
    if (!Number.isFinite(value)) return;
    volume = clamp(value);
    if (volume > 0) muted = false;
    audio.volume = volume;
    audio.muted = muted;
    save();
    notify();
  }
  function toggleMute() {
    muted = !muted;
    audio.muted = muted;
    save();
    notify();
  }
  function setShuffle(value) {
    shuffle = !!value;
    save();
    notify();
  }
  function seek(value) {
    if (
      loaded !== index ||
      !Number.isFinite(value) ||
      !Number.isFinite(audio.duration)
    )
      return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, value));
    notify();
  }
  const listeners = {
    playing() {
      if (!wanted) {
        audio.pause();
        return;
      }
      playing = true;
      status = "playing";
      notify();
    },
    pause() {
      // A queued pause from a previous source may arrive after a new play.
      if (!audio.paused) return;
      // End-of-track also pauses, but must retain intent for automatic advance.
      if (!audio.ended && wanted) {
        wanted = false;
        request++;
      }
      playing = false;
      if (status !== "error") status = "paused";
      notify();
    },
    waiting() {
      if (wanted) {
        status = "loading";
        notify();
      }
    },
    ended() {
      if (wanted) next();
    },
    error() {
      if (loaded < 0) return;
      wanted = false;
      playing = false;
      status = "error";
      request++;
      notify();
    },
    timeupdate: notify,
    durationchange: notify,
    loadedmetadata: notify,
    volumechange() {
      volume = audio.volume;
      muted = audio.muted;
      save();
      notify();
    },
  };
  for (const [event, handler] of Object.entries(listeners))
    audio.addEventListener(event, handler);
  return {
    snapshot,
    play,
    pause,
    next,
    previous,
    select,
    setVolume,
    toggleMute,
    setShuffle,
    seek,
    toggle() {
      return wanted ? pause() : play();
    },
    destroy() {
      pause();
      for (const [event, handler] of Object.entries(listeners))
        audio.removeEventListener(event, handler);
    },
  };
}
