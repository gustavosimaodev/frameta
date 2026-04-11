# Frameta — EXIF Watermark

> Add your shooting data as a clean watermark to any photo, ready for Instagram and social media.

![Version](https://img.shields.io/badge/version-0.2.0-0d0d0d)
![Status](https://img.shields.io/badge/status-beta-c8a96e)
![License](https://img.shields.io/badge/license-MIT-green)

Desenvolvido por **Gustavo de Morais Simão**

---

## What it does

Frameta reads the EXIF metadata embedded in your photo and renders it as a styled bar — camera body, lens, shutter speed, aperture, ISO, focal length — exported in the exact dimensions each social platform expects.

**No server. No account. No upload to third parties.** Everything runs in the browser via native binary JPEG parsing.

---

## Features

- Native EXIF binary parser — no CDN dependency, works offline
- Reads: camera, lens, shutter, aperture, ISO, focal length, date
- 3 watermark styles: white, dark, glass
- 9 positioning options
- 6 export formats: original, 1:1, 4:5, 9:16, 16:9, 1.91:1
- Per-field visibility toggles
- 3 font options: DM Sans, DM Mono, Serif
- Drag-and-drop upload
- EXIF status indicator (ok / limited / missing)
- JPEG export at 95% quality
- Zero runtime dependencies

---

## Project structure

```
frameta/
├── index.html          # shell HTML — tabs, sidebar, workspace, panels
├── css/
│   └── main.css        # design system — variables, layout, components
├── js/
│   ├── exif.js         # binary JPEG/TIFF EXIF parser (no dependencies)
│   ├── render.js       # canvas rendering — watermark bar
│   └── app.js          # controller — state, events, UI orchestration
├── README.md
└── CHANGELOG.md
```

---

## Architecture

```
fileInput / dragDrop
       │
       ▼
  FrametaExif.parse(file)      ← reads first 256KB of JPEG binary
       │
       ▼
  FrametaExif.extract(raw)     ← formats fields: shutter, aperture, ISO…
       │
       ├──► updateExifPanel()  ← displays metadata in the right panel
       │
       └──► FrametaRender.draw(canvas, img, fields, opts)
                  │
                  ▼
             canvas.toBlob()   ← JPEG 95% quality download
```

---

## Getting started

### Run locally

```bash
git clone https://github.com/seu-usuario/frameta.git
cd frameta
open index.html   # macOS
```

No build step. No npm install. Just open the file.

### Deploy to Vercel

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Other** (static)
4. Deploy — done.

---

## Supported formats

| Platform | Ratio | Resolution |
|---|---|---|
| Instagram Feed | 1:1 | 1080 × 1080 |
| Instagram Portrait | 4:5 | 1080 × 1350 |
| Instagram / TikTok Story | 9:16 | 1080 × 1920 |
| YouTube / Wide | 16:9 | 1280 × 720 |
| X / Twitter | 1.91:1 | 1600 × 836 |
| Original | — | unchanged |

---

## Roadmap

See [`CHANGELOG.md`](./CHANGELOG.md).

---

## License

MIT © Gustavo de Morais Simão
