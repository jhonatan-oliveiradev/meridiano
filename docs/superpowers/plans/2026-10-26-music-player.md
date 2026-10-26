# Music Player Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline execution.

**Goal:** Add the approved optional lo-fi player with 12 supplied tracks.
**Architecture:** Independent audio controller, static manifest and DOM/CSS presentation. Integrate through a separate module script; do not modify simulation state.
**Tech Stack:** Native JavaScript, HTMLAudioElement, CSS, Node test runner, MP3.
**Spec:** docs/superpowers/specs/2026-10-26-music-player-design.md

## Global Constraints
- No new dependencies, no audio autoplay, no eager track requests.
- Preserve desktop viewport height, mobile navigation, both themes and accents.
- Only feature files are published on top of verified dev; original local dirty work is excluded.

## Review Focus
- Rejected play promises and rapid play/pause must not leave a false playing state.
- Broken local storage must not stop startup.
- A failed track must permit retry without looping requests.
- Short screens and mobile keyboard/navigation must leave controls accessible.
- Paused track changes and playlist wrap must retain the user's intended state.

### Task 1: Playback and assets
Files: dist/music-controller.js, dist/music-tracks.js, dist/assets/music/*.mp3, tests/music.test.js.
- [x] Write behavioral tests for lazy loading, persistence validation, race cancellation, errors, progression, shuffle, seeking and volume; observe failure before implementation.
- [x] Implement createMusicController(audio, tracks, options), exposing a snapshot and explicit playback/selection/volume operations.
- [x] Transcode supplied files to 128 kbps MP3 and retain original filenames/artist identifiers in manifest.
- [x] Run node --test tests/music.test.js; expected green.

### Task 2: Interface and integration
Files: dist/music-player.js, dist/music-player.css, dist/index.html, scripts/build.mjs, scripts/serve.mjs, docs/MUSIC.md.
- [x] Build compact trigger and expanded panel with real controls, scrollable playlist, keyboard/outside dismissal and explicit statuses.
- [x] Require manifest/assets in build and serve MP3 with audio/mpeg locally.
- [x] Check UI in desktop/mobile/light/dark, play/pause, playlist progression, reload, error and no eager media requests.
- [x] Run npm test, npm run check, npm run build, changed-file formatting and git diff --check; expected green.
- [x] Review diff and publish feature branch PR targeting dev, without merging.
