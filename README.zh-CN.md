<p align="center">
  <img src="assets/banner.svg" alt="SVG Studio by xiangwriter" width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-personal%20use%20only-ff9fc2.svg" alt="Personal use only"></a>
  <img src="https://img.shields.io/badge/commercial-license%20required-30203a.svg" alt="Commercial license required">
  <img src="https://img.shields.io/badge/python-3.10%2B-3776AB.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/DeepSeek%20Harness-plugin-4F7CFF.svg" alt="DeepSeek Harness plugin">
  <img src="https://img.shields.io/badge/xiangwriter-original-ff9fc2.svg" alt="by xiangwriter">
</p>

<h1 align="center">SVG Studio · 图像矢量化工作室</h1>

<p align="center">
  图片 + 风格描述 → 真正由路径和渐变组成的纯 SVG。<br>
  一个本地运行的 DeepSeek Harness 矢量化插件。<br>
  <sub>由 <a href="https://github.com/xiangwriter-dev"><strong>xiangwriter</strong></a> 设计与维护。</sub>
</p>

<p align="center">
  <code>dsh-xiangwriter-svg-studio</code>
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="#安装">安装</a> ·
  <a href="#使用">使用</a> ·
  <a href="#引擎流程">引擎流程</a> ·
  <a href="#开发">开发</a> ·
  <a href="#许可">许可</a>
</p>

> **仅供个人非商业使用。**
> 本仓库是 source-available（可查看源码），不是开源许可。任何商业使用都需要先取得
> xiangwriter 的单独书面授权，详见 [COMMERCIAL.md](COMMERCIAL.md)。
> `xiangwriter` 名称、标志与品牌必须保留。

---

SVG Studio 把人物插画、立绘、贴纸或平涂图片转换成**真正的矢量 SVG**：由 `<path>`、渐变和遮罩组成，不嵌入原图，也不依赖在线描摹服务。安装后你会得到三个入口：

- Harness 侧边栏里的 **SVG 矢量化工作室** 页面；
- Agent 工具 **`svg_studio`**，可直接处理本地图片路径；
- 可复用的 Agent 技能 **`svg-vector-recreation`**。

所有处理都在本地完成。图片和提示词只进入本机 Harness 服务和本地 Python 引擎。

## 特性

- **提示词引导预设**：可以用自然语言描述风格，例如“保留酒红背景、轮廓干净一点、眼睛细节多一点”。明确的高级设置优先级更高。
- **分层色块描摹**：中位切分调色板 → 连通色块 → 闭合轮廓与 even-odd 孔洞 → 可选 RDP 简化。同一种颜色可以有多个不相连的色块。
- **人像感知剪影**：自动分离背景、处理内部孔洞与近白色区域，并把颜色路径裁切到人物范围内，减少背景杂色变成路径。
- **本地面部细化**：用小范围调色板和柔和遮罩细化眼睛、腮红、嘴巴和发丝，不影响其他区域。
- **干净的背景**：默认 `gradient` 模式只生成干净的渐变背景，**不会凭空添加光晕或深色圆环**。选择 `original` 可以保留原图背景。
- **外描边默认关闭**：额外深色外轮廓是可选效果，默认不会生成；只有在高级设置里手动打开，或明确要求描边时才会加。
- **纯矢量输出**：没有 `<image>`、没有 `data:image`、没有 base64 位图；生成后会做 XML 与结构校验。
- **中英双语界面**，并带有可扩展的语言文件。

## 安装

需要可用的 DeepSeek Harness Web UI，以及带 **Pillow** 和 **numpy** 的 Python 3.10+。

从 GitHub 安装：

```bash
dsh plugin add github:xiangwriter-dev/dsh-xiangwriter-svg-studio
```

从本地目录安装：

```bash
dsh plugin add /absolute/path/to/dsh-xiangwriter-svg-studio
```

安装 Python 依赖：

```bash
python -m pip install -r engine/requirements.txt
```

Windows 下 Harness 也会自动寻找自带的 Python 运行时；也可以通过 `DSH_SVG_STUDIO_PYTHON` 指定解释器。页面右上角显示“本地引擎就绪”即表示 Pillow/numpy 可用。

刷新 Harness Web UI 后，在侧边栏打开 **SVG 矢量化**。

## 使用

### 在页面中

1. 拖入或选择 PNG / JPG / WebP / GIF 图片。
2. 可选：在“你的想法与建议”里写下风格要求。
3. 选择预设，或展开“高级设置”。
4. 点击“生成 SVG”，然后预览、下载、复制代码或在新标签页打开。

### 在 Agent 中

直接用自然语言描述即可，技能会自动匹配：

```text
用 svg_studio 把 D:\art\character.png 转成 SVG，
使用 faithful 预设，面部细化开，外轮廓关，背景用干净渐变。
```

### 预设

