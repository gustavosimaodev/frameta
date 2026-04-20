# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### v1.0.0 — Compartilhamento direto nas redes sociais
- [ ] Web Share API para WhatsApp, Instagram, Facebook e outras
- [ ] Deep link para Instagram Stories
- [ ] Copiar imagem para área de transferência com um clique

### Web (geral)
- [ ] Upload de logo própria no overlay
- [ ] Color picker para cores dos pills
- [ ] Salvar preferências no localStorage
- [ ] Export em PNG além de JPEG
- [ ] PWA — instalável como app no desktop e mobile

### Mobile
- [ ] Flutter app scaffold (Android + iOS)
- [ ] Leitura nativa EXIF via platform channels

### Lightroom Plugin
- [ ] Scaffold Lua com Lightroom SDK

### Infra
- [ ] Domínio próprio (frameta.com / frameta.app)
- [ ] Analytics privacy-first (Plausible)

### Bugs conhecidos (revisão futura)
- [ ] EXIF independente por foto no batch mode
- [ ] Downloads individuais múltiplos bloqueados no macOS/Safari (workaround: ZIP)

---

## [0.9.3] — 2026-04-19

Estabilização completa da v0.9.0: canvas interativo restaurado, pills com alinhamento correto pelo canto, sidebar compacto, bottom sheet mobile funcional.

### Fixed
- Canvas interativo restaurado — `imgOffset` e `imgZoom` perdidos em reescrita anterior foram reinseridos na desestruturação de `opts` e na lógica de `drawImage`
- Pills do overlay agora se alinham pelo canto escolhido com largura natural: canto direito ancora pela borda direita (`pillX = blockX + blockW - item.pw`), canto esquerdo pela borda esquerda (`pillX = blockX`)
- Overflow de 53px no sidebar eliminado: grid de formatos em 3 colunas com fonte e padding reduzidos
- Bottom sheet mobile reescrito com `position: fixed`, `border-radius: 16px`, handle pill via `::before`, transição `cubic-bezier` suave e `max-height: 60vh` com scroll interno
- `index.html` reconstruído do zero — versão antiga com `posGroup` de 9 botões e sem IDs do batch/canvas foi substituída pela versão correta

### Changed
- Aba Sobre: card de Roadmap removido para evitar desatualização

---

## [0.9.2] — 2026-04-19

Data como primeiro campo habilitada por padrão.

### Changed
- Campo "Data" movido para primeira posição em `state.order` e no `orderList`
- `visible.date` alterado de `false` para `true`

### Confirmed
- `fields.date` usa `DateTimeOriginal` (tag `0x9003`) — data de captura, não de modificação

---

## [0.9.1] — 2026-04-19

Slider de zoom no canvas interativo, drop overlay corrigido.

### Fixed
- Drop overlay não bloqueia a interface por padrão (`pointer-events: none` sem `.active`)

### Added
- Slider de zoom (100%–300%) no hint de reposicionamento
- Botão ↺ reseta offset e zoom simultaneamente
- Duplo-clique no canvas centraliza a imagem

---

## [0.9.0] — 2026-04-19

Canvas interativo, posições contextuais, 3:4 Portrait, mobile bottom sheet.

### Added
- Canvas interativo: arraste a imagem dentro do crop ao mudar formato de saída
- Posições contextuais: Overlay mostra 4 cantos (↖ ↗ ↙ ↘), sólidos mostram topo/base (↑ ↓)
- Sincronização automática de `state.pos` ao trocar estilo
- Formato 3:4 Portrait ao lado de 4:5 Portrait
- Mobile: sidebar vira bottom sheet com handle

### Changed
- Formato 1.91:1 Twitter removido, substituído por 3:4 Portrait
- `imgOffset` e `imgZoom` resetados ao trocar formato ou carregar nova foto

---

## [0.9.0 patch] — 2026-04-18

Limpeza de código, ZIP restaurado.

### Fixed
- `signature` adicionado na desestruturação de `opts`
- Bloco de código morto removido após `return` do modo overlay
- `isSignature` e `isBrand` unificados em `isDiscrete`

### Changed
- Download em lote restaurado para ZIP via JSZip
- `app.js` reescrito limpo

---

## [0.8.0] — 2026-04-16

Batch mode completo.

### Added
- Upload múltiplo com filmstrip de miniaturas
- Navegação ‹ › entre fotos
- Download em lote via ZIP
- Cada foto mantém EXIF e nome de arquivo independente

---

## [0.7.2] — 2026-04-16

Responsividade mobile.

### Added
- Layout adaptado para telas ≤768px
- Sidebar colapsável com botão "Configurações"

---

## [0.7.1] — 2026-04-16

Nome do arquivo ao salvar.

### Added
- Campo para nome do arquivo exportado com sanitização automática

---

## [0.7.0] — 2026-04-16

Campo de assinatura.

### Added
- Campo "Assinatura" no sidebar — aparece como pill discreto no overlay

---

## [0.6.1] — 2026-04-16

Barra sólida como sobreposição.

### Fixed
- Estilos Branco e Escuro não expandem mais o canvas

### Added
- Slider de opacidade da barra (10%–100%)

---

## [0.6.0] — 2026-04-11

Tab Feedback, pill de marca, reorganização.

### Added
- Tab Feedback com formulário Formspree
- Pill obrigatório "frameta.vercel.app" no overlay

---

## [0.1.0–0.5.0] — 2026-04-09 a 2026-04-11

Versões iniciais: parser EXIF nativo, design system, overlay, temas, drag-and-drop de campos.

---

## Política de versões

| Segmento | Quando incrementar |
|---|---|
| **Major** (1.x.x) | Breaking change em export, plugin API ou schema mobile |
| **Minor** (x.1.x) | Nova feature |
| **Patch** (x.x.1) | Bugfix ou ajuste visual |

---

*Frameta — desenvolvido por Gustavo de Morais Simão · frameta.vercel.app*
