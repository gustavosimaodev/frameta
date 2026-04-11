/**
 * frameta/js/render.js — v2
 * Estilos: white/dark = barra sólida | overlay = sem fundo, texto com stroke
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

  /* ── UTILITÁRIO: desenha texto com stroke (outline) ───── */
  function strokeText(ctx, text, x, y, fontSize, strokeW) {
    ctx.lineWidth   = strokeW;
    ctx.lineJoin    = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  /* ── UTILITÁRIO: pill background ─────────────────────── */
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

  /* ── RENDER PRINCIPAL ─────────────────────────────────── */
  function draw(canvas, img, fields, opts) {
    const {
      style   = 'overlay',
      pos     = 'bl',
      fmt     = 'original',
      font    = 'sans',
      visible = {},
    } = opts;

    const ctx = canvas.getContext('2d');
    const sw  = img.naturalWidth;
    const sh  = img.naturalHeight;

    // ── Crop pelo formato ──────────────────────────────────
    let cropW = sw, cropH = sh;
    if (fmt !== 'original' && FMT_RATIOS[fmt]) {
      const [rw, rh] = FMT_RATIOS[fmt];
      const targetR  = rw / rh;
      const srcR     = sw / sh;
      if (targetR > srcR) cropH = Math.round(sw / targetR);
      else                cropW = Math.round(sh * targetR);
    }

    const isOverlay = style === 'overlay';
    const isDark    = style === 'dark';

    // ── Altura da barra ────────────────────────────────────
    // Overlay: maior (0.085) para texto mais legível sobre a imagem
    // Sólido: mantém 0.062
    const barRatio = isOverlay ? 0.085 : 0.062;
    const barH = Math.max(isOverlay ? 110 : 90, Math.round(cropW * barRatio));
    const pad  = Math.round(barH * 0.28);

    // ── Posição e tamanho total do canvas ─────────────────
    const isTop    = pos.startsWith('t');
    const isBottom = pos.startsWith('b');

    // Overlay sempre fica sobre a imagem (não expande o canvas)
    // Sólido top/bottom: expande
    const expandCanvas = !isOverlay && (isTop || isBottom);
    const totalH = expandCanvas ? cropH + barH : cropH;

    canvas.width  = cropW;
    canvas.height = totalH;

    const ox = Math.floor((sw - cropW) / 2);
    const oy = Math.floor((sh - cropH) / 2);

    // Onde a imagem vai no canvas
    const imgDestY = (!isOverlay && isTop) ? barH : 0;
    ctx.drawImage(img, ox, oy, cropW, cropH, 0, imgDestY, cropW, cropH);

    // Y do topo da barra
    let barY;
    if (isOverlay) {
      // Overlay: sempre sobre a imagem
      if (isTop)         barY = 0;
      else if (isBottom) barY = cropH - barH;
      else               barY = Math.floor((cropH - barH) / 2);
    } else {
      if (isTop)         barY = 0;
      else if (isBottom) barY = cropH; // abaixo da imagem (canvas expandido)
      else               barY = imgDestY + Math.floor((cropH - barH) / 2);
    }

    // ── Fundo da barra (apenas estilos sólidos) ───────────
    if (!isOverlay) {
      ctx.fillStyle = isDark ? '#0d0d0d' : '#ffffff';
      ctx.fillRect(0, barY, cropW, barH);
      // Linha divisória
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const lineY = isTop ? barH : barY;
      ctx.moveTo(0, lineY);
      ctx.lineTo(cropW, lineY);
      ctx.stroke();
    }

    // ── Configuração de fonte e cores ─────────────────────
    const fontFam = FONT_MAP[font] || FONT_MAP.sans;

    // Overlay: sempre branco com stroke preto
    // Sólido: segue o tema
    const mainColor  = (!isOverlay && !isDark) ? '#0d0d0d' : '#ffffff';
    const mutedColor = (!isOverlay && !isDark) ? '#666666' : 'rgba(255,255,255,0.75)';
    const chipBg     = (!isOverlay && !isDark) ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)';
    const divColor   = (!isOverlay && !isDark) ? 'rgba(0,0,0,0.10)'  : 'rgba(255,255,255,0.15)';

    // Stroke width proporcional (só no overlay)
    const strokeW = isOverlay ? Math.max(3, Math.round(barH * 0.028)) : 0;

    // Tamanhos de fonte — overlay maior
    const fsCam  = Math.max(isOverlay?18:14, Math.round(barH * (isOverlay ? 0.32 : 0.295)));
    const fsLens = Math.max(isOverlay?13:11, Math.round(barH * (isOverlay ? 0.22 : 0.210)));
    const fsChip = Math.max(isOverlay?14:12, Math.round(barH * (isOverlay ? 0.25 : 0.235)));

    ctx.textBaseline = 'middle';
    const midY = barY + barH / 2;

    // ── ESQUERDA: Câmera + Lente ──────────────────────────
    const showCamera = visible.camera !== false && fields.camera;
    const showLens   = visible.lens   !== false && fields.lens;
    const leftX = pad;

    const drawText = (text, x, y, fs, weight, color, isMuted) => {
      ctx.font      = `${weight} ${fs}px ${fontFam}`;
      ctx.fillStyle = isMuted ? mutedColor : mainColor;
      if (isOverlay) {
        strokeText(ctx, text, x, y, fs, strokeW);
      } else {
        ctx.fillText(text, x, y);
      }
    };

    if (showCamera && showLens) {
      const topLineY = barY + barH * 0.315;
      const botLineY = barY + barH * 0.720;
      drawText(fields.camera, leftX, topLineY, fsCam,  '700', mainColor,  false);
      drawText(fields.lens,   leftX, botLineY, fsLens, '300', mutedColor, true);
    } else if (showCamera) {
      drawText(fields.camera, leftX, midY, fsCam,  '700', mainColor, false);
    } else if (showLens) {
      drawText(fields.lens,   leftX, midY, fsLens, '300', mutedColor, true);
    }

    // ── DIREITA: Chips ────────────────────────────────────
    const chips = [];
    if (visible.shutter  !== false && fields.shutter)  chips.push(fields.shutter);
    if (visible.aperture !== false && fields.aperture) chips.push(fields.aperture);
    if (visible.iso      !== false && fields.iso)      chips.push('ISO\u2009' + fields.iso);
    if (visible.focal    !== false && fields.focal)    chips.push(fields.focal);
    if (visible.date     !== false && fields.date)     chips.push(fields.date);

    ctx.font = `400 ${fsChip}px ${fontFam}`;

    const chipPadX = Math.round(fsChip * 0.65);
    const chipPadY = Math.round(fsChip * 0.30);
    const chipGap  = Math.round(barH * 0.08);
    const chipRad  = Math.round(fsChip * 0.38);
    const chipH    = fsChip + chipPadY * 2;
    const chipTopY = midY - chipH / 2;

    const chipWidths = chips.map(c => {
      ctx.font = `400 ${fsChip}px ${fontFam}`;
      return ctx.measureText(c).width + chipPadX * 2;
    });

    let rx = cropW - pad;
    chips.slice().reverse().forEach((chip, i) => {
      const chipW = chipWidths[chipWidths.length - 1 - i];
      const chipX = rx - chipW;

      if (isOverlay) {
        // Overlay: pill com fundo semitransparente escuro + texto branco com stroke
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        pill(ctx, chipX, chipTopY, chipW, chipH, chipRad);
        ctx.fill();
        ctx.font      = `400 ${fsChip}px ${fontFam}`;
        ctx.fillStyle = '#ffffff';
        strokeText(ctx, chip, chipX + chipPadX, midY, fsChip, strokeW * 0.6);
      } else {
        ctx.fillStyle = chipBg;
        pill(ctx, chipX, chipTopY, chipW, chipH, chipRad);
        ctx.fill();
        ctx.fillStyle = mainColor;
        ctx.font      = `400 ${fsChip}px ${fontFam}`;
        ctx.fillText(chip, chipX + chipPadX, midY);
      }

      rx = chipX - chipGap;
    });

    // ── Divisória vertical ────────────────────────────────
    if ((showCamera || showLens) && chips.length > 0) {
      const divX = rx - chipGap * 0.4;
      if (divX > leftX + 40) {
        ctx.strokeStyle = isOverlay ? 'rgba(255,255,255,0.35)' : divColor;
        ctx.lineWidth   = Math.max(1, Math.round(barH * 0.012));
        ctx.beginPath();
        ctx.moveTo(divX, barY + barH * 0.20);
        ctx.lineTo(divX, barY + barH * 0.80);
        ctx.stroke();
      }
    }

    // ── Marca frameta discreta ────────────────────────────
    const wmFs = Math.max(9, Math.round(barH * 0.13));
    ctx.font      = `300 ${wmFs}px ${fontFam}`;
    ctx.fillStyle = isOverlay ? 'rgba(255,255,255,0.22)' :
                    isDark    ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)';
    const wmText = 'frameta';
    const wmW    = ctx.measureText(wmText).width;
    if (rx - wmW - 16 > leftX + 60) {
      ctx.fillText(wmText, cropW - pad - wmW, barY + barH - wmFs * 0.8);
    }
  }

  return { draw };

})();
