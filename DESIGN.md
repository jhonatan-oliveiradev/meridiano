---
version: alpha
colors:
  primary: '#47730b'
  ink: '#20251d'
  muted: '#60695b'
  surface: '#ffffff'
  background: '#f3f5ef'
  ocean: '#e0e9e1'
  border: '#dce1d5'
  accent: '#ff5a19'
typography:
  sans:
    fontFamily: 'Manrope, sans-serif'
  display:
    fontFamily: 'Space Grotesk, Manrope, sans-serif'
  data:
    fontFamily: 'Manrope, sans-serif'
rounded:
  control: '10px'
  panel: '17px'
  dialog: '22px'
spacing:
  unit: '4px'
components:
  button:
    rounded: '10px'
---
# Meridiano
## Overview
A playable geopolitical atlas. The user explicitly requested Apple-like product design, dark/light themes and fluid interaction. Native-app restraint: custom typography, neutral surfaces, Creative Studio lime/orange accents, subtle selection states, precise geographic controls. The map remains the main workspace; no decorative marketing content. Avoid neon gaming dashboards, slogans and fake operating-system window chrome.
## Colors
Runtime token owner: `dist/studio.css` overrides the v0.2 premium layer and v0.1 compatibility stylesheet. The frontmatter maps directly to identically named CSS properties on `:root`. Dark tokens use `:root[data-theme=dark]`: primary #c7ff3d, ink #f2f3ed, muted #a3ad9d, surface #0d0f0d, background #070807, ocean #101d19, border #292f27. The lime #c7ff3d and orange #ff5a19 come from the user's nx-creative-studio app/globals.css. Lime buttons use dark text; light-mode links use #47730b for readable contrast. Physical terrain and data-layer palettes are separate cartographic encodings, never ideological labels. Chart colors read CSS tokens at render time. Three.js receives a resolved theme through `setTheme` and uses separate scene materials.
## Typography
Use locally hosted Manrope for interface roles and Space Grotesk for major headings and numeric emphasis. Variable Latin WOFF2 files are copied from pinned npm packages; no Google Fonts/CDN requests. Country title 34px/600, page title 21px/600, content title 30px/650. Cartographic state labels use Space Grotesk; water labels retain italic atlas lettering. Utility labels 9–11px, body 12–14px; mobile action text 11px. Do not add motivational headings to functional screens.
## Layout
Desktop: 66px navigation rail, 274px country sidebar, flexible map/content area. Main map has floating controls and selected-region inspector. Desktop shell is exactly 100dvh, with 82px header, flexible workspace and 76px timeline. Only the sidebar and content/inspector panels scroll. No root scroll. On mobile the regional inspector moves below the map, keeping the territory unobscured; controls retain non-drag and keyboard alternatives. Adviser: context panel beside analysis; stacked on narrow viewports.
## Elevation & Depth
17px inspector with limited blur, soft shadow only for floating controls. Flat application chrome. Three.js is an optional terrain view, loaded on demand; SVG remains default and fallback. No bloom, particles, constant camera drift or background render loop.
## Shapes
10px controls, 17px panels, 19px map, 22px dialogs. 1px neutral separators. Consistent native selects accept OS-owned popup geometry.
## Components
Shared native dialog controls focus isolation and Escape. Shared notification system is used across actions. Theme preference supports light/dark/system, persisted with guarded storage; a pre-paint bootstrap avoids a theme flash. View transitions and map zoom last about 190–220ms. Quarter changes use a short pulse. Reduced-motion disables decorative motion. Automatic quarterly time is explicit, with play/pause and speed.
## Do's and Don'ts
Compute economics in the deterministic engine. Render adviser output as plain text. Preserve visible focus and text errors. Never expose the API key in client assets. Clearly distinguish an unavailable adviser from a simulation failure. Dispose Three.js resources and stop rendering when hidden; cap DPR at 1.5 and draw only on change. Do not claim empirical prediction or measured FPS without evidence.

## Cabinet character
Nilo was created in the Avatar Lab UI with a rounded cube, lime body and dark eyes. Neutral, happy and thinking Photo Mode exports supply the actual vector poses. Local SVGs add a tonal gradient; a small CSS/DOM controller adds blinking, gaze, hover and acknowledgement. No avatar engine is bundled. Motion pauses offscreen or hidden and respects reduced motion. Government changes the fictional office title, never a numerical bonus.
