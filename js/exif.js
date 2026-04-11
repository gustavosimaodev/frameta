/**
 * frameta/js/exif.js — v4
 * Corrige: segue IFD chain (IFD0→IFD1→...), lê SubIFD/ExifIFD,
 * funciona com big-endian (MM) e IFDs minimalistas.
 *
 * Autor: Gustavo de Morais Simão
 */

window.FrametaExif = (() => {

  /* ── TAGS ──────────────────────────────────────────────── */
  const TAG = {
    0x010F:'Make', 0x0110:'Model', 0x0112:'Orientation',
    0x0131:'Software', 0x0132:'DateTime', 0x013B:'Artist',
    // Ponteiros para sub-IFDs
    0x014A:'SubIFD',
    0x8769:'ExifIFD',
    0x8825:'GPSIFD',
    // Exif IFD
    0x829A:'ExposureTime', 0x829D:'FNumber',
    0x8822:'ExposureProgram', 0x8827:'ISO',
    0x9003:'DateTimeOriginal', 0x9004:'DateTimeDigitized',
    0x9201:'ShutterSpeedValue', 0x9202:'ApertureValue',
    0x9204:'ExposureBiasValue', 0x9207:'MeteringMode',
    0x9209:'Flash', 0x920A:'FocalLength',
    0xA002:'PixelXDimension', 0xA003:'PixelYDimension',
    0xA402:'ExposureMode', 0xA403:'WhiteBalance',
    0xA405:'FocalLengthIn35mmFilm',
    0xA432:'LensSpecification', 0xA433:'LensMake',
    0xA434:'LensModel', 0xA435:'LensSerialNumber',
  };

  const TYPE_SIZE = {1:1,2:1,3:2,4:4,5:8,6:1,7:1,8:2,9:4,10:8,11:4,12:8};

  /* ── LÊ VALOR ──────────────────────────────────────────── */
  function readVal(dv, type, count, off, le) {
    try {
      if (type === 2) {
        let s = '';
        for (let i = 0; i < count && i < 1024; i++) {
          const c = dv.getUint8(off + i);
          if (c === 0) break;
          if (c >= 32 && c < 127) s += String.fromCharCode(c);
        }
        return s.trim() || null;
      }
      if (type === 5 || type === 10) {
        const vals = [];
        for (let i = 0; i < Math.min(count, 8); i++) {
          const o = off + i * 8;
          if (o + 8 > dv.byteLength) break;
          const n = type === 5 ? dv.getUint32(o,le) : dv.getInt32(o,le);
          const d = type === 5 ? dv.getUint32(o+4,le) : dv.getInt32(o+4,le);
          vals.push(d === 0 ? 0 : n / d);
        }
        return count === 1 ? (vals[0] ?? null) : vals;
      }
      const R = {
        1:(o)=>dv.getUint8(o),      3:(o)=>dv.getUint16(o,le),
        4:(o)=>dv.getUint32(o,le),  6:(o)=>dv.getInt8(o),
        8:(o)=>dv.getInt16(o,le),   9:(o)=>dv.getInt32(o,le),
      };
      const r = R[type]; if (!r) return null;
      const sz = TYPE_SIZE[type];
      if (count === 1) return r(off);
      const arr = [];
      for (let i = 0; i < Math.min(count,8); i++) arr.push(r(off + i*sz));
      return arr;
    } catch { return null; }
  }

  /* ── LÊ UM IFD — retorna {fields, nextIFD, subPointers} ── */
  function readIFD(dv, ifdOff, le, tiffBase, log) {
    const fields = {};
    const subPointers = {}; // tagName → absolute offset

    if (ifdOff < 0 || ifdOff + 2 > dv.byteLength) {
      log && log.push(`readIFD: offset ${ifdOff} inválido`);
      return { fields, nextIFD: 0, subPointers };
    }

    let count;
    try { count = dv.getUint16(ifdOff, le); }
    catch { return { fields, nextIFD:0, subPointers }; }

    if (count < 1 || count > 512) {
      log && log.push(`readIFD @ ${ifdOff}: count=${count} inválido`);
      return { fields, nextIFD:0, subPointers };
    }

    log && log.push(`IFD @ ${ifdOff}: ${count} entradas`);

    for (let i = 0; i < count; i++) {
      const eOff = ifdOff + 2 + i * 12;
      if (eOff + 12 > dv.byteLength) break;

      let tagId, type, num;
      try {
        tagId = dv.getUint16(eOff,     le);
        type  = dv.getUint16(eOff + 2, le);
        num   = dv.getUint32(eOff + 4, le);
      } catch { continue; }

      const sz = TYPE_SIZE[type];
      if (!sz || num < 1 || num > 100000) continue;

      const totalBytes = sz * num;
      let dataOff;
      if (totalBytes <= 4) {
        dataOff = eOff + 8;
      } else {
        let ptr;
        try { ptr = dv.getUint32(eOff + 8, le); } catch { continue; }
        dataOff = tiffBase + ptr;
        if (dataOff < 0 || dataOff + totalBytes > dv.byteLength) continue;
      }

      const name = TAG[tagId];

      // Sub-IFD pointers — guarda para seguir depois
      if (name === 'ExifIFD' || name === 'SubIFD' || name === 'GPSIFD') {
        let ptr;
        try { ptr = dv.getUint32(eOff + 8, le); } catch { continue; }
        if (name !== 'GPSIFD') {
          subPointers[name] = tiffBase + ptr;
          log && log.push(`  → ${name} pointer @ abs ${tiffBase + ptr}`);
        }
        continue;
      }

      if (!name) continue;

      const val = readVal(dv, type, num, dataOff, le);
      if (val !== null && val !== undefined && val !== '') {
        fields[name] = val;
        if (['Make','Model','ExposureTime','FNumber','ISO',
             'FocalLength','LensModel','DateTimeOriginal'].includes(name)) {
          log && log.push(`  tag 0x${tagId.toString(16)} ${name} = ${JSON.stringify(val)}`);
        }
      }
    }

    // Ponteiro para o próximo IFD (4 bytes após as entradas)
    let nextIFD = 0;
    const nextOff = ifdOff + 2 + count * 12;
    if (nextOff + 4 <= dv.byteLength) {
      try { nextIFD = dv.getUint32(nextOff, le); } catch { nextIFD = 0; }
    }

    return { fields, nextIFD, subPointers };
  }

  /* ── PARSEIA TIFF COMPLETO — segue toda a chain ─────────── */
  function parseTIFF(dv, tiffBase, log) {
    if (tiffBase + 8 > dv.byteLength) return null;

    let bo, magic, ifd0Off;
    try {
      bo      = dv.getUint16(tiffBase);
      magic   = dv.getUint16(tiffBase + 2, bo === 0x4949);
      ifd0Off = dv.getUint32(tiffBase + 4, bo === 0x4949);
    } catch { return null; }

    const le = bo === 0x4949;
    const boStr = le ? 'LE(II)' : 'BE(MM)';
    log.push(`TIFF @ ${tiffBase} | ${boStr} | magic=${magic} | IFD0 @ abs ${tiffBase + ifd0Off}`);

    if (bo !== 0x4949 && bo !== 0x4D4D) return null;
    if (magic !== 42) { log.push(`magic inválido: ${magic}`); return null; }

    const merged = {};

    // Segue a IFD chain: IFD0 → IFD1 → IFD2 ...
    let currentOff = tiffBase + ifd0Off;
    let chainDepth = 0;
    const visitedIFDs = new Set();

    while (currentOff > 0 && chainDepth < 8 && !visitedIFDs.has(currentOff)) {
      visitedIFDs.add(currentOff);
      const { fields, nextIFD, subPointers } = readIFD(dv, currentOff, le, tiffBase, log);
      Object.assign(merged, fields);

      // Processa ExifIFD e SubIFD
      for (const [subName, subAbsOff] of Object.entries(subPointers)) {
        if (!visitedIFDs.has(subAbsOff)) {
          visitedIFDs.add(subAbsOff);
          log.push(`Entrando em ${subName} @ ${subAbsOff}`);
          const { fields: subFields } = readIFD(dv, subAbsOff, le, tiffBase, log);
          Object.assign(merged, subFields); // Exif IFD tem prioridade sobre IFD0 para datas
        }
      }

      // Avança para o próximo IFD na chain
      currentOff = nextIFD > 0 ? tiffBase + nextIFD : 0;
      chainDepth++;
    }

    log.push(`Campos extraídos: ${Object.keys(merged).join(', ') || 'nenhum'}`);
    return merged;
  }

  /* ── SCAN JPEG ─────────────────────────────────────────── */
  function parseJPEG(dv) {
    const log = [];
    const len = dv.byteLength;
    log.push(`Arquivo: ${len} bytes`);

    if (len < 4 || dv.getUint8(0) !== 0xFF || dv.getUint8(1) !== 0xD8) {
      return { _error:'Não é JPEG', _log:log };
    }

    let off = 2;
    while (off < len - 3) {
      if (dv.getUint8(off) !== 0xFF) { off++; continue; }
      const marker = dv.getUint8(off + 1);

      if (marker === 0xD8||marker===0xD9||marker===0x00||
          (marker>=0xD0&&marker<=0xD7)) { off+=2; continue; }

      if (off + 3 >= len) break;
      let segLen;
      try { segLen = dv.getUint16(off + 2); } catch { break; }
      if (segLen < 2) { off += 2; continue; }

      log.push(`Seg 0xFF${marker.toString(16).padStart(2,'0')} @ ${off} len=${segLen}`);

      if (marker === 0xE1 && segLen > 10) {
        const dataStart = off + 4;
        const hexPreview = Array.from({length:Math.min(20,segLen-2)},
          (_,i)=>dv.getUint8(dataStart+i).toString(16).padStart(2,'0')).join(' ');
        log.push(`  bytes: ${hexPreview}`);

        // Procura "Exif" nos primeiros 64 bytes do segmento
        const searchLen = Math.min(64, segLen - 10);
        for (let s = 0; s <= searchLen; s++) {
          const b = dataStart + s;
          if (b + 4 >= len) break;
          if (dv.getUint8(b)===0x45 && dv.getUint8(b+1)===0x78 &&
              dv.getUint8(b+2)===0x69 && dv.getUint8(b+3)===0x66) {
            // Encontrou "Exif" — TIFF começa após "Exif\0\0" (6 bytes)
            const tiffBase = b + 6;
            log.push(`"Exif" @ ${b}, TIFF @ ${tiffBase}`);
            const raw = parseTIFF(dv, tiffBase, log);
            if (raw) {
              raw._ok  = true;
              raw._log = log;
              return raw;
            }
          }
        }
      }

      if (marker === 0xDA) break;
      off += 2 + segLen;
    }

    return { _error:'EXIF não encontrado', _log:log };
  }

  /* ── parse(file) → Promise ─────────────────────────────── */
  function parse(file) {
    return new Promise(resolve => {
      if (!file) { resolve({_error:'Sem arquivo',_log:[]}); return; }
      const r = new FileReader();
      r.onload  = ev => {
        try { resolve(parseJPEG(new DataView(ev.target.result))); }
        catch(e) { resolve({_error:'Exceção: '+e.message,_log:[]}); }
      };
      r.onerror = () => resolve({_error:'FileReader falhou',_log:[]});
      // 1MB — suficiente para EXIF (que fica sempre no início)
      r.readAsArrayBuffer(file.slice(0, 1048576));
    });
  }

  /* ── FORMATADORES ─────────────────────────────────────── */
  function fmtShutter(v) {
    if (v == null || typeof v !== 'number' || v <= 0) return null;
    if (v >= 1) return (Number.isInteger(v) ? v : v.toFixed(1)) + 's';
    return '1/' + Math.round(1/v) + 's';
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
    const m = String(v).match(/^(\d{4})[:\-\/](\d{2})[:\-\/](\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
  }
  function fmtCamera(raw) {
    const make  = (raw.Make  || '').replace(/\0/g,'').trim();
    const model = (raw.Model || '').replace(/\0/g,'').trim();
    if (!make && !model) return null;
    if (model.toLowerCase().startsWith(make.toLowerCase().split(' ')[0])) return model;
    return [make, model].filter(Boolean).join(' ');
  }

  /* ── extract(raw) ──────────────────────────────────────── */
  function extract(raw) {
    if (!raw || !raw._ok) {
      return { ok:false, error:raw?._error||'Falha', fields:{}, _raw:raw, _log:raw?._log||[] };
    }
    const clean = s => s ? String(s).replace(/\0/g,'').trim()||null : null;
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
      fields, _raw:raw, _log:raw._log||[],
    };
  }

  return { parse, extract };
})();
