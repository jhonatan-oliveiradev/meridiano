import test from "node:test";
import assert from "node:assert/strict";
import { createMusicController } from "../dist/music-controller.js";
import { audioRange } from "../server/audio-range.js";

test("audio HTTP ranges support forward, open, suffix and unsatisfiable requests", () => {
  assert.deepEqual(audioRange("bytes=10-19", 100), { start: 10, end: 19 });
  assert.deepEqual(audioRange("bytes=90-", 100), { start: 90, end: 99 });
  assert.deepEqual(audioRange("bytes=-20", 100), { start: 80, end: 99 });
  assert.deepEqual(audioRange("bytes=90-500", 100), { start: 90, end: 99 });
  for (const h of [
    "bytes=100-",
    "bytes=40-10",
    "bytes=-0",
    "bytes=a-b",
    "bytes=1-2,4-5",
  ])
    assert.equal(audioRange(h, 100), null);
});

class AudioStub extends EventTarget {
  preload = "auto";
  src = "";
  volume = 1;
  muted = false;
  currentTime = 0;
  duration = 120;
  paused = true;
  playCalls = 0;
  async play() {
    this.playCalls++;
    this.paused = false;
    this.dispatchEvent(new Event("playing"));
  }
  pause() {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }
  load() {}
}
const tracks = ["one", "two", "three"].map((id) => ({
  id,
  src: `${id}.mp3`,
  title: id,
  artist: "artist",
}));
function setup(options = {}) {
  const audio = new AudioStub();
  const c = createMusicController(audio, tracks, options);
  return { audio, c };
}
test("startup and paused selection never load media or autoplay", () => {
  const { audio, c } = setup();
  assert.equal(audio.preload, "none");
  assert.equal(audio.src, "");
  c.select(1);
  assert.equal(audio.src, "");
  assert.equal(audio.playCalls, 0);
});
test("play uses selected source; pause and next preserve paused intent", async () => {
  const { audio, c } = setup();
  await c.play();
  assert.equal(audio.src, "one.mp3");
  assert.equal(c.snapshot().playing, true);
  c.pause();
  c.next();
  assert.equal(c.snapshot().index, 1);
  assert.equal(audio.playCalls, 1);
});
test("ended advances and wraps while playing", async () => {
  const { audio, c } = setup();
  c.select(2);
  await c.play();
  audio.dispatchEvent(new Event("ended"));
  assert.equal(c.snapshot().index, 0);
  assert.equal(audio.src, "one.mp3");
});
test("shuffle does not repeat current track and previous uses listening history", async () => {
  const { c } = setup({ random: () => 0.99 });
  c.setShuffle(true);
  await c.play();
  c.next();
  assert.equal(c.snapshot().index, 2);
  c.previous();
  assert.equal(c.snapshot().index, 0);
});
test("corrupt and unavailable storage preserve safe defaults", () => {
  for (const storage of [
    { getItem: () => "{bad" },
    {
      getItem() {
        throw Error("denied");
      },
    },
  ]) {
    const { c } = setup({ storage });
    assert.equal(c.snapshot().volume, 0.35);
    assert.equal(c.snapshot().playing, false);
  }
});
test("restores validated preferences without restoring playback", () => {
  let saved;
  const storage = {
    getItem: () =>
      JSON.stringify({
        trackId: "two",
        volume: 9,
        shuffle: true,
        muted: true,
        playing: true,
      }),
    setItem: (k, v) => (saved = JSON.parse(v)),
  };
  const { audio, c } = setup({ storage });
  assert.equal(c.snapshot().index, 1);
  assert.equal(audio.volume, 1);
  assert.equal(audio.muted, true);
  assert.equal(audio.playCalls, 0);
  c.setVolume(0.2);
  assert.equal(saved.volume, 0.2);
  assert.equal(saved.playing, undefined);
});
test("errors stop with explicit retry and do not repeatedly skip tracks", async () => {
  const { audio, c } = setup();
  audio.play = async () => {
    audio.playCalls++;
    throw Error("offline");
  };
  await c.play();
  assert.equal(c.snapshot().status, "error");
  assert.equal(c.snapshot().playing, false);
  assert.equal(audio.playCalls, 1);
  audio.play = AudioStub.prototype.play;
  await c.play();
  assert.equal(c.snapshot().playing, true);
});
test("stale rejected play cannot overwrite a newer request or pause", async () => {
  const { audio, c } = setup();
  let reject;
  audio.play = () => new Promise((_, r) => (reject = r));
  const pending = c.play();
  c.pause();
  reject(Error("aborted"));
  await pending;
  assert.equal(c.snapshot().status, "paused");
});
test("seeking clamps finite loaded durations and ignores unloaded media", async () => {
  const { audio, c } = setup();
  c.seek(50);
  assert.equal(audio.currentTime, 0);
  await c.play();
  c.seek(500);
  assert.equal(audio.currentTime, 120);
  c.seek(-3);
  assert.equal(audio.currentTime, 0);
  c.setVolume(NaN);
  assert.equal(audio.volume, 0.35);
});

test("external audio interruption pauses intent so the next click resumes", async () => {
  const { audio, c } = setup();
  await c.play();
  audio.pause();
  assert.equal(c.snapshot().playing, false);
  await c.toggle();
  assert.equal(c.snapshot().playing, true);
  assert.equal(audio.playCalls, 2);
});
test("a stale pause event cannot overwrite a newer playing resource", async () => {
  const { audio, c } = setup();
  await c.play();
  c.next();
  audio.dispatchEvent(new Event("pause"));
  assert.equal(c.snapshot().playing, true);
  assert.equal(c.snapshot().status, "playing");
});
