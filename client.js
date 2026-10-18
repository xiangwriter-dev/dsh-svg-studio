/*! SVG Studio · dsh-xiangwriter-svg-studio
 * Copyright (c) 2026 xiangwriter. All rights reserved.
 * Personal, non-commercial use only. Commercial licensing: see COMMERCIAL.md.
 */
window.__ModuleLoader__.load({
  id: 'dsh-xiangwriter-svg-studio',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'svg-studio';

    const DICTS = {
      en: {
        'nav.label': 'SVG Studio',
        title: 'SVG Studio',
        subtitle: 'Turn a raster illustration into a true, scalable SVG. Add your own style notes in the box.',
        'status.checking': 'Checking engine',
        'status.ready': 'Local engine ready',
        'status.error': 'Engine unavailable',
        'status.retry': 'Retry',
        'section.source': 'Source image',
        'drop.title': 'Drop an image here',
        'drop.hint': 'or click to browse · PNG / JPG / WebP / GIF',
        'drop.replace': 'Click to replace',
        'drop.limit': 'Images longer than 1200 px are scaled down safely for speed and file size.',
        'prompt.label': 'Your ideas and direction',
        'prompt.placeholder': 'e.g. Keep the wine-red backdrop, make the outline clean, keep more detail in the face and eyes, and make the colours a little more vivid.',
        'prompt.hint': 'The prompt guides presets and palette choices; it is also stored in the SVG description.',
        'preset.label': 'Style preset',
        'preset.faithful': 'Faithful',
        'preset.faithful.desc': '160 colours · face detail · clean gradient. Best overall resemblance.',
        'preset.clean': 'Clean',
        'preset.clean.desc': '112 colours · face detail · clean background. Smaller, flatter and cleaner.',
        'preset.flat': 'Flat',
        'preset.flat.desc': '72 colours · no face pass · clean background. Bold poster-like colour masses.',
        'preset.original': 'Keep background',
        'preset.original.desc': '140 colours · face detail · keeps the source backdrop instead of building a clean one.',
        'advanced.title': 'Advanced settings',
        'advanced.colors': 'Colour count',
        'advanced.colorsHint': 'More colours preserve gradients and detail; fewer colours make a lighter, flatter file.',
        'advanced.face': 'Face detail pass',
        'advanced.faceHint': 'A local palette and soft mask refine the face without changing the rest.',
        'advanced.outline': 'Outer contour',
        'advanced.outlineHint': 'Optional dark rim around the whole figure. Off by default.',
        'advanced.background': 'Backdrop',
        'advanced.backgroundPreset': 'Preset default',
        'advanced.backgroundAuto': 'Auto detect',
        'advanced.backgroundGradient': 'Clean gradient',
        'advanced.backgroundOriginal': 'Original background',
        'advanced.reset': 'Reset overrides',
        'advanced.overridden': 'Custom overrides',
        generate: 'Generate SVG',
        generating: 'Generating vector image',
        cancel: 'Cancel',
        'stage.0': 'Analysing colour families',
        'stage.1': 'Finding the figure silhouette',
        'stage.2': 'Tracing colour regions',
        'stage.3': 'Refining face detail',
        'stage.4': 'Validating the SVG',
        'output.title': 'Vector preview',
        'output.empty': 'Your SVG preview appears here',
        'output.emptyHint': 'The result is pure vector paths and gradients. No embedded bitmap.',
        'result.dimensions': 'Dimensions',
        'result.paths': 'Paths',
        'result.size': 'File size',
        'result.time': 'Engine time',
        'result.download': 'Download SVG',
        'result.copy': 'Copy SVG code',
        'result.copied': 'Copied',
        'result.open': 'Open preview',
        'result.pathLabel': 'Saved at',
        'result.faceOn': 'Face detail on',
        'result.faceOff': 'Face detail off',
        'result.outlineOn': 'Outline on',
        'result.outlineOff': 'Outline off',
        'result.background': 'Backdrop',
        'error.read': 'Could not read this image.',
        'error.fileType': 'Please choose a PNG, JPG, WebP or GIF image.',
        'error.fileSize': 'This image is too large after normalisation. Try a smaller file.',
        'error.cancelled': 'Generation cancelled.',
        'error.generic': 'Generation failed.',
        'error.health': 'The local Python engine is not reachable. Check Python with Pillow and numpy installed, then retry.',
        footer: 'Local processing · pure vector output · no raster image embedded.',
        'footer.license': 'Personal, non-commercial use only · commercial licensing: xiangwriter.',
        'image.normalised': 'Normalised to {w}×{h}',
        'image.original': 'Original {w}×{h}',
        'limit.hint': 'Up to 26 MB · PNG / JPG / WebP / GIF',
      },
      zh: {
        'nav.label': 'SVG 矢量化',
        title: 'SVG 矢量化工作室',
        subtitle: '把人物插画、立绘或贴纸变成可无限放大的纯 SVG。除了图片，也可以写下你的风格想法。',
        'status.checking': '正在检查引擎',
        'status.ready': '本地引擎就绪',
        'status.error': '引擎不可用',
        'status.retry': '重试',
        'section.source': '输入图片',
        'drop.title': '拖入图片，或点击选择',
        'drop.hint': '支持 PNG / JPG / WebP / GIF',
        'drop.replace': '点击更换图片',
        'drop.limit': '长边超过 1200px 会自动等比缩放，以控制生成时间和文件体积。',
        'prompt.label': '你的想法与建议',
        'prompt.placeholder': '例如：保留原图的酒红背景，轮廓干净一点，脸部细节更清晰，整体颜色再鲜艳一点，文件不要太大。',
        'prompt.hint': '这些描述会用于选择预设与参数，并写入 SVG 的说明信息。',
        'preset.label': '风格预设',
        'preset.faithful': '忠实复刻',
        'preset.faithful.desc': '160 色 · 面部细化 · 干净渐变背景。整体最接近原图。',
        'preset.clean': '干净矢量',
        'preset.clean.desc': '112 色 · 面部细化 · 干净背景。更轻、更平、更干净。',
        'preset.flat': '扁平海报',
        'preset.flat.desc': '72 色 · 不做面部细化 · 干净背景。适合做色块感强的海报。',
        'preset.original': '保留原背景',
        'preset.original.desc': '140 色 · 面部细化 · 保留原图背景，适合完整场景或不想换背景的图。',
        'advanced.title': '高级设置',
        'advanced.colors': '色块数量',
        'advanced.colorsHint': '越多越能保留渐变和细节；越少文件越轻、风格越平。',
        'advanced.face': '面部细化',
        'advanced.faceHint': '用局部调色板和柔边遮罩单独细化脸和眼睛，其余部分不变。',
        'advanced.outline': '外轮廓',
        'advanced.outlineHint': '可选：在人物外围加一圈深色边，默认关闭。',
        'advanced.background': '背景',
        'advanced.backgroundPreset': '跟随预设',
        'advanced.backgroundAuto': '自动判断',
        'advanced.backgroundGradient': '干净渐变',
        'advanced.backgroundOriginal': '保留原背景',
        'advanced.reset': '恢复预设',
        'advanced.overridden': '已自定义',
        generate: '生成 SVG',
        generating: '正在生成矢量图',
        cancel: '取消',
        'stage.0': '分析画面色彩',
        'stage.1': '提取角色剪影',
        'stage.2': '描摹色块轮廓',
        'stage.3': '细化面部细节',
        'stage.4': '检查 SVG 结构',
        'output.title': '矢量预览',
        'output.empty': 'SVG 预览会显示在这里',
        'output.emptyHint': '结果是纯路径、渐变和遮罩，不包含嵌入位图。',
        'result.dimensions': '尺寸',
        'result.paths': '路径数',
        'result.size': '文件大小',
        'result.time': '引擎耗时',
        'result.download': '下载 SVG',
        'result.copy': '复制 SVG 代码',
        'result.copied': '已复制',
        'result.open': '新窗口预览',
        'result.pathLabel': '已保存到',
        'result.faceOn': '面部细化开',
        'result.faceOff': '面部细化关',
        'result.outlineOn': '外轮廓开',
        'result.outlineOff': '外轮廓关',
        'result.background': '背景',
        'error.read': '无法读取这张图片。',
        'error.fileType': '请选择 PNG / JPG / WebP / GIF 图片。',
        'error.fileSize': '图片规范化后仍然太大，请换一张更小的图片。',
        'error.cancelled': '已取消生成。',
        'error.generic': '生成失败。',
        'error.health': '本地 Python 引擎不可用。请确认 Python 已安装 Pillow 与 numpy，然后重试。',
        footer: '本地处理 · 纯矢量输出 · 不嵌入位图。',
        'footer.license': '仅供个人非商业使用 · 商用授权请联系 xiangwriter。',
        'image.normalised': '已缩放为 {w}×{h}',
        'image.original': '原始尺寸 {w}×{h}',
        'limit.hint': '单张最大 26 MB · PNG / JPG / WebP / GIF',
      },
      'zh-CN': {},
    };
    DICTS['zh-CN'] = DICTS.zh;
    DICTS['en-US'] = DICTS.en;

    const PRESET_KEYS = ['faithful', 'clean', 'flat', 'original'];
    const PRESET_DEFAULTS = {
      faithful: { colors: 160, face: true, outline: false, background: 'gradient' },
      clean: { colors: 112, face: true, outline: false, background: 'gradient' },
      flat: { colors: 72, face: false, outline: false, background: 'gradient' },
      original: { colors: 140, face: true, outline: false, background: 'original' },
    };
    const STAGE_COUNT = 5;

    function useTranslate(ctx) {
      const [, force] = React.useReducer((x) => x + 1, 0);
      React.useEffect(() => ctx.locale.subscribe(force), [ctx]);
      const tr = ctx.locale.bind(NS);
      return React.useCallback((key) => {
        const value = tr(key);
        return typeof value === 'string' ? value : key;
      }, [tr, force]);
    }

    function formatBytes(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) return '—';
      if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
      return `${bytes} B`;
    }

    function formatTime(ms) {
      if (!Number.isFinite(ms)) return '—';
      if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
      return `${Math.round(ms)} ms`;
    }

    function buttonClass(primary) {
      return primary ? 'svgst-btn svgst-btnPrimary' : 'svgst-btn';
    }

    function Glyph({ children, size = 18, viewBox = '0 0 24 24' }) {
      return h('svg', {
        width: size, height: size, viewBox, fill: 'none', stroke: 'currentColor',
        strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, className: 'svgst-glyph',
      }, children);
    }

    function IconSparkle({ size = 18 }) {
      return h(Glyph, { size }, h('path', { d: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z' }),
        h('path', { d: 'M19 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z' }));
    }
    function IconUpload({ size = 20 }) {
      return h(Glyph, { size }, h('path', { d: 'M12 16V4' }), h('path', { d: 'm7 9 5-5 5 5' }),
        h('path', { d: 'M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3' }));
    }
    function IconPhoto({ size = 18 }) {
      return h(Glyph, { size }, h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 2.5 }),
        h('circle', { cx: 8.5, cy: 9.5, r: 1.6 }), h('path', { d: 'm4 17 4.5-4.5L13 17l3-3 3 3' }));
    }
    function IconDownload({ size = 18 }) {
      return h(Glyph, { size }, h('path', { d: 'M12 4v11' }), h('path', { d: 'm7 11 5 5 5-5' }),
        h('path', { d: 'M5 19h14' }));
    }
    function IconCopy({ size = 18 }) {
      return h(Glyph, { size }, h('rect', { x: 9, y: 9, width: 10, height: 11, rx: 2 }),
        h('path', { d: 'M7 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2' }));
    }
    function IconOpen({ size = 18 }) {
      return h(Glyph, { size }, h('path', { d: 'M14 4h6v6' }), h('path', { d: 'M20 4 11 13' }),
        h('path', { d: 'M19 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5' }));
    }
    function IconSliders({ size = 16 }) {
      return h(Glyph, { size }, h('path', { d: 'M4 7h10' }), h('path', { d: 'M18 7h2' }),
        h('circle', { cx: 16, cy: 7, r: 2 }), h('path', { d: 'M4 17h2' }), h('path', { d: 'M10 17h10' }),
        h('circle', { cx: 8, cy: 17, r: 2 }));
    }
    function IconAlert({ size = 18 }) {
      return h(Glyph, { size }, h('path', { d: 'M12 4 3.5 19h17L12 4Z' }), h('path', { d: 'M12 9v4.5' }),
        h('circle', { cx: 12, cy: 16.7, r: 0.8, fill: 'currentColor', stroke: 'none' }));
    }
    function IconCheck({ size = 18 }) {
      return h(Glyph, { size }, h('path', { d: 'm5 12 4.2 4.2L19 6.5' }));
    }
    function IconVector({ size = 24 }) {
      return h(Glyph, { size }, h('rect', { x: 4, y: 4, width: 16, height: 16, rx: 3 }),
        h('circle', { cx: 8, cy: 8, r: 1.2, fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: 16, cy: 16, r: 1.2, fill: 'currentColor', stroke: 'none' }),
        h('path', { d: 'M9 8.5h4.5A2.5 2.5 0 0 1 16 11v4.3' }),
        h('path', { d: 'M8 9v4.5A2.5 2.5 0 0 0 10.5 16H15' }));
    }

    function StudioIcon({ size = 20, active = false }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, style: { opacity: active ? 1 : 0.9 },
      },
        h('path', { d: 'M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7L12 3Z' }),
        h('path', { d: 'M6.5 15.5 8 19l-1.5 3.5L5 19l-1.5-1.5L5 16l1.5-.5Z' }),
        h('path', { d: 'M17.8 15.2l1 2.3 2.2 1-2.2 1-1 2.3-1-2.3-2.1-1 2.1-1 1-2.3Z' })
      );
    }

    function XiangwriterMark({ size = 12 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, focusable: 'false',
      },
        h('path', {
          d: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z',
          fill: 'currentColor', opacity: 0.95,
        }),
        h('circle', { cx: 19, cy: 19, r: 1.6, fill: '#ffcf8b' })
      );
    }

    async function readSourceFile(file, t) {
      if (!file) throw new Error(t('error.fileType'));
      if (!/^image\/(png|jpeg|webp|gif)$/i.test(file.type || '')) throw new Error(t('error.fileType'));
      if (file.size > 26 * 1024 * 1024) throw new Error(t('error.fileSize'));
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error(t('error.read')));
        reader.readAsDataURL(file);
      });
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error(t('error.read')));
        el.src = dataUrl;
      });
      const max = 1200;
      const originalWidth = img.naturalWidth || img.width;
      const originalHeight = img.naturalHeight || img.height;
      const scale = Math.min(1, max / Math.max(originalWidth, originalHeight));
      const width = Math.max(1, Math.round(originalWidth * scale));
      const height = Math.max(1, Math.round(originalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const c2d = canvas.getContext('2d');
      c2d.fillStyle = '#ffffff';
      c2d.fillRect(0, 0, width, height);
      c2d.imageSmoothingEnabled = true;
      c2d.imageSmoothingQuality = 'high';
      c2d.drawImage(img, 0, 0, width, height);
      const mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      const outUrl = canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.92 : undefined);
      if (outUrl.length * 0.75 > 26 * 1024 * 1024) throw new Error(t('error.fileSize'));
      return {
        dataUrl: outUrl,
        name: file.name || 'image',
        width,
        height,
        originalWidth,
        originalHeight,
        resized: scale < 1,
      };
    }

    function createStudioPage(ctx) {
      return function StudioPage() {
        const t = useTranslate(ctx);
        const [image, setImage] = React.useState(null);
        const [dragging, setDragging] = React.useState(false);
        const [prompt, setPrompt] = React.useState('');
        const [preset, setPreset] = React.useState('faithful');
        const [overrides, setOverrides] = React.useState({});
        const [advancedOpen, setAdvancedOpen] = React.useState(false);
        const [busy, setBusy] = React.useState(false);
        const [stage, setStage] = React.useState(0);
        const [result, setResult] = React.useState(null);
        const [error, setError] = React.useState('');
        const [health, setHealth] = React.useState({ status: 'checking' });
        const [copied, setCopied] = React.useState(false);
        const fileRef = React.useRef(null);
        const abortRef = React.useRef(null);
        const copyTimer = React.useRef(null);

        const presetDefaults = PRESET_DEFAULTS[preset];
        const effectiveColors = overrides.colors ?? presetDefaults.colors;
        const effectiveFace = overrides.face_detail ?? presetDefaults.face;
        const effectiveOutline = overrides.outline ?? presetDefaults.outline;
        const effectiveBackground = overrides.background ?? 'preset';

        React.useEffect(() => {
          const c = new AbortController();
          let live = true;
          setHealth({ status: 'checking' });
          fetch('/svg-studio/api/health', { signal: c.signal })
            .then(async (res) => {
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data.ok) throw new Error(data.error || t('status.error'));
              if (live) setHealth({ status: 'ok', python: data.python, engine: data.engine });
            })
            .catch((err) => {
              if (!live || err?.name === 'AbortError') return;
              setHealth({ status: 'error', message: err?.message || t('error.health') });
            });
          return () => {
            live = false;
            c.abort();
          };
        }, []);

        React.useEffect(() => {
          if (!busy) return;
          setStage(0);
          const id = setInterval(() => setStage((s) => (s + 1) % STAGE_COUNT), 3200);
          return () => clearInterval(id);
        }, [busy]);

        React.useEffect(() => () => {
          abortRef.current?.abort();
          if (copyTimer.current) clearTimeout(copyTimer.current);
        }, []);

        function acceptImage(file) {
          if (!file) return;
          setError('');
          readSourceFile(file, t)
            .then((next) => {
              setImage(next);
              setResult(null);
            })
            .catch((err) => setError(err?.message || t('error.read')));
        }

        function onFileChange(event) {
          const file = event.target.files?.[0];
          event.target.value = '';
          acceptImage(file);
        }

        function onDrop(event) {
          event.preventDefault();
          event.stopPropagation();
          setDragging(false);
          const file = event.dataTransfer?.files?.[0];
          acceptImage(file);
        }

        function updateOverride(key, value) {
          setOverrides((current) => {
            const next = { ...current };
            if (value === undefined || value === 'preset') delete next[key];
            else next[key] = value;
            return next;
          });
        }

        function changePreset(next) {
          setPreset(next);
          setOverrides({});
        }

        async function generate() {
          if (!image || busy || health.status === 'error') return;
          setBusy(true);
          setError('');
          setCopied(false);
          setResult(null);
          const c = new AbortController();
          abortRef.current = c;
          const rawSettings = { preset };
          if (overrides.colors !== undefined) rawSettings.colors = overrides.colors;
          if (overrides.face_detail !== undefined) rawSettings.face_detail = overrides.face_detail;
          if (overrides.outline !== undefined) rawSettings.outline = overrides.outline;
          if (overrides.background !== undefined) rawSettings.background = overrides.background;
          try {
            const res = await fetch('/svg-studio/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: c.signal,
              body: JSON.stringify({
                image: image.dataUrl,
                filename: image.name,
                prompt,
                settings: rawSettings,
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) throw new Error(data.error || t('error.generic'));
            setResult(data);
            setHealth((current) => (current.status === 'ok' ? current : { status: 'ok' }));
          } catch (err) {
            if (err?.name === 'AbortError') setError(t('error.cancelled'));
            else setError(err?.message || t('error.generic'));
          } finally {
            abortRef.current = null;
            setBusy(false);
          }
        }

        function cancel() {
          abortRef.current?.abort();
        }

        function download() {
          if (!result) return;
          const a = document.createElement('a');
          a.href = result.url;
          a.download = result.filename || 'vector.svg';
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }

        function openPreview() {
          if (!result) return;
          window.open(result.url, '_blank', 'noopener,noreferrer');
        }

        async function copySvg() {
          if (!result) return;
          try {
            const res = await fetch(result.url);
            const text = await res.text();
            await navigator.clipboard.writeText(text);
            setCopied(true);
            if (copyTimer.current) clearTimeout(copyTimer.current);
            copyTimer.current = setTimeout(() => setCopied(false), 1800);
          } catch {
            setError(t('error.generic'));
          }
        }

        function onPromptKeyDown(event) {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            generate();
          }
        }

        const retryHealth = () => {
          setHealth({ status: 'checking' });
          fetch('/svg-studio/api/health')
            .then(async (res) => {
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data.ok) throw new Error(data.error || t('status.error'));
              setHealth({ status: 'ok', python: data.python, engine: data.engine });
            })
            .catch((err) => setHealth({ status: 'error', message: err?.message || t('error.health') }));
        };

        const healthTone = health.status === 'ok' ? 'ok' : health.status === 'error' ? 'bad' : 'checking';
        const statusLabel = health.status === 'ok'
          ? t('status.ready')
          : health.status === 'error' ? t('status.error') : t('status.checking');

        const stageLabels = Array.from({ length: STAGE_COUNT }, (_, i) => t('stage.' + i));

        return h('section', { className: 'svgst-page', 'aria-busy': busy },
          h('style', null, CSS),
          h('header', { className: 'svgst-header' },
            h('div', { className: 'svgst-brand' },
              h('div', { className: 'svgst-brandMark' }, h(StudioIcon, { size: 26, active: true })),
              h('div', null,
                h('h1', { className: 'svgst-title' }, t('title')),
                h('p', { className: 'svgst-subtitle' }, t('subtitle')),
                h('div', { className: 'svgst-byline' },
                  h(XiangwriterMark, { size: 12 }),
                  h('span', null, 'xiangwriter')
                )
              )
            ),
            h('div', { className: 'svgst-headerRight' },
              h('span', { className: `svgst-status svgst-status-${healthTone}`, title: health.python || health.message || '' },
                h('span', { className: 'svgst-dot' }),
                statusLabel
              ),
              health.status === 'error' && h('button', {
                type: 'button', className: 'svgst-link', onClick: retryHealth,
              }, t('status.retry'))
            )
          ),

          h('div', { className: 'svgst-grid' },
            h('div', { className: 'svgst-card svgst-inputCard' },
              h('div', { className: 'svgst-cardHead' },
                h('h2', null, t('section.source')),
                h('span', { className: 'svgst-kicker' }, h(IconPhoto, { size: 14 }), t('limit.hint'))
              ),
              h('div', {
                className: `svgst-drop ${dragging ? 'is-dragging' : ''} ${image ? 'has-image' : ''}`,
                role: 'button',
                tabIndex: 0,
                'aria-label': t('drop.title'),
                onClick: () => fileRef.current?.click(),
                onKeyDown: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileRef.current?.click();
                  }
                },
                onDragEnter: (e) => { e.preventDefault(); setDragging(true); },
                onDragOver: (e) => { e.preventDefault(); setDragging(true); },
                onDragLeave: (e) => {
                  if (e.currentTarget === e.target) setDragging(false);
                },
                onDrop,
              },
                h('input', {
                  ref: fileRef, type: 'file', className: 'svgst-fileInput',
                  accept: 'image/png,image/jpeg,image/webp,image/gif',
                  onChange: onFileChange,
                  onClick: (e) => e.stopPropagation(),
                }),
                image
                  ? h('div', { className: 'svgst-sourcePreview' },
                    h('img', { src: image.dataUrl, alt: image.name }),
                    h('div', { className: 'svgst-replace' }, h(IconUpload, { size: 15 }), t('drop.replace')))
                  : h('div', { className: 'svgst-emptyDrop' },
                    h('div', { className: 'svgst-uploadBadge' }, h(IconUpload, { size: 24 })),
                    h('strong', null, t('drop.title')),
                    h('span', null, t('drop.hint'))
                  )
              ),
              image && h('div', { className: 'svgst-fileMeta' },
                h('span', { className: 'svgst-fileName', title: image.name }, image.name),
                h('span', { className: 'svgst-kicker' },
                  image.resized
                    ? t('image.normalised').replace('{w}', image.width).replace('{h}', image.height)
                    : t('image.original').replace('{w}', image.width).replace('{h}', image.height)
                )
              ),

              h('div', { className: 'svgst-field' },
                h('div', { className: 'svgst-fieldHead' },
                  h('label', { className: 'svgst-label', htmlFor: 'svgst-prompt' }, t('prompt.label')),
                  h('span', { className: 'svgst-kicker' }, `${prompt.length}/4000`)
                ),
                h('textarea', {
                  id: 'svgst-prompt',
                  className: 'svgst-textarea',
                  rows: 4,
                  maxLength: 4000,
                  value: prompt,
                  placeholder: t('prompt.placeholder'),
                  onChange: (e) => setPrompt(e.target.value),
                  onKeyDown: onPromptKeyDown,
                }),
                h('p', { className: 'svgst-hint' }, t('prompt.hint'))
              ),

              h('div', { className: 'svgst-field' },
                h('span', { className: 'svgst-label' }, t('preset.label')),
                h('div', { className: 'svgst-presets', role: 'radiogroup', 'aria-label': t('preset.label') },
                  PRESET_KEYS.map((key) => h('button', {
                    key,
                    type: 'button',
                    role: 'radio',
                    'aria-checked': preset === key,
                    className: `svgst-preset ${preset === key ? 'is-active' : ''}`,
                    onClick: () => changePreset(key),
                  }, t('preset.' + key)))
                ),
                h('p', { className: 'svgst-hint' }, t('preset.' + preset + '.desc'))
              ),

              h('details', {
                className: 'svgst-advanced',
                open: advancedOpen,
                onToggle: (e) => setAdvancedOpen(e.currentTarget.open),
              },
                h('summary', { className: 'svgst-summary' },
                  h(IconSliders, { size: 15 }), t('advanced.title'),
                  Object.keys(overrides).length > 0 && h('span', { className: 'svgst-override' }, t('advanced.overridden'))
                ),
                h('div', { className: 'svgst-advBody' },
                  h('div', { className: 'svgst-rangeRow' },
                    h('label', { className: 'svgst-label', htmlFor: 'svgst-colors' }, t('advanced.colors')),
                    h('span', { className: 'svgst-value' }, effectiveColors)
                  ),
                  h('input', {
                    id: 'svgst-colors', className: 'svgst-range', type: 'range',
                    min: 48, max: 224, step: 8, value: effectiveColors,
                    onChange: (e) => updateOverride('colors', Number(e.target.value)),
                    'aria-describedby': 'svgst-colors-hint',
                  }),
                  h('p', { id: 'svgst-colors-hint', className: 'svgst-hint' }, t('advanced.colorsHint')),

                  h('div', { className: 'svgst-switchRow' },
                    h('div', null,
                      h('span', { className: 'svgst-label' }, t('advanced.face')),
                      h('span', { className: 'svgst-hint' }, t('advanced.faceHint'))
                    ),
                    h('button', {
                      type: 'button', role: 'switch', 'aria-checked': effectiveFace,
                      'aria-label': t('advanced.face'),
                      className: `svgst-switch ${effectiveFace ? 'is-on' : ''}`,
                      onClick: () => updateOverride('face_detail', !effectiveFace),
                    }, h('span'))
                  ),
                  h('div', { className: 'svgst-switchRow' },
                    h('div', null,
                      h('span', { className: 'svgst-label' }, t('advanced.outline')),
                      h('span', { className: 'svgst-hint' }, t('advanced.outlineHint'))
                    ),
                    h('button', {
                      type: 'button', role: 'switch', 'aria-checked': effectiveOutline,
                      'aria-label': t('advanced.outline'),
                      className: `svgst-switch ${effectiveOutline ? 'is-on' : ''}`,
                      onClick: () => updateOverride('outline', !effectiveOutline),
                    }, h('span'))
                  ),
                  h('div', { className: 'svgst-field' },
                    h('label', { className: 'svgst-label', htmlFor: 'svgst-background' }, t('advanced.background')),
                    h('select', {
                      id: 'svgst-background', className: 'svgst-select', value: effectiveBackground,
                      onChange: (e) => updateOverride('background', e.target.value === 'preset' ? undefined : e.target.value),
                    },
                      h('option', { value: 'preset' }, t('advanced.backgroundPreset')),
                      h('option', { value: 'auto' }, t('advanced.backgroundAuto')),
                      h('option', { value: 'gradient' }, t('advanced.backgroundGradient')),
                      h('option', { value: 'original' }, t('advanced.backgroundOriginal'))
                    )
                  ),
                  h('button', {
                    type: 'button', className: 'svgst-link',
                    onClick: () => setOverrides({}),
                  }, t('advanced.reset'))
                )
              ),

              health.status === 'error' && h('div', { className: 'svgst-alert', role: 'alert' },
                h(IconAlert, { size: 17 }),
                h('span', null, t('error.health'))
              ),
              error && h('div', { className: 'svgst-alert', role: 'alert' },
                h(IconAlert, { size: 17 }),
                h('span', null, error)
              ),

              h('div', { className: 'svgst-generateRow' },
                h('button', {
                  type: 'button',
                  className: buttonClass(true) + ' svgst-generate',
                  disabled: !image || busy || health.status === 'error',
                  onClick: generate,
                },
                  busy ? h('span', { className: 'svgst-spinner small' }) : h(IconSparkle, { size: 18 }),
                  busy ? t('generating') : t('generate')
                ),
                busy && h('button', { type: 'button', className: 'svgst-btn', onClick: cancel }, t('cancel'))
              ),
              h('p', { className: 'svgst-shortcut' }, 'Ctrl / Cmd + Enter')
            ),

            h('div', { className: 'svgst-card svgst-outputCard' },
              h('div', { className: 'svgst-cardHead' },
                h('h2', null, t('output.title')),
                result && h('span', { className: 'svgst-tag' }, 'SVG 1.1')
              ),
              h('div', { className: 'svgst-stage' },
                busy
                  ? h('div', { className: 'svgst-progress', role: 'status', 'aria-live': 'polite' },
                    h('div', { className: 'svgst-spinner' }),
                    h('strong', null, stageLabels[stage]),
                    h('div', { className: 'svgst-progressTrack' }, h('div', { className: 'svgst-progressFill' })),
                    h('span', { className: 'svgst-hint' }, t('generating'))
                  )
                  : result
                    ? h('img', { className: 'svgst-resultImage', src: result.url, alt: t('output.title') })
                    : h('div', { className: 'svgst-emptyResult' },
                      h('div', { className: 'svgst-emptyArt' }, h(IconVector, { size: 30 })),
                      h('strong', null, t('output.empty')),
                      h('span', null, t('output.emptyHint'))
                    )
              ),
              result
                ? h('div', { className: 'svgst-resultBody' },
                  h('div', { className: 'svgst-stats' },
                    h('div', { className: 'svgst-stat' }, h('span', null, t('result.dimensions')), h('strong', null, `${result.width}×${result.height}`)),
                    h('div', { className: 'svgst-stat' }, h('span', null, t('result.paths')), h('strong', null, result.paths)),
                    h('div', { className: 'svgst-stat' }, h('span', null, t('result.size')), h('strong', null, formatBytes(result.bytes))),
                    h('div', { className: 'svgst-stat' }, h('span', null, t('result.time')), h('strong', null, formatTime(result.elapsed_ms)))
                  ),
                  h('div', { className: 'svgst-resultMeta' },
                    h('span', null, `${t('result.background')}: ${result.background === 'original' ? t('advanced.backgroundOriginal') : t('advanced.backgroundGradient')}`),
                    h('span', null, result.face_detail ? t('result.faceOn') : t('result.faceOff')),
                    h('span', null, result.outline ? t('result.outlineOn') : t('result.outlineOff'))
                  ),
                  result.path && h('div', { className: 'svgst-path' },
                    h('span', null, t('result.pathLabel')),
                    h('code', { title: result.path }, result.path)
                  ),
                  Array.isArray(result.warnings) && result.warnings.length > 0 && h('div', { className: 'svgst-notice', role: 'status' },
                    h(IconAlert, { size: 16 }),
                    h('div', null, result.warnings.map((warning, index) => h('p', { key: index }, warning)))
                  ),
                  h('div', { className: 'svgst-actions' },
                    h('button', { type: 'button', className: buttonClass(true), onClick: download },
                      h(IconDownload, { size: 17 }), t('result.download')),
                    h('button', { type: 'button', className: 'svgst-btn', onClick: copySvg },
                      copied ? h(IconCheck, { size: 17 }) : h(IconCopy, { size: 17 }),
                      copied ? t('result.copied') : t('result.copy')),
                    h('button', { type: 'button', className: 'svgst-btn', onClick: openPreview },
                      h(IconOpen, { size: 17 }), t('result.open'))
                  )
                )
                : h('div', { className: 'svgst-outputNote' }, t('output.emptyHint'))
            )
          ),
          h('footer', { className: 'svgst-footer' },
            h('span', null, t('footer')),
            h('span', { className: 'svgst-footerMeta' },
              h(XiangwriterMark, { size: 12 }),
              h('span', null, 'xiangwriter · SVG Studio v1.0.1')
            )
          ),
          h('div', { className: 'svgst-licenseNote' }, t('footer.license'))
        );
      };
    }

    const CSS = `
      .svgst-page {
        box-sizing: border-box;
        width: 100%;
        min-height: 100%;
        max-width: 1280px;
        margin: 0 auto;
        padding: 24px 28px 40px;
        color: var(--dsw-alias-label-primary);
        font-family: inherit;
      }
      .svgst-page *, .svgst-page *::before, .svgst-page *::after { box-sizing: border-box; }
      .svgst-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
      .svgst-brand { display: flex; align-items: flex-start; gap: 14px; min-width: 0; }
      .svgst-brandMark {
        flex: 0 0 auto; width: 48px; height: 48px; border-radius: 15px;
        display: grid; place-items: center; color: #fff;
        background: linear-gradient(140deg, #f0a4b9 0%, #cc7f9f 48%, #6eb9cf 100%);
        border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent);
      }
      .svgst-title { margin: 1px 0 4px; font-size: 22px; line-height: 1.2; font-weight: 680; letter-spacing: -0.02em; }
      .svgst-subtitle { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 1.55; max-width: 760px; }
      .svgst-byline { display: inline-flex; align-items: center; gap: 5px; margin-top: 7px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; font-weight: 600; letter-spacing: .045em; opacity: .9; }
      .svgst-headerRight { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; padding-top: 4px; }
      .svgst-status { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
      .svgst-dot { width: 7px; height: 7px; border-radius: 99px; background: var(--dsw-alias-state-idle-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-idle-primary) 16%, transparent); }
      .svgst-status-ok .svgst-dot { background: var(--dsw-alias-state-success-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent); }
      .svgst-status-bad .svgst-dot { background: var(--dsw-alias-state-error-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-error-primary) 16%, transparent); }
      .svgst-status-checking .svgst-dot { animation: svgst-pulse 1.4s ease-in-out infinite; }
      .svgst-grid { display: grid; grid-template-columns: minmax(330px, 410px) minmax(0, 1fr); gap: 18px; align-items: start; }
      .svgst-card { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 18px; padding: 16px; min-width: 0; }
      .svgst-cardHead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .svgst-cardHead h2 { margin: 0; font-size: 14px; font-weight: 650; letter-spacing: -0.01em; }
      .svgst-kicker { display: inline-flex; align-items: center; gap: 5px; color: var(--dsw-alias-label-secondary); font-size: 11.5px; line-height: 1.4; }
      .svgst-drop {
        position: relative; display: flex; align-items: center; justify-content: center; width: 100%;
        min-height: 210px; max-height: 300px; border: 1.5px dashed var(--dsw-alias-border-l2); border-radius: 14px;
        background: var(--dsw-alias-bg-layer-2); cursor: pointer; overflow: hidden; transition: border-color .16s ease, background .16s ease;
      }
      .svgst-drop:hover, .svgst-drop.is-dragging { border-color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, var(--dsw-alias-bg-layer-2)); }
      .svgst-drop:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
      .svgst-fileInput { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
      .svgst-emptyDrop { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 24px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 12.5px; }
      .svgst-emptyDrop strong { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 620; }
      .svgst-uploadBadge { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); margin-bottom: 4px; }
      .svgst-sourcePreview { position: relative; width: 100%; min-height: 210px; max-height: 300px; display: grid; place-items: center; padding: 10px; }
      .svgst-sourcePreview img { display: block; max-width: 100%; max-height: 278px; object-fit: contain; border-radius: 9px; }
      .svgst-replace { position: absolute; right: 10px; bottom: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; border-radius: 9px; color: var(--dsw-alias-label-primary); background: color-mix(in srgb, var(--dsw-alias-bg-overlay) 86%, transparent); border: 1px solid var(--dsw-alias-border-l1); font-size: 11.5px; backdrop-filter: blur(8px); }
      .svgst-fileMeta { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 2px 2px; }
      .svgst-fileName { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--dsw-alias-label-primary); }
      .svgst-field { margin-top: 15px; }
      .svgst-fieldHead { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
      .svgst-label { display: block; margin-bottom: 7px; font-size: 12.5px; font-weight: 620; color: var(--dsw-alias-label-primary); }
      .svgst-textarea, .svgst-select {
        width: 100%; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
        background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary);
        font: inherit; font-size: 12.5px; line-height: 1.55; outline: none;
      }
      .svgst-textarea { resize: vertical; min-height: 92px; padding: 10px 11px; }
      .svgst-select { padding: 8px 9px; }
      .svgst-textarea:focus, .svgst-select:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent); }
      .svgst-textarea::placeholder { color: var(--dsw-alias-label-secondary); opacity: .82; }
      .svgst-hint { margin: 6px 0 0; color: var(--dsw-alias-label-secondary); font-size: 11.5px; line-height: 1.5; }
      .svgst-presets { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
      .svgst-preset {
        appearance: none; border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px;
        padding: 7px 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary);
        font: inherit; font-size: 11.5px; cursor: pointer; transition: .16s ease;
      }
      .svgst-preset:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
      .svgst-preset.is-active { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, var(--dsw-alias-bg-layer-2)); font-weight: 650; }
      .svgst-advanced { margin-top: 16px; border-top: 1px solid var(--dsw-alias-border-l1); padding-top: 11px; }
      .svgst-summary { display: flex; align-items: center; gap: 7px; cursor: pointer; list-style: none; color: var(--dsw-alias-label-secondary); font-size: 12px; user-select: none; }
      .svgst-summary::-webkit-details-marker { display: none; }
      .svgst-summary:hover { color: var(--dsw-alias-label-primary); }
      .svgst-advBody { padding-top: 12px; display: flex; flex-direction: column; gap: 12px; }
      .svgst-override { margin-left: auto; padding: 2px 7px; border-radius: 99px; color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, var(--dsw-alias-bg-layer-2)); border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, var(--dsw-alias-border-l1)); font-size: 9.5px; line-height: 1.3; }
      .svgst-rangeRow { display: flex; align-items: center; justify-content: space-between; margin-bottom: -4px; }
      .svgst-value { color: var(--dsw-alias-brand-primary); font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 650; }
      .svgst-range { width: 100%; accent-color: var(--dsw-alias-brand-primary); margin: 0; }
      .svgst-switchRow { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
      .svgst-switchRow .svgst-label { margin-bottom: 2px; }
      .svgst-switchRow .svgst-hint { display: block; max-width: 280px; }
      .svgst-switch { flex: 0 0 auto; width: 36px; height: 21px; border-radius: 99px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); padding: 2px; cursor: pointer; transition: .16s ease; }
      .svgst-switch span { display: block; width: 15px; height: 15px; border-radius: 99px; background: var(--dsw-alias-label-secondary); transition: transform .16s ease, background .16s ease; }
      .svgst-switch.is-on { border-color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, var(--dsw-alias-bg-layer-2)); }
      .svgst-switch.is-on span { transform: translateX(15px); background: var(--dsw-alias-brand-primary); }
      .svgst-alert { margin-top: 12px; display: flex; align-items: flex-start; gap: 8px; border-radius: 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 38%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, var(--dsw-alias-bg-layer-1)); color: var(--dsw-alias-state-error-primary); padding: 9px 10px; font-size: 11.5px; line-height: 1.5; }
      .svgst-alert svg { flex: 0 0 auto; margin-top: 1px; }
      .svgst-generateRow { display: flex; gap: 8px; margin-top: 16px; }
      .svgst-btn {
        appearance: none; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
        min-height: 36px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l2);
        background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary);
        font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: .16s ease;
      }
      .svgst-btn:hover { border-color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, var(--dsw-alias-bg-layer-2)); }
      .svgst-btn:disabled { opacity: .45; cursor: not-allowed; }
      .svgst-btnPrimary { background: var(--dsw-alias-label-primary); color: var(--dsw-alias-bg-base); border-color: var(--dsw-alias-label-primary); }
      .svgst-btnPrimary:hover { background: var(--dsw-alias-label-primary); color: var(--dsw-alias-bg-base); opacity: .9; }
      .svgst-generate { flex: 1; min-height: 40px; font-size: 12.5px; }
      .svgst-shortcut { margin: 8px 0 0; text-align: right; color: var(--dsw-alias-label-secondary); font-size: 10.5px; letter-spacing: .02em; }
      .svgst-link { appearance: none; border: 0; background: none; padding: 0; color: var(--dsw-alias-brand-primary); font: inherit; font-size: 11.5px; cursor: pointer; }
      .svgst-link:hover { text-decoration: underline; }
      .svgst-outputCard { position: sticky; top: 16px; }
      .svgst-tag { border: 1px solid var(--dsw-alias-border-l1); border-radius: 99px; padding: 3px 7px; color: var(--dsw-alias-label-secondary); font-size: 10px; letter-spacing: .05em; }
      .svgst-stage { position: relative; display: grid; place-items: center; min-height: 420px; height: clamp(420px, 64vh, 680px); border-radius: 13px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
      .svgst-resultImage { display: block; width: 100%; height: 100%; object-fit: contain; padding: 18px; }
      .svgst-emptyResult { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 34px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.5; max-width: 320px; }
      .svgst-emptyResult strong { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 620; }
      .svgst-emptyArt { width: 64px; height: 64px; border-radius: 20px; display: grid; place-items: center; margin-bottom: 6px; color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, var(--dsw-alias-bg-layer-1)); border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, var(--dsw-alias-border-l1)); }
      .svgst-progress { width: min(320px, 72%); display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .svgst-progress strong { color: var(--dsw-alias-label-primary); font-size: 13px; font-weight: 620; }
      .svgst-progressTrack { width: 100%; height: 3px; border-radius: 99px; background: color-mix(in srgb, var(--dsw-alias-label-primary) 10%, transparent); overflow: hidden; }
      .svgst-progressFill { width: 36%; height: 100%; border-radius: inherit; background: var(--dsw-alias-brand-primary); animation: svgst-slide 1.5s ease-in-out infinite; }
      .svgst-spinner { width: 28px; height: 28px; border-radius: 99px; border: 2.5px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent); border-top-color: var(--dsw-alias-brand-primary); animation: svgst-spin .8s linear infinite; }
      .svgst-spinner.small { width: 15px; height: 15px; border-width: 1.8px; }
      .svgst-resultBody { padding-top: 13px; }
      .svgst-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; }
      .svgst-stat { border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px; padding: 8px 9px; background: var(--dsw-alias-bg-layer-2); min-width: 0; }
      .svgst-stat span { display: block; color: var(--dsw-alias-label-secondary); font-size: 10.5px; line-height: 1.3; margin-bottom: 2px; }
      .svgst-stat strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; font-weight: 650; font-variant-numeric: tabular-nums; }
      .svgst-resultMeta { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 9px; color: var(--dsw-alias-label-secondary); font-size: 11px; }
      .svgst-path { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 7px 9px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); min-width: 0; }
      .svgst-path span { flex: 0 0 auto; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }
      .svgst-path code { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
      .svgst-notice { display: flex; align-items: flex-start; gap: 7px; margin-top: 9px; padding: 7px 9px; border-radius: 8px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary) 28%, var(--dsw-alias-border-l1)); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, var(--dsw-alias-bg-layer-1)); color: var(--dsw-alias-state-warn-primary); font-size: 10.5px; line-height: 1.45; }
      .svgst-notice svg { flex: 0 0 auto; margin-top: 1px; }
      .svgst-notice p { margin: 0; }
      .svgst-notice p + p { margin-top: 3px; }
      .svgst-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
      .svgst-outputNote { padding: 0 24px 12px; }
      .svgst-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 16px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }
      .svgst-footerMeta { display: inline-flex; align-items: center; gap: 5px; font-variant-numeric: tabular-nums; }
      .svgst-licenseNote { margin-top: 7px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; line-height: 1.45; opacity: .82; }
      .svgst-glyph { flex: 0 0 auto; }
      @keyframes svgst-spin { to { transform: rotate(360deg); } }
      @keyframes svgst-pulse { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
      @keyframes svgst-slide { 0% { transform: translateX(-110%); } 100% { transform: translateX(300%); } }
      @media (max-width: 960px) {
        .svgst-grid { grid-template-columns: 1fr; }
        .svgst-outputCard { position: static; }
        .svgst-stage { height: clamp(340px, 56vh, 520px); min-height: 340px; }
      }
      @media (max-width: 620px) {
        .svgst-page { padding: 16px 14px 28px; }
        .svgst-header { flex-direction: column; gap: 10px; }
        .svgst-headerRight { padding-top: 0; }
        .svgst-brandMark { width: 42px; height: 42px; border-radius: 13px; }
        .svgst-title { font-size: 19px; }
        .svgst-presets { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .svgst-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .svgst-footer { flex-direction: column; align-items: flex-start; gap: 4px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .svgst-spinner, .svgst-progressFill, .svgst-status-checking .svgst-dot { animation: none; }
        .svgst-btn, .svgst-preset, .svgst-switch, .svgst-switch span { transition: none; }
      }
    `;

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, 'en', DICTS.en), 'svg-studio locale en');
        ctx.effect(() => ctx.locale.register(NS, 'zh', DICTS.zh), 'svg-studio locale zh');
        ctx.effect(() => ctx.locale.register(NS, 'zh-CN', DICTS['zh-CN']), 'svg-studio locale zh-CN');
        ctx.effect(() => ctx.locale.register(NS, 'en-US', DICTS['en-US']), 'svg-studio locale en-US');

        const label = () => ctx.locale.bind(NS)('nav.label');
        const StudioPage = createStudioPage(ctx);

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: 'svg-studio',
          order: 20,
          label,
        }, StudioIcon));

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: 'svg-studio',
        }, StudioPage));
      },
    };
  },
});
