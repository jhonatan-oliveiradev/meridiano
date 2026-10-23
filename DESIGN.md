---
version: alpha
colors:
  primary: '#0071e3'
  ink: '#1d1d1f'
  muted: '#6e6e73'
  surface: '#ffffff'
  background: '#f5f5f7'
  ocean: '#dce8ee'
  border: '#dedee3'
  accent: '#0071e3'
typography:
  sans:
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  data:
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
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
A playable geopolitical atlas. The user explicitly requested Apple-like product design, dark/light themes and fluid interaction. Native-app restraint: system typography, neutral surfaces, blue action accent, subtle selection states, precise geographic controls. The map remains the main workspace; no decorative marketing content. Avoid neon gaming dashboards, slogans and fake operating-system window chrome.
## Colors
Runtime token owner: `dist/premium.css` overrides the v0.1 compatibility stylesheet. The frontmatter maps directly to identically named CSS properties on `:root`. Dark tokens use `:root[data-theme=dark]`: primary #2997ff, ink #f5f5f7, muted #a1a1a8, surface #232326, background #161618, ocean #142330, border #39393e. Physical terrain and data-layer palettes are separate cartographic encodings, never ideological labels. Chart colors read CSS tokens at render time. Three.js receives a resolved theme through `setTheme` and uses separate scene materials.
## Typography
Use system sans for all interface roles with tabular numeric values; no font requests. Country title 34px/600, page title 21px/600, content title 30px/650. Cartographic geographic labels retain restrained serif lettering as an atlas convention. Utility labels 9–11px, body 12–14px; mobile action text 11px. Do not add motivational headings to functional screens.
## Layout
Desktop: 66px navigation rail, 274px country sidebar, flexible map/content area. Main map has floating controls and selected-region inspector. On mobile the regional inspector moves below the map, keeping the territory unobscured; controls retain non-drag and keyboard alternatives. Adviser: context panel beside analysis; stacked on narrow viewports.
## Elevation & Depth
17px inspector with limited blur, soft shadow only for floating controls. Flat application chrome. Three.js is an optional terrain view, loaded on demand; SVG remains default and fallback. No bloom, particles, constant camera drift or background render loop.
## Shapes
10px controls, 17px panels, 19px map, 22px dialogs. 1px neutral separators. Consistent native selects accept OS-owned popup geometry.
## Components
Shared native dialog controls focus isolation and Escape. Shared notification system is used across actions. Theme preference supports light/dark/system, persisted with guarded storage; a pre-paint bootstrap avoids a theme flash. View transitions and map zoom last about 190–220ms. Quarter changes use a short pulse. Reduced-motion disables decorative motion. Automatic quarterly time is explicit, with play/pause and speed.
## Do's and Don'ts
Compute economics in the deterministic engine. Render adviser output as plain text. Preserve visible focus and text errors. Never expose the API key in client assets. Clearly distinguish an unavailable adviser from a simulation failure. Dispose Three.js resources and stop rendering when hidden; cap DPR at 1.5 and draw only on change. Do not claim empirical prediction or measured FPS without evidence.
