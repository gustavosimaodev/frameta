/**
 * frameta/js/render.js
 * Renderização do canvas com a barra de metadados EXIF.
 *
 * Autor: Gustavo de Morais Simão
 */

window.FrametaRender = (() => {

  const FONT_MAP = {
    sans:  "'DM Sans', system-ui, sans-serif",
    mono:  "'DM Mono', 'Courier New', monospace",
    serif: "Georgia, 'Times New Roman', serif",
  };

  const FMT_RATIOS = {
    '1:1':    [1, 1],
    '4:5':    [4, 5],
    '9:16':   [9, 16],
    '16:9':   [16, 9],
    '1.91:1': [1.91, 1],
  };

  /* -------------------------------------------------------
     UTILITÁRIOS DE CANVAS
  ------------------------------------------------------- */
  function pill(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.arcTo(x + w, y,     x + w, y + h, rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.arcTo(x + w, y + h, x,     y + h, rad);
    ctx.lineTo(x + rad, y + h);
    ctx.arcTo(x,     y + h, x,     y,     rad);
    ctx.lineTo(x, y + rad);
    ctx.arcTo(x,     y,     x + w, y,     rad);
    ctx.closePath();
  }

  /* -------------------------------------------------------
     RENDER PRINCIPAL
  ------------------------------------------------------- */
  function draw(canvas, img, fields, opts) {
    const {
      style  = 'white',
      pos    = 'bl',
      fmt    = 'original',
      font   = 'sans',
      visible = {},
    } = opts;

    const ctx = canvas.getContext('2d');
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;

    // --- Crop pelo formato ---
    let cropW = sw, cropH = sh;
    if (fmt !== 'original' && FMT_RATIOS[fmt]) {
      const [rw, rh] = FMT_RATIOS[fmt];
      const targetR  = rw / rh;
      const srcR     = sw / sh;
      if (targetR > srcR) cropH = Math.round(sw / targetR);
      else                cropW = Math.round(sh * targetR);
    }

    // --- Altura da barra ---
    // Proporcional à largura da imagem, com mínimo absoluto de 90px
    // para garantir legibilidade mesmo em imagens pequenas.
    const barH = Math.max(90, Math.round(cropW * 0.062));
    const pad  = Math.round(barH * 0.30);

    // --- Posição da barra ---
    const isTop    = pos.startsWith('t');
    const isBottom = pos.startsWith('b');
    // middle (m) sobrepõe o centro da imagem
    // top/bottom: a barra CRESCE para fora da imagem
    const totalH = (isTop || isBottom) ? cropH + barH : cropH;

    canvas.width  = cropW;
    canvas.height = totalH;

    // Offsets do crop centralizado
    const ox = Math.floor((sw - cropW) / 2);
    const oy = Math.floor((sh - cropH) / 2);

    // Onde a imagem é desenhada dentro do canvas
    const imgDestY = isTop ? barH : 0;
    ctx.drawImage(img, ox, oy, cropW, cropH, 0, imgDestY, cropW, cropH);

    // Y inicial da barra
    let barY;
    if (isTop)    barY = 0;
    else if (isBottom) barY = cropH; // logo após a imagem
    else          barY = imgDestY + Math.floor((cropH - barH) / 2); // centro

    // --- Fundo da barra ---
    const isDark = style === 'dark';
    const isGlass = style === 'glass';

    if (isGlass) {
      ctx.fillStyle = 'rgba(0,0,0,0.48)';
    } else if (isDark) {
      ctx.fillStyle = '#0d0d0d';
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillRect(0, barY, cropW, barH);

    // Linha separadora sutil (apenas estilos sólidos)
    if (!isGlass) {
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      // Linha na borda que toca a imagem
      const lineY = isTop ? barH : barY;
      ctx.moveTo(0, lineY);
      ctx.lineTo(cropW, lineY);
      ctx.stroke();
    }

    // --- Cores ---
    const mainColor  = (isDark || isGlass) ? '#f0f0f0' : '#0d0d0d';
    const mutedColor = (isDark || isGlass) ? '#888888' : '#787878';
    const chipBg     = (isDark || isGlass) ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.055)';
    const divColor   = (isDark || isGlass) ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
    const fontFam    = FONT_MAP[font] || FONT_MAP.sans;

    // --- Tamanhos de fonte proporcionais ---
    const fsCam  = Math.max(14, Math.round(barH * 0.295));  // câmera
    const fsLens = Math.max(11, Math.round(barH * 0.210));  // lente
    const fsChip = Math.max(12, Math.round(barH * 0.235));  // chips

    ctx.textBaseline = 'middle';
    const midY = barY + barH / 2;

    // --- ESQUERDA: Câmera + Lente ---
    const showCamera = visible.camera !== false && fields.camera;
    const showLens   = visible.lens   !== false && fields.lens;

    let leftX = pad;

    if (showCamera && showLens) {
      // Duas linhas — câmera acima, lente abaixo
      const topLineY = barY + barH * 0.315;
      const botLineY = barY + barH * 0.720;
      ctx.fillStyle = mainColor;
      ctx.font = `600 ${fsCam}px ${fontFam}`;
      ctx.fillText(fields.camera, leftX, topLineY);
      ctx.fillStyle = mutedColor;
      ctx.font = `300 ${fsLens}px ${fontFam}`;
      ctx.fillText(fields.lens, leftX, botLineY);
    } else if (showCamera) {
      ctx.fillStyle = mainColor;
      ctx.font = `600 ${fsCam}px ${fontFam}`;
      ctx.fillText(fields.camera, leftX, midY);
    } else if (showLens) {
      ctx.fillStyle = mutedColor;
      ctx.font = `300 ${fsLens}px ${fontFam}`;
      ctx.fillText(fields.lens, leftX, midY);
    }

    // --- DIREITA: Chips de configuração ---
    const chips = [];
    if (visible.shutter  !== false && fields.shutter)  chips.push(fields.shutter);
    if (visible.aperture !== false && fields.aperture) chips.push(fields.aperture);
    if (visible.iso      !== false && fields.iso)      chips.push('ISO\u2009' + fields.iso);
    if (visible.focal    !== false && fields.focal)    chips.push(fields.focal);
    if (visible.date     !== false && fields.date)     chips.push(fields.date);

    ctx.font = `400 ${fsChip}px ${fontFam}`;

    const chipPadX = Math.round(fsChip * 0.65);
    const chipPadY = Math.round(fsChip * 0.30);
    const chipGap  = Math.round(barH * 0.09);
    const chipRad  = Math.round(fsChip * 0.38);
    const chipH    = fsChip + chipPadY * 2;
    const chipTopY = midY - chipH / 2;

    // Mede tudo antes de desenhar para garantir posicionamento correto
    const chipWidths = chips.map(c => {
      ctx.font = `400 ${fsChip}px ${fontFam}`;
      return ctx.measureText(c).width + chipPadX * 2;
    });

    let rx = cropW - pad;
    const chipsReversed = chips.slice().reverse();
    const widthsReversed = chipWidths.slice().reverse();

    chipsReversed.forEach((chip, i) => {
      const chipW = widthsReversed[i];
      const chipX = rx - chipW;

      ctx.fillStyle = chipBg;
      pill(ctx, chipX, chipTopY, chipW, chipH, chipRad);
      ctx.fill();

      ctx.fillStyle = mainColor;
      ctx.font = `400 ${fsChip}px ${fontFam}`;
      ctx.fillText(chip, chipX + chipPadX, midY);

      rx = chipX - chipGap;
    });

    // --- Divisória vertical ---
    if ((showCamera || showLens) && chips.length > 0) {
      const divX = rx - chipGap * 0.4;
      // Só desenha se houver espaço entre texto esquerdo e chips
      if (divX > leftX + 40) {
        ctx.strokeStyle = divColor;
        ctx.lineWidth   = Math.max(1, Math.round(barH * 0.012));
        ctx.beginPath();
        ctx.moveTo(divX, barY + barH * 0.20);
        ctx.lineTo(divX, barY + barH * 0.80);
        ctx.stroke();
      }
    }

    // --- Marca d'água "frameta" discreta (canto inferior direito da barra) ---
    const watermarkFontSize = Math.max(9, Math.round(barH * 0.14));
    ctx.font = `300 ${watermarkFontSize}px ${fontFam}`;
    ctx.fillStyle = (isDark || isGlass) ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.13)';
    const wmText = 'frameta';
    const wmW    = ctx.measureText(wmText).width;
    // Só exibe se não colidir com os chips
    if (rx - wmW - 16 > leftX + 60) {
      ctx.fillText(wmText, cropW - pad - wmW, barY + barH - watermarkFontSize * 0.8);
    }
  }

  return { draw };

})();
