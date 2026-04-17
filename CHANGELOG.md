# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### v0.9.0 — Canvas interativo com crop e posicionamento
> EXIF independente por foto no batch mode (pendente de revisão com modelo mais robusto).
> Canvas com reposicionamento da imagem ao mudar formato de saída.
- [ ] Drag interativo da imagem dentro do canvas ao mudar proporção
- [ ] Estado de offset individual por foto no batch
- [ ] Botão "centralizar" para resetar o crop
- [ ] Zoom in/out com scroll ou pinch

### v1.0.0 — Compartilhamento direto nas redes sociais
- [ ] Web Share API para WhatsApp, Instagram, Facebook e outras
- [ ] Deep link para Instagram Stories
- [ ] Copiar imagem para área de transferência com um clique

### Web (geral)
- [ ] Upload de logo própria no overlay
- [ ] Color picker para cor de fundo e texto dos pills
- [ ] Salvar preferências no localStorage
- [ ] Export em PNG além de JPEG
- [ ] PWA — instalável como app

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

## [0.9.0] — 2026-04-17

Limpeza e estabilização do código. Download em lote restaurado para ZIP.

### Fixed
- `signature` adicionado na desestruturação de `opts` no `render.js` — campo não estava sendo passado para o canvas
- `signature` adicionado como pill no array `items` do overlay, antes da marca obrigatória
- Bloco de código morto removido do `render.js` (linhas após `return` do modo overlay que nunca eram executadas)
- Variável `isCenter` removida do `render.js` (declarada mas nunca usada)
- `isSignature` e `isBrand` unificados em `isDiscrete` no bloco de medição e desenho dos pills

### Changed
- Download em lote restaurado para ZIP via JSZip — mais confiável que downloads sequenciais no macOS/Safari
- `app.js` reescrito com código limpo: remoção de tentativas de correção acumuladas, lógica de batch simplificada e comentada
- Debug block exibido apenas quando `result._log` tem conteúdo (não em fotos do batch)
- `updateStyleUI` renomeado de `updateOverlaySizeVisibility` para nome mais descritivo
- Blob URLs do batch agora usados diretamente nas miniaturas do filmstrip (em vez de `img.src` que ficava inválido após revogar)

### Known Issues
- EXIF independente por foto no batch: painel atualiza corretamente mas renderização usa configurações globais (comportamento intencional nesta versão — revisão planejada para v0.9.0)
- Download em lote no macOS/Safari: ZIP funciona corretamente; downloads individuais sequenciais bloqueados pelo browser (limitação de plataforma)

---

## [0.8.4] — 2026-04-16

EXIF isolado por foto via deep copy.

### Fixed
- Deep copy via `JSON.parse(JSON.stringify(...))` evita que o ArrayBuffer do EXIF seja liberado pelo GC entre fotos do batch
- Blob URLs permanentes por foto para evitar invalidação prematura
- `hideBatchUI` revoga todos os blob URLs ao limpar o estado

---

## [0.8.3] — 2026-04-16

Reset do painel EXIF entre fotos.

### Fixed
- Painel EXIF resetado completamente antes de cada atualização
- Debug block escondido por padrão, exibido apenas com dados disponíveis

---

## [0.8.2] — 2026-04-16

Layout restaurado após quebra do filmstrip.

### Fixed
- Filmstrip com `position: absolute` quebrava o layout — movido para `div.app-column` em flow normal
- `activateBatchItem` reescrita corretamente

---

## [0.8.1] — 2026-04-16

Refinamentos do batch e overlay.

### Fixed
- Filmstrip posicionado abaixo do canvas, fora da área de edição
- Tamanho de fonte unificado no overlay
- `ctx.textAlign` resetado após modo overlay

### Changed
- Download em lote passa a gerar arquivos individuais (revertido no v0.9.0)

---

## [0.8.0] — 2026-04-16

Batch mode completo.

### Added
- Upload múltiplo — seleção ou drag de N imagens
- Filmstrip com miniaturas numeradas
- Botões de navegação anterior/próxima
- Contador de fotos (ex: "2 / 5")
- Botão "Baixar todas" com exportação em ZIP
- Arquivo único mantém comportamento original

---

## [0.7.2] — 2026-04-16

Responsividade mobile.

### Added
- Layout adaptado para telas ≤768px
- Sidebar colapsável com botão "Configurações"
- Canvas adaptado para largura mobile
- Touch-friendly

---

## [0.7.1] — 2026-04-16

Nome do arquivo ao salvar.

### Added
- Campo de texto para nome do arquivo exportado
- Sanitização automática do nome
- Fallback para `frameta_[timestamp].jpg`

---

## [0.7.0] — 2026-04-16

Campo de assinatura.

### Added
- Campo "Assinatura" no sidebar (nome, perfil, copyright)
- Aparece como pill discreto antes da marca obrigatória
- No modo sólido, aparece centralizado na barra
- Limite de 60 caracteres

---

## [0.6.1] — 2026-04-16

Correção de proporção nos modos sólidos.

### Fixed
- Estilos Branco e Escuro não expandem mais o canvas
- Barra sempre sobreposta sobre a imagem
- `barY` do modo bottom corrigido

### Added
- Slider de opacidade da barra (10%–100%) nos modos Branco e Escuro

---

## [0.6.0] — 2026-04-11

Tab Feedback e reorganização do sidebar.

### Added
- Tab **Feedback** com formulário Formspree
- Pill obrigatório "frameta.vercel.app" no overlay

### Changed
- "Campos e ordem" movido para o painel direito
- Botões P/M/G substituídos pelo slider de fonte
- "Sugestões" migrado para tab Feedback

---

## [0.5.0] — 2026-04-11

UX consolidada.

### Added
- Botão "Baixar foto" abaixo do "Abrir foto"
- Campos e ordem unificados com drag-and-drop e toggle por linha
- Slider de tamanho de fonte (60%–160%)
- Pill obrigatório "frameta.vercel.app"
- Página "Sobre" com Fale Conosco (Instagram, Facebook, LinkedIn)

---

## [0.4.0] — 2026-04-10

Overlay e tema escuro.

### Added
- Estilo **Overlay** — texto com stroke, sem fundo sólido
- Tema claro / escuro / sistema
- Link de crédito no header

---

## [0.3.0] — 2026-04-10

Parser EXIF v4.

### Fixed
- IFD chain completa (IFD0 → IFD1 → ExifIFD)
- Big-endian (MM byte order)
- Identificação correta de fotos sem EXIF de câmera

---

## [0.2.0] — 2026-04-10

Arquitetura modular e parser nativo.

### Added
- Parser EXIF binário nativo sem CDN
- Design system com DM Sans + DM Mono
- Módulos separados: exif.js, render.js, app.js

---

## [0.1.0] — 2026-04-09

Versão inicial.

### Added
- Upload, EXIF via exifr (CDN), preview, export JPEG

---

## Política de versões

| Segmento | Quando incrementar |
|---|---|
| **Major** (1.x.x) | Breaking change em export, plugin API ou schema mobile |
| **Minor** (x.1.x) | Nova feature |
| **Patch** (x.x.1) | Bugfix ou ajuste visual |

---

*Frameta — desenvolvido por Gustavo de Morais Simão · frameta.vercel.app*
