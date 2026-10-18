/**
 * SVG Studio — Host half.
 *
 * Copyright (c) 2026 xiangwriter. All rights reserved.
 * Personal, non-commercial use only. Commercial licensing: see COMMERCIAL.md.
 *
 * Registers:
 *  - the reusable `svg-vector-recreation` agent skill;
 *  - the `svg_studio` agent tool;
 *  - a local HTTP surface used by the Web UI: health, generate, file serving.
 *
 * The actual vectorization engine is a self-contained Python file next to this
 * module.  The Host only validates requests, invokes the engine, and serves the
 * resulting pure-SVG files.  No raster data enters the SVG.
 */
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_DIR = path.dirname(fileURLToPath(import.meta.url));
const ENGINE_PATH = path.join(PLUGIN_DIR, 'engine', 'svg_engine.py');
const SKILL_PATH = path.join(PLUGIN_DIR, 'skill.md');
const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
const OUTPUT_DIR = path.join(DSH_HOME, 'svg-studio', 'outputs');
const UPLOAD_DIR = path.join(DSH_HOME, 'svg-studio', 'uploads');
const MAX_UPLOAD_BYTES = 26 * 1024 * 1024;
const MAX_BODY_BYTES = 38 * 1024 * 1024;
const ENGINE_TIMEOUT_MS = 240_000;
const MAX_OUTPUTS = 40;

/** Skill body is authored as markdown on disk so it stays readable and testable. */
const SKILL_CONTENT = fs.readFileSync(SKILL_PATH, 'utf8');

const PRESETS = {
  faithful: {
    colors: 160,
    faceDetail: true,
    faceColors: 48,
    outline: false,
    background: 'gradient',
    saturation: 1.07,
    contrast: 1.02,
  },
  clean: {
    colors: 112,
    faceDetail: true,
    faceColors: 48,
    outline: false,
    background: 'gradient',
    saturation: 1.06,
    contrast: 1.015,
  },
  flat: {
    colors: 72,
    faceDetail: false,
    faceColors: 40,
    outline: false,
    background: 'gradient',
    saturation: 1.04,
    contrast: 1.0,
  },
  original: {
    colors: 140,
    faceDetail: true,
    faceColors: 48,
    outline: false,
    background: 'original',
    saturation: 1.05,
    contrast: 1.01,
  },
  mini: {
    colors: 64,
    faceDetail: false,
    faceColors: 32,
    outline: false,
    background: 'gradient',
    saturation: 1.03,
    contrast: 1.0,
  },
};

let pythonCache = null;
let busy = false;

