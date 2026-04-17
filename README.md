# Frameta — EXIF Watermark

> Adicione os dados técnicos das suas fotos como overlay diretamente sobre a imagem, pronto para o Instagram e outras redes sociais.

![Version](https://img.shields.io/badge/version-0.9.0-0d0d0d)
![Status](https://img.shields.io/badge/status-beta-c8a96e)
![License](https://img.shields.io/badge/license-MIT-green)

Desenvolvido por **Gustavo de Morais Simão**

---

## O que faz

O Frameta lê automaticamente os metadados EXIF gravados pela sua câmera (corpo, lente, velocidade, abertura, ISO, focal) e os renderiza como pills tipográficos diretamente sobre a imagem — sem fundo sólido, sem alterar a proporção original.

**Sem servidor. Sem conta. Sem upload para terceiros.** Tudo processa no browser.

---

## Funcionalidades

- Parser EXIF binário nativo — sem dependências externas, funciona offline
- Lê: câmera, lente, velocidade, abertura, ISO, focal, data
- 3 estilos: Overlay, Branco, Escuro
- Controle de opacidade da barra (estilos Branco e Escuro)
- Controle de tamanho de fonte do overlay
- 9 posições de overlay
- 6 formatos de exportação: original, 1:1, 4:5, 9:16, 16:9, 1.91:1
- Visibilidade e ordem dos campos personalizáveis (drag-and-drop)
- Campo de assinatura livre (nome, perfil, copyright)
- Escolha do nome do arquivo ao salvar
- Batch mode: carrega múltiplas fotos, navega pelo filmstrip, exporta tudo em ZIP
- 3 opções de fonte: DM Sans, DM Mono, Serif
- Tema claro / escuro / sistema
- Responsivo — funciona em desktop e mobile
- Export JPEG 95%

---

## Estrutura do projeto

```
frameta/
├── index.html          # shell da app — tabs, sidebar, workspace, painéis
├── css/
│   └── main.css        # design system — variáveis, layout, componentes, mobile
├── js/
│   ├── exif.js         # parser binário JPEG/TIFF — sem dependências
│   ├── render.js       # renderização canvas — overlay e barra sólida
│   └── app.js          # controller — estado, eventos, UI, batch mode
├── README.md
├── CHANGELOG.md
└── NOVIDADES.md
```

---

## Arquitetura

```
fileInput / dragDrop
      │
      ▼
loadBatch(files)
      │
      ├─ arquivo único → loadFile() → FrametaExif.parse()
      │                               FrametaExif.extract()
      │                               updateExifPanel()
      │                               render()
      │
      └─ múltiplos → batch[] com deep copy dos fields
                     buildFilmstrip()
                     activateBatchItem(0)
                          │
                          ▼
                     FrametaRender.draw(canvas, img, fields, opts)
                          │
                          ▼
                     canvas.toBlob() → download JPEG / ZIP
```

---

## Como usar

### Localmente

```bash
git clone https://github.com/seu-usuario/frameta.git
cd frameta
open index.html   # macOS
```

Sem build. Sem npm install.

### Deploy no Vercel

1. Push para o GitHub
2. Importe em [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Other** (static)
4. Deploy

---

## Formatos suportados

| Plataforma | Proporção | Resolução base |
|---|---|---|
| Instagram Feed | 1:1 | 1080 × 1080 |
| Instagram Portrait | 4:5 | 1080 × 1350 |
| Instagram / TikTok Story | 9:16 | 1080 × 1920 |
| YouTube / Wide | 16:9 | 1280 × 720 |
| X / Twitter | 1.91:1 | 1600 × 836 |
| Original | — | sem alteração |

---

## Roadmap

Ver [`CHANGELOG.md`](./CHANGELOG.md) para versões lançadas e [`NOVIDADES.md`](./NOVIDADES.md) para o resumo em linguagem acessível.

---

## Licença

MIT © Gustavo de Morais Simão
