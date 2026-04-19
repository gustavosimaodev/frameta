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
- [ ] Salvar preferências no localStorage (estilo, posição, fonte, ordem)
- [ ] Export em PNG além de JPEG
- [ ] PWA — instalável como app no desktop e mobile

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

### Bugs conhecidos (revisão futura)
- [ ] EXIF independente por foto no batch mode
- [ ] Downloads individuais múltiplos bloqueados no macOS/Safari (workaround: ZIP)

---

## [0.9.3] — 2026-04-19

Alinhamento correto dos pills, sidebar compacto, bottom sheet mobile funcional.

### Fixed
- Pills do overlay agora se alinham pelo canto escolhido: cada pill mantém sua largura natural (ajustada ao conteúdo), mas a âncora do bloco é o canto escolhido — pills do lado direito ancoram pela borda direita (`pillX = blockX + blockW - item.pw`), pills do lado esquerdo ancoram pela borda esquerda
- Overflow de 53px no sidebar eliminado: grid de formatos passou para 3 colunas com fonte e padding reduzidos
- Bottom sheet mobile reescrito: border-radius 16px, handle pill via `::before`, `position: fixed`, `z-index: 100`, transição `cubic-bezier` suave, max-height 60vh com scroll interno

### Changed
- Aba Sobre: card de Roadmap removido para evitar desatualização constante

---

## [0.9.2] — 2026-04-19

Data como primeiro campo, habilitada por padrão.

### Changed
- Campo "Data" movido para primeira posição em `state.order` e no `orderList` do HTML
- `visible.date` alterado de `false` para `true` — Data aparece no overlay por padrão

### Confirmed
- `fields.date` usa `DateTimeOriginal` (tag `0x9003`) com fallback para `DateTime` — é a data de captura, não de modificação

---

## [0.9.1] — 2026-04-19

Correção do drop overlay, sidebar compacto, zoom slider no canvas interativo.

### Fixed
- Drop overlay não bloqueia mais a interface por padrão (`pointer-events: none` sem `.active`)
- Sidebar com espaçamentos reduzidos em todos os componentes

### Added
- Slider de zoom no hint de reposicionamento do canvas (100%–300%)
- Zoom integrado ao `render.js` via `imgZoom` — reduz a região fonte da imagem proporcionalmente
- Botão ↺ reseta offset e zoom simultaneamente

---

## [0.9.0] — 2026-04-19

Canvas interativo, posições contextuais, 3:4 Portrait, mobile bottom sheet.

### Added
- Canvas interativo: arraste a imagem dentro do crop ao mudar o formato de saída
- Duplo-clique no canvas centraliza a imagem
- Hint flutuante "Arraste · use o zoom abaixo" aparece ao mudar para formato ≠ Original
- Posições contextuais: Overlay mostra 4 cantos (↖ ↗ ↙ ↘), modos sólidos mostram topo/base (↑ ↓)
- Ao trocar de estilo, `state.pos` é sincronizado para valor válido automaticamente
- Formato 3:4 Portrait adicionado ao lado de 4:5 Portrait
- Mobile: sidebar vira bottom sheet com handle e pill indicator

### Changed
- Formato 1.91:1 Twitter removido e substituído por 3:4 Portrait
- `FMT_RATIOS` atualizado com `'3:4': [3, 4]`
- `imgOffset` resetado ao trocar de formato ou carregar nova foto
- Aba Sobre: grid de 3 cards reduzido para 2 (Roadmap removido)

---

## [0.9.0 patch] — 2026-04-18

Limpeza de código e ZIP restaurado.

### Fixed
- `signature` adicionado na desestruturação de `opts` no `render.js`
- Bloco de código morto removido após `return` do modo overlay
- Variável `isCenter` não usada removida
- `isSignature` e `isBrand` unificados em `isDiscrete`

### Changed
- Download em lote restaurado para ZIP via JSZip — mais confiável no macOS/Safari
- `app.js` reescrito limpo: remoção de tentativas acumuladas, batch simplificado
- Debug block exibido apenas quando `result._log` tem conteúdo real

---

## [0.8.0] — 2026-04-16

Batch mode completo.

### Added
- Upload múltiplo com filmstrip de miniaturas
- Navegação entre fotos com botões ‹ ›
- Contador de fotos no filmstrip
- Download em lote via ZIP (JSZip)
- Cada foto mantém EXIF e nome de arquivo independente

---

## [0.7.2] — 2026-04-16

Responsividade mobile.

### Added
- Layout adaptado para telas ≤768px
- Sidebar colapsável com botão "Configurações"
- Canvas adaptado para largura mobile

---

## [0.7.1] — 2026-04-16

Nome do arquivo ao salvar.

### Added
- Campo para definir nome do arquivo exportado
- Sanitização automática do nome
- Fallback para `frameta_[timestamp].jpg`

---

## [0.7.0] — 2026-04-16

Campo de assinatura.

### Added
- Campo "Assinatura" no sidebar (nome, perfil, copyright — máx 60 chars)
- Aparece como pill discreto antes da marca obrigatória no overlay

---

## [0.6.1] — 2026-04-16

Barra sólida como sobreposição.

### Fixed
- Estilos Branco e Escuro não expandem mais o canvas — barra sempre sobreposta
- `barY` do modo bottom corrigido

### Added
- Slider de opacidade da barra (10%–100%)

---

## [0.6.0] — 2026-04-11

Tab Feedback e reorganização.

### Added
- Tab Feedback com formulário Formspree
- Pill obrigatório "frameta.vercel.app" no overlay

### Changed
- "Campos e ordem" movido para o painel direito
- Botões P/M/G substituídos pelo slider de fonte

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
