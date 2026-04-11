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
    style: 'white',
    pos:   'bl',
    fmt:   'original',
    font:  'sans',
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
  const toggleTitle     = $('toggleTitle');
  const toggleList      = $('toggleList');
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

  setupGroup('styleGroup', 'style');
  setupGroup('posGroup',   'pos');
  setupGroup('fmtGroup',   'fmt');
  setupGroup('fontGroup',  'font');

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

      // 4. Inicializa toggles se ainda não existirem
      buildToggles();

      // 5. Renderiza
      render();
      exportBtn.disabled = false;

      // 6. Mostra preview
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
      exifStatus.textContent = '⚠ EXIF limitado';
    } else {
      exifStatus.classList.add('err');
      exifStatus.textContent = '✕ ' + (result.error || 'Sem EXIF');
    }

    // Lista de campos formatados
    exifList.innerHTML = '';
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
     TOGGLES DE CAMPOS
  ------------------------------------------------------- */
  let togglesBuilt = false;

  function buildToggles() {
    if (togglesBuilt) return;
    togglesBuilt = true;

    toggleTitle.style.display = 'block';
    toggleList.innerHTML = '';

    const TOGGLE_DEFS = [
      { key: 'camera',   label: 'Câmera' },
      { key: 'lens',     label: 'Lente' },
      { key: 'shutter',  label: 'Velocidade' },
      { key: 'aperture', label: 'Abertura' },
      { key: 'iso',      label: 'ISO' },
      { key: 'focal',    label: 'Focal' },
      { key: 'date',     label: 'Data' },
    ];

    TOGGLE_DEFS.forEach(({ key, label }) => {
      const row = document.createElement('div');
      row.className = 'toggle-row';

      const lbl = document.createElement('span');
      lbl.className = 'toggle-label';
      lbl.textContent = label;

      const wrap = document.createElement('label');
      wrap.className = 'toggle-wrap';

      const input = document.createElement('input');
      input.type    = 'checkbox';
      input.checked = state.visible[key] !== false;
      input.addEventListener('change', () => {
        state.visible[key] = input.checked;
        render();
      });

      const slider = document.createElement('span');
      slider.className = 'toggle-slider';

      wrap.appendChild(input);
      wrap.appendChild(slider);
      row.appendChild(lbl);
      row.appendChild(wrap);
      toggleList.appendChild(row);
    });
  }

  /* -------------------------------------------------------
     RENDERIZAÇÃO
  ------------------------------------------------------- */
  function render() {
    if (!state.img) return;
    window.FrametaRender.draw(mainCanvas, state.img, state.fields, {
      style:   state.style,
      pos:     state.pos,
      fmt:     state.fmt,
      font:    state.font,
      visible: state.visible,
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
