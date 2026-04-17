# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### v0.9.0 — Canvas interativo com crop e posicionamento
> Permite ao usuário reposicionar e escalar a imagem dentro do canvas ao mudar o formato de exportação (1:1, 4:5, 9:16 etc.), em vez do crop automático centralizado atual.
- [ ] Canvas secundário interativo com handles de arrastar e redimensionar
- [ ] Preview do recorte em tempo real ao mudar o formato
- [ ] Botão "centralizar" para voltar ao crop automático
- [ ] Zoom in/out com scroll ou pinch
- [ ] No batch mode, cada foto mantém seu próprio offset de posicionamento

### v1.0.0 — Compartilhamento direto nas redes sociais
- [ ] Web Share API para WhatsApp, Instagram, Facebook e outras
- [ ] Deep link para Instagram Stories
- [ ] Copiar imagem para área de transferência com um clique

### Web (geral)
- [ ] Upload de logo própria na barra / overlay
- [ ] Color picker para cor de fundo e texto dos pills
- [ ] Salvar preferências no localStorage (estilo, posição, ordem, tamanho)
- [ ] Export em PNG além de JPEG
- [ ] Suporte a RAW via conversão prévia no browser (limitado)

### Mobile
- [ ] Flutter app scaffold (Android + iOS)
- [ ] Leitura nativa EXIF via platform channels
- [ ] Share sheet integration
- [ ] Batch mode nativo com acesso ao rolo de câmera

### Lightroom Plugin
- [ ] Scaffold Lua com Lightroom SDK
- [ ] Leitura de metadados do catálogo na exportação
- [ ] Preset de overlay salvo por perfil

### Infra
- [ ] Domínio próprio (frameta.com / frameta.app)
- [ ] Analytics privacy-first (Plausible)
- [ ] PWA — instalável como app no desktop e mobile

---

## [0.8.4] — 2026-04-16

Correção de estabilidade do batch mode: EXIF isolado por foto e downloads individuais confiáveis.

### Fixed
- EXIF de cada foto no batch agora é isolado via deep copy (`JSON.parse/stringify`), evitando que o ArrayBuffer binário seja liberado pelo garbage collector e corrompesse os dados das fotos anteriores
- Downloads em lote convertidos para base64 via FileReader — contorna o bloqueio de múltiplos downloads automáticos no macOS/Safari
- Blob URLs das imagens do batch agora são revogados corretamente ao limpar o estado

---

## [0.8.3] — 2026-04-16

Correções no painel EXIF e tentativa inicial de downloads individuais.

### Fixed
- Painel EXIF resetado completamente antes de cada atualização — eliminava resíduos visuais ao navegar entre fotos no batch
- Debug block agora escondido por padrão e exibido apenas quando há dados `_raw` disponíveis

---

## [0.8.2] — 2026-04-16

Restauração do layout e correção da estrutura do batch mode.

### Fixed
- Área de edição (workspace) restaurada — quebra de layout causada pelo filmstrip com `position: absolute`
- Filmstrip movido para fora do workspace, dentro de um `div.app-column` que empilha verticalmente
- `activateBatchItem` reescrita para atualizar corretamente `state.img`, `state.fields` e o painel EXIF ao navegar entre fotos

---

## [0.8.1] — 2026-04-16

Refinamentos do batch mode e comportamento do overlay.

### Fixed
- Filmstrip reposicionado para abaixo do canvas, fora da área de edição
- Tamanho de fonte unificado no overlay — câmera em bold 700, demais campos em regular 400, mesma escala base
- Alinhamento do texto dos pills segue o posicionamento: esquerda alinha à esquerda, centro centraliza, direita alinha à direita
- `ctx.textAlign` resetado para `'left'` após o modo overlay para não afetar o modo sólido

### Changed
- Download em lote passa a gerar arquivos individuais em sequência em vez de ZIP

---

## [0.8.0] — 2026-04-16

Batch mode completo: upload múltiplo, carrossel de pré-visualização e download em lote.

### Added
- Upload múltiplo — seleção ou drag de N imagens de uma vez
- Filmstrip (tira de filme) com miniaturas numeradas para navegar entre as fotos carregadas
- Botões de navegação anterior/próxima no filmstrip
- Contador de fotos (ex: "2 / 5") no filmstrip
- Botão "Baixar todas" — processa e baixa cada foto com o overlay aplicado
- Cada foto do batch mantém seu próprio EXIF, nome de arquivo e pré-visualização independente
- Ao carregar uma única foto, o comportamento original é preservado sem exibir o filmstrip

---

## [0.7.2] — 2026-04-16

Responsividade mobile.

### Added
- Layout adaptado para telas pequenas (≤768px): sidebar empilhado acima do canvas
- Sidebar colapsável em mobile com botão "Configurações"
- Sidebar começa colapsado em mobile e expande automaticamente em telas grandes
- Seção de upload sempre visível mesmo com sidebar colapsado (`sidebar-section--always`)
- Canvas e preview adaptados para largura de tela mobile

### Changed
- Crédito do header oculto em mobile para economizar espaço
- Upload zone compacto em modo horizontal no mobile
- Formato grid ajustado para 3 colunas em telas pequenas

---

## [0.7.1] — 2026-04-16

Escolha do nome do arquivo ao salvar.

