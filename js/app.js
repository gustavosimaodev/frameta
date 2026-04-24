/**
 * frameta/js/app.js
 * Controller principal — orquestra UI, EXIF e renderização.
 *
 * Autor: Gustavo de Morais Simão
 * v0.9.0 — batch mode estável, download ZIP, código limpo
 */

(() => {

  /* -------------------------------------------------------
     ESTADO
  ------------------------------------------------------- */
  const state = {
    img:     null,
    fields:  {},
    visible: {
      camera:   true,
      lens:     true,
      shutter:  true,
      aperture: true,
      iso:      true,
      focal:    true,
      date:     true,
    },
    order:       ['date','camera','lens','shutter','aperture','iso','focal'],
    style:        'overlay',
    overlaySize:  'md',
    fontScale:    1.0,
    imgOffset:    { x: 0, y: 0 },
    imgZoom:      1.0,
    barOpacity:   1.0,
    signature:    '',
    exportFormat: 'jpeg',
    batch:        [],
    batchIndex:   0,
    batchMode:    'individual',
    pos:          'bl',
    fmt:          'original',
    font:         'sans',
  };

  /* -------------------------------------------------------
     ELEMENTOS DOM
  ------------------------------------------------------- */
  const $ = id => document.getElementById(id);

  const fileInput        = $('fileInput');
  const workspace        = $('workspace');
  const dropOverlay      = $('dropOverlay');
  const emptyState       = $('emptyState');
  const previewContainer = $('previewContainer');
  const mainCanvas       = $('mainCanvas');
  const exportBtn        = $('exportBtn');
  const exifEmpty        = $('exifEmpty');
  const exifData         = $('exifData');
  const exifStatus       = $('exifStatus');
  const exifList         = $('exifList');
  const toast            = $('toast');

  /* -------------------------------------------------------
     NAVEGAÇÃO (tabs)
  ------------------------------------------------------- */
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      $('tabEditor').style.display   = tab === 'editor'   ? 'flex' : 'none';
      $('tabAbout').style.display    = tab === 'about'    ? 'flex' : 'none';
      $('tabFeedback').style.display = tab === 'feedback' ? 'flex' : 'none';
    });
  });

  /* -------------------------------------------------------
     GRUPOS DE BOTÕES
  ------------------------------------------------------- */
  function setupGroup(groupId, stateKey, callback) {
    const group = $(groupId);
    if (!group) return;
    group.querySelectorAll('[data-value]').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('[data-value]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state[stateKey] = btn.dataset.value;
        if (callback) callback();
        render();
      });
    });
  }

  setupGroup('styleGroup',    'style', updateStyleUI);
  // Os dois grupos de posição compartilham o mesmo state.pos
  setupGroup('posGroupOverlay', 'pos');
  setupGroup('posGroupSolid',   'pos');
  setupGroup('fmtGroup', 'fmt', () => {
    state.imgOffset = { x: 0, y: 0 };
    state.imgZoom   = 1.0;
    const zoomSlider = $('zoomSlider');
    const zoomVal    = $('zoomVal');
    if (zoomSlider) zoomSlider.value = 100;
    if (zoomVal)    zoomVal.textContent = '100%';
    updateRepositionHint();
  });
  setupGroup('fontGroup',  'font');

  function updateStyleUI() {
    const overlaySec = $('overlaySizeSection');
    const opacityRow = $('opacityRow');
    const posOverlay = $('posGroupOverlay');
    const posSolid   = $('posGroupSolid');
    const isOverlay  = state.style === 'overlay';
    const isSolid    = state.style === 'white' || state.style === 'dark';

    if (overlaySec) overlaySec.classList.toggle('hidden', !isOverlay);
    if (opacityRow) opacityRow.style.display = isSolid ? 'flex' : 'none';
    if (posOverlay) posOverlay.style.display = isOverlay ? 'grid' : 'none';
    if (posSolid)   posSolid.style.display   = isSolid  ? 'grid' : 'none';

    // Sincroniza state.pos com o grupo ativo
    if (isOverlay && !['tl','tr','bl','br'].includes(state.pos)) {
      state.pos = 'bl';
      posOverlay.querySelectorAll('[data-value]').forEach(b => {
        b.classList.toggle('active', b.dataset.value === 'bl');
      });
    }
    if (isSolid && !['tc','bc'].includes(state.pos)) {
      state.pos = 'bc';
      posSolid.querySelectorAll('[data-value]').forEach(b => {
        b.classList.toggle('active', b.dataset.value === 'bc');
      });
    }
  }
  updateStyleUI();

  /* -------------------------------------------------------
     CANVAS INTERATIVO — drag para reposicionar a imagem
  ------------------------------------------------------- */
  function updateRepositionHint() {
    const hint = $('repositionHint');
    if (!hint) return;
    const shouldShow = state.img && state.fmt !== 'original';
    hint.style.display = shouldShow ? 'flex' : 'none';
    if (mainCanvas) {
      mainCanvas.classList.toggle('draggable', shouldShow);
    }
  }

  const repositionReset = $('repositionReset');
  if (repositionReset) {
    repositionReset.addEventListener('click', () => {
      state.imgOffset = { x: 0, y: 0 };
      state.imgZoom   = 1.0;
      const zoomSlider = $('zoomSlider');
      const zoomVal    = $('zoomVal');
      if (zoomSlider) zoomSlider.value = 100;
      if (zoomVal)    zoomVal.textContent = '100%';
      render();
    });
  }

  // Slider de zoom
  const zoomSlider = $('zoomSlider');
  const zoomVal    = $('zoomVal');
  if (zoomSlider) {
    zoomSlider.addEventListener('input', () => {
      const pct = parseInt(zoomSlider.value);
      state.imgZoom = pct / 100;
      if (zoomVal) zoomVal.textContent = pct + '%';
      render();
    });
  }

  // Drag da imagem no canvas
  (function initCanvasDrag() {
    if (!mainCanvas) return;
    let dragging = false;
    let startX   = 0;
    let startY   = 0;
    let startOX  = 0;
    let startOY  = 0;

    function getPoint(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
      if (!state.img || state.fmt === 'original') return;
      e.preventDefault();
      dragging = true;
      const p = getPoint(e);
      startX  = p.x;
      startY  = p.y;
      startOX = state.imgOffset.x;
      startOY = state.imgOffset.y;
      mainCanvas.classList.add('dragging');
    }

    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();
      const p = getPoint(e);
      const rect = mainCanvas.getBoundingClientRect();
      // Converte deslocamento em pixels para percentual do canvas
      const dx = (p.x - startX) / rect.width  * 2;
      const dy = (p.y - startY) / rect.height * 2;
      state.imgOffset = {
        x: Math.max(-1, Math.min(1, startOX + dx)),
        y: Math.max(-1, Math.min(1, startOY + dy)),
      };
      render();
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      mainCanvas.classList.remove('dragging');
    }

    mainCanvas.addEventListener('mousedown',  onStart);
    window.addEventListener     ('mousemove', onMove);
    window.addEventListener     ('mouseup',   onEnd);
    mainCanvas.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener     ('touchmove',  onMove,  { passive: false });
    window.addEventListener     ('touchend',   onEnd);
  })();

  /* -------------------------------------------------------
     SLIDER — opacidade (modos sólidos)
  ------------------------------------------------------- */
  const opacitySlider = $('opacitySlider');
  const opacityVal    = $('opacityVal');
  if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
      const pct = parseInt(opacitySlider.value);
      state.barOpacity = pct / 100;
      if (opacityVal) opacityVal.textContent = pct + '%';
      render();
    });
  }

  /* -------------------------------------------------------
     SLIDER — tamanho de fonte do overlay
  ------------------------------------------------------- */
  const fontSizeSlider = $('fontSizeSlider');
  const fontSizeVal    = $('fontSizeVal');
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', () => {
      const pct = parseInt(fontSizeSlider.value);
      state.fontScale   = pct / 100;
      state.overlaySize = pct <= 80 ? 'sm' : pct <= 120 ? 'md' : 'lg';
      if (fontSizeVal) fontSizeVal.textContent = pct + '%';
      render();
    });
  }

  /* -------------------------------------------------------
     CAMPO DE ASSINATURA
  ------------------------------------------------------- */
  const signatureInput = $('signatureInput');
  if (signatureInput) {
    signatureInput.addEventListener('input', () => {
      state.signature = signatureInput.value.trim();
      render();
    });
  }

  document.querySelectorAll('.fmt-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fmt-type-btn').forEach(b =>
        b.classList.remove('active'));
      btn.classList.add('active');
      state.exportFormat = btn.dataset.fmt;
    });
  });

  /* -------------------------------------------------------
     COLAPSÁVEL — campos e ordem
  ------------------------------------------------------- */
  const fieldsToggle = $('fieldsToggle');
  const orderList    = $('orderList');
  if (fieldsToggle && orderList) {
    fieldsToggle.addEventListener('click', () => {
      fieldsToggle.classList.toggle('collapsed');
      orderList.classList.toggle('collapsed');
    });
  }

  /* -------------------------------------------------------
     TOGGLES DE CAMPOS VISÍVEIS
  ------------------------------------------------------- */
  document.querySelectorAll('.field-toggle').forEach(chk => {
    chk.addEventListener('change', () => {
      state.visible[chk.dataset.field] = chk.checked;
      render();
    });
  });

  /* -------------------------------------------------------
     DRAG AND DROP — reordenação dos campos
  ------------------------------------------------------- */
  (function initOrderDrag() {
    const list = $('orderList');
    if (!list) return;
    let dragSrc = null;

    list.querySelectorAll('.order-item').forEach(item => {
      item.setAttribute('draggable', 'true');
      item.addEventListener('dragstart', e => {
        dragSrc = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        list.querySelectorAll('.order-item').forEach(i => i.classList.remove('drag-over'));
        state.order = Array.from(list.querySelectorAll('.order-item')).map(i => i.dataset.key);
        render();
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        if (item !== dragSrc) {
          list.querySelectorAll('.order-item').forEach(i => i.classList.remove('drag-over'));
          item.classList.add('drag-over');
        }
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        if (dragSrc && dragSrc !== item) {
          const items  = Array.from(list.querySelectorAll('.order-item'));
          const srcIdx = items.indexOf(dragSrc);
          const tgtIdx = items.indexOf(item);
          list.insertBefore(dragSrc, srcIdx < tgtIdx ? item.nextSibling : item);
        }
      });
    });
  })();

  /* -------------------------------------------------------
     TEMA DA INTERFACE
  ------------------------------------------------------- */
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? root.setAttribute('data-theme', 'dark')
        : root.removeAttribute('data-theme');
    }
  }
  applyTheme('system');
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const active = document.querySelector('#themeGroup .opt-btn.active');
    if (active && active.dataset.value === 'system') applyTheme('system');
  });
  const themeGroup = $('themeGroup');
  if (themeGroup) {
    themeGroup.querySelectorAll('[data-value]').forEach(btn => {
      btn.addEventListener('click', () => {
        themeGroup.querySelectorAll('[data-value]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyTheme(btn.dataset.value);
      });
    });
  }

  /* -------------------------------------------------------
     SIDEBAR TOGGLE — mobile
  ------------------------------------------------------- */
  (function initSidebarToggle() {
    const toggle  = $('sidebarToggle');
    const sidebar = $('sidebar');
    if (!toggle || !sidebar) return;
    if (window.innerWidth <= 768) sidebar.classList.add('collapsed');
    toggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) sidebar.classList.remove('collapsed');
    });
  })();

  /* -------------------------------------------------------
     UPLOAD — FILE INPUT
  ------------------------------------------------------- */
  fileInput.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    if (files.length > 0) loadBatch(files);
    fileInput.value = '';
  });

  /* -------------------------------------------------------
     UPLOAD — DRAG AND DROP
  ------------------------------------------------------- */
  workspace.addEventListener('dragenter', e => { e.preventDefault(); dropOverlay.classList.add('active'); });
  workspace.addEventListener('dragover',  e => { e.preventDefault(); });
  workspace.addEventListener('dragleave', e => {
    if (!workspace.contains(e.relatedTarget)) dropOverlay.classList.remove('active');
  });
  workspace.addEventListener('drop', e => {
    e.preventDefault();
    dropOverlay.classList.remove('active');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.match(/^image\//));
    if (files.length > 0) loadBatch(files);
    else showToast('Formato não suportado. Use JPEG, PNG ou TIFF.');
  });

  /* -------------------------------------------------------
     CARREGAR — ÚNICO ARQUIVO
  ------------------------------------------------------- */
  async function loadFile(file) {
    showToast('Lendo metadados…');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); showToast('Erro ao carregar a imagem.'); };
    img.onload  = async () => {
      state.img       = img;
      state.imgOffset = { x: 0, y: 0 };
      state.imgZoom   = 1.0;
      URL.revokeObjectURL(url);
      const raw    = await window.FrametaExif.parse(file);
      const result = window.FrametaExif.extract(raw);
      state.fields = result.fields || {};
      updateExifPanel(result);
      render();
      exportBtn.disabled = false;
      emptyState.style.display      = 'none';
      previewContainer.style.display = 'flex';
      showToast(result.ok ? 'EXIF carregado com sucesso.' : 'Foto carregada. ' + (result.error || ''));
    };
    img.src = url;
  }

  /* -------------------------------------------------------
     CARREGAR — BATCH (múltiplos arquivos)
     Configurações globais aplicadas a todas as fotos.
     EXIF de cada foto exibido no painel ao navegar.
  ------------------------------------------------------- */
  async function loadBatch(files) {
    if (!files || files.length === 0) return;

    // Arquivo único — comportamento normal
    if (files.length === 1) {
      hideBatchUI();
      loadFile(files[0]);
      return;
    }

    showToast('Carregando ' + files.length + ' fotos…');
    state.batch      = [];
    state.batchIndex = 0;

    for (const file of files) {
      const blobUrl = URL.createObjectURL(file);
      const img = await new Promise(res => {
        const i = new Image();
        i.onload  = () => res(i);
        i.onerror = () => { URL.revokeObjectURL(blobUrl); res(null); };
        i.src = blobUrl;
      });
      if (!img) continue;

      // Parse EXIF e serialização profunda para isolar do buffer binário
      const raw    = await window.FrametaExif.parse(file);
      const result = window.FrametaExif.extract(raw);
      const safeFields = JSON.parse(JSON.stringify(result.fields || {}));
      const safeResult = {
        ok:     result.ok,
        error:  result.error || null,
        fields: safeFields,
        _raw:   { _ok: !!(raw && raw._ok) },
        _log:   [],
      };

      state.batch.push({
        img,
        blobUrl,
        fields:   safeFields,
        result:   safeResult,
        filename: file.name.replace(/\.[^.]+$/, ''),
        config:   snapshotConfig(),
      });
    }

    if (state.batch.length === 0) { showToast('Nenhuma imagem válida.'); return; }

    showBatchUI();
    buildFilmstrip();
    activateBatchItem(0);
    showToast(state.batch.length + ' fotos carregadas.');
  }

  /* -------------------------------------------------------
     BATCH — UI helpers
  ------------------------------------------------------- */
  function showBatchUI() {
    const filmstrip      = $('filmstrip');
    const exportAllBtn   = $('exportAllBtn');
    const batchCounter   = $('batchCounter');
    const exportBtnLabel = $('exportBtnLabel');
    if (filmstrip)      filmstrip.style.display    = 'flex';
    if (exportAllBtn)   exportAllBtn.style.display = 'flex';
    if (batchCounter)   batchCounter.classList.add('visible');
    if (exportBtnLabel) exportBtnLabel.textContent = 'Baixar atual';
    const batchToolbar = $('batchToolbar');
    if (batchToolbar) batchToolbar.style.display = 'flex';
    updateBatchCounter();
  }

  function hideBatchUI() {
    const filmstrip      = $('filmstrip');
    const exportAllBtn   = $('exportAllBtn');
    const batchCounter   = $('batchCounter');
    const exportBtnLabel = $('exportBtnLabel');
    if (filmstrip)      filmstrip.style.display    = 'none';
    if (exportAllBtn)   exportAllBtn.style.display = 'none';
    if (batchCounter)   batchCounter.classList.remove('visible');
    if (exportBtnLabel) exportBtnLabel.textContent = 'Baixar foto';
    const batchToolbar = $('batchToolbar');
    if (batchToolbar) batchToolbar.style.display = 'none';
    state.batchMode = 'individual';
    if ($('batchModeIndividual')) $('batchModeIndividual').classList.add('active');
    if ($('batchModeGlobal'))     $('batchModeGlobal').classList.remove('active');
    // Libera memória
    state.batch.forEach(item => { if (item.blobUrl) URL.revokeObjectURL(item.blobUrl); });
    state.batch      = [];
    state.batchIndex = 0;
  }

  /* -------------------------------------------------------
     BATCH MODE — Individual / Global
  ------------------------------------------------------- */
  function applyConfigToAll() {
    const current = snapshotConfig();
    state.batch.forEach((item, i) => {
      if (i !== state.batchIndex) {
        item.config = JSON.parse(JSON.stringify(current));
      }
    });
    showToast('Configuração aplicada a todas as fotos.');
  }

  const batchModeIndividual = $('batchModeIndividual');
  const batchModeGlobal     = $('batchModeGlobal');
  const batchApplyAll       = $('batchApplyAll');

  if (batchModeIndividual) {
    batchModeIndividual.addEventListener('click', () => {
      state.batchMode = 'individual';
      batchModeIndividual.classList.add('active');
      batchModeGlobal.classList.remove('active');
      showToast('Modo individual: cada foto com sua própria configuração.');
    });
  }

  if (batchModeGlobal) {
    batchModeGlobal.addEventListener('click', () => {
      state.batchMode = 'global';
      batchModeGlobal.classList.add('active');
      batchModeIndividual.classList.remove('active');
      applyConfigToAll();
      showToast('Modo global ativo: alterações se aplicam a todas as fotos.');
    });
  }

  if (batchApplyAll) {
    batchApplyAll.addEventListener('click', () => {
      applyConfigToAll();
    });
  }

  function snapshotConfig() {
    return {
      style:        state.style,
      pos:          state.pos,
      fmt:          state.fmt,
      font:         state.font,
      fontScale:    state.fontScale,
      barOpacity:   state.barOpacity,
      signature:    state.signature,
      imgOffset:    { x: (state.imgOffset || {x:0}).x, y: (state.imgOffset || {y:0}).y },
      imgZoom:      state.imgZoom || 1.0,
      exportFormat: state.exportFormat || 'jpeg',
      visible:      JSON.parse(JSON.stringify(state.visible)),
      order:        [...state.order],
    };
  }

  function applyConfig(cfg) {
    if (!cfg) return;

    state.style      = cfg.style;
    state.pos        = cfg.pos;
    state.fmt        = cfg.fmt;
    state.font       = cfg.font;
    state.fontScale  = cfg.fontScale;
    state.barOpacity = cfg.barOpacity;
    state.signature  = cfg.signature;
    state.imgOffset  = { x: cfg.imgOffset.x, y: cfg.imgOffset.y };
    state.imgZoom    = cfg.imgZoom;
    state.visible    = JSON.parse(JSON.stringify(cfg.visible));
    state.order      = [...cfg.order];

    document.querySelectorAll('#styleGroup [data-value]').forEach(b => {
      b.classList.toggle('active', b.dataset.value === cfg.style);
    });

    document.querySelectorAll('#posGroupOverlay [data-value]').forEach(b => {
      b.classList.toggle('active', b.dataset.value === cfg.pos);
    });
    document.querySelectorAll('#posGroupSolid [data-value]').forEach(b => {
      b.classList.toggle('active', b.dataset.value === cfg.pos);
    });

    document.querySelectorAll('#fmtGroup [data-value]').forEach(b => {
      b.classList.toggle('active', b.dataset.value === cfg.fmt);
    });

    document.querySelectorAll('#fontGroup [data-value]').forEach(b => {
      b.classList.toggle('active', b.dataset.value === cfg.font);
    });

    const fontSizeSlider = $('fontSizeSlider');
    const fontSizeVal    = $('fontSizeVal');
    if (fontSizeSlider) fontSizeSlider.value = Math.round(cfg.fontScale * 100);
    if (fontSizeVal)    fontSizeVal.textContent = Math.round(cfg.fontScale * 100) + '%';

    const opacitySlider = $('opacitySlider');
    const opacityVal    = $('opacityVal');
    if (opacitySlider) opacitySlider.value = Math.round(cfg.barOpacity * 100);
    if (opacityVal)    opacityVal.textContent = Math.round(cfg.barOpacity * 100) + '%';

    const zoomSlider = $('zoomSlider');
    const zoomVal    = $('zoomVal');
    if (zoomSlider) zoomSlider.value = Math.round(cfg.imgZoom * 100);
    if (zoomVal)    zoomVal.textContent = Math.round(cfg.imgZoom * 100) + '%';

    const sigInput = $('signatureInput');
    if (sigInput) sigInput.value = cfg.signature || '';

    document.querySelectorAll('.field-toggle').forEach(chk => {
      const key = chk.dataset.field;
      if (key && cfg.visible[key] !== undefined) {
        chk.checked = cfg.visible[key];
      }
    });

    const list = $('orderList');
    if (list && cfg.order.length) {
      const items = Array.from(list.querySelectorAll('.order-item'));
      cfg.order.forEach((key) => {
        const el = items.find(li => li.dataset.key === key);
        if (el) list.appendChild(el);
      });
    }

    updateStyleUI();
  }

  function updateBatchCounter() {
    const el = $('batchCounter');
    if (el) el.textContent = (state.batchIndex + 1) + ' / ' + state.batch.length;
  }

  function buildFilmstrip() {
    const track = $('filmstripTrack');
    if (!track) return;
    track.innerHTML = '';
    state.batch.forEach((item, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'filmstrip-thumb' + (i === 0 ? ' active' : '');
      thumb.dataset.index = i;
      const tImg = document.createElement('img');
      tImg.src = item.blobUrl;
      const idx = document.createElement('span');
      idx.className   = 'thumb-index';
      idx.textContent = i + 1;
      thumb.appendChild(tImg);
      thumb.appendChild(idx);
      thumb.addEventListener('click', () => activateBatchItem(i));
      track.appendChild(thumb);
    });
  }

  function activateBatchItem(index) {
    if (index < 0 || index >= state.batch.length) return;

    // Salva config da foto anterior antes de trocar
    if (state.batch[state.batchIndex] && state.batchIndex !== index) {
      state.batch[state.batchIndex].config = snapshotConfig();
    }

    state.batchIndex = index;
    const item = state.batch[index];

    // Atualiza estado global com dados desta foto
    state.img    = item.img;
    state.fields = item.fields;

    // Restaura config desta foto
    applyConfig(item.config);

    // Atualiza campo de nome do arquivo
    const fi = $('filenameInput');
    if (fi) fi.value = item.filename || '';

    // Atualiza painel EXIF
    updateExifPanel(item.result);

    // Renderiza e exibe
    render();
    exportBtn.disabled = false;
    emptyState.style.display       = 'none';
    previewContainer.style.display = 'flex';
    updateBatchCounter();

    // Destaca thumb ativo
    document.querySelectorAll('.filmstrip-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });

    // Scroll para thumb ativo
    const track  = $('filmstripTrack');
    const active = track && track.querySelector('.filmstrip-thumb.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  /* -------------------------------------------------------
     PAINEL EXIF
  ------------------------------------------------------- */
  function updateExifPanel(result) {
    // Reset completo
    exifEmpty.style.display = 'none';
    exifData.style.display  = 'block';
    exifList.innerHTML      = '';
    exifStatus.className    = 'exif-status';
    exifStatus.textContent  = '';

    const debugBlock = $('debugBlock');
    if (debugBlock) debugBlock.style.display = 'none';

    // Status
    if (result.ok) {
      exifStatus.classList.add('ok');
      exifStatus.textContent = '✓ EXIF detectado';
    } else if (result._raw && result._raw._ok) {
      exifStatus.classList.add('warn');
      exifStatus.textContent = '⚠ EXIF sem dados de câmera';
    } else {
      exifStatus.classList.add('err');
      exifStatus.textContent = '✕ Sem EXIF';
    }

    // Mensagem quando sem dados
    if (!result.ok) {
      const msg = document.createElement('div');
      msg.style.cssText = 'font-size:12px;color:#787878;line-height:1.7;margin-top:4px';
      msg.innerHTML = (result._raw && result._raw._ok)
        ? `Esta foto teve os metadados removidos (Instagram, WhatsApp etc.).<br><br>Use o JPEG original da câmera ou exportado pelo Lightroom.`
        : `Nenhum bloco EXIF encontrado.<br><br>Tente com um JPEG original da câmera.`;
      exifList.appendChild(msg);
      return;
    }

    // Campos EXIF
    const display = [
      ['Câmera',     result.fields.camera],
      ['Lente',      result.fields.lens],
      ['Velocidade', result.fields.shutter],
      ['Abertura',   result.fields.aperture],
      ['ISO',        result.fields.iso],
      ['Focal',      result.fields.focal],
      ['Focal 35mm', result.fields.focal35],
      ['Data',       result.fields.date],
      ['Software',   result.fields.software],
    ];
    display.forEach(([key, val]) => {
      if (!val) return;
      const item = document.createElement('div');
      item.className = 'exif-item';
      item.innerHTML = `<div class="exif-key">${key}</div><div class="exif-val">${val}</div>`;
      exifList.appendChild(item);
    });
    if (exifList.children.length === 0) {
      const msg = document.createElement('div');
      msg.className   = 'exif-val muted';
      msg.textContent = result.error || 'Nenhum campo disponível.';
      exifList.appendChild(msg);
    }

    // Debug block (apenas para foto única, não batch)
    if (result._raw && result._log && result._log.length > 0) {
      const debugBlock = $('debugBlock');
      const debugPre   = $('debugPre');
      if (debugBlock && debugPre) {
        debugBlock.style.display = 'block';
        const safe = {};
        Object.entries(result._raw).forEach(([k, v]) => {
          if (!k.startsWith('_')) safe[k] = v;
        });
        debugPre.textContent =
          '── LOG ──\n' + result._log.join('\n') +
          '\n\n── RAW FIELDS ──\n' + JSON.stringify(safe, null, 2);
      }
    }
  }

  /* -------------------------------------------------------
     RENDERIZAÇÃO
  ------------------------------------------------------- */
  function render() {
    if (!state.img) return;
    window.FrametaRender.draw(mainCanvas, state.img, state.fields, {
      style:       state.style,
      pos:         state.pos,
      fmt:         state.fmt,
      font:        state.font,
      overlaySize: state.overlaySize,
      fontScale:   state.fontScale,
      barOpacity:  state.barOpacity,
      signature:   state.signature,
      imgOffset:   state.imgOffset,
      imgZoom:     state.imgZoom,
      order:       state.order,
      visible:     state.visible,
    });
    // Modo global: propaga config para todas as fotos do batch
    if (state.batchMode === 'global' && state.batch.length > 0) {
      const current = snapshotConfig();
      state.batch.forEach((item, i) => {
        if (i !== state.batchIndex) {
          item.config = JSON.parse(JSON.stringify(current));
        }
      });
    }
    updateRepositionHint();
  }

  /* -------------------------------------------------------
     EXPORTAÇÃO — arquivo único
  ------------------------------------------------------- */
  exportBtn.addEventListener('click', () => {
    if (!state.img) return;
    exportBtn.disabled = true;
    showToast('Preparando download…');
    const isPng     = state.exportFormat === 'png';
    const mimeType  = isPng ? 'image/png' : 'image/jpeg';
    const quality   = isPng ? undefined : 0.95;
    const extension = isPng ? '.png' : '.jpg';

    mainCanvas.toBlob(blob => {
      const filenameInput = $('filenameInput');
      const rawName  = filenameInput ? filenameInput.value.trim() : '';
      const safeName = rawName
        ? rawName.replace(/[^a-zA-Z0-9_\-\. ]/g, '').replace(/\s+/g, '_')
        : 'frameta_' + Date.now();
      const base     = safeName.replace(/\.(jpg|jpeg|png)$/i, '');
      const filename = base + extension;
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      exportBtn.disabled = false;
      showToast('Download iniciado!');
    }, mimeType, quality);
  });

  /* -------------------------------------------------------
     EXPORTAÇÃO — batch (ZIP via JSZip)
  ------------------------------------------------------- */
  const exportAllBtn = $('exportAllBtn');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', async () => {
      if (state.batch.length === 0) return;
      exportAllBtn.disabled = true;
      showToast('Preparando ZIP…');

      // Carrega JSZip dinamicamente
      if (!window.JSZip) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src     = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          s.onload  = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      const zip          = new window.JSZip();
      const savedImg     = state.img;
      const savedFields  = state.fields;
      const savedIndex   = state.batchIndex;

      for (let i = 0; i < state.batch.length; i++) {
        const item = state.batch[i];
        // Salva config da foto ativa antes de processar
        if (i === state.batchIndex) item.config = snapshotConfig();
        const cfg = item.config || snapshotConfig();
        showToast('Processando ' + (i + 1) + ' de ' + state.batch.length + '…');

        // Renderiza com a config individual de cada foto
        window.FrametaRender.draw(mainCanvas, item.img, item.fields, {
          style:       cfg.style,
          pos:         cfg.pos,
          fmt:         cfg.fmt,
          font:        cfg.font,
          overlaySize: 'md',
          fontScale:   cfg.fontScale,
          barOpacity:  cfg.barOpacity,
          signature:   cfg.signature,
          imgOffset:   cfg.imgOffset || { x: 0, y: 0 },
          imgZoom:     cfg.imgZoom || 1.0,
          order:       cfg.order,
          visible:     cfg.visible,
        });

        const isPng = (cfg.exportFormat || 'jpeg') === 'png';
        const mime  = isPng ? 'image/png' : 'image/jpeg';
        const qual  = isPng ? undefined : 0.95;
        const ext   = isPng ? '.png' : '.jpg';
        const blob  = await new Promise(res => mainCanvas.toBlob(res, mime, qual));
        const name  = (item.filename || ('frameta_' + (i + 1))) + ext;
        zip.file(name, blob);
      }

      // Restaura estado da foto ativa
      state.img    = savedImg;
      state.fields = savedFields;
      activateBatchItem(savedIndex);

      // Gera e baixa o ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl  = URL.createObjectURL(zipBlob);
      const a       = document.createElement('a');
      a.href     = zipUrl;
      a.download = 'frameta_batch_' + Date.now() + '.zip';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);

      exportAllBtn.disabled = false;
      showToast('ZIP com ' + state.batch.length + ' fotos baixado!');
    });
  }

  /* -------------------------------------------------------
     NAVEGAÇÃO DO FILMSTRIP
  ------------------------------------------------------- */
  const filmPrev = $('filmPrev');
  const filmNext = $('filmNext');
  if (filmPrev) filmPrev.addEventListener('click', () => {
    if (state.batchIndex > 0) activateBatchItem(state.batchIndex - 1);
  });
  if (filmNext) filmNext.addEventListener('click', () => {
    if (state.batchIndex < state.batch.length - 1) activateBatchItem(state.batchIndex + 1);
  });

  /* -------------------------------------------------------
     BOTTOM NAV — mobile
  ------------------------------------------------------- */
  (function initBottomNav() {
    if (window.innerWidth > 768) return;

    const panels = {
      style:  $('mobilePanelStyle'),
      format: $('mobilePanelFormat'),
      fields: $('mobilePanelFields'),
    };

    let activePanel = null;

    function setupMobileGroup(mobileGroupId, stateKey, callback) {
      const group = $(mobileGroupId);
      if (!group) return;
      group.querySelectorAll('[data-value]').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('[data-value]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const desktopGroup = stateKey === 'style' ? $('styleGroup')
            : stateKey === 'fmt' ? $('fmtGroup')
            : stateKey === 'font' ? $('fontGroup') : null;
          if (desktopGroup) {
            desktopGroup.querySelectorAll('[data-value]').forEach(b => {
              b.classList.toggle('active', b.dataset.value === btn.dataset.value);
            });
          }
          state[stateKey] = btn.dataset.value;
          if (callback) callback();
          render();
        });
      });
    }

    setupMobileGroup('styleGroupMobile', 'style', updateStyleUI);
    setupMobileGroup('posGroupOverlayMobile', 'pos');
    setupMobileGroup('fmtGroupMobile', 'fmt', () => {
      state.imgOffset = { x: 0, y: 0 };
      state.imgZoom   = 1.0;
      updateRepositionHint();
    });
    setupMobileGroup('fontGroupMobile', 'font');

    const fsMobile  = $('fontSizeSliderMobile');
    const fsvMobile = $('fontSizeValMobile');
    if (fsMobile) {
      fsMobile.addEventListener('input', () => {
        const pct = parseInt(fsMobile.value);
        state.fontScale   = pct / 100;
        state.overlaySize = pct <= 80 ? 'sm' : pct <= 120 ? 'md' : 'lg';
        if (fsvMobile) fsvMobile.textContent = pct + '%';
        const fsDesktop  = $('fontSizeSlider');
        const fsvDesktop = $('fontSizeVal');
        if (fsDesktop)  fsDesktop.value = pct;
        if (fsvDesktop) fsvDesktop.textContent = pct + '%';
        render();
      });
    }

    document.querySelectorAll('.field-toggle-mobile').forEach(chk => {
      chk.addEventListener('change', () => {
        state.visible[chk.dataset.field] = chk.checked;
        const desktopChk = document.querySelector(`.field-toggle[data-field="${chk.dataset.field}"]`);
        if (desktopChk) desktopChk.checked = chk.checked;
        render();
      });
    });

    const sigMobile = $('signatureInputMobile');
    if (sigMobile) {
      sigMobile.addEventListener('input', () => {
        state.signature = sigMobile.value.trim();
        const sigDesktop = $('signatureInput');
        if (sigDesktop) sigDesktop.value = sigMobile.value;
        render();
      });
    }

    const bnUpload = $('bnUpload');
    if (bnUpload) {
      bnUpload.addEventListener('click', () => {
        fileInput.click();
        closeAllPanels();
        document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
      });
    }

    const bnDownload = $('bnDownload');
    if (bnDownload) {
      bnDownload.addEventListener('click', () => {
        if (!state.img) { showToast('Carregue uma foto primeiro.'); return; }
        exportBtn.click();
        closeAllPanels();
        document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
      });
    }

    function closeAllPanels() {
      Object.values(panels).forEach(p => { if (p) p.style.display = 'none'; });
      activePanel = null;
    }

    document.querySelectorAll('.bn-item[data-panel]').forEach(btn => {
      const panelKey = btn.dataset.panel;
      if (!panels[panelKey]) return;
      btn.addEventListener('click', () => {
        const panel  = panels[panelKey];
        const isOpen = activePanel === panelKey;
        closeAllPanels();
        document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
        if (!isOpen) {
          panel.style.display = 'block';
          activePanel = panelKey;
          btn.classList.add('active');
        }
      });
    });

    const ws = $('workspace');
    if (ws) ws.addEventListener('click', e => {
      if (!e.target.closest('.mobile-panel') && !e.target.closest('.bottom-nav')) {
        closeAllPanels();
        document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
      }
    });
  })();

  /* -------------------------------------------------------
     TOAST
  ------------------------------------------------------- */
  let toastTimer;
  function showToast(msg, duration = 2800) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  if (mainCanvas) {
    mainCanvas.addEventListener('dblclick', () => {
      if (state.fmt !== 'original') {
        state.imgOffset = { x: 0, y: 0 };
        render();
      }
    });
  }

})();
