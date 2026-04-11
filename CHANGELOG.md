# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### Web
- [ ] Canvas redimensionável com imagem arrastável dentro do formato de rede social
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

## [0.4.0] — 2026-04-10

UI compacta, overlay sem fundo, seletor de tema.

### Added
- Estilo **Overlay**: texto branco com stroke preto fino, sem fundo — sobreposição direta sobre a imagem
- Seletor de **tema da interface**: Claro / Escuro / Padrão do sistema (detecta `prefers-color-scheme` em tempo real)
- Tema escuro completo via `data-theme="dark"` com variáveis CSS

### Changed
- Estilo padrão alterado de "Branco" para "Overlay"
- "Glass" renomeado e substituído por "Overlay" com lógica de renderização dedicada
- Botões de posição reduzidos (altura 28px) — sidebar agora cabe sem scroll na maioria das resoluções
- Sidebar mais compacta: padding reduzido, seções com menos gap, fontes de rótulo menores
- Fonte base reduzida de 14px para 13px
- Chips no modo overlay com fundo semitransparente escuro para legibilidade
- Divisória vertical no overlay com opacidade maior para contraste
- Marca d'água "frameta" adaptada para cada estilo

### Fixed
- Texto do crédito "by Gustavo de Morais Simão" agora é link clicável para instagram.com/gsimao14
- Hover no link de crédito com underline dourado sutil

---

## [0.3.0] — 2026-04-10

Parser EXIF v4 — segue IFD chain completa.

### Added
- Segue IFD chain completa (IFD0 → IFD1 → ...) via ponteiro `nextIFD`
- Leitura de `ExifIFD` e `SubIFD` via ponteiros de sub-IFD
- Painel "Raw EXIF debug" colapsável com log de diagnóstico linha a linha
- Mensagem de erro explicativa quando foto teve EXIF removido por redes sociais

### Fixed
- Arquivos exportados pelo Instagram/WhatsApp (IFD0 com 3 entradas apenas) agora extraem corretamente quando os dados reais estão no IFD1 ou ExifIFD
- Suporte correto a big-endian (MM byte order)
- Scan de "Exif" nos primeiros 64 bytes do segmento APP1 em vez de offset fixo

---

## [0.2.0] — 2026-04-10

Reescrita da arquitetura. Parser EXIF nativo. UI refinada.

### Added
- Parser EXIF binário nativo (`js/exif.js`) — sem CDN externo
- Suporte a byte order II (little endian) e MM (big endian)
- Leitura de tipos TIFF: BYTE, ASCII, SHORT, LONG, RATIONAL, SLONG, SRATIONAL
- Formatadores: `fmtShutter`, `fmtAperture`, `fmtFocal`, `fmtDate`
- Tratamento de valores RATIONAL como float direto
- Status badge EXIF: ok / limitado / ausente
- Módulo `render.js` separado — `FrametaRender.draw()`
- Controller `app.js` com estado centralizado
- Design system `css/main.css` com variáveis CSS — DM Sans + DM Mono
- Toast de feedback para todas as ações
- Marca d'água "frameta" discreta na barra exportada
- Tab "Sobre" com roadmap e créditos
- Crédito "Desenvolvido por Gustavo de Morais Simão" no header

### Fixed
- FNumber float bruto → `f/2.8`
- ExposureTime como objeto RATIONAL → tratado corretamente
- FocalLength não arredondado → `85mm`
- Data EXIF `2024:03:15` → `15/03/2024`
- Barra invisível em imagens grandes — mínimo 90px garantido
- `roundRect` nativo → substituído por `pill()` compatível
- Canvas não crescia para barra em posição "bottom" → corrigido

### Changed
- Removida dependência do `exifr` (CDN) — parsing 100% local
- Arquitetura refatorada: 1 arquivo → 4 arquivos

---

## [0.1.0] — 2026-04-09

Versão inicial — single file, prova de conceito.

### Added
- Upload por clique e drag-and-drop
- Parsing EXIF via `exifr` (CDN)
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
