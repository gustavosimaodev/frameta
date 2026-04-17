/**
 * frameta/js/app.js
 * Controller principal — orquestra UI, EXIF e renderização.
 *
 * Autor: Gustavo de Morais Simão
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
      date:     false,
    },
    order: ['camera','lens','shutter','aperture','iso','focal','date'],
    style:       'overlay',
    overlaySize: 'md',
    fontScale:   1.0,
    barOpacity:  1.0,
    signature:   '',
    batch:       [],
    batchIndex:  0,
    pos:         'bl',
    fmt:         'original',
    font:        'sans',
  };

  /* -------------------------------------------------------
     ELEMENTOS DOM
  ------------------------------------------------------- */
  const $ = id => document.getElementById(id);

  const fileInput       = $('fileInput');
  const uploadZone      = $('uploadZone');
  const workspace       = $('workspace');
  const dropOverlay     = $('dropOverlay');
  const emptyState      = $('emptyState');
  const previewContainer= $('previewContainer');
  const mainCanvas      = $('mainCanvas');
  const exportBtn       = $('exportBtn');
  const exifEmpty       = $('exifEmpty');
  const exifData        = $('exifData');
  const exifStatus      = $('exifStatus');
  const exifList        = $('exifList');
  const toast           = $('toast');

  /* -------------------------------------------------------
     NAVEGAÇÃO (tabs)
  ------------------------------------------------------- */
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      $('tabEditor').style.display   = tab === 'editor'   ? 'flex'  : 'none';
      $('tabAbout').style.display    = tab === 'about'    ? 'flex'  : 'none';
      $('tabFeedback').style.display = tab === 'feedback' ? 'flex'  : 'none';
    });
  });

  /* -------------------------------------------------------
     GRUPOS DE BOTÕES (estilo, posição, formato, fonte)
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

  setupGroup('styleGroup',      'style',       updateOverlaySizeVisibility);
  setupGroup('posGroup',        'pos');
  setupGroup('fmtGroup',        'fmt');
  setupGroup('fontGroup',       'font');

  /* Mostra/esconde seção de tamanho conforme o estilo */
  function updateOverlaySizeVisibility() {
    const sec = document.getElementById('overlaySizeSection');
    if (!sec) return;
    sec.classList.toggle('hidden', state.style !== 'overlay');
    const opacityRow = document.getElementById('opacityRow');
    const isSolid = state.style === 'white' || state.style === 'dark';
    if (opacityRow) opacityRow.style.display = isSolid ? 'flex' : 'none';
  }
  updateOverlaySizeVisibility();

  /* -------------------------------------------------------
     SLIDER DE TAMANHO DE FONTE (controla tudo no overlay)
  ------------------------------------------------------- */
  const fontSizeSlider = $('fontSizeSlider');
  const fontSizeVal    = $('fontSizeVal');
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', () => {
      const pct = parseInt(fontSizeSlider.value);
      state.fontScale   = pct / 100;
      // overlaySize mapeado pelo valor do slider para manter compatibilidade com render.js
      state.overlaySize = pct <= 80 ? 'sm' : pct <= 120 ? 'md' : 'lg';
      fontSizeVal.textContent = pct + '%';
      render();
    });
  }

  const opacitySlider = document.getElementById('opacitySlider');
  const opacityVal    = document.getElementById('opacityVal');
  if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
      const pct = parseInt(opacitySlider.value);
      state.barOpacity = pct / 100;
      opacityVal.textContent = pct + '%';
      render();
    });
  }

  const signatureInput = document.getElementById('signatureInput');
  if (signatureInput) {
    signatureInput.addEventListener('input', () => {
      state.signature = signatureInput.value.trim();
      render();
    });
  }

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
     FIELD TOGGLES unificados (dentro da order-list)
  ------------------------------------------------------- */
  document.querySelectorAll('.field-toggle').forEach(chk => {
    chk.addEventListener('change', () => {
      const key = chk.dataset.field;
      state.visible[key] = chk.checked;
      render();
    });
  });

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
      // Sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      prefersDark ? root.setAttribute('data-theme','dark') : root.removeAttribute('data-theme');
    }
  }

  // Inicializa com preferência do sistema
  applyTheme('system');

  // Escuta mudança do sistema em tempo real
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
     DRAG AND DROP — reordenação dos campos
  ------------------------------------------------------- */
  (function initOrderDrag() {
    const list = document.getElementById('orderList');
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
        e.dataTransfer.dropEffect = 'move';
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
     SIDEBAR TOGGLE — mobile
  ------------------------------------------------------- */
  (function initSidebarToggle() {
    const toggle  = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggle || !sidebar) return;

    // Começa colapsado em mobile
    if (window.innerWidth <= 768) {
      sidebar.classList.add('collapsed');
    }

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });

    // Redefine ao redimensionar
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        sidebar.classList.remove('collapsed');
      } else if (!sidebar.classList.contains('collapsed')) {
        sidebar.classList.add('collapsed');
      }
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
  workspace.addEventListener('dragenter', e => {
    e.preventDefault();
    dropOverlay.classList.add('active');
  });

  workspace.addEventListener('dragover', e => {
    e.preventDefault();
  });

  workspace.addEventListener('dragleave', e => {
    // Só esconde se saiu do workspace (não de um filho)
    if (!workspace.contains(e.relatedTarget)) {
      dropOverlay.classList.remove('active');
    }
  });

  workspace.addEventListener('drop', e => {
    e.preventDefault();
    dropOverlay.classList.remove('active');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.match(/^image\//));
    if (files.length > 0) loadBatch(files);
    else showToast('Formato não suportado. Use JPEG, PNG ou TIFF.');
  });

  /* -------------------------------------------------------
     CARREGAR ARQUIVO
  ------------------------------------------------------- */
  async function loadFile(file) {
    showToast('Lendo metadados…');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); showToast('Erro ao carregar a imagem.'); };
    img.onload = async () => {
      state.img = img;
      URL.revokeObjectURL(url);
      const raw    = await window.FrametaExif.parse(file);
      const result = window.FrametaExif.extract(raw);
      state.fields = result.fields || {};
      updateExifPanel(result);
      render();
      exportBtn.disabled = false;
      emptyState.style.display       = 'none';
      previewContainer.style.display = 'flex';
      if (result.ok) showToast('EXIF carregado com sucesso.');
      else showToast('Foto carregada. ' + (result.error || 'Sem dados EXIF.'));
    };
    img.src = url;
  }

  async function loadBatch(files) {
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      loadFile(files[0]);
      hideBatchUI();
      return;
    }

    showToast('Carregando ' + files.length + ' fotos…');
    state.batch      = [];
    state.batchIndex = 0;

    for (const file of files) {
      // Cria blob URL permanente para a imagem (não revoga)
      const blobUrl = URL.createObjectURL(file);

      const img = await new Promise(res => {
        const i  = new Image();
        i.onload  = () => res(i);
        i.onerror = () => res(null);
        i.src     = blobUrl;
      });
      if (!img) { URL.revokeObjectURL(blobUrl); continue; }

      const raw    = await window.FrametaExif.parse(file);
      const result = window.FrametaExif.extract(raw);

      // Copia profunda dos fields para isolar do buffer original
      const safeFields = JSON.parse(JSON.stringify(result.fields || {}));

      // Reconstrói result sem referências ao buffer binário
      const safeResult = {
        ok:     result.ok,
        error:  result.error || null,
        fields: safeFields,
        _raw:   { _ok: raw && raw._ok },
        _log:   [],
      };

      const baseName = file.name.replace(/\.[^.]+$/, '');

      state.batch.push({
        img,
        blobUrl,
        fields:   safeFields,
        result:   safeResult,
        filename: baseName,
      });
    }

    if (state.batch.length === 0) {
      showToast('Nenhuma imagem válida.');
      return;
    }

    showBatchUI();
    buildFilmstrip();
    activateBatchItem(0);
    showToast(state.batch.length + ' fotos carregadas.');
  }

  function showBatchUI() {
    const filmstrip      = document.getElementById('filmstrip');
    const exportAllBtn   = document.getElementById('exportAllBtn');
    const batchCounter   = document.getElementById('batchCounter');
    const exportBtnLabel = document.getElementById('exportBtnLabel');
    if (filmstrip)      filmstrip.style.display    = 'flex';
    if (exportAllBtn)   exportAllBtn.style.display = 'flex';
    if (batchCounter)   batchCounter.classList.add('visible');
    if (exportBtnLabel) exportBtnLabel.textContent = 'Baixar atual';
    updateBatchCounter();
  }

  function hideBatchUI() {
    const filmstrip      = document.getElementById('filmstrip');
    const exportAllBtn   = document.getElementById('exportAllBtn');
    const batchCounter   = document.getElementById('batchCounter');
    const exportBtnLabel = document.getElementById('exportBtnLabel');
    if (filmstrip)      filmstrip.style.display    = 'none';
    if (exportAllBtn)   exportAllBtn.style.display = 'none';
    if (batchCounter)   batchCounter.classList.remove('visible');
    if (exportBtnLabel) exportBtnLabel.textContent = 'Baixar foto';
    // Revoga blob URLs para liberar memória
    state.batch.forEach(item => {
      if (item.blobUrl) URL.revokeObjectURL(item.blobUrl);
    });
    state.batch      = [];
    state.batchIndex = 0;
  }

  function updateBatchCounter() {
    const el = document.getElementById('batchCounter');
    if (el) el.textContent = (state.batchIndex + 1) + ' / ' + state.batch.length;
  }

  function buildFilmstrip() {
    const track = document.getElementById('filmstripTrack');
    if (!track) return;
    track.innerHTML = '';
    state.batch.forEach((item, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'filmstrip-thumb' + (i === 0 ? ' active' : '');
      thumb.dataset.index = i;
      const tImg = document.createElement('img');
      tImg.src = item.img.src;
      const idx = document.createElement('span');
      idx.className = 'thumb-index';
      idx.textContent = i + 1;
      thumb.appendChild(tImg);
      thumb.appendChild(idx);
      thumb.addEventListener('click', () => activateBatchItem(i));
      track.appendChild(thumb);
    });
  }

  function activateBatchItem(index) {
    if (index < 0 || index >= state.batch.length) return;
    state.batchIndex = index;
    const item = state.batch[index];

    state.img    = item.img;
    state.fields = item.fields;

    const fi = document.getElementById('filenameInput');
    if (fi) fi.value = item.filename || '';

    updateExifPanel(item.result);
    render();
    exportBtn.disabled = false;
    emptyState.style.display       = 'none';
    previewContainer.style.display = 'flex';
    updateBatchCounter();

    document.querySelectorAll('.filmstrip-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });

    const track  = document.getElementById('filmstripTrack');
    const active = track && track.querySelector('.filmstrip-thumb.active');
    if (active) active.scrollIntoView({
      behavior: 'smooth', inline: 'center', block: 'nearest'
    });
  }

  /* -------------------------------------------------------
     PAINEL EXIF
  ------------------------------------------------------- */
  function updateExifPanel(result) {
    // Reset completo antes de popular
    exifEmpty.style.display = 'none';
    exifData.style.display  = 'block';
    exifList.innerHTML      = '';
    exifStatus.className    = 'exif-status';
    exifStatus.textContent  = '';

    const debugBlock = document.getElementById('debugBlock');
    if (debugBlock) debugBlock.style.display = 'none';

    exifStatus.className = 'exif-status';
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

    // Mensagem explicativa quando não há dados de câmera
    exifList.innerHTML = '';
    if (!result.ok) {
      const msg = document.createElement('div');
      msg.style.cssText = 'font-size:12px;color:#787878;line-height:1.7;margin-top:4px';
      const isStripped = result._raw && result._raw._ok;
      msg.innerHTML = isStripped
        ? `Esta foto teve os metadados de câmera removidos — provavelmente foi exportada pelo <strong>Instagram, WhatsApp ou similar</strong>.<br><br>Use o JPEG original saído da câmera ou exportado pelo <strong>Lightroom/Capture One</strong>.`
        : `Nenhum bloco EXIF encontrado neste arquivo.<br><br>Tente com um JPEG original da câmera.`;
      exifList.appendChild(msg);
      return;
    }
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
      msg.className = 'exif-val muted';
      msg.textContent = result.error || 'Nenhum campo disponível.';
      exifList.appendChild(msg);
    }

    if (result._raw) {
      const debugBlock = document.getElementById('debugBlock');
      const debugPre   = document.getElementById('debugPre');
      if (debugBlock && debugPre) {
        debugBlock.style.display = 'block';
        const log  = result._log || [];
        const safe = {};
        Object.entries(result._raw).forEach(([k, v]) => {
          if (!k.startsWith('_')) safe[k] = v;
        });
        debugPre.textContent =
          '── LOG ──\n' + log.join('\n') +
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
      order:       state.order,
      visible:     state.visible,
    });
  }

  /* -------------------------------------------------------
     EXPORTAÇÃO
  ------------------------------------------------------- */
  exportBtn.addEventListener('click', () => {
    if (!state.img) return;
    exportBtn.disabled = true;
    showToast('Preparando download…');

    mainCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      const filenameInput = document.getElementById('filenameInput');
      const rawName = filenameInput ? filenameInput.value.trim() : '';
      const safeName = rawName
        ? rawName.replace(/[^a-zA-Z0-9_\-\. ]/g, '').replace(/\s+/g, '_')
        : 'frameta_' + Date.now();
      a.download = safeName.endsWith('.jpg') ? safeName : safeName + '.jpg';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      exportBtn.disabled = false;
      showToast('Download iniciado!');
    }, 'image/jpeg', 0.95);
  });

  const exportAllBtn = document.getElementById('exportAllBtn');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', async () => {
      if (state.batch.length === 0) return;
      exportAllBtn.disabled = true;
      showToast('Preparando downloads…');

      const savedIndex  = state.batchIndex;
      const savedImg    = state.img;
      const savedFields = state.fields;

      for (let i = 0; i < state.batch.length; i++) {
        const item = state.batch[i];

        window.FrametaRender.draw(mainCanvas, item.img, item.fields, {
          style:       state.style,
          pos:         state.pos,
          fmt:         state.fmt,
          font:        state.font,
          overlaySize: state.overlaySize,
          fontScale:   state.fontScale,
          barOpacity:  state.barOpacity,
          order:       state.order,
          visible:     state.visible,
          signature:   state.signature,
        });

        showToast('Baixando ' + (i + 1) + ' de ' + state.batch.length + '…');

        await new Promise(resolve => {
          mainCanvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const link     = document.createElement('a');
              link.href      = reader.result;
              link.download  = (item.filename || ('frameta_' + (i + 1))) + '.jpg';
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                document.body.removeChild(link);
                resolve();
              }, 1500);
            };
            reader.readAsDataURL(blob);
          }, 'image/jpeg', 0.95);
        });
      }

      state.img    = savedImg;
      state.fields = savedFields;
      activateBatchItem(savedIndex);
      exportAllBtn.disabled = false;
      showToast('Todas as ' + state.batch.length + ' fotos baixadas!');
    });
  }

  const filmPrev = document.getElementById('filmPrev');
  const filmNext = document.getElementById('filmNext');
  if (filmPrev) {
    filmPrev.addEventListener('click', () => {
      if (state.batchIndex > 0) activateBatchItem(state.batchIndex - 1);
    });
  }
  if (filmNext) {
    filmNext.addEventListener('click', () => {
      if (state.batchIndex < state.batch.length - 1)
        activateBatchItem(state.batchIndex + 1);
    });
  }

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

})();