function clamp(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function bool(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function analysePrompt(prompt) {
  const text = String(prompt ?? '').toLowerCase();
  const hints = {};
  const notes = [];
  if (/(小文件|更小|轻量|压缩|compact|smaller|under\s*\d+\s*mb|网页用)/i.test(text)) {
    Object.assign(hints, { colors: 96, faceDetail: false });
    notes.push('compact palette');
  }
  if (/(更精细|更多细节|细节|清晰|高清|精致|faithful|detailed|sharp|眼睛|脸部细腻)/i.test(text)) {
    Object.assign(hints, { colors: 176, faceDetail: true, faceColors: 64 });
    notes.push('high-detail palette + face pass');
  }
  if (/(扁平|flat|少色块|fewer colors|海报色块)/i.test(text)) {
    Object.assign(hints, { colors: 72, faceDetail: false });
    notes.push('flat-colour look');
  }
  if (/(不要描边|无描边|去描边|不要外轮廓|无外轮廓|去掉外轮廓|no outline|without outline|no stroke)/i.test(text)) {
    hints.outline = false;
    notes.push('outline off');
  } else if (/(外描边|加描边|描边|outline|sticker|贴纸|外轮廓)/i.test(text)) {
    hints.outline = true;
    notes.push('outline on');
  }
  if (/(保留原背景|原背景|不要换背景|别换背景|完整场景|keep.*background|original background|scene)/i.test(text)) {
    hints.background = 'original';
    notes.push('keep original background');
  } else if (/(渐变背景|光晕|halo|gradient|干净背景|clean background)/i.test(text)) {
    hints.background = 'gradient';
    notes.push('clean gradient backdrop');
  }
  if (/(鲜艳|高饱和|vivid|saturat|pop|浓郁)/i.test(text)) {
    hints.saturation = 1.13;
    hints.contrast = 1.035;
    notes.push('vivid colour');
  } else if (/(柔和|低饱和|soft|pastel|muted|清淡)/i.test(text)) {
    hints.saturation = 0.97;
    hints.contrast = 1.0;
    notes.push('soft colour');
  }
  return { hints, notes };
}

function resolveSettings(raw = {}, prompt = '') {
  const presetName = Object.hasOwn(PRESETS, raw.preset) ? raw.preset : 'faithful';
  const base = { ...PRESETS[presetName] };
  const { hints, notes } = analysePrompt(prompt);
  for (const [key, value] of Object.entries(hints)) {
    if (!Object.hasOwn(raw, key)) base[key] = value;
  }
  if (raw.preset === 'original' && !Object.hasOwn(raw, 'background')) base.background = 'original';

  const colors = clamp(raw.colors, 24, 224, base.colors);
  const faceColors = clamp(raw.faceColors, 24, 96, base.faceColors);
  const saturation = clamp(raw.saturation, 0.8, 1.3, base.saturation);
  const contrast = clamp(raw.contrast, 0.9, 1.12, base.contrast);
  const background = ['auto', 'gradient', 'original'].includes(raw.background)
    ? raw.background
    : base.background;
  return {
    preset: presetName,
    colors,
    faceDetail: bool(raw.face_detail, base.faceDetail),
    faceColors,
    outline: bool(raw.outline, base.outline),
    background,
    saturation,
    contrast,
    notes,
  };
}

function isLoopback(address) {
  if (!address) return true;
  const a = String(address);
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}

function safeBaseName(name, fallback = 'vector') {
  const raw = String(name ?? '').replace(/\.[a-z0-9]+$/i, '');
  const ascii = raw
    .normalize('NFKD')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return ascii || fallback;
}

async function ensureDirs() {
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });
}

