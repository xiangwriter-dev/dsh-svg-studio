#!/usr/bin/env python3
"""SVG Studio vector engine.

Copyright (c) 2026 xiangwriter. All rights reserved.
Personal, non-commercial use only. Commercial licensing: see COMMERCIAL.md.

Pipeline: adaptive palette quantization -> layered contour tracing -> figure
silhouette clip -> local face-detail palette -> optional clean outer contour -> SVG
validation.  Pure vector output; no raster data is embedded in the SVG.

The engine is intentionally self-contained and depends only on Pillow + numpy.
It is invoked by the svg-studio Host plugin through a file-based CLI, so the
same engine serves the Web UI, the agent tool, and manual use.
"""
from __future__ import annotations

import argparse
import colorsys
import json
import math
import os
import sys
import time
from collections import defaultdict
from typing import Iterable

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = 40_000_000


# ---------------------------------------------------------------------------
# Basic geometry / contour tracing
# ---------------------------------------------------------------------------


def shift(mask: np.ndarray, dy: int, dx: int) -> np.ndarray:
    out = np.zeros_like(mask, dtype=bool)
    h, w = mask.shape
    ys, yd = (slice(0, h - dy), slice(dy, h)) if dy >= 0 else (slice(-dy, h), slice(0, h + dy))
    xs, xd = (slice(0, w - dx), slice(dx, w)) if dx >= 0 else (slice(-dx, w), slice(0, w + dx))
    out[yd, xd] = mask[ys, xs]
    return out


def label_components(mask: np.ndarray) -> tuple[np.ndarray, int]:
    """4-connected component labels, implemented locally (no scipy needed)."""
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=np.int32)
    count = 0
    ys, xs = np.nonzero(mask)
    for sy, sx in zip(ys.tolist(), xs.tolist()):
        if labels[sy, sx]:
            continue
        count += 1
        labels[sy, sx] = count
        stack = [(sy, sx)]
        while stack:
            y, x = stack.pop()
            if y > 0 and mask[y - 1, x] and labels[y - 1, x] == 0:
                labels[y - 1, x] = count
                stack.append((y - 1, x))
            if y + 1 < h and mask[y + 1, x] and labels[y + 1, x] == 0:
                labels[y + 1, x] = count
                stack.append((y + 1, x))
            if x > 0 and mask[y, x - 1] and labels[y, x - 1] == 0:
                labels[y, x - 1] = count
                stack.append((y, x - 1))
            if x + 1 < w and mask[y, x + 1] and labels[y, x + 1] == 0:
                labels[y, x + 1] = count
                stack.append((y, x + 1))
    return labels, count


def turn_rank(prev: tuple[int, int], cur: tuple[int, int], nxt: tuple[int, int]) -> int:
    """Boundary-walk preference: right, straight, left, back."""
    dirs = {(1, 0): 0, (0, 1): 1, (-1, 0): 2, (0, -1): 3}
    d = dirs[(cur[0] - prev[0], cur[1] - prev[1])]
    e = dirs[(nxt[0] - cur[0], nxt[1] - cur[1])]
    order = {0: (1, 0, 3, 2), 1: (2, 1, 0, 3), 2: (3, 2, 1, 0), 3: (0, 3, 2, 1)}[d]
    return order.index(e)


def compress_collinear(points: list[tuple[int, int]]) -> list[tuple[int, int]]:
    if len(points) < 3:
        return points
    out = [points[0]]
    last_dir = None
    for a, b in zip(points, points[1:]):
        d = (b[0] - a[0], b[1] - a[1])
        if last_dir is None:
            out.append(b)
            last_dir = d
        elif d == last_dir:
            out[-1] = b
        else:
            out.append(b)
            last_dir = d
    while len(out) > 2 and out[-1] == out[0]:
        out.pop()
    if len(out) > 2:
        a, b, c = out[-2], out[-1], out[0]
        d1 = (b[0] - a[0], b[1] - a[1])
        d2 = (c[0] - b[0], c[1] - b[1])
        if d1 == d2:
            out.pop()
    return out


