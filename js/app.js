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
      $('tabEditor').style.display = tab === 'editor' ? 'flex' : 'none';
      $('tabAbout').style.display  = tab === 'about'  ? 'flex' : 'none';
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
  setupGroup('overlaySizeGroup','overlaySize');

  /* Mostra/esconde seção de tamanho conforme o estilo */
  function updateOverlaySizeVisibility() {
    const sec = document.getElementById('overlaySizeSection');
    if (!sec) return;
    sec.classList.toggle('hidden', state.style !== 'overlay');
  }
  updateOverlaySizeVisibility();

  /* -------------------------------------------------------
     SLIDER DE TAMANHO DE FONTE
  ------------------------------------------------------- */
  const fontSizeSlider = $('fontSizeSlider');
  const fontSizeVal    = $('fontSizeVal');
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', () => {
      state.fontScale = parseInt(fontSizeSlider.value) / 100;
      fontSizeVal.textContent = fontSizeSlider.value + '%';
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
     UPLOAD — FILE INPUT
  ------------------------------------------------------- */
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) loadFile(file);
    fileInput.value = ''; // reset para permitir reupload do mesmo arquivo
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
    const file = e.dataTransfer.files[0];
    if (file && file.type.match(/^image\//)) {
      loadFile(file);
    } else {
      showToast('Formato não suportado. Use JPEG, PNG ou TIFF.');
    }
  });

  /* -------------------------------------------------------
     CARREGAR ARQUIVO
  ------------------------------------------------------- */
  async function loadFile(file) {
    showToast('Lendo metadados…');

    // 1. Carrega a imagem
    const url = URL.createObjectURL(file);
    const img  = new Image();

    img.onerror = () => {
      URL.revokeObjectURL(url);
      showToast('Erro ao carregar a imagem.');
    };

    img.onload = async () => {
      state.img = img;
      URL.revokeObjectURL(url);

      // 2. Lê o EXIF
      const raw    = await window.FrametaExif.parse(file);
      const result = window.FrametaExif.extract(raw);
      state.fields = result.fields || {};

      // 3. Atualiza painel EXIF
      updateExifPanel(result);

      // 4. Renderiza
      render();
      exportBtn.disabled = false;

      // 5. Mostra preview
      emptyState.style.display      = 'none';
      previewContainer.style.display = 'flex';

      if (result.ok) {
        showToast('EXIF carregado com sucesso.');
      } else {
        showToast('Foto carregada. ' + (result.error || 'Sem dados EXIF.'));
      }
    };

    img.src = url;
  }

  /* -------------------------------------------------------
     PAINEL EXIF
  ------------------------------------------------------- */
  function updateExifPanel(result) {
    exifEmpty.style.display = 'none';
    exifData.style.display  = 'block';

    // Status badge
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

    // Debug: mostra os dados crus para diagnóstico
    const debugBlock = document.getElementById('debugBlock');
    const debugPre   = document.getElementById('debugPre');
    if (debugBlock && debugPre) {
      debugBlock.style.display = 'block';
      const log = result._log || [];
      const safe = {};
      if (result._raw) {
        Object.entries(result._raw).forEach(([k, v]) => {
          if (!k.startsWith('_')) safe[k] = v;
        });
      }
      debugPre.textContent =
        '── LOG ──\n' + log.join('\n') +
        '\n\n── RAW FIELDS ──\n' + JSON.stringify(safe, null, 2);
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
      a.download = 'frameta_' + Date.now() + '.jpg';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      exportBtn.disabled = false;
      showToast('Download iniciado!');
    }, 'image/jpeg', 0.95);
  });

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
