# Observable behavior
Source: user conversation, approved atlas and synthetic simulation concept. No external accounts, billing, permissions or server records in v0.1.
## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native select | DESIGN.md | Platform popup | Browser keyboard |
| Form | countryForm in index.html | User approved country settings | Native controls, custom inline error | Browser invalid/save |
| Scrollbar | style.css global | DESIGN.md | Root, panels | Browser narrow |
| Toast | notify in app.js | This document | Info, warning | Browser live feedback |
| CRUD | scenario functions in app.js | Local-only scenario model | Save, load, export, remove | Browser save/load |
## Workflows
Map click or region list selects region and exposes local indicators. Layers change map encoding and legend. Policy changes apply on next quarter, staged settings persist. Quarter advancement updates simulation, bounded to 40 years. Saved scenarios are snapshots in localStorage; save failures keep current session and show message. Loading restores terrain seed and all metrics. Export JSON works without storage. New country retains saved snapshots and asks explicit confirmation about replacing the active unsaved simulation. Native dialog owns focus trap, Escape and focus restoration; close button always available. Nonmodal region panel never traps focus. Locale is pt-BR, synthetic currency M$, periods by quarter. Methods state equations and limitations. No validated real-world forecasts.

## v0.2 user-approved additions
Source: user request for Gemini adviser, Apple-like design, dark/light themes and playable interactions.

- Theme: theme controls in app.js own light/dark/system preference. Bootstrap in index.html resolves the initial theme before paint. Storage errors retain session behavior. On narrow screens the two explicit theme choices remain visible.
- Adviser: dist/advisor.js owns request lifecycle and result rendering. POST /api/advisor sends an allowlisted snapshot and optional question; key is server-only. The user must deliberately consult; no automatic Gemini requests during playback. Results are plain text. Changing state aborts pending requests and marks displayed answers stale. Cancel, retry, timeout, missing configuration and quota errors leave the simulation available. Cache holds at most eight snapshot/question results in memory.
- Loading: buttons cannot launch duplicate requests; a cancellable loading row is visible. A missing key shows an unavailable state, not fabricated advice. Opening a dialog pauses playback. Playback also stops when the document is hidden or the 40-year horizon is reached.
- 3D: terrain3d.js owns the optional Three.js scene; switching to 2D disposes renderer, controls, geometry, materials, observers and events. On-demand rendering only, no idle animation loop. WebGL failure returns to SVG and explains why. State selectors, zoom and recenter controls remain available. Mobile regional detail is placed after the map. The 3D scale bar is hidden because perspective does not preserve a single scale.
- API: same-origin POST with JSON content and a custom header; bounded payload, strict snapshot ranges, output validation and short timeout. Per-IP warm-instance throttling is a best-effort limit, not a durable distributed quota. No server-side account or authorization model is introduced. Provider quotas and deployment firewall controls remain deployment responsibilities.
