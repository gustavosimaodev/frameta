/**
 * frameta/js/render.js — v3
 * Overlay: coluna única, todos os itens com pill translúcido, tamanho configurável.
 * Sólido: barra horizontal clássica.
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

  // Tamanho da overlay — multiplicador base
  const OVERLAY_SCALE = { sm: 0.72, md: 1.0, lg: 1.40 };

  /* ── pill background ─────────────────────────────────── */
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

  /* ── texto com outline preto para legibilidade ────────── */
  function outlineText(ctx, text, x, y, strokeW) {
    ctx.lineJoin    = 'round';
    ctx.lineWidth   = strokeW;
    ctx.strokeStyle = 'rgba(0,0,0,0.80)';
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  /* ── RENDER PRINCIPAL ─────────────────────────────────── */
  function draw(canvas, img, fields, opts) {
    const {
      style       = 'overlay',
      pos         = 'bl',
      fmt         = 'original',
      font        = 'sans',
      overlaySize = 'md',
      fontScale   = 1.0,
      barOpacity  = 1.0,
      signature   = '',
      visible     = {},
      order       = ['camera','lens','shutter','aperture','iso','focal','date'],
    } = opts;

    const ctx = canvas.getContext('2d');
    const sw  = img.naturalWidth;
    const sh  = img.naturalHeight;

    /* ── Crop ─────────────────────────────────────────── */
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
    const fontFam   = FONT_MAP[font] || FONT_MAP.sans;

    /* ── Posição ──────────────────────────────────────── */
    const isTop    = pos.startsWith('t');
    const isBottom = pos.startsWith('b');
    const isLeft   = pos.endsWith('l');
    const isRight  = pos.endsWith('r');

    /* ── Canvas — sempre mantém proporção da imagem ───── */
    // Nenhum estilo expande o canvas. A barra é sempre sobreposição.
    const barH = Math.max(90, Math.round(cropW * 0.062));

    canvas.width  = cropW;
    canvas.height = cropH;

    /* ── Desenha a foto ───────────────────────────────── */
    const ox = Math.floor((sw - cropW) / 2);
    const oy = Math.floor((sh - cropH) / 2);
    ctx.drawImage(img, ox, oy, cropW, cropH, 0, 0, cropW, cropH);

    /* ════════════════════════════════════════════════════
       MODO OVERLAY — coluna de pills
    ════════════════════════════════════════════════════ */
    if (isOverlay) {
      const scale = OVERLAY_SCALE[overlaySize] || 1.0;

      // Tamanho base proporcional à largura da imagem
      const baseFs   = Math.max(13, Math.round(cropW * 0.022)) * scale * fontScale;
      const labelFs  = Math.max(9,  Math.round(cropW * 0.014)) * scale * fontScale;
      const pillPadX = Math.round(baseFs * 0.75);
      const pillPadY = Math.round(baseFs * 0.38);
      const pillGap  = Math.round(baseFs * 0.28);
      const pillRad  = Math.round(baseFs * 0.45);
      const strokeW  = Math.max(2, Math.round(baseFs * 0.10));

      // Margem da borda da imagem
      const margin = Math.round(cropW * 0.025);

      /* Monta lista de itens na ordem definida pelo usuário */
      const LABELS = {
        camera: null, lens: null,
        shutter: '1/T', aperture: 'f/', iso: 'ISO', focal: 'mm', date: 'DATA',
      };

      const items = [];
      order.forEach(key => {
        if (visible[key] === false) return;
        const val = fields[key];
        if (!val) return;
        items.push({ key, value: val });
      });

      // Assinatura do usuário (opcional) — antes da marca
      if (signature) {
        items.push({ key: '_signature', value: signature, isSignature: true });
      }

      // Pill obrigatório de marca — sempre ao final
      items.push({ key: '_brand', value: 'frameta.vercel.app', isBrand: true });

      if (items.length <= 1) return; // sem dados reais — não renderiza

      /* Mede cada pill — incluindo o de marca */
      ctx.textBaseline = 'middle';
      const measured = items.map(item => {
        const isCamLens   = item.key === 'camera' || item.key === 'lens';
        const isBrand     = !!item.isBrand;
        const isSignature = !!item.isSignature;
        const isDiscrete  = isBrand || isSignature;
        const fs = isDiscrete
          ? Math.max(9, Math.round(baseFs * 0.60))
          : baseFs;
        const fw = isDiscrete ? '300' : item.key === 'camera' ? '700' : '400';
        ctx.font = `${fw} ${fs}px ${fontFam}`;
        const tw = ctx.measureText(item.value).width;
        const px = isDiscrete ? Math.round(fs * 0.65) : pillPadX;
        const py = isDiscrete ? Math.round(fs * 0.30) : pillPadY;
        return { ...item, fs, fw, tw, pw: tw + px * 2, ph: fs + py * 2, px, py, isDiscrete };
      });

      // Largura do bloco = pill mais largo
      const blockW = Math.max(...measured.map(m => m.pw));

      // Altura total incluindo gaps
      const totalPillH = measured.reduce((s, m) => s + m.ph, 0)
                       + pillGap * (measured.length - 1)
                       + Math.round(pillGap * 0.6); // gap extra antes da marca

      /* Posição X do bloco */
      let blockX;
      if (isLeft)        blockX = margin;
      else if (isRight)  blockX = cropW - margin - blockW;
      else               blockX = Math.round((cropW - blockW) / 2);

      /* Posição Y do bloco */
      let blockY;
      if (isTop)         blockY = margin;
      else if (isBottom) blockY = cropH - margin - totalPillH;
      else               blockY = Math.round((cropH - totalPillH) / 2);

      /* Desenha cada pill — largura ajustada ao conteúdo, alinhado pelo canto */
      let currentY = blockY;
      measured.forEach((item, idx) => {
        const isDiscrete = !!item.isDiscrete;

        // Gap extra antes de itens discretos
        if (isDiscrete && idx > 0) currentY += Math.round(pillGap * 0.6);

        // Pill alinhado pelo canto: âncora direita ou esquerda
        const pillX = isRight ? blockX + blockW - item.pw : blockX;

        // Fundo
        const bgAlpha = isDiscrete ? 0.28 : 0.42;
        ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
        pill(ctx, pillX, currentY, item.pw, item.ph, pillRad);
        ctx.fill();

        // Borda
        ctx.strokeStyle = isDiscrete ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.12)';
        ctx.lineWidth   = 1;
        pill(ctx, pillX, currentY, item.pw, item.ph, pillRad);
        ctx.stroke();

        // Texto com padding natural dentro do pill
        const textY = currentY + item.ph / 2;
        ctx.font      = `${item.fw} ${item.fs}px ${fontFam}`;
        ctx.fillStyle = isDiscrete ? 'rgba(255,255,255,0.55)' : '#ffffff';
        ctx.textAlign = 'left';
        const textX   = pillX + item.px;

        if (isDiscrete) {
          ctx.fillText(item.value, textX, textY);
        } else {
          outlineText(ctx, item.value, textX, textY, strokeW);
        }

        currentY += item.ph + pillGap;
      });

      ctx.textAlign = 'left'; // reset

      return; // encerra o modo overlay
    }

    /* ════════════════════════════════════════════════════
       MODO SÓLIDO — barra horizontal sobre a imagem
    ════════════════════════════════════════════════════ */
    const pad = Math.round(barH * 0.28);

    // barY sempre dentro da imagem (nunca expande)
    let barY;
    if (isTop)         barY = 0;
    else if (isBottom) barY = cropH - barH;
    else               barY = Math.floor((cropH - barH) / 2);

    // Cor base com opacidade configurável
    const solidAlpha = Math.max(0, Math.min(1, barOpacity));
    if (isDark) {
      ctx.fillStyle = `rgba(13,13,13,${solidAlpha})`;
    } else {
      ctx.fillStyle = `rgba(255,255,255,${solidAlpha})`;
    }
    ctx.fillRect(0, barY, cropW, barH);

    // Linha divisória proporcional à opacidade
    if (solidAlpha > 0.1) {
      ctx.strokeStyle = isDark
        ? `rgba(255,255,255,${0.07 * solidAlpha})`
        : `rgba(0,0,0,${0.06 * solidAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const lineY = isTop ? barH : barY;
      ctx.moveTo(0, lineY); ctx.lineTo(cropW, lineY);
      ctx.stroke();
    }

    const mainColor  = isDark ? '#ffffff' : '#0d0d0d';
    const mutedColor = isDark ? 'rgba(255,255,255,0.65)' : '#666666';
    const chipBg     = isDark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.055)';
    const divColor   = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

    const fsCam  = Math.max(14, Math.round(barH * 0.295));
    const fsLens = Math.max(11, Math.round(barH * 0.210));
    const fsChip = Math.max(12, Math.round(barH * 0.235));

    ctx.textBaseline = 'middle';
    const midY  = barY + barH / 2;
    const leftX = pad;

    const showCamera = visible.camera !== false && fields.camera;
    const showLens   = visible.lens   !== false && fields.lens;

    if (showCamera && showLens) {
      ctx.fillStyle = mainColor; ctx.font = `700 ${fsCam}px ${fontFam}`;
      ctx.fillText(fields.camera, leftX, barY + barH * 0.315);
      ctx.fillStyle = mutedColor; ctx.font = `300 ${fsLens}px ${fontFam}`;
      ctx.fillText(fields.lens,   leftX, barY + barH * 0.720);
    } else if (showCamera) {
      ctx.fillStyle = mainColor; ctx.font = `700 ${fsCam}px ${fontFam}`;
      ctx.fillText(fields.camera, leftX, midY);
    } else if (showLens) {
      ctx.fillStyle = mutedColor; ctx.font = `300 ${fsLens}px ${fontFam}`;
      ctx.fillText(fields.lens,   leftX, midY);
    }

    const chips = [];
    order.forEach(key => {
      if (['camera','lens'].includes(key)) return;
      if (visible[key] === false) return;
      const val = fields[key];
      if (!val) return;
      if (key === 'iso')    chips.push('ISO\u2009' + val);
      else                   chips.push(val);
    });

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
      ctx.fillStyle = chipBg;
      pill(ctx, chipX, chipTopY, chipW, chipH, chipRad);
      ctx.fill();
      ctx.fillStyle = mainColor;
      ctx.font = `400 ${fsChip}px ${fontFam}`;
      ctx.fillText(chip, chipX + chipPadX, midY);
      rx = chipX - chipGap;
    });

    if ((showCamera || showLens) && chips.length > 0) {
      const divX = rx - chipGap * 0.4;
      if (divX > leftX + 40) {
        ctx.strokeStyle = divColor;
        ctx.lineWidth   = Math.max(1, Math.round(barH * 0.012));
        ctx.beginPath();
        ctx.moveTo(divX, barY + barH * 0.20);
        ctx.lineTo(divX, barY + barH * 0.80);
        ctx.stroke();
      }
    }

    const wmFs = Math.max(9, Math.round(barH * 0.13));
    ctx.font = `300 ${wmFs}px ${fontFam}`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)';
    const wmText = 'frameta';
    const wmW    = ctx.measureText(wmText).width;
    if (rx - wmW - 16 > leftX + 60) {
      ctx.fillText(wmText, cropW - pad - wmW, barY + barH - wmFs * 0.8);
    }
  }

  return { draw };

})();
