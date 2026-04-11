/**
 * frameta/js/exif.js
 * Parser EXIF nativo v2 — leitura binária JPEG/TIFF.
 * Suporte completo a IFD0 + ExifIFD, recursão de sub-IFDs.
 *
 * Autor: Gustavo de Morais Simão
 */

window.FrametaExif = (() => {

  /* ─────────────────────────────────────────────
     TABELA DE TAGS
  ───────────────────────────────────────────── */
  const TAG = {
    0x010F: 'Make',
    0x0110: 'Model',
    0x0112: 'Orientation',
    0x0131: 'Software',
    0x0132: 'DateTime',
    0x8769: '_ExifIFD',
    // Exif IFD
    0x829A: 'ExposureTime',
    0x829D: 'FNumber',
    0x8822: 'ExposureProgram',
    0x8827: 'ISO',
    0x9003: 'DateTimeOriginal',
    0x9004: 'DateTimeDigitized',
    0x9201: 'ShutterSpeedValue',
    0x9202: 'ApertureValue',
    0x9204: 'ExposureBiasValue',
    0x9207: 'MeteringMode',
    0x9209: 'Flash',
    0x920A: 'FocalLength',
    0xA002: 'PixelXDimension',
    0xA003: 'PixelYDimension',
    0xA402: 'ExposureMode',
    0xA403: 'WhiteBalance',
    0xA405: 'FocalLengthIn35mmFilm',
    0xA432: 'LensSpecification',
    0xA433: 'LensMake',
    0xA434: 'LensModel',
    0xA435: 'LensSerialNumber',
  };

  const TYPE_SIZE = { 1:1, 2:1, 3:2, 4:4, 5:8, 6:1, 7:1, 8:2, 9:4, 10:8, 11:4, 12:8 };

  /* ─────────────────────────────────────────────
     LÊ VALOR DE UM CAMPO
  ───────────────────────────────────────────── */
  function readValue(view, type, count, offset, le) {
    try {
      if (type === 2) {
        let s = '';
        for (let i = 0; i < count && i < 512; i++) {
          const c = view.getUint8(offset + i);
          if (c === 0) break;
          s += String.fromCharCode(c);
        }
        return s.trim() || null;
      }

      if (type === 5 || type === 10) {
        const results = [];
        for (let i = 0; i < Math.min(count, 8); i++) {
          const o = offset + i * 8;
          if (o + 8 > view.byteLength) break;
          const n = type === 5 ? view.getUint32(o,     le) : view.getInt32(o,     le);
          const d = type === 5 ? view.getUint32(o + 4, le) : view.getInt32(o + 4, le);
          results.push(d === 0 ? 0 : n / d);
        }
        return count === 1 ? results[0] : results;
      }

      const sz = TYPE_SIZE[type];
      if (!sz) return null;
      const readers = {
        1: (o) => view.getUint8(o),
        3: (o) => view.getUint16(o, le),
        4: (o) => view.getUint32(o, le),
        6: (o) => view.getInt8(o),
        8: (o) => view.getInt16(o, le),
        9: (o) => view.getInt32(o, le),
      };
      const r = readers[type];
      if (!r) return null;
      if (count === 1) return r(offset);
      const arr = [];
      for (let i = 0; i < Math.min(count, 8); i++) arr.push(r(offset + i * sz));
      return arr;
    } catch (e) {
      return null;
    }
  }

  /* ─────────────────────────────────────────────
     LÊ UM IFD
  ───────────────────────────────────────────── */
  function readIFD(view, ifdOffset, le, tiffBase, depth) {
    const out = {};
    if (depth > 2 || ifdOffset < 0 || ifdOffset + 2 > view.byteLength) return out;

    let count;
    try { count = view.getUint16(ifdOffset, le); }
    catch (e) { return out; }
    if (count < 1 || count > 256) return out;

    for (let i = 0; i < count; i++) {
      const e = ifdOffset + 2 + i * 12;
      if (e + 12 > view.byteLength) break;

      let tagId, type, num;
      try {
        tagId = view.getUint16(e,     le);
        type  = view.getUint16(e + 2, le);
        num   = view.getUint32(e + 4, le);
      } catch (_) { continue; }

      const sz = TYPE_SIZE[type];
      if (!sz || num < 1 || num > 65536) continue;

      const totalBytes = sz * num;
      let dataOff;
      if (totalBytes <= 4) {
        dataOff = e + 8;
      } else {
        let ptr;
        try { ptr = view.getUint32(e + 8, le); } catch (_) { continue; }
        dataOff = tiffBase + ptr;
        if (dataOff < 0 || dataOff + totalBytes > view.byteLength) continue;
      }

      const name = TAG[tagId];
      if (!name) continue;

      if (name === '_ExifIFD') {
        let ptr;
        try { ptr = view.getUint32(e + 8, le); } catch (_) { continue; }
        const sub = readIFD(view, tiffBase + ptr, le, tiffBase, depth + 1);
        Object.assign(out, sub);
        continue;
      }

      const val = readValue(view, type, num, dataOff, le);
      if (val !== null && val !== undefined && val !== '') {
        out[name] = val;
      }
    }
    return out;
  }

  /* ─────────────────────────────────────────────
     PARSEIA O BLOCO TIFF
  ───────────────────────────────────────────── */
  function parseTIFF(view, tiffBase) {
    if (tiffBase + 8 > view.byteLength) return { _error: 'TIFF fora dos limites' };

    let bo, magic, ifd0Off;
    try {
      bo      = view.getUint16(tiffBase);
      magic   = view.getUint16(tiffBase + 2, bo === 0x4949);
      ifd0Off = view.getUint32(tiffBase + 4, bo === 0x4949);
    } catch (e) { return { _error: 'Falha no cabeçalho TIFF' }; }

    const le = bo === 0x4949;
    if (bo !== 0x4949 && bo !== 0x4D4D) return { _error: 'Byte order inválido' };
    if (magic !== 42) return { _error: 'Magic TIFF incorreto: ' + magic };

    const raw = readIFD(view, tiffBase + ifd0Off, le, tiffBase, 0);
    raw._ok = true;
    return raw;
  }

  /* ─────────────────────────────────────────────
     VARRE O JPEG PROCURANDO APP1/EXIF
  ───────────────────────────────────────────── */
  function parseJPEG(view) {
    const len = view.byteLength;
    if (len < 4) return { _error: 'Arquivo muito pequeno' };

    try {
      if (view.getUint8(0) !== 0xFF || view.getUint8(1) !== 0xD8) {
        return { _error: 'Não é um JPEG válido' };
      }
    } catch (e) { return { _error: 'Falha na leitura inicial' }; }

    let offset = 2;
    while (offset < len - 3) {
      // Garante marcador 0xFF
      if (view.getUint8(offset) !== 0xFF) { offset++; continue; }

      const marker = view.getUint8(offset + 1);

      // Marcadores sem segmento
      if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
        offset += 2;
        continue;
      }

      if (offset + 3 >= len) break;
      let segLen;
      try { segLen = view.getUint16(offset + 2); } catch (e) { break; }
      if (segLen < 2) { offset += 2; continue; }

      // APP1 = 0xE1
      if (marker === 0xE1 && segLen > 8) {
        const base = offset + 4;
        // Verifica "Exif\0\0" (6 bytes)
        if (base + 6 < len) {
          try {
            const hdr = String.fromCharCode(
              view.getUint8(base),
              view.getUint8(base + 1),
              view.getUint8(base + 2),
              view.getUint8(base + 3)
            );
            if (hdr === 'Exif') {
              return parseTIFF(view, base + 6);
            }
          } catch (e) { /* continua */ }
        }
      }

      // SOS: início dos dados — para
      if (marker === 0xDA) break;

      offset += 2 + segLen;
    }

    return { _error: 'EXIF não encontrado neste arquivo' };
  }

  /* ─────────────────────────────────────────────
     parse(file) → Promise<raw>
  ───────────────────────────────────────────── */
  function parse(file) {
    return new Promise((resolve) => {
      if (!file) { resolve({ _error: 'Sem arquivo' }); return; }
      const reader = new FileReader();
      reader.onload  = (ev) => {
        try {
          resolve(parseJPEG(new DataView(ev.target.result)));
        } catch (e) {
          resolve({ _error: 'Exceção: ' + e.message });
        }
      };
      reader.onerror = () => resolve({ _error: 'FileReader falhou' });
      reader.readAsArrayBuffer(file.slice(0, 524288));
    });
  }

  /* ─────────────────────────────────────────────
     FORMATADORES
  ───────────────────────────────────────────── */
  function fmtShutter(v) {
    if (v == null || typeof v !== 'number') return null;
    if (v <= 0) return null;
    if (v >= 1) return (Number.isInteger(v) ? v : v.toFixed(1)) + 's';
    return '1/' + Math.round(1 / v) + 's';
  }

  function fmtAperture(v) {
    if (v == null || typeof v !== 'number' || v <= 0) return null;
    const r = Math.round(v * 10) / 10;
    return 'f/' + (r % 1 === 0 ? r.toFixed(0) : r.toFixed(1));
  }

  function fmtFocal(v) {
    if (v == null || typeof v !== 'number' || v <= 0) return null;
    return Math.round(v) + 'mm';
  }

  function fmtDate(v) {
    if (!v) return null;
    const s = String(v);
    const m = s.match(/^(\d{4})[:\-\/](\d{2})[:\-\/](\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    if (v instanceof Date) return v.toLocaleDateString('pt-BR');
    return null;
  }

  function fmtCamera(raw) {
    const make  = (raw.Make  || '').replace(/\0/g, '').trim();
    const model = (raw.Model || '').replace(/\0/g, '').trim();
    if (!make && !model) return null;
    const makeLower  = make.toLowerCase();
    const modelLower = model.toLowerCase();
    if (modelLower.startsWith(makeLower.split(' ')[0])) return model;
    return [make, model].filter(Boolean).join(' ');
  }

  /* ─────────────────────────────────────────────
     extract(raw) → { ok, fields, error, _raw }
  ───────────────────────────────────────────── */
  function extract(raw) {
    if (!raw || !raw._ok) {
      return { ok: false, error: raw?._error || 'Falha no parse', fields: {}, _raw: raw };
    }

    const clean = (s) => s ? String(s).replace(/\0/g, '').trim() || null : null;

    const fields = {
      camera:   fmtCamera(raw),
      lens:     clean(raw.LensModel || raw.LensMake),
      shutter:  fmtShutter(raw.ExposureTime),
      aperture: fmtAperture(raw.FNumber),
      iso:      raw.ISO != null ? String(raw.ISO) : null,
      focal:    fmtFocal(raw.FocalLength),
      focal35:  raw.FocalLengthIn35mmFilm ? fmtFocal(raw.FocalLengthIn35mmFilm) : null,
      date:     fmtDate(raw.DateTimeOriginal || raw.DateTime),
      software: clean(raw.Software),
    };

    const hasAny = Object.values(fields).some(v => v != null);
    return {
      ok: hasAny,
      error: hasAny ? null : 'EXIF presente, mas sem campos de câmera',
      fields,
      _raw: raw,
    };
  }

  return { parse, extract };

})();
