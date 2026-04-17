# Novidades do Frameta

Resumo das atualizações em linguagem acessível.

---

## Versão atual — 0.9.0 (17 de abril de 2026)

### 🧹 Código mais limpo e estável
Fizemos uma revisão completa do código removendo tentativas de correção acumuladas que estavam causando conflitos. O resultado é um app mais previsível e fácil de manter.

### 📦 Download em lote via ZIP (restaurado)
O botão "Baixar todas" agora gera um arquivo ZIP com todas as fotos processadas — mais confiável do que downloads individuais em sequência, especialmente no macOS e Safari.

### ✍️ Assinatura aparece corretamente no overlay
O campo de assinatura agora é exibido corretamente como pill discreto sobre a imagem, logo antes da marca "frameta.vercel.app".

---

## Versão 0.8 (16 de abril de 2026)

### 📸 Várias fotos de uma vez (Batch mode)
Abra múltiplas fotos ao mesmo tempo. Uma tira de miniaturas aparece abaixo da imagem para você navegar entre elas. Ao clicar em "Baixar todas", todas as fotos são exportadas em um único arquivo ZIP com o overlay aplicado.

### ✍️ Campo de assinatura
Adicione seu nome, perfil de rede social ou mensagem de copyright. O texto aparece discretamente como pill extra no overlay.

### 💾 Nome do arquivo personalizado
Defina o nome do arquivo antes de baixar. Se deixar em branco, o Frameta usa o nome original da foto.

### 📱 Interface adaptada para celular
O painel de configurações fica recolhido no celular para não atrapalhar a visualização. Toque em "Configurações" para expandir quando precisar ajustar algo.

### 🌓 Tema claro, escuro ou automático
A interface acompanha a preferência do seu sistema operacional automaticamente.

### 🎨 Opacidade da barra
Nos estilos Branco e Escuro, um slider controla a transparência da barra — sem alterar a proporção da imagem.

### 📐 Proporção preservada
Corrigimos um bug em que os estilos Branco e Escuro adicionavam espaço extra à imagem. Agora a barra é sempre sobreposta sobre a foto.

---

## Versão 0.4–0.5 (11 de abril de 2026)

- Novo estilo **Overlay**: dados EXIF diretamente sobre a foto, sem fundo
- Campos reordenáveis por arrastar
- Controle de tamanho dos textos
- Página "Sobre" com links de contato
- Tab **Feedback** para enviar sugestões

---

## Versão 0.1–0.3 (9–10 de abril de 2026)

- Lançamento do Frameta
- Parser EXIF próprio, sem dependências externas
- Suporte a Canon, Sony, Nikon, Fuji e outras câmeras
- Detecção de fotos sem EXIF (exportadas por Instagram ou WhatsApp)

---

## O que vem por aí

- **Reposicionamento da imagem no canvas** ao mudar o formato de saída
- **Compartilhamento direto** para Instagram, WhatsApp e outras redes
- **App mobile** (iOS e Android)
- **Plugin para Lightroom**

---

*Frameta é desenvolvido por Gustavo de Morais Simão · [frameta.vercel.app](https://frameta.vercel.app)*