### Added
- Campo de texto acima do botão "Baixar foto" para definir o nome do arquivo exportado
- Nome sanitizado automaticamente (remove caracteres especiais, substitui espaços por underscore)
- Fallback para `frameta_[timestamp].jpg` quando o campo está vazio

---

## [0.7.0] — 2026-04-16

Campo de assinatura do autor.

### Added
- Campo "Assinatura" no sidebar — texto livre para nome, perfil de rede social ou mensagem de copyright
- Assinatura aparece como pill extra no overlay, ao final dos campos de EXIF
- No modo sólido, assinatura aparece centralizada na barra
- Mesmo estilo visual dos demais pills (fonte menor, sem outline, discreta)
- Limite de 60 caracteres

---

## [0.6.1] — 2026-04-16

Correção de comportamento dos estilos Branco e Escuro.

### Fixed
- Estilos Branco e Escuro não expandem mais o canvas — a barra agora é sempre sobreposta sobre a imagem, mantendo a proporção original
- `barY` do modo bottom corrigido de `cropH` para `cropH - barH`
- Imagem sempre desenhada em `destY = 0`, sem deslocamento por posição da barra

### Added
- Slider de opacidade da barra (10%–100%) nos modos Branco e Escuro
- Slider aparece automaticamente ao selecionar Branco ou Escuro, e some no modo Overlay

---

## [0.6.0] — 2026-04-11

Refinamento de UX: campos no painel correto, slider unificado, pill de marca, tab Feedback.

### Added
- Tab **Feedback** na navegação — formulário Formspree com nome, e-mail e mensagem
- Pill obrigatório "frameta.vercel.app" ao final do bloco overlay, integrado ao bloco medido
- Campo de e-mail no formulário de feedback

### Changed
- Seção "Campos e ordem" movida para o painel direito (abaixo do debug EXIF)
- Botões P/M/G removidos — slider de fonte (60–160%) é o único controle de tamanho
- Pill de marca calculado junto com os demais — respeita os limites da imagem em qualquer escala
- Seção "Sugestões" migrada da página Sobre para a nova tab Feedback

### Fixed
- Pill obrigatório ultrapassava os limites da tela ao aumentar a fonte

---

## [0.5.0] — 2026-04-11

UX consolidada: sidebar compacto, campos unificados, slider de fonte, página Sobre completa.

### Added
- Botão "Baixar foto" movido para logo abaixo do botão "Abrir foto"
- Seção "Campos e ordem" unificada com drag-and-drop e toggle por linha, colapsável
- Slider de tamanho de fonte do overlay (60%–160%)
- Pill obrigatório "frameta.vercel.app" ao final do bloco overlay
- Página "Sobre" com seção Fale Conosco — Instagram, Facebook e LinkedIn
- Seção Sugestões com formulário Formspree (`mkopdybv`)

### Removed
- Painel "Campos visíveis" separado no painel direito
- Função `buildToggles()` dinâmica

---

## [0.4.0] — 2026-04-10

UI compacta, overlay sem fundo, seletor de tema.

### Added
- Estilo **Overlay** — texto branco com stroke preto, sem fundo sólido
- Seletor de tema: Claro / Escuro / Sistema (detecta `prefers-color-scheme` em tempo real)
- Tema escuro completo via `data-theme="dark"`
- Link "by Gustavo de Morais Simão" no header apontando para instagram.com/gsimao14

### Changed
- Estilo padrão alterado para Overlay
- Botões de posição reduzidos (28px) — sidebar cabe sem scroll na maioria das resoluções
- Sidebar mais compacto em espaçamentos e fontes

---

## [0.3.0] — 2026-04-10

Parser EXIF v4 — segue IFD chain completa.

### Fixed
- Segue IFD chain completa (IFD0 → IFD1 → ExifIFD)
- Suporte correto a big-endian (MM byte order)
- Scan de "Exif" nos primeiros 64 bytes do segmento APP1
- Arquivos exportados por Instagram/WhatsApp agora identificados corretamente como sem EXIF de câmera

### Added
- Painel "Raw EXIF debug" colapsável com log de diagnóstico
- Mensagem explicativa quando a foto teve EXIF removido por redes sociais

---

## [0.2.0] — 2026-04-10

Reescrita da arquitetura. Parser EXIF nativo. UI refinada.

### Added
- Parser EXIF binário nativo (`js/exif.js`) — sem CDN externo, funciona offline
- Suporte a byte order II (little endian) e MM (big endian)
- Leitura de tipos TIFF: BYTE, ASCII, SHORT, LONG, RATIONAL, SLONG, SRATIONAL
- Formatadores: `fmtShutter`, `fmtAperture`, `fmtFocal`, `fmtDate`
- Status badge EXIF: ok / limitado / ausente
- Módulo `render.js` com `FrametaRender.draw()`
- Controller `app.js` com estado centralizado
- Design system `css/main.css` com variáveis CSS — DM Sans + DM Mono
- Toast de feedback para todas as ações
- Tab "Sobre" com roadmap e créditos

### Fixed
- FNumber float bruto → `f/2.8`
- ExposureTime como objeto RATIONAL
- FocalLength não arredondado → `85mm`
- Data EXIF `2024:03:15` → `15/03/2024`

### Changed
- Removida dependência do `exifr` (CDN)
- Arquitetura: 1 arquivo → 4 arquivos (index.html, exif.js, render.js, app.js)

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
