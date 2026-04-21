# Novidades do Frameta

Resumo das atualizações em linguagem acessível.

---

## Versão atual — 0.9.4 (21 de abril de 2026)

### 🎛️ Cada foto com suas próprias configurações (Batch mode)
Ao abrir várias fotos de uma vez, cada uma agora guarda individualmente seu estilo (Overlay, Branco, Escuro), posição, formato de recorte, zoom, offset e quais campos exibir. Ao navegar no filmstrip, a interface toda sincroniza automaticamente com a foto selecionada. O botão "Baixar todas" exporta cada foto com exatamente as configurações que você definiu para ela.

### 🖼️ Export em PNG além de JPEG
Dois botões aparecem antes do campo de nome do arquivo — JPEG (padrão) e PNG. A escolha vale tanto para o download individual quanto para o ZIP do batch.

### 🏠 Logo leva para o início
Clicar na logo "frameta" no cabeçalho recarrega a aplicação, voltando para a tela inicial.

### 🔢 Versão no cabeçalho
O número de versão atual aparece discretamente ao lado da logo para referência rápida.

---

## Versão 0.9.3 (19 de abril de 2026)

### 🔧 Canvas interativo restaurado
O arraste da imagem e o slider de zoom voltaram a funcionar corretamente após uma reescrita anterior que havia removido essas funções.

### 📌 Pills alinhados pelo canto
Os campos de dados agora se alinham corretamente pelo canto escolhido — canto direito ancora pela borda direita, canto esquerdo pela borda esquerda.

### 📱 Bottom sheet mobile refatorado
O painel de configurações no celular ganhou bordas arredondadas, animação mais suave e handle de arraste mais visível.

---

## Versão 0.9.0–0.9.2 (19 de abril de 2026)

### 🖱️ Arraste a imagem dentro do recorte
Ao escolher um formato de saída (1:1, 4:5, 9:16 etc.), você pode arrastar a imagem para enquadrar exatamente o que quer mostrar. Um slider de zoom (100%–300%) e um botão de reset completam o controle.

### 📐 Posições contextuais
O Overlay mostra 4 opções de canto (↖ ↗ ↙ ↘). Os estilos Branco e Escuro mostram topo ou base (↑ ↓). Os botões mudam automaticamente ao trocar de estilo.

### 📅 Data como primeiro campo
O campo de data agora aparece habilitado e em primeiro lugar por padrão.

### 📏 Novo formato 3:4 Portrait
Adicionado ao lado do 4:5 Portrait — útil para proporções padrão de câmera.

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

- **Compartilhamento direto** para Instagram, WhatsApp e outras redes
- **Upload de logo própria** no overlay
- **App mobile** (iOS e Android)
- **Plugin para Lightroom**

---

*Frameta é desenvolvido por Gustavo de Morais Simão · [frameta.vercel.app](https://frameta.vercel.app)*
