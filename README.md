# Frameta — EXIF Watermark

> Adicione os dados técnicos das suas fotos como overlay tipográfico diretamente sobre a imagem, pronto para Instagram e outras redes sociais.

![Version](https://img.shields.io/badge/version-0.9.4-0d0d0d)
![Status](https://img.shields.io/badge/status-beta-c8a96e)
![License](https://img.shields.io/badge/license-MIT-green)

Desenvolvido por **Gustavo de Morais Simão** · [frameta.vercel.app](https://frameta.vercel.app)

---

## O que faz

O Frameta lê automaticamente os metadados EXIF gravados pela câmera (câmera, lente, velocidade, abertura, ISO, focal, data de captura) e os renderiza como pills tipográficos diretamente sobre a imagem — sem expandir o canvas, sem alterar a proporção original.

**Sem servidor. Sem conta. Sem upload para terceiros.** Tudo processa no browser.

---

## Funcionalidades

- Parser EXIF binário nativo — sem dependências externas, funciona offline
- Lê: câmera, lente, velocidade, abertura, ISO, focal, data de captura (DateTimeOriginal)
- **3 estilos:** Overlay (pills translúcidos), Branco, Escuro
- Controle de opacidade da barra (estilos Branco e Escuro)
- Controle de tamanho de fonte do overlay
- **4 posições de overlay** (cantos) — alinhamento automático do bloco pelo canto escolhido
- **2 posições de barra sólida** (topo / base)
- **6 formatos de exportação:** Original, 1:1, 4:5, 3:4, 9:16, 16:9
- **Canvas interativo:** arraste a imagem dentro do crop; slider de zoom (100–300%); duplo-clique para centralizar
- Visibilidade e ordem dos campos personalizáveis (drag-and-drop)
- Campo de assinatura livre (nome, perfil de rede social, copyright)
- Escolha do nome do arquivo ao salvar
- **Export JPEG ou PNG** — seletor antes do nome do arquivo
- **Batch mode:** múltiplas fotos com filmstrip; cada foto mantém suas próprias configurações de estilo, posição, zoom e visibilidade; exportação em ZIP
- 3 opções de fonte: DM Sans, DM Mono, Serif
- Tema claro / escuro / sistema
- Responsivo — desktop e mobile (bottom sheet)

---

## Estrutura do projeto

```
frameta/
├── index.html          # shell — tabs, sidebar, workspace, painéis
├── css/
│   └── main.css        # design system — variáveis, layout, mobile
├── js/
│   ├── exif.js         # parser binário JPEG/TIFF sem dependências
│   ├── render.js       # renderização canvas — overlay, barra sólida, zoom/offset
│   └── app.js          # controller — estado, eventos, batch, canvas drag
├── README.md
├── CHANGELOG.md
└── NOVIDADES.md
```

---

## Como usar localmente

```bash
git clone https://github.com/gustavosimaodev/frameta.git
cd frameta
open index.html   # macOS
```

Sem build. Sem npm install.

---

## Formatos de exportação

| Formato | Proporção | Uso principal |
|---|---|---|
| Original | — | Sem alteração |
| 1:1 Feed | 1:1 | Instagram quadrado |
| 4:5 Portrait | 4:5 | Instagram portrait |
| 3:4 Portrait | 3:4 | Portrait padrão |
| 9:16 Story | 9:16 | Stories / Reels / TikTok |
| 16:9 Wide | 16:9 | YouTube / Wide |

---

## Comportamento dos pills no overlay

Cada pill se ajusta à largura do seu conteúdo. O bloco inteiro se ancora no canto escolhido:

- **Cantos esquerdos (↖ ↙)** — pills crescem para a direita a partir da borda esquerda
- **Cantos direitos (↗ ↘)** — pills crescem para a esquerda a partir da borda direita

---

## Batch mode — configurações por foto

No modo batch cada foto armazena um snapshot independente de todas as configurações. Ao navegar no filmstrip a interface sincroniza automaticamente estilo, posição, formato, zoom, offset e visibilidade dos campos. O "Baixar todas" exporta cada foto com sua própria configuração.

---

## Deploy no Vercel

1. Push para o GitHub
2. Importe em [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Other** (static)
4. Deploy automático a cada push

---

## Licença

MIT © Gustavo de Morais Simão
