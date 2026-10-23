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