| 预设 | 颜色数 | 面部细化 | 背景 | 适合 |
| --- | ---: | :---: | --- | --- |
| `faithful` | 160 | 开 | 干净渐变 | 最接近原图 |
| `clean` | 112 | 开 | 干净渐变 | 更小、更平、更干净 |
| `flat` | 72 | 关 | 干净渐变 | 色块感强的海报风格 |
| `original` | 140 | 开 | 保留原背景 | 原背景本身是画面的一部分 |
| `mini` | 64 | 关 | 干净渐变 | 简单图、小文件 |

外轮廓与预设独立，默认关闭。

## 输出说明

- 生成的 SVG 只包含路径、渐变、柔和遮罩和剪影裁切，不包含位图。
- 输出会做 XML 解析和纯矢量检查，拒绝 `<image>`、`data:image` 和 base64 数据。
- 输出文件位于 `$DSH_HOME/svg-studio/outputs/`，只保留最新 40 个。
- 所有处理都是本地的；不会上传到云端。

## 引擎流程

```text
原图
  │  归一化 / 白底合成
  ▼
自适应调色板（中位切分）
  ▼
颜色家族 → 连通域 → 带孔洞的闭合轮廓
  ▼
人物剪影（边界背景 + 连通域清理 + 孔洞处理）
  ▼
颜色路径预裁切 · 面部局部调色板 · 柔和遮罩
  ▼
干净渐变背景（不合成光晕）· 可选外轮廓
  ▼
RDP 简化 · XML / 纯矢量结构校验
  ▼
.svg
```

本次版本重点修复：

- 白色、浅色和平涂背景使用边界连通背景分割，浅色皮肤、裙摆和高光不会被误裁掉。
- 干净渐变模式不再凭空生成深色光晕；背景里的深色块和假描边问题一并消失。
- 外轮廓默认关闭；提示词里写“轮廓干净一点”不会误触发描边。
- 面部细化层不做 RDP 简化，避免眼睛和腮红变成碎点。

## 本地 API

| 方法 | 路由 | 用途 |
| --- | --- | --- |
| `GET` | `/svg-studio/api/health` | 检查 Python、Pillow、numpy |
| `POST` | `/svg-studio/api/generate` | 通过 data URL 或本地路径生成 |
| `GET` | `/svg-studio/file?name=<name>.svg` | 读取已保存的输出 |

路由只注册在本机 Harness Web 服务器上，不应对公网暴露。

## 要求与限制

- DeepSeek Harness Web UI（需要 `ctx.webServer`、`ctx.tools`、`ctx.skills`）。
- Node.js 20+（由 Harness 提供）。
- Python 3.10+、Pillow ≥ 10、numpy ≥ 1.26。
- 输入格式：PNG、JPEG、WebP、GIF。当前版本不支持透明背景导出，也不支持直接编辑已有 SVG。
- 页面会把图片长边限制在 1200 px（客户端上限 26 MB），以控制生成时间与文件大小。
- 非常大的图片可能生成很大的 SVG；超过 10 MB 时引擎会给出提示。
- 本地 API 自身不带认证，请依赖 Harness Web 服务本身的本地/私有边界。

## 开发

```text
dsh-xiangwriter-svg-studio/
├─ index.js                  Host：技能、工具、HTTP 路由、Python 检测
├─ client.js                 页面与侧边栏图标（模块 id：dsh-xiangwriter-svg-studio）
├─ engine/svg_engine.py      Pillow + numpy 矢量引擎
├─ engine/requirements.txt   Python 依赖
├─ skill.md                  Agent 工作流与质量门槛
├─ locale/                   中英文元数据与界面文案
├─ cordis.patch.yml          Bundle patch（row id：svg-studio）
├─ icon.svg                  带 xiangwriter 标志的插件图标
├─ assets/                   README banner 与 xiangwriter 标志
├─ tests/smoke_engine.py     合成图片端到端冒烟测试
└─ .github/workflows/ci.yml  JS/Python 检查与测试
```

```bash
node --check index.js
node --check client.js

python -m pip install -r engine/requirements.txt
python -m py_compile engine/svg_engine.py
python tests/smoke_engine.py
```

冒烟测试会现场生成一张平涂测试图，运行完整引擎，并断言输出是纯 SVG、没有 `haloGrad`、没有 `outer-outline`。不依赖任何第三方图片。

## 许可

**仅限个人非商业使用。** 这是 source-available 的专有许可，不是 OSI 开源许可。

- 个人使用需遵守 [LICENSE](LICENSE) 中的条款。
- 任何商业使用都需要 xiangwriter 的单独书面授权，见 [COMMERCIAL.md](COMMERCIAL.md)。
- 联系方式：[GitHub @xiangwriter-dev](https://github.com/xiangwriter-dev)，或在仓库中提交
  [Commercial license request](https://github.com/xiangwriter-dev/dsh-xiangwriter-svg-studio/issues/new?title=Commercial%20license%20request)。
- `xiangwriter` 名称与标志用于标识作者，必须保留。
- 你处理的原始插画版权仍归你或原权利人所有，也不会被提交到本仓库。

© 2026 xiangwriter. All rights reserved.
