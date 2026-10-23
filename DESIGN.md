---
version: alpha
colors:
  primary: '#275c4a'
  ink: '#243c35'
  muted: '#61756d'
  surface: '#ffffff'
  background: '#f4f6f2'
  ocean: '#dce8e8'
  border: '#dce3dc'
  accent: '#b08a47'
typography:
  sans:
    fontFamily: 'Arial, sans-serif'
  display:
    fontFamily: 'Georgia, serif'
  data:
    fontFamily: 'Consolas, monospace'
rounded:
  control: '8px'
  panel: '12px'
spacing:
  unit: '4px'
components:
  button:
    borderRadius: '8px'
---
# Meridiano
## Overview
An interactive atlas for exploring synthetic countries and public policies. Product register, Portuguese Brazil. Signature: a shaded relief territory with topographic contours, geographic labels and selectable administrative cells. Avoid dashboard card grids and game neon. Working name chosen by implementer, not final branding.
## Colors
Normative palette above maps to identically named CSS custom properties in dist/style.css. Physical terrain ramp is separate cartographic data encoding; never use political ideology to color success/failure.
## Typography
Georgia only for country title and atlas labels; Arial for controls; Consolas for coordinate and data annotations. No remote font dependency.
## Layout
64px instrument rail, 278px information sidebar, map occupies remaining width. Floating map tools and region detail. Below 1000px sidebar narrows, below 760px sidebar becomes a natural-height summary and map remains at least 550px tall. Active content scrolls naturally on mobile.
## Elevation & Depth
Relief on map. Very soft shadows only on floating controls. Flat side panels.
## Shapes
8px controls, 12px floating panels. Dividers group information.
## Components
Native buttons, labelled native selects with platform popup accepted, native dialog for modal focus isolation and Escape; shared openModal and notification function. Range controls are keyboard accessible. Map region list supplies non-pointer selection.
## Do's and Don'ts
Show synthetic-model caveat alongside results. No false precision claims. Preserve visible keyboard focus, chart text alternatives, reduced motion, global scrollbar colors. Controls remain meaningful at small sizes.
