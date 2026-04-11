# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### Web
- [ ] Batch mode (múltiplas fotos)
- [ ] Upload de logo própria na barra
- [ ] Color picker para fundo e texto
- [ ] Salvar preferências no localStorage
- [ ] Export em PNG
- [ ] Web Share API (compartilhar direto)

### Mobile
- [ ] Flutter app scaffold (Android + iOS)
- [ ] Leitura nativa EXIF via platform channels
- [ ] Share sheet integration

### Lightroom Plugin
- [ ] Scaffold Lua com Lightroom SDK
- [ ] Leitura de metadados do catálogo na exportação

### Infra
- [ ] Domínio próprio (frameta.com / frameta.app)
- [ ] Analytics privacy-first (Plausible)

---

## [0.2.0] — 2026-04-10

Reescrita da arquitetura. Parser EXIF nativo. UI refinada.

### Added
- Parser EXIF binário nativo (`js/exif.js`) — leitura direta do segmento APP1/TIFF do JPEG, sem CDN externo
- Suporte a byte order II (little endian) e MM (big endian)
- Leitura de tipos TIFF: BYTE, ASCII, SHORT, LONG, RATIONAL, SLONG, SRATIONAL
- Formatadores robustos: `formatShutter`, `formatAperture`, `formatFocal`, `formatDate`
- Tratamento correto de valores RATIONAL (objeto `{n, d}`)
- Status badge EXIF no painel direito: ok / limitado / ausente
- Módulo `render.js` separado com função `FrametaRender.draw()`
- Controller `app.js` com estado centralizado e separação de responsabilidades
- Design system em `css/main.css` com variáveis CSS e tipografia DM Sans + DM Mono
- Toast de feedback para todas as ações
- Marca d'água "frameta" discreta no canto da barra exportada
- Linha separadora entre barra e imagem
- Tab "Sobre" com informações do projeto e créditos
- Crédito "Desenvolvido por Gustavo de Morais Simão" no header e na página Sobre

### Fixed
- FNumber exibindo float bruto (ex: `f/2.800000001`) → corrigido para `f/2.8`
- ExposureTime como objeto RATIONAL não era tratado → corrigido
- FocalLength não arredondado → corrigido para `85mm`
- Data EXIF no formato `2024:03:15` não convertida → corrigido para `15/03/2024`
- Barra invisível em imagens grandes (altura mínima agora garantida em 90px)
- `roundRect` nativo com incompatibilidade de browser → substituído por função `pill()` própria
- Canvas não crescia para barra em posição "bottom" → corrigido com `totalH = cropH + barH`

### Changed
- Removida dependência do `exifr` (CDN externo) — parsing 100% local
- Arquitetura refatorada de 1 arquivo → 4 arquivos com responsabilidades claras

---

## [0.1.0] — 2026-04-09

Versão inicial — single file, prova de conceito.

### Added
- Upload por clique e drag-and-drop
- Parsing EXIF via biblioteca `exifr` (CDN)
- Preview com barra de metadados
- 3 estilos, 9 posições, 6 formatos, 3 fontes
- Toggles por campo
- Export JPEG 95%

---

## Política de versões

| Segmento | Quando incrementar |
|---|---|
| **Major** (1.x.x) | Breaking change em formato de export, plugin API ou schema mobile |
| **Minor** (x.1.x) | Nova feature (batch, mobile, plugin, logo) |
| **Patch** (x.x.1) | Bugfix, ajuste visual, atualização de dependência |

---

*Frameta — desenvolvido por Gustavo de Morais Simão*
