# Frameta — EXIF Watermark

> Add your shooting data as a clean watermark to any photo, ready for Instagram and social media.

![Version](https://img.shields.io/badge/version-0.1.0-7c3aed)
![Status](https://img.shields.io/badge/status-beta-a78bfa)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What it does

Frameta reads the EXIF metadata embedded in your photo and renders it as a styled bar — camera body, lens, shutter speed, aperture, ISO, focal length — exported in the exact dimensions each social platform expects.

No server. No account. No upload to third parties. Everything runs in the browser.

---

## Features

- Automatic EXIF extraction (camera, lens, shutter, aperture, ISO, focal length, date)
- 3 watermark styles: white, dark, transparent
- 9 positioning options
- 6 export formats: original, 1:1, 4:5, 9:16, 16:9, 1.91:1
- Per-field visibility toggles
- 3 font options: sans-serif, monospace, serif
- Drag-and-drop upload
- High-quality JPEG export (95%)
- Zero dependencies beyond a single CDN script

---

## Supported formats

| Platform | Ratio | Resolution |
|---|---|---|
| Instagram Feed | 1:1 | 1080 × 1080 |
| Instagram Portrait | 4:5 | 1080 × 1350 |
| Instagram / TikTok Story | 9:16 | 1080 × 1920 |
| YouTube Thumbnail | 16:9 | 1280 × 720 |
| X / Twitter | 1.91:1 | 1600 × 836 |
| Original | — | unchanged |

---

## Getting started

### Run locally

Just open `index.html` in any modern browser. No build step required.

### Deploy to Vercel

1. Push this repository to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Vercel detects a static site automatically — click **Deploy**

That's it.

---

## Project structure

```
frameta/
├── index.html        # entire app — self-contained
├── README.md
└── CHANGELOG.md
```

---

## Roadmap

See [`CHANGELOG.md`](./CHANGELOG.md) for released versions and the planned roadmap.

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Vanilla JS + Canvas API |
| EXIF parsing | [exifr](https://github.com/MikeKovarik/exifr) v7 |
| Hosting | Vercel (static) |
| Future mobile | Flutter |
| Future plugin | Lightroom SDK (Lua) |

---

## License

MIT © Frameta