def trace_mask(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    """Trace every directed boundary loop of one binary mask.

    Components are traced separately so walks cannot jump between regions that
    touch diagonally.  Interior holes come out as reverse loops and the SVG
    path later uses fill-rule=evenodd.
    """
    h, w = mask.shape
    labels, ncomp = label_components(mask)
    if ncomp == 0:
        return []
    above = shift(mask, 1, 0)
    below = shift(mask, -1, 0)
    left = shift(mask, 0, 1)
    right = shift(mask, 0, -1)
    stride = w + 1
    edges: dict[int, list[tuple[int, int]]] = defaultdict(list)

    def add_edges(select: np.ndarray, starts, ends):
        if not select.any():
            return
        ys, xs = np.nonzero(select)
        labs = labels[ys, xs]
        for sx, sy, ex, ey, lab in zip(
            starts[0].tolist(), starts[1].tolist(),
            ends[0].tolist(), ends[1].tolist(), labs.tolist()
        ):
            edges[int(lab)].append((int(sy) * stride + int(sx), int(ey) * stride + int(ex)))

    coords = np.nonzero(mask & ~above)
    add_edges(mask & ~above, (coords[1], coords[0]), (coords[1] + 1, coords[0]))
    coords = np.nonzero(mask & ~right)
    add_edges(mask & ~right, (coords[1] + 1, coords[0]), (coords[1] + 1, coords[0] + 1))
    coords = np.nonzero(mask & ~below)
    add_edges(mask & ~below, (coords[1] + 1, coords[0] + 1), (coords[1], coords[0] + 1))
    coords = np.nonzero(mask & ~left)
    add_edges(mask & ~left, (coords[1], coords[0] + 1), (coords[1], coords[0]))

    used: set[tuple[int, int]] = set()
    loops: list[list[tuple[int, int]]] = []
    for lab, lab_edges in edges.items():
        out_edges: dict[int, list[int]] = defaultdict(list)
        for a, b in lab_edges:
            out_edges[a].append(b)
        for start_key in list(out_edges.keys()):
            for first_key in list(out_edges[start_key]):
                if (start_key, first_key) in used:
                    continue
                start_xy = (start_key % stride, start_key // stride)
                next_key = first_key
                prev_xy = None
                pts: list[tuple[int, int]] = [start_xy]
                used.add((start_key, next_key))
                closed = False
                while True:
                    next_xy = (next_key % stride, next_key // stride)
                    pts.append(next_xy)
                    if next_key == start_key:
                        closed = True
                        break
                    candidates = [e for e in out_edges.get(next_key, []) if (next_key, e) not in used]
                    if not candidates:
                        break
                    if prev_xy is None:
                        prev_xy = start_xy
                    ranked = []
                    for cand in candidates:
                        cand_xy = (cand % stride, cand // stride)
                        ranked.append((turn_rank(prev_xy, next_xy, cand_xy), cand))
                    ranked.sort(key=lambda t: t[0])
                    choice = ranked[0][1]
                    used.add((next_key, choice))
                    prev_xy = next_xy
                    next_key = choice
                if closed:
                    pts.pop()
                loops.append(compress_collinear(pts))
    return loops


def signed_area(pts: list[tuple[int, int]]) -> float:
    s = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
        s += x1 * y2 - x2 * y1
    return s / 2.0


def fmt(v: float) -> str:
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return s if s not in ("-0", "") else "0"


def _rdp(points: list[tuple[int, int]], eps: float) -> list[tuple[int, int]]:
    """Iterative Ramer–Douglas–Peucker simplification for an open polyline."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    sqeps = eps * eps
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        ax, ay = points[i]
        bx, by = points[j]
        vx, vy = bx - ax, by - ay
        vv = vx * vx + vy * vy
        best_d = -1.0
        best_k = -1
        for k in range(i + 1, j):
            px, py = points[k]
            wx, wy = px - ax, py - ay
            if vv <= 1e-12:
                d = wx * wx + wy * wy
            else:
                t = max(0.0, min(1.0, (wx * vx + wy * vy) / vv))
                dx, dy = wx - t * vx, wy - t * vy
                d = dx * dx + dy * dy
            if d > best_d:
                best_d, best_k = d, k
        if best_d > sqeps:
            keep[best_k] = True
            stack.append((i, best_k))
            stack.append((best_k, j))
    return [p for p, k in zip(points, keep) if k]


def simplify_closed(points: list[tuple[int, int]], eps: float) -> list[tuple[int, int]]:
    """Simplify a closed pixel contour while preserving its ring topology."""
    if eps <= 0 or len(points) < 5:
        return points
    p0 = points[0]
    far = max(range(len(points)), key=lambda i: (points[i][0] - p0[0]) ** 2 + (points[i][1] - p0[1]) ** 2)
    first = _rdp(points[: far + 1], eps)
    second = _rdp(points[far:] + [points[0]], eps)
    merged = first[:-1] + second[:-1]
    return merged if len(merged) >= 3 else points


def poly_path(points: Iterable[tuple[float, float]]) -> str:
    pts = list(points)
    if not pts:
        return ""
    bits = [f"M{fmt(pts[0][0])} {fmt(pts[0][1])}"]
    for x, y in pts[1:]:
        bits.append(f"L{fmt(x)} {fmt(y)}")
    bits.append("Z")
    return "".join(bits)


# ---------------------------------------------------------------------------
# Colour helpers
# ---------------------------------------------------------------------------


def rgb_hex(rgb: tuple[int, int, int]) -> str:
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"


def rgb_dist(a, b) -> float:
    return math.sqrt(sum((float(x) - float(y)) ** 2 for x, y in zip(a, b)))


def boost_color(rgb: tuple[int, int, int], sat: float, contrast: float) -> tuple[int, int, int]:
    r, g, b = (v / 255.0 for v in rgb)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    s = min(1.0, max(0.0, s * sat))
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    vals = []
    for c in (r, g, b):
        v = (c * 255.0 - 128.0) * contrast + 128.0
        vals.append(int(round(max(0.0, min(255.0, v)))))
    return tuple(vals)


def hls_rgb(h: float, l: float, s: float) -> tuple[int, int, int]:
    r, g, b = colorsys.hls_to_rgb(h % 1.0, max(0.0, min(1.0, l)), max(0.0, min(1.0, s)))
    return tuple(int(round(max(0.0, min(255.0, c * 255.0)))) for c in (r, g, b))


def xml_escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def odd_size(value: int) -> int:
    value = max(1, int(value))
    return value if value % 2 == 1 else value + 1


# ---------------------------------------------------------------------------
# Background + figure analysis
# ---------------------------------------------------------------------------


def image_border_color(arr: np.ndarray) -> tuple[tuple[int, int, int], bool]:
    """Estimate the background colour and whether the border is visually flat."""
    h, w = arr.shape[:2]
    inset = max(2, min(10, min(h, w) // 30))
    band = max(2, min(12, min(h, w) // 18))
    strips = []
    y0, y1 = min(inset, h - 1), min(inset + band, h)
    x0, x1 = min(inset, w - 1), min(inset + band, w)
    strips.append(arr[y0:y1, :, :].reshape(-1, 3))
    strips.append(arr[max(0, h - inset - band):max(1, h - inset), :, :].reshape(-1, 3))
    strips.append(arr[:, x0:x1, :].reshape(-1, 3))
    strips.append(arr[:, max(0, w - inset - band):max(1, w - inset), :].reshape(-1, 3))
    pixels = np.concatenate(strips, axis=0)
    med = np.median(pixels, axis=0)
    d = np.sqrt(((pixels - med) ** 2).sum(axis=1))
    flat = bool(np.percentile(d, 92) < 34.0 and np.percentile(d, 70) < 18.0)
    return tuple(int(round(v)) for v in med.tolist()), flat


def derive_background(bg: tuple[int, int, int]):
    h, l, s = colorsys.rgb_to_hls(*(v / 255.0 for v in bg))
    bg_light = hls_rgb(h, min(1.0, l * 1.045), min(1.0, s * 1.02))
    bg_dark = hls_rgb(h, max(0.06, l * 0.94), min(1.0, s * 0.98))
    # A halo is an accent for a coloured/dark backdrop.  A white or neutral
    # backdrop must not get a dark invented ring (the common WebP case).
    use_halo = bool(l <= 0.80 and s >= 0.08)
    if use_halo:
        # The poster's halo is an analogous, darker and bluer accent.
        halo_h = (h - 0.065) % 1.0
        halo_l = max(0.08, min(0.32, l * 0.56))
        halo_s = min(1.0, s * 1.38)
        halo = hls_rgb(halo_h, halo_l, halo_s)
        halo_light = hls_rgb(halo_h, min(0.36, halo_l * 1.10), halo_s)
        halo_dark = hls_rgb(halo_h, max(0.06, halo_l * 0.86), min(1.0, halo_s * 1.04))
        outline = hls_rgb(halo_h, 0.095, min(0.5, s * 0.58))
    else:
        halo = bg
        halo_light = bg_light
        halo_dark = bg_dark
        outline = (31, 22, 28)
    return {
        "bg": bg,
        "bg_light": bg_light,
        "bg_dark": bg_dark,
        "halo": halo,
        "halo_light": halo_light,
        "halo_dark": halo_dark,
        "outline": outline,
        "use_halo": use_halo,
    }


def build_figure_mask(
    arr: np.ndarray,
    bg_color: tuple[int, int, int],
    halo_color: tuple[int, int, int],
    *,
    bg_thr: float = 34.0,
    halo_thr: float = 30.0,
    dilate: int = 2,
    fill_holes: str = "all",
    hole_limit: int = 900,
    use_halo: bool = True,
) -> np.ndarray:
    """Foreground figure.

    With a real halo, both background families are removed and holes are handled
    by size.  With a plain white/neutral backdrop only the background component
    connected to the image border is removed — this preserves near-white skin,
    highlights and dress panels instead of punching them out of the figure.
    """
    pix = arr.astype(np.float32)
    bg = np.array(bg_color, dtype=np.float32)
    bg_like = np.sqrt(((pix - bg) ** 2).sum(axis=2)) <= bg_thr
    if use_halo:
        halo = np.array(halo_color, dtype=np.float32)
        halo_like = np.sqrt(((pix - halo) ** 2).sum(axis=2)) <= halo_thr
        fg = ~(bg_like | halo_like)
        # Ignore a thin capture frame at the canvas edge.
        fg[:3, :] = False
        fg[-3:, :] = False
        fg[:, :3] = False
        fg[:, -3:] = False
        labels, n = label_components(fg)
        if n == 0:
            return np.zeros(fg.shape, dtype=bool)
        counts = np.bincount(labels.ravel(), minlength=n + 1)
        keep = counts >= 3
        keep[0] = False
        fg = keep[labels]
        # Background islands: distinguish small pinholes from real gaps.
        bg_labels, bn = label_components(~fg)
        if bn > 0:
            border_labels = np.unique(np.concatenate([
                bg_labels[0, :], bg_labels[-1, :], bg_labels[:, 0], bg_labels[:, -1]
            ]))
            border_labels = border_labels[border_labels != 0]
            outside = np.isin(bg_labels, border_labels)
            holes = (~fg) & (~outside)
            if fill_holes == "all":
                fg = fg | holes
            elif fill_holes == "small":
                hole_counts = np.bincount(bg_labels[holes].ravel(), minlength=bn + 1)
                keep_hole = hole_counts <= hole_limit
                keep_hole[0] = False
                fg = fg | (holes & keep_hole[bg_labels])
    else:
        # Outer background is the border-connected part of the sampled colour.
        bg_labels, bn = label_components(bg_like)
        if bn > 0:
            border_labels = np.unique(np.concatenate([
                bg_labels[0, :], bg_labels[-1, :], bg_labels[:, 0], bg_labels[:, -1]
            ]))
            border_labels = border_labels[border_labels != 0]
            if border_labels.size == 0:
                counts = np.bincount(bg_labels.ravel(), minlength=bn + 1)
                counts[0] = 0
                border_labels = np.array([int(np.argmax(counts))], dtype=np.int32)
            outer = np.isin(bg_labels, border_labels)
        else:
            outer = np.zeros(bg_like.shape, dtype=bool)
        fg = ~outer
        # Trim non-background capture-frame colours at the outer rim.
        fg[:2, :] = False
        fg[-2:, :] = False
        fg[:, :2] = False
        fg[:, -2:] = False
        labels, n = label_components(fg)
        if n == 0:
            return np.zeros(fg.shape, dtype=bool)
        counts = np.bincount(labels.ravel(), minlength=n + 1)
        keep = counts >= 3
        keep[0] = False
        fg = keep[labels]
    if dilate > 0:
        im = Image.fromarray((fg * 255).astype(np.uint8), "L")
        im = im.filter(ImageFilter.MaxFilter(dilate * 2 + 1))
        fg = np.asarray(im) > 127
    return fg


def main_component_mask(mask: np.ndarray) -> tuple[np.ndarray, tuple[int, int, int, int] | None]:
    labels, n = label_components(mask)
    if n == 0:
        return np.zeros_like(mask, dtype=bool), None
    counts = np.bincount(labels.ravel(), minlength=n + 1)
    counts[0] = 0
    main = int(np.argmax(counts))
    main_mask = labels == main
    ys, xs = np.nonzero(main_mask)
    if ys.size == 0:
        return main_mask, None
    return main_mask, (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def skin_fraction(crop: np.ndarray) -> float:
    r = crop[:, :, 0].astype(np.int16)
    g = crop[:, :, 1].astype(np.int16)
    b = crop[:, :, 2].astype(np.int16)
    skin = (r > 135) & (g > 78) & (b > 55) & (r > g) & (r - b > 10) & (g > b - 18)
    return float(skin.mean())


# ---------------------------------------------------------------------------
# Palette + vector layers
# ---------------------------------------------------------------------------


def quantize_palette(im: Image.Image, colors: int) -> tuple[np.ndarray, list[dict]]:
    q = im.quantize(
        colors=max(8, min(256, int(colors))),
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    arr = np.asarray(q)
    packed = (
        (arr[:, :, 0].astype(np.uint32) << 16)
        | (arr[:, :, 1].astype(np.uint32) << 8)
        | arr[:, :, 2].astype(np.uint32)
    )
    vals, counts = np.unique(packed, return_counts=True)
    palette = []
    for v, c in sorted(zip(vals.tolist(), counts.tolist()), key=lambda t: -t[1]):
        rgb = ((v >> 16) & 255, (v >> 8) & 255, v & 255)
        palette.append({"rgb": rgb, "hex": rgb_hex(rgb), "count": int(c)})
    return arr, palette


def trace_colours(
    arr: np.ndarray,
    palette: list[dict],
    trace_region: np.ndarray | None,
    sat: float,
    contrast: float,
    simplify_eps: float = 0.0,
) -> list[dict]:
    """Trace each palette colour into one even-odd path group."""
    groups = []
    for c in palette:
        r, g, b = c["rgb"]
        mask = (arr[:, :, 0] == r) & (arr[:, :, 1] == g) & (arr[:, :, 2] == b)
        if trace_region is not None:
            mask &= trace_region
        count = int(mask.sum())
        if count < 1:
            continue
        loops = trace_mask(mask)
        if simplify_eps > 0:
            loops = [simplify_closed(loop, simplify_eps) for loop in loops if len(loop) >= 3]
        d = "".join(poly_path(loop) for loop in loops if len(loop) >= 3)
        if not d:
            continue
        disp = boost_color(c["rgb"], sat, contrast)
        groups.append(
            {
                "rgb": c["rgb"],
                "display": disp,
                "hex": c["hex"],
                "display_hex": rgb_hex(disp),
                "count": count,
                "d": d,
                "loops": loops,
            }
        )
    # Big masses first, then details. Dark line-work and pale highlights on top.
    def priority(item):
        r, g, b = item["rgb"]
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        is_line = lum < 55
        is_highlight = lum > 225 and (max(r, g, b) - min(r, g, b)) < 80
        return (1 if is_highlight else 2 if is_line else 0, -item["count"])

    groups.sort(key=priority)
    return groups


def build_face_layer(
    im: Image.Image,
    bbox: tuple[int, int, int, int] | None,
    *,
    face_colors: int,
    median_size: int,
    sat: float,
    contrast: float,
    simplify_eps: float = 0.0,
) -> dict | None:
    w, h = im.size
    if bbox is None:
        return None
    x0, y0, x1, y1 = bbox
    bw, bh = x1 - x0, y1 - y0
    if bw < 12 or bh < 12:
        return None
    fw = max(64, min(int(round(bw * 0.42)), int(w * 0.62)))
    fh = max(56, min(int(round(bh * 0.22)), int(h * 0.32)))
    cx = x0 + bw * 0.5
    cy = y0 + bh * 0.405
    fx0 = max(0, int(round(cx - fw / 2)))
    fy0 = max(0, int(round(cy - fh / 2)))
    fx1 = min(w, fx0 + fw)
    fy1 = min(h, fy0 + fh)
    if fx1 - fx0 < 32 or fy1 - fy0 < 32:
        return None
    crop = im.crop((fx0, fy0, fx1, fy1))
    if skin_fraction(np.asarray(crop)) < 0.11:
        return None
    crop_image = crop.filter(ImageFilter.MedianFilter(odd_size(median_size))) if median_size > 1 else crop
    arr, palette = quantize_palette(crop_image, face_colors)
    face_groups = trace_colours(arr, palette, None, sat, contrast, 0.0)
    # Face coordinates are translated into the full canvas.
    paths = []
    for item in face_groups:
        shifted = "".join(
            poly_path([(x + fx0, y + fy0) for x, y in loop]) for loop in item["loops"]
        )
        if shifted:
            paths.append({**item, "d": shifted})
    if not paths:
        return None
    return {
        "x0": fx0,
        "y0": fy0,
        "x1": fx1,
        "y1": fy1,
        "cx": fx0 + (fx1 - fx0) / 2.0,
        "cy": fy0 + (fy1 - fy0) / 2.0,
        "rx": max(16.0, (fx1 - fx0) * 0.417),
        "ry": max(14.0, (fy1 - fy0) * 0.417),
        "paths": paths,
        "colors": len(paths),
    }


# ---------------------------------------------------------------------------
# Main renderer
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Convert a raster image into a layered SVG vector recreation.")
    p.add_argument("--src", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--colors", type=int, default=160)
    p.add_argument("--face-detail", action="store_true", default=True)
    p.add_argument("--no-face", action="store_true")
    p.add_argument("--face-colors", type=int, default=48)
    p.add_argument("--face-median", type=int, default=3)
    p.add_argument("--outline", action="store_true", default=False)
    p.add_argument("--no-outline", action="store_true")
    p.add_argument("--halo", action="store_true", default=False)
    p.add_argument("--outline-width", type=float, default=0.0)
    p.add_argument("--outline-color", default="")
    p.add_argument("--stroke", type=float, default=0.0)
    p.add_argument("--saturate", type=float, default=1.07)
    p.add_argument("--contrast", type=float, default=1.02)
    p.add_argument("--background", choices=("auto", "gradient", "original"), default="auto")
    p.add_argument("--no-preclip", action="store_true")
    p.add_argument("--max-edge", type=int, default=1200)
    p.add_argument("--title", default="")
    p.add_argument("--desc", default="")
    return p.parse_args()


def normalize_image(im: Image.Image, max_edge: int) -> tuple[Image.Image, int, int]:
    source_w, source_h = im.size
    limit = max(240, min(2400, int(max_edge)))
    if max(source_w, source_h) <= limit:
        return im, source_w, source_h
    copy = im.copy()
    copy.thumbnail((limit, limit), Image.Resampling.LANCZOS)
    return copy, source_w, source_h


def main() -> None:
    args = parse_args()
    if args.no_face:
        args.face_detail = False
    if args.no_outline:
        args.outline = False
    t0 = time.perf_counter()
    im = Image.open(args.src).convert("RGB")
    im, source_w, source_h = normalize_image(im, args.max_edge)
    w, h = im.size
    if w < 8 or h < 8:
        raise ValueError("image is too small; need at least 8x8 pixels")
    work_scale = max(w, h) / 559.0
    simplify_eps = max(0.35, min(1.1, 0.45 * work_scale))
    arr = np.asarray(im)
    bg_color, flat_border = image_border_color(arr)
    derived = derive_background(bg_color)
    # A clean gradient replaces the source backdrop; it does not invent a halo.
    # The optional --halo flag exists for an explicitly requested stylisation.
    derived["use_halo"] = bool(args.halo and derived["use_halo"])
    bg_mode = args.background
    if bg_mode == "auto":
        bg_mode = "gradient" if flat_border else "original"

    figure = None
    solid = None
    main_bbox = None
    main_mask = None
    if bg_mode == "gradient" or args.outline or args.face_detail:
        solid = build_figure_mask(
            arr, derived["bg"], derived["halo"], dilate=2, fill_holes="all",
            use_halo=derived["use_halo"],
        )
        main_mask, main_bbox = main_component_mask(solid)
        figure = build_figure_mask(
            arr,
            derived["bg"],
            derived["halo"],
            dilate=2,
            fill_holes="small",
            hole_limit=max(120, int(w * h * 0.002)),
            use_halo=derived["use_halo"],
        )
        # A tiny or near-full "figure" means the silhouette is not useful.
        if figure.mean() < 0.03 or figure.mean() > 0.985:
            if bg_mode == "gradient":
                bg_mode = "original"
            figure = None
            solid = None
            main_mask = None
            main_bbox = None

    clip_d = ""
    if bg_mode == "gradient" and figure is not None:
        clip_loops = trace_mask(figure)
        clip_loops = [simplify_closed(loop, min(0.9, simplify_eps)) for loop in clip_loops if len(loop) >= 3]
        clip_d = "".join(poly_path(loop) for loop in clip_loops)

    preclip = figure if (bg_mode == "gradient" and not args.no_preclip) else None
    q_arr, palette = quantize_palette(im, args.colors)
    groups = trace_colours(q_arr, palette, preclip, args.saturate, args.contrast, simplify_eps)
    if not groups:
        raise RuntimeError("palette tracing produced no usable regions")

    scale = max(0.6, min(1.8, w / 559.0))
    stroke = args.stroke if args.stroke > 0 else max(0.4, 0.65 * scale)
    outline_width = args.outline_width if args.outline_width > 0 else max(1.4, min(4.5, 2.2 * scale))
    outline_color = args.outline_color or rgb_hex(derived["outline"])

    face = None
    if args.face_detail:
        face = build_face_layer(
            im,
            main_bbox,
            face_colors=args.face_colors,
            median_size=args.face_median,
            sat=args.saturate,
            contrast=args.contrast,
            simplify_eps=simplify_eps,
        )

    # Halo geometry follows the main figure.
    if main_bbox is not None:
        bx0, by0, bx1, by1 = main_bbox
        bw, bh = bx1 - bx0, by1 - by0
        halo_cx = (bx0 + bx1) / 2.0
        halo_cy = by0 + bh * 0.47
        halo_rx = max(24.0, bw * 0.475)
        halo_ry = max(24.0, bh * 0.42)
    else:
        halo_cx, halo_cy = w / 2.0, h * 0.48
        halo_rx, halo_ry = w * 0.46, h * 0.38

    title = args.title.strip() or "SVG 矢量复刻"
    desc = args.desc.strip() or "由 svg-studio 生成的纯矢量复刻图像，无嵌入位图。"

    parts: list[str] = []
    parts.append('<?xml version="1.0" encoding="UTF-8"?>\n')
    parts.append("<!-- svg-studio vector engine: no raster image is embedded. -->\n")
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc">\n'
    )
    parts.append(f'  <title id="title">{xml_escape(title)}</title>\n')
    parts.append(f'  <desc id="desc">{xml_escape(desc)}</desc>\n')
    parts.append("  <defs>\n")
    if bg_mode == "gradient":
        parts.append(
            '    <radialGradient id="bgGrad" cx="50%" cy="44%" r="78%">\n'
            f'      <stop offset="0" stop-color="{rgb_hex(derived["bg_light"])}"/>\n'
            f'      <stop offset="0.62" stop-color="{rgb_hex(derived["bg"])}"/>\n'
            f'      <stop offset="1" stop-color="{rgb_hex(derived["bg_dark"])}"/>\n'
            "    </radialGradient>\n"
        )
        if derived["use_halo"]:
            parts.append(
                '    <radialGradient id="haloGrad" cx="50%" cy="45%" r="58%">\n'
                f'      <stop offset="0" stop-color="{rgb_hex(derived["halo_light"])}"/>\n'
                f'      <stop offset="0.58" stop-color="{rgb_hex(derived["halo"])}"/>\n'
                f'      <stop offset="1" stop-color="{rgb_hex(derived["halo_dark"])}"/>\n'
                "    </radialGradient>\n"
            )
        if clip_d:
            parts.append(
                '    <clipPath id="figureClip" clipPathUnits="userSpaceOnUse">\n'
                f'      <path d="{clip_d}" fill-rule="evenodd"/>\n'
                "    </clipPath>\n"
            )
    if face is not None:
        parts.append(
            '    <radialGradient id="faceFade" cx="50%" cy="50%" r="50%">\n'
            '      <stop offset="0" stop-color="#ffffff"/>\n'
            '      <stop offset="0.68" stop-color="#ffffff"/>\n'
            '      <stop offset="0.86" stop-color="#ffffff" stop-opacity="0.9"/>\n'
            '      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>\n'
            "    </radialGradient>\n"
            f'    <mask id="faceMask" maskUnits="userSpaceOnUse" x="0" y="0" width="{w}" height="{h}">\n'
            f'      <ellipse cx="{fmt(face["cx"])}" cy="{fmt(face["cy"])}" rx="{fmt(face["rx"])}" ry="{fmt(face["ry"])}" fill="url(#faceFade)"/>\n'
            "    </mask>\n"
        )
    parts.append("  </defs>\n")
    if bg_mode == "gradient":
        parts.append(f'  <rect width="{w}" height="{h}" fill="url(#bgGrad)"/>\n')
        if derived["use_halo"]:
            parts.append(
                f'  <ellipse cx="{fmt(halo_cx)}" cy="{fmt(halo_cy)}" rx="{fmt(halo_rx)}" ry="{fmt(halo_ry)}" fill="url(#haloGrad)"/>\n'
            )
    parts.append(
        f'  <g id="illustration" shape-rendering="geometricPrecision" stroke-linejoin="round" '
        f'stroke-linecap="round" stroke-width="{fmt(stroke)}"'
        + (' clip-path="url(#figureClip)"' if clip_d else "")
        + ">\n"
    )
    for gi, item in enumerate(groups):
        parts.append(
            f'    <path id="c{gi:02d}-{item["hex"][1:]}" d="{item["d"]}" fill="{item["display_hex"]}" '
            f'fill-rule="evenodd" stroke="{item["display_hex"]}"/>\n'
        )
    if face is not None:
        parts.append(f'    <g id="face-detail" mask="url(#faceMask)" stroke-width="{fmt(stroke * 0.85)}">\n')
        for fi, item in enumerate(face["paths"]):
            parts.append(
                f'      <path id="face-{fi:02d}" d="{item["d"]}" fill="{item["display_hex"]}" '
                f'fill-rule="evenodd" stroke="{item["display_hex"]}"/>\n'
            )
        parts.append("    </g>\n")
    parts.append("  </g>\n")

    outline_d = ""
    if args.outline and main_mask is not None:
        outline_loops = trace_mask(main_mask)
        outline_loops = [simplify_closed(loop, min(0.9, simplify_eps)) for loop in outline_loops if len(loop) >= 3]
        outline_d = "".join(poly_path(loop) for loop in outline_loops)
        if outline_d:
            parts.append(
                f'  <path id="outer-outline" d="{outline_d}" fill="none" stroke="{outline_color}" '
                f'stroke-width="{fmt(outline_width)}" stroke-linejoin="round" stroke-linecap="round"/>\n'
            )
    parts.append("</svg>\n")
    svg = "".join(parts)

    # Structural quality gate: parseable, pure paths/references, no raster.
    from xml.etree import ElementTree as ET

    root = ET.fromstring(svg)
    image_tags = [el for el in root.iter() if el.tag.endswith("image")]
    if image_tags:
        raise RuntimeError("refusing to emit an SVG that contains raster images")
    path_count = sum(1 for el in root.iter() if el.tag.endswith("path"))
    if path_count < 2:
        raise RuntimeError("vector output contains too few paths")
    if "data:image" in svg or "base64," in svg:
        raise RuntimeError("refusing to emit embedded raster data")

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(svg)
    elapsed_ms = int(round((time.perf_counter() - t0) * 1000))
    output_bytes = os.path.getsize(args.out)
    warnings = []
    if output_bytes > 10 * 1024 * 1024:
        warnings.append('SVG 文件较大，可尝试 clean 预设、降低色块数量或关闭面部细化。')
    if max(source_w, source_h) > max(w, h):
        warnings.append(f'源图已等比缩小到 {w}×{h} 以保证速度与文件体积。')
    result = {
        "ok": True,
        "output": os.path.abspath(args.out),
        "width": w,
        "height": h,
        "source_width": source_w,
        "source_height": source_h,
        "background": bg_mode,
        "halo": derived["use_halo"],
        "colors_requested": args.colors,
        "colors_used": len(groups),
        "paths": path_count,
        "face_detail": face is not None,
        "outline": bool(outline_d),
        "bytes": output_bytes,
        "elapsed_ms": elapsed_ms,
        "prompt": desc,
        "warnings": warnings,
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - CLI boundary must surface a stable message
        import traceback

        traceback.print_exc()
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        sys.exit(1)
