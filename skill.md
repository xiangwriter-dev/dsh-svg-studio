# Image → high-quality pure SVG

> **Licence:** personal, non-commercial use only. Commercial use requires a separate written licence from xiangwriter. See `LICENSE` and `COMMERCIAL.md`.

Use this skill when the user asks to turn an image (especially a character illustration, chibi, poster, or sticker art) into SVG, vectorize it, trace it, or create a scalable version. The bundled `svg_studio` tool runs the whole optimized pipeline; do not rebuild it ad hoc.

## What the tool does

`svg_studio` performs: adaptive palette quantization → layered contour tracing → character silhouette clip → local face-detail palette → optional clean outer contour → structural validation. It writes a real SVG with paths, gradients and masks; no raster image is embedded.

The interactive page is **SVG Studio** (sidebar icon “SVG Studio / 图像矢量化”). The page accepts an image plus a free-form style description. Use the tool when the task is agent-driven; use the page when the user wants to experiment visually. The clean-background mode never invents a halo; the source backdrop is either replaced by a clean gradient or, with the `original` preset, preserved. The outer contour is an opt-in sticker effect and is off by default.

## Workflow

1. Find the image's local path. Prefer an absolute path. For an uploaded attachment, use the normalized host path supplied by the harness, not a browser blob URL. Large images are normalised to a 1200 px long edge by the engine for speed and file size; report the output dimensions rather than the source dimensions when they differ.
2. Read the user's style guidance. Pass it verbatim as `prompt`. If absent, use the faithful default; do not invent constraints.
3. Choose a preset:
   - `faithful` (default): 160 colours, face detail on, clean gradient, no outer contour. Best overall resemblance.
   - `clean`: 112 colours, face detail on. Smaller file, cleaner flat look.
   - `flat`: 72 colours, face detail off. Poster/flat-colour look.
   - `original`: 140 colours, face detail on, **keeps the source background**. Use when the source is a full scene/photo or the user explicitly wants its backdrop.
   - `mini`: 64 colours, no face detail. Smallest file; only for simple art.
   - The outer contour is off by default. Only set `outline:true` when the user explicitly asks for a sticker-style rim.
4. Call `svg_studio` with:
   - `image_path` — required local path.
   - `prompt` — the user's own ideas/suggestions (optional).
   - `preset` — one of the values above.
   - Optional explicit overrides: `colors` (24–224), `face_detail`, `outline`, `background` (`auto` / `gradient` / `original`), `saturation` (0.8–1.3), `output_path`.
   - An explicit override wins over both the preset and prompt hints. Prompt hints refine the chosen preset when a field is not explicitly supplied; trust the returned `settings` as the effective values.
5. Read the JSON result. Prefer the returned `path`; present that file and report dimensions, path count, file size, chosen background, and elapsed time. If `warnings` is non-empty, mention the size/time tradeoff to the user.
6. Iterate at most twice, and only for an observed defect:
   - File too large → lower `colors` to 96–112, or `face_detail:false`.
   - Face/eyes too flat → `preset:"faithful"`, `face_detail:true`, raise `colors` to 176.
   - Background artefact/clutter → `background:"original"` (faithful to source) or choose `clean`.
   - Outline too heavy/unwanted → `outline:false`.
   - Different look requested → pass the user's exact note as `prompt`; the tool maps keywords to settings.

## Quality gates

- The returned summary must show `ok:true` and the SVG must contain no embedded raster. If a file contains `<image>` or `data:image`, reject it.
- Check `ok === true`, `paths >= 2`, `width/height > 0`, and that the output file exists.
- Do not claim a visual check you did not perform. If browser rendering is available, inspect the result and/or the page; otherwise report structural verification only.
- Keep the source untouched. Write outputs to the requested path or the tool's managed output directory.
- Do not loop endlessly over presets: 1–2 refinement passes is enough.

## Style-to-settings hints (the Host also parses these)

- “更干净/简洁、扁平、少色块” → `clean`/`flat`, optionally lower colors.
- “更精细、脸部/眼睛更清楚、尽量还原” → `faithful`, colors 176, face detail on.
- “保留原背景/不要换背景/复杂场景” → `background:"original"`.
- “不要描边/去轮廓” → `outline:false`.
- “小文件、轻量、网页用” → colors 96–112, face detail off if necessary.
- “透明背景” is not part of this engine version; use `background:"original"` if the source is already transparent, or tell the user it is not yet supported.
