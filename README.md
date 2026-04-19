# Frameta — EXIF Watermark

> Adicione os dados técnicos das suas fotos como overlay tipográfico diretamente sobre a imagem, pronto para Instagram e outras redes sociais.

![Version](https://img.shields.io/badge/version-0.9.3-0d0d0d)
![Status](https://img.shields.io/badge/status-beta-c8a96e)
![License](https://img.shields.io/badge/license-MIT-green)

Desenvolvido por **Gustavo de Morais Simão** · [frameta.vercel.app](https://frameta.vercel.app)

---

## O que faz

O Frameta lê automaticamente os metadados EXIF gravados pela câmera (corpo, lente, velocidade, abertura, ISO, focal, data) e os renderiza como pills tipográficos diretamente sobre a imagem — sem expandir o canvas, sem alterar a proporção original.

**Sem servidor. Sem conta. Sem upload para terceiros.** Tudo processa no browser.

---

## Funcionalidades

- Parser EXIF binário nativo — sem dependências externas, funciona offline
- Lê: câmera, lente, velocidade, abertura, ISO, focal, data de captura
- **3 estilos:** Overlay (pills translúcidos), Branco, Escuro
- Controle de opacidade da barra (estilos Branco e Escuro)
- Controle de tamanho de fonte do overlay
- **4 posições de overlay** (cantos) com alinhamento automático do bloco pelo canto
- **2 posições de barra sólida** (topo / base)
- **6 formatos de exportação:** Original, 1:1, 4:5, 3:4, 9:16, 16:9
- **Canvas interativo:** arraste a imagem dentro do crop ao mudar o formato; slider de zoom; duplo-clique para centralizar
- Visibilidade e ordem dos campos personalizáveis (drag-and-drop)
- Campo de assinatura livre (nome, perfil, copyright)
- Escolha do nome do arquivo ao salvar
- **Batch mode:** carrega múltiplas fotos, navega pelo filmstrip, exporta em ZIP
- 3 opções de fonte: DM Sans, DM Mono, Serif
- Tema claro / escuro / sistema
- Responsivo — desktop e mobile (bottom sheet)
- Export JPEG 95%

---

## Estrutura do projeto

```
frameta/
├── index.html          # shell — tabs, sidebar, workspace, painéis
├── css/
│   └── main.css        # design system — variáveis, layout, mobile
├── js/
│   ├── exif.js         # parser binário JPEG/TIFF sem dependências
│   ├── render.js       # renderização canvas — overlay e barra sólida
│   └── app.js          # controller — estado, eventos, batch, canvas drag
├── README.md
├── CHANGELOG.md
└── NOVIDADES.md
```

---

## Como usar

### Localmente

```bash
git clone https://github.com/gustavosimaodev/frameta.git
cd frameta
open index.html   # macOS
```

Sem build. Sem npm install.

### Deploy no Vercel

1. Push para o GitHub
2. Importe em [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Other** (static)
4. Deploy automático a cada push

---

## Formatos de exportação

| Formato | Proporção | Uso |
|---|---|---|
| Original | — | Sem alteração |
| 1:1 Feed | 1:1 | Instagram quadrado |
| 4:5 Portrait | 4:5 | Instagram portrait |
| 3:4 Portrait | 3:4 | Portrait padrão |
| 9:16 Story | 9:16 | Stories / Reels / TikTok |
| 16:9 Wide | 16:9 | YouTube / Wide |

---

## Comportamento do alinhamento do overlay

Cada pill se ajusta à largura do seu conteúdo. O bloco inteiro se ancora no canto escolhido:

- **Cantos esquerdos (↖ ↙)** — pills ancorados à esquerda, crescem para a direita
- **Cantos direitos (↗ ↘)** — pills ancorados à direita, crescem para a esquerda

---

## Licença

MIT © Gustavo de Morais Simão