function candidatePythons() {
  const out = [];
  for (const key of ['DSH_SVG_STUDIO_PYTHON', 'DSH_PYTHON']) {
    if (process.env[key]) out.push(process.env[key]);
  }
  out.push('python', 'python3');
  try {
    const runtimes = path.join(DSH_HOME, 'dsh-runtimes');
    if (fs.existsSync(runtimes)) {
      for (const name of fs.readdirSync(runtimes)) {
        const base = path.join(runtimes, name, 'dependencies', 'python');
        out.push(path.join(base, 'python.exe'));
        out.push(path.join(base, 'bin', 'python3'));
        out.push(path.join(base, 'bin', 'python'));
      }
    }
  } catch {
    /* best-effort discovery only */
  }
  const seen = new Set();
  return out.filter((value) => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

async function resolvePython() {
  if (pythonCache) return pythonCache;
  const probe = 'import sys, PIL, numpy; print(f"{sys.version.split()[0]}|{PIL.__version__}|{numpy.__version__}")';
  for (const command of candidatePythons()) {
    try {
      const result = spawnSync(command, ['-c', probe], {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 8_000,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      });
      if (result.status === 0 && typeof result.stdout === 'string' && result.stdout.includes('|')) {
        pythonCache = { command, version: result.stdout.trim() };
        return pythonCache;
      }
    } catch {
      /* try the next interpreter */
    }
  }
  throw new Error(
    '未找到带 Pillow + numpy 的 Python。可以为插件配置 DSH_SVG_STUDIO_PYTHON，或安装 python 依赖后重试。',
  );
}

function engineArgs({ src, out, settings, title, desc }) {
  const args = [
    ENGINE_PATH,
    '--src', src,
    '--out', out,
    '--colors', String(settings.colors),
    '--face-colors', String(settings.faceColors),
    '--face-median', '3',
    '--saturate', String(settings.saturation),
    '--contrast', String(settings.contrast),
    '--background', settings.background,
    '--title', title,
    '--desc', desc,
  ];
  args.push(settings.faceDetail ? '--face-detail' : '--no-face');
  args.push(settings.outline ? '--outline' : '--no-outline');
  return args;
}

function runEngine({ src, out, settings, title, desc, signal }) {
  return new Promise((resolve, reject) => {
    resolvePython()
      .then(({ command }) => {
        const child = spawn(command, engineArgs({ src, out, settings, title, desc }), {
          cwd: PLUGIN_DIR,
          windowsHide: true,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        let settled = false;
        let killedByTimeout = false;
        const timer = setTimeout(() => {
          killedByTimeout = true;
          child.kill();
        }, ENGINE_TIMEOUT_MS);
        const cleanup = () => {
          clearTimeout(timer);
          signal?.removeEventListener?.('abort', onAbort);
        };
        const finish = (fn, value) => {
          if (settled) return;
          settled = true;
          cleanup();
          fn(value);
        };
        const onAbort = () => {
          child.kill();
          finish(reject, new Error('矢量生成已取消'));
        };
        signal?.addEventListener?.('abort', onAbort, { once: true });
        if (signal?.aborted) {
          onAbort();
          return;
        }
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', (chunk) => {
          stdout += chunk;
          if (stdout.length > 2_000_000) stdout = stdout.slice(-2_000_000);
        });
        child.stderr.on('data', (chunk) => {
          stderr += chunk;
          if (stderr.length > 500_000) stderr = stderr.slice(-500_000);
        });
        child.on('error', (error) => finish(reject, error));
        child.on('close', (code) => {
          if (killedByTimeout) {
            finish(reject, new Error(`矢量引擎运行超过 ${ENGINE_TIMEOUT_MS / 1000}s`));
            return;
          }
          let payload = null;
          const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
          for (let i = lines.length - 1; i >= 0; i -= 1) {
            try {
              const parsed = JSON.parse(lines[i]);
              if (parsed && typeof parsed === 'object') {
                payload = parsed;
                break;
              }
            } catch {
              /* keep looking for the engine's JSON line */
            }
          }
          if (code !== 0 || payload?.ok !== true) {
            const detail = stderr.trim().split(/\r?\n/).slice(-6).join('\n');
            const message = payload?.error || detail || `矢量引擎退出码 ${code}`;
            finish(reject, new Error(message));
            return;
          }
          finish(resolve, payload);
        });
      })
      .catch(reject);
  });
}

async function pruneOutputs() {
  try {
    const entries = await fsp.readdir(OUTPUT_DIR);
    const svgs = [];
    for (const name of entries) {
      if (!name.endsWith('.svg')) continue;
      const full = path.join(OUTPUT_DIR, name);
      const stat = await fsp.stat(full);
      svgs.push({ full, mtime: stat.mtimeMs });
    }
    svgs.sort((a, b) => b.mtime - a.mtime);
    for (const old of svgs.slice(MAX_OUTPUTS)) {
      await fsp.rm(old.full, { force: true }).catch(() => {});
    }
  } catch {
    /* cleanup is opportunistic */
  }
}

async function generateFromFile({
  imagePath,
  prompt,
  settings,
  outputPath,
  signal,
  title,
  desc,
}) {
  await ensureDirs();
  const raw = await fsp.readFile(imagePath).catch(() => null);
  if (!raw) throw new Error(`找不到图片文件：${imagePath}`);
  const ext = path.extname(imagePath) || '.png';
  if (!/\.(png|jpe?g|webp|gif)$/i.test(ext)) throw new Error('仅支持 PNG / JPEG / WebP / GIF 图片');
  const stem = safeBaseName(path.basename(imagePath));
  const out = outputPath || path.join(
    OUTPUT_DIR,
    `${stem}-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}.svg`,
  );
  await fsp.mkdir(path.dirname(out), { recursive: true });
  const started = Date.now();
  const summary = await runEngine({
    src: imagePath,
    out,
    settings,
    title: title || `${stem} · SVG 矢量复刻`,
    desc,
    signal,
  });
  summary.elapsed_ms = summary.elapsed_ms ?? (Date.now() - started);
  summary.path = out;
  if (!outputPath) {
    const name = path.basename(out);
    summary.url = `/svg-studio/file?name=${encodeURIComponent(name)}`;
  }
  return summary;
}

function decodeDataUrl(value) {
  if (typeof value !== 'string') throw new Error('缺少图片数据');
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([\s\S]+)$/i.exec(value);
  if (!match) throw new Error('图片格式必须是 PNG / JPEG / WebP / GIF 的 base64 data URL');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0) throw new Error('图片内容为空');
  if (bytes.length > MAX_UPLOAD_BYTES) throw new Error('图片超过 26 MB 限制');
  const mime = match[1].toLowerCase();
  const ext = mime === 'image/jpeg' ? '.jpg' : mime === 'image/webp' ? '.webp' : mime === 'image/gif' ? '.gif' : '.png';
  return { bytes, mime, ext };
}

async function readJsonBody(req) {
  return await new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('请求体超过大小限制'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(text || '{}'));
      } catch {
        reject(new Error('请求不是有效 JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, value) {
  if (res.writableEnded) return;
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, status, text) {
  if (res.writableEnded) return;
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}

function createRouteHandler(ctx) {
  return async function route(req, res) {
    const remote = req.socket?.remoteAddress;
    if (!isLoopback(remote)) {
      sendJson(res, 403, { ok: false, error: 'SVG Studio API is local-only' });
      return;
    }
    let parsed;
    try {
      parsed = new URL(req.url || '/', 'http://svg-studio.local');
    } catch {
      sendJson(res, 400, { ok: false, error: 'bad URL' });
      return;
    }
    const pathname = parsed.pathname;

    if (pathname === '/svg-studio/api/health' && req.method === 'GET') {
      try {
        const py = await resolvePython();
        sendJson(res, 200, {
          ok: true,
          engine: fs.existsSync(ENGINE_PATH),
          python: py.version,
          maxUploadBytes: MAX_UPLOAD_BYTES,
        });
      } catch (error) {
        sendJson(res, 503, { ok: false, error: error?.message || String(error) });
      }
      return;
    }

    if (pathname === '/svg-studio/api/generate' && req.method === 'POST') {
      if (busy) {
        sendJson(res, 429, { ok: false, error: '已有矢量化任务在运行，请稍候。' });
        return;
      }
      busy = true;
      let tempPath = null;
      let outputPath = null;
      try {
        await ensureDirs();
        const body = await readJsonBody(req);
        const decoded = decodeDataUrl(body.image);
        const filename = String(body.filename || 'image').slice(0, 180);
        const stem = safeBaseName(filename);
        const settings = resolveSettings(body.settings || {}, body.prompt || '');
        const prompt = String(body.prompt || '').slice(0, 4_000);
        const descParts = [
          prompt || '由 svg-studio 转换的高质量纯矢量图像。',
          settings.notes.length ? `风格提示：${settings.notes.join('；')}` : '',
        ].filter(Boolean);
        tempPath = path.join(UPLOAD_DIR, `${randomUUID()}${decoded.ext}`);
        await fsp.writeFile(tempPath, decoded.bytes);
        const outName = `${stem}-${Date.now().toString(36)}.svg`;
        outputPath = path.join(OUTPUT_DIR, outName);
        const ac = new AbortController();
        const onClose = () => {
          if (!res.writableEnded) ac.abort();
        };
        res.on('close', onClose);
        let summary;
        try {
          summary = await generateFromFile({
            imagePath: tempPath,
            prompt,
            settings,
            outputPath,
            signal: ac.signal,
            title: `${stem} · SVG 矢量复刻`,
            desc: descParts.join('\n'),
          });
        } finally {
          res.removeListener?.('close', onClose);
        }
        summary.prompt = prompt;
        summary.settings = settings;
        summary.url = `/svg-studio/file?name=${encodeURIComponent(path.basename(outputPath))}`;
        summary.filename = `${stem}.svg`;
        await pruneOutputs();
        sendJson(res, 200, summary);
      } catch (error) {
        if (outputPath) await fsp.rm(outputPath, { force: true }).catch(() => {});
        if (!res.writableEnded) sendJson(res, 500, { ok: false, error: error?.message || String(error) });
      } finally {
        if (tempPath) await fsp.rm(tempPath, { force: true }).catch(() => {});
        busy = false;
      }
      return;
    }

    if (pathname === '/svg-studio/file' && req.method === 'GET') {
      const name = parsed.searchParams.get('name') || '';
      if (!/^[A-Za-z0-9._-]+\.svg$/.test(name)) {
        sendText(res, 400, 'invalid filename');
        return;
      }
      const full = path.join(OUTPUT_DIR, name);
      try {
        const data = await fsp.readFile(full);
        res.writeHead(200, {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Length': data.length,
        });
        res.end(data);
      } catch {
        sendText(res, 404, 'not found');
      }
      return;
    }

    sendJson(res, 404, { ok: false, error: 'not found' });
  };
}

function makeTool(ctx) {
  return {
    name: 'svg_studio',
    description:
      'Convert a local raster illustration/image into a high-quality pure SVG vector recreation. ' +
      'Runs the optimized pipeline: adaptive palette quantization, layered contour tracing, figure clip, ' +
      'local face-detail palette, clean backdrop, optional outline, and structural validation. ' +
      'Supports a free-form style prompt and preset/overrides. Returns the saved SVG path and a summary; ' +
      'never embeds raster data.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['image_path'],
      properties: {
        image_path: {
          type: 'string',
          description: 'Local path to the source image (absolute preferred). PNG/JPEG/WebP/GIF.',
        },
        prompt: {
          type: 'string',
          description:
            'The user’s own style ideas and constraints, e.g. “保留酒红背景，脸部更清晰，整体更鲜艳，文件小一点”.',
        },
        preset: {
          type: 'string',
          enum: ['faithful', 'clean', 'flat', 'original', 'mini'],
          description:
            'faithful=160 colours + face detail + clean gradient; clean=112; flat=72; original=keep source background; mini=64/no face/outline.',
        },
        colors: {
          type: 'integer',
          minimum: 24,
          maximum: 224,
          description: 'Palette size override. Higher preserves more gradients and increases file size.',
        },
        face_detail: {
          type: 'boolean',
          description: 'Enable/disable the local face-detail overlay (only applied when a face region is detected).',
        },
        outline: {
          type: 'boolean',
          description: 'Optional outer rim around the figure. Off by default; enable only when a sticker-like edge is wanted.',
        },
        saturation: {
          type: 'number',
          minimum: 0.8,
          maximum: 1.3,
          description: 'Optional saturation multiplier, e.g. 1.13 for a vivid look or 0.97 for soft pastel.',
        },
        background: {
          type: 'string',
          enum: ['auto', 'gradient', 'original'],
          description:
            'auto lets the engine decide from the border; gradient builds a clean backdrop without inventing a halo; original traces the source backdrop.',
        },
        output_path: {
          type: 'string',
          description: 'Optional SVG output path. Relative paths resolve against the session working directory.',
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: true,
        required: ['ok', 'path', 'width', 'height', 'paths', 'bytes'],
        properties: {
          ok: { type: 'boolean' },
          path: { type: 'string' },
          url: { type: 'string' },
          width: { type: 'integer' },
          height: { type: 'integer' },
          source_width: { type: 'integer' },
          source_height: { type: 'integer' },
          paths: { type: 'integer' },
          bytes: { type: 'integer' },
          colors_used: { type: 'integer' },
          background: { type: 'string' },
          face_detail: { type: 'boolean' },
          outline: { type: 'boolean' },
          elapsed_ms: { type: 'integer' },
          warnings: { type: 'array', items: { type: 'string' } },
          prompt: { type: 'string' },
          settings: { type: 'object', additionalProperties: true },
          error: { type: 'string' },
        },
      },
      render: (_args, value) => [
        {
          type: 'text',
          text:
            `SVG generated: ${value.path}\n` +
            `${value.width}×${value.height}, ${value.paths} paths, ${(value.bytes / 1024 / 1024).toFixed(2)} MB, ` +
            `${value.elapsed_ms ?? '?'} ms\n` +
            `background=${value.background}; face=${value.face_detail ? 'on' : 'off'}; outline=${value.outline ? 'on' : 'off'}\n` +
            `settings=${JSON.stringify(value.settings ?? {})}` +
            (Array.isArray(value.warnings) && value.warnings.length > 0
              ? `\nwarnings:\n${value.warnings.join('\n')}`
              : ''),
        },
      ],
    },
    timeoutMs: ENGINE_TIMEOUT_MS + 20_000,
    isConcurrencySafe: () => false,
    async execute(args, exec) {      const imagePath = String(args.image_path || '');
      if (!imagePath) throw new Error('image_path is required');
      let cwd = process.cwd();
      try {
        const wd = ctx.get('workingDirectory');
        if (wd && exec.agent?.session) cwd = wd.get(exec.agent.session);
      } catch {
        /* fallback to process cwd */
      }
      const src = path.isAbsolute(imagePath) ? imagePath : path.resolve(cwd, imagePath);
      const raw = args;
      const settings = resolveSettings(raw, args.prompt || '');
      let outputPath = null;
      if (args.output_path) {
        outputPath = path.isAbsolute(args.output_path)
          ? args.output_path
          : path.resolve(cwd, args.output_path);
        if (!outputPath.toLowerCase().endsWith('.svg')) outputPath += '.svg';
      }
      const stem = safeBaseName(path.basename(src));
      const desc = [
        String(args.prompt || '由 svg_studio 工具生成的纯矢量复刻图像。').slice(0, 4000),
        settings.notes.length ? `风格提示：${settings.notes.join('；')}` : '',
      ].filter(Boolean).join('\n');
      const result = await generateFromFile({
        imagePath: src,
        prompt: args.prompt || '',
        settings,
        outputPath,
        signal: exec.signal,
        title: `${stem} · SVG 矢量复刻`,
        desc,
      });
      return { ...result, settings, prompt: args.prompt || '' };
    },
  };
}

export const inject = ['webServer', 'skills', 'tools'];

export function apply(ctx) {
  ctx.effect(() => ctx.skills.register({
    name: 'svg-vector-recreation',
    description:
      'Turn a raster illustration into a high-quality pure SVG vector recreation with an adaptive engine, local face detail, a clean backdrop and optional outline. By xiangwriter.',
    whenToUse:
      'Use when the user asks to convert/vectorize/trace/recreate an image as SVG, make a scalable poster or sticker from character art, or use the SVG Studio page/tool.',
    source: 'plugin',
    invocation: { modelInvocable: true, userInvocable: true },
    content: SKILL_CONTENT,
    resourceBase: {
      kind: 'opaque',
      description: 'The svg-studio Host plugin bundles engine/svg_engine.py and the svg_studio tool; the interactive page is the sidebar entry “SVG Studio”.',
    },
    metadata: { plugin: 'dsh-xiangwriter-svg-studio', tool: 'svg_studio' },
  }), 'svg-studio: register skill');

  ctx.effect(() => ctx.tools.register(makeTool(ctx)), 'svg-studio: register tool');

  const routeHandler = createRouteHandler(ctx);
  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: '/svg-studio/api/health', handler: routeHandler }),
    'svg-studio: health route',
  );
  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: '/svg-studio/api/generate', handler: routeHandler }),
    'svg-studio: generate route',
  );
  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: '/svg-studio/file', handler: routeHandler }),
    'svg-studio: file route',
  );

  ctx.logger?.info?.('SVG Studio ready: skill, tool, and local HTTP surface registered.');
}
