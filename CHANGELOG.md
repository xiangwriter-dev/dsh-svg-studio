# Changelog

## 1.0.1 — 2026-10-18

- Renamed the package, repository, local source directory and client module to
  **dsh-xiangwriter-svg-studio**.
- Added the xiangwriter wordmark, sparkle seal, byline and footer branding to the
  icon, Studio page and README assets.
- Relicensed the project for **personal, non-commercial use only**. Commercial use
  now requires a separate written licence; added `COMMERCIAL.md` and a visible
  in-app licence notice.
- Added the xiangwriter-branded GitHub banner and English/Chinese GitHub READMEs.

## 1.0.0 — initial engine release

- Web Studio page with upload/drag-drop, prompt, presets, advanced settings,
  preview and download.
- Agent tool `svg_studio` and skill `svg-vector-recreation`.
- Pillow + numpy engine: adaptive palette, layered contour tracing, figure-aware
  clipping, local face detail, clean gradient backdrop, optional outer contour,
  closed-contour simplification, structural validation.
- Light and neutral backgrounds no longer lose near-white character areas.
- Clean gradient mode no longer invents a dark halo; background colour blobs from
  the synthetic halo are removed.
- Outer contour is off by default and only enabled explicitly; a prompt mentioning
  “contour” no longer switches it on.
- Local face-detail tracing no longer applies RDP, avoiding facial speckles.
- English and Chinese UI, CI and synthetic engine smoke test.
