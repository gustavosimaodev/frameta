# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### Feature C — Upload de logo própria (interface pendente)
- Opção 1: logo substitui assinatura — simples
- Opção 2: logo como elemento independente — flexível
- Opção 3: logo integrada ao bloco de dados — elegante

### Feature D — Color picker (reformulação Overlay/Faixa)
- [ ] Overlay/Branco/Escuro → Overlay / Faixa
- [ ] Color picker: roda + hex + conta-gotas (EyeDropper API — Chrome/Edge)
- [ ] Cor do fundo e fonte + opacidade independentes
- [ ] Aviso de compatibilidade por navegador

### v1.0.0 — Compartilhamento nas redes
- [ ] Web Share API, deep link Stories, copiar para clipboard

### Monetização
- [ ] Ko-fi / GitHub Sponsors, Plano Pro opcional

### Plataformas
- [ ] PWA, Flutter (Android + iOS), Lightroom Plugin

### Infra
- [ ] Search Console verificado + sitemap indexado
- [ ] Domínio próprio, Plausible Analytics

### Bugs conhecidos
- [ ] Downloads individuais múltiplos no macOS/Safari (workaround: ZIP)

---

## [0.9.5] — 2026-04-23

Interface mobile com bottom navigation e batch mode Individual/Global.

### Added
- Bottom navigation mobile — barra fixa com 5 ícones: Estilo, Formato, Foto, Campos, Baixar
- Painéis móveis sincronizados com o estado global, fecham ao tocar no canvas
- Batch toolbar com toggle Individual/Global e botão "Aplicar a todas"
- Modo Global propaga configuração para todas as fotos em tempo real
- Modo Individual mantém configurações independentes por foto (padrão)

### Fixed
- Listeners da bottom nav registrados independente do viewport inicial

---

## [0.9.4] — 2026-04-22

Config independente no batch, export PNG, logo home, versão no header, SEO.

### Added
- Export PNG além de JPEG, seletor por foto
- snapshotConfig / applyConfig — config independente por foto no batch
- Logo clicável → frameta.vercel.app, versão no header
- Google Analytics, SEO completo, Open Graph, Twitter Card, Schema.org
- sitemap.xml, robots.txt, og-image.jpg

### Fixed
- Download em lote usa config individual de cada foto

---

## [0.9.3] — 2026-04-19

### Fixed
- Pills alinhados pelo canto com largura natural
- imgOffset e imgZoom restaurados no render.js
- index.html reconstruído com todos os IDs

---

## [0.9.0–0.9.2] — 2026-04-19

Canvas interativo (arrastar + zoom), posições contextuais, 3:4 Portrait, data em destaque por padrão.

---

## [0.8.0] — 2026-04-16

Batch mode: upload múltiplo, filmstrip, download ZIP.

---

## [0.7.0–0.7.2] — 2026-04-16

Assinatura, nome do arquivo ao salvar, responsividade mobile.

---

## [0.6.0–0.6.1] — 2026-04-11

Tab Feedback, pill de marca, barra sólida como sobreposição, slider de opacidade.

---

## [0.1.0–0.5.0] — 2026-04-09 a 2026-04-11

Parser EXIF nativo, design system, overlay, temas, drag-and-drop.

---

*Frameta — Gustavo de Morais Simão · frameta.vercel.app*
