# Fonts and character assets

- **Manrope** and **Space Grotesk**: locally hosted variable Latin fonts distributed through @fontsource-variable packages. Their SIL Open Font License files are copied to dist/fonts at build time. Fontsource: https://fontsource.org/fonts/manrope and https://fontsource.org/fonts/space-grotesk.
- **Three.js**: MIT; license retained in dist/vendor/THREE-LICENSE.txt by the build script.
- **Nilo**: created for Meridiano in https://avatars.bible-strong.app/ by configuring a new rounded cube (245×225×155, roundness 0.28), body #c7ff3d and eyes #111316. Avatar Lab author: Stéphane Montlouis-Calixte (@_smontlouis). Original portable .avatar.json and neutral/happy/thinking SVG Photo Mode exports are retained under docs/avatar-source. Meridiano's own prepare-avatar.py adds a lime tonal gradient, an unclipped frame, and eye-group selectors; cabinet-avatar.js provides UI reactions.

The Avatar Lab application and its published renderer packages are AGPL-3.0-only. Those runtime packages and their rendering code are not bundled in Meridiano. This integration uses the character data and artwork exported through the authoring interface, plus Meridiano's own DOM/CSS controller. It does not claim support for every animation in the Lab's runtime catalog. The exported .avatar.json remains available for further editing in the Lab.

**Color reference:** https://github.com/jhonatan-oliveiradev/nx-creative-studio, app/globals.css: #c7ff3d lime, #ff5a19 orange, #070807 background, #0d0f0d surface. No source UI components from that repository were copied.
