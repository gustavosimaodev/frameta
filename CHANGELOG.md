# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### v0.7.0 — Canvas interativo com crop e posicionamento
> Permite ao usuário reposicionar e escalar a imagem dentro do canvas ao mudar o formato de exportação (1:1, 4:5, 9:16 etc.), em vez do crop automático centralizado atual.
- [ ] Canvas secundário interativo com handles de arrastar e redimensionar
- [ ] Preview do recorte em tempo real ao mudar o formato
- [ ] Botão "centralizar" para voltar ao crop automático
- [ ] Zoom in/out com scroll ou pinch

### v0.8.0 — Batch mode (múltiplas fotos)
> Permitir carregar diversas imagens em uma única sessão, percorrer cada uma individualmente para previsualização e ajuste fino, e exportar todas com o mesmo conjunto de configurações de overlay aplicado em massa.
- [ ] Upload múltiplo — seleção de N arquivos de uma vez ou drag de vários
- [ ] Filmstrip / carrossel de miniaturas para navegar entre as fotos carregadas
- [ ] Configurações globais: aplicar estilo, posição, tamanho e ordem a todas de uma vez
- [ ] Override por foto: permitir ajuste individual antes de exportar
- [ ] Exportar todas — download em ZIP com todas as imagens processadas
- [ ] Indicador de progresso por foto durante o processamento em lote
- [ ] Contador de fotos na interface (ex: "3 / 12")

### Web (geral)
- [ ] Upload de logo própria na barra / overlay
- [ ] Color picker para cor de fundo e texto dos pills
- [ ] Salvar preferências no localStorage (estilo, posição, ordem, tamanho)
- [ ] Export em PNG além de JPEG
- [ ] Web Share API — compartilhar direto do browser
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

## [0.6.0] — 2026-04-11

Refinamento de UX: campos no painel correto, slider unificado, pill de marca integrado ao bloco, tab Feedback separada.

### Added
- Tab **Feedback** na navegação principal — mesma aparência das demais páginas, formulário Formspree com campos de nome, e-mail e mensagem
- Campo de e-mail adicionado ao formulário de feedback
- Pill obrigatório "frameta.vercel.app" integrado ao bloco overlay medido — acompanha posicionamento, tamanho e respeitando os limites da imagem em qualquer escala de fonte

### Changed
- Seção "Campos e ordem" movida de volta para o painel direito (abaixo do debug EXIF) — sidebar esquerdo reservado apenas para controles de renderização
- Botões P/M/G de tamanho overlay removidos — slider de fonte (60–160%) é o único controle, mapeando internamente para sm/md/lg
- Pill de marca agora entra no array `measured` junto com os demais itens — altura total do bloco calculada corretamente incluindo a marca, sem ultrapassar os limites da imagem
- Seção "Sugestões" removida da página Sobre — conteúdo migrado para a nova tab Feedback

### Fixed
- Pill obrigatório ultrapassava os limites da tela ao aumentar a fonte — corrigido ao incluí-lo no cálculo de `totalPillH`

---

## [0.5.0] — 2026-04-11

UX consolidada: sidebar compacto, campos unificados, slider de fonte, pill de marca, página Sobre completa.

### Added
- Botão "Baixar foto" movido para logo abaixo do botão "Abrir foto" — sem necessidade de rolar o sidebar
- Seção "Campos e ordem" unificada: drag-and-drop e toggle de visibilidade na mesma linha por campo, com header colapsável
- Slider de tamanho de fonte do overlay (60% a 160%) — controle independente do tamanho geral do bloco
- Pill obrigatório "frameta.vercel.app" ao final do bloco overlay — não removível, estilo discreto diferenciado dos demais pills
- Página "Sobre" expandida com seção **Fale conosco** — links para Instagram, Facebook e LinkedIn com ícones SVG, abertura em nova aba
- Seção **Sugestões** na página "Sobre" — formulário funcional via Formspree (`mkopdybv`), sem backend próprio
- WhatsApp omitido por decisão do autor — pode ser adicionado futuramente

### Changed
- Sidebar reestruturado para eliminar scroll na maioria das resoluções
- Seção "Tamanho overlay" agora inclui o slider de fonte, consolidando controles relacionados
- Roadmap da página "Sobre" atualizado para refletir versões planejadas reais
- Crédito no rodapé da página Sobre agora inclui link para frameta.vercel.app

### Removed
- Painel "Campos visíveis" separado no painel direito — substituído pelo painel unificado no sidebar
- Função `buildToggles()` dinâmica — substituída por toggles estáticos no HTML com listeners diretos

### Lightroom Plugin
- [ ] Scaffold Lua com Lightroom SDK
- [ ] Leitura de metadados do catálogo na exportação
- [ ] Preset de overlay salvo por perfil

### Infra
- [ ] Domínio próprio (frameta.com / frameta.app)
- [ ] Analytics privacy-first (Plausible)
- [ ] PWA — instalável como app no desktop e mobile
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
