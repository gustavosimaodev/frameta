/**
 * frameta/js/exif.js  — v3
 * Parser EXIF binário com diagnóstico interno detalhado.
 * Autor: Gustavo de Morais Simão
 */

window.FrametaExif = (() => {

  /* ── TAGS ──────────────────────────────────────────────── */
  const TAG = {
    0x010F:'Make', 0x0110:'Model', 0x0112:'Orientation',
    0x0131:'Software', 0x0132:'DateTime', 0x013B:'Artist',
    0x8769:'_ExifIFD', 0x8825:'_GPSIFD',
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

  /* ── LEITURA DE VALOR ──────────────────────────────────── */
  function readVal(dv, type, count, off, le) {
    try {
      if (type === 2) { // ASCII
        let s = '';
        for (let i = 0; i < count && i < 1024; i++) {
          const c = dv.getUint8(off + i);
          if (c === 0) break;
          if (c >= 32 && c < 127) s += String.fromCharCode(c);
        }
        return s.trim() || null;
      }
      if (type === 5 || type === 10) { // RATIONAL / SRATIONAL
        const vals = [];
        for (let i = 0; i < Math.min(count, 8); i++) {
          const o = off + i * 8;
          if (o + 8 > dv.byteLength) break;
          const n = type === 5 ? dv.getUint32(o,le) : dv.getInt32(o,le);
          const d = type === 5 ? dv.getUint32(o+4,le) : dv.getInt32(o+4,le);
          vals.push(d === 0 ? 0 : n / d);
        }
        return count === 1 ? vals[0] ?? null : vals;
      }
      const R = {
        1:(o)=>dv.getUint8(o), 3:(o)=>dv.getUint16(o,le),
        4:(o)=>dv.getUint32(o,le), 6:(o)=>dv.getInt8(o),
        8:(o)=>dv.getInt16(o,le), 9:(o)=>dv.getInt32(o,le),
      };
      const r = R[type]; if (!r) return null;
      const sz = TYPE_SIZE[type];
      if (count === 1) return r(off);
      const arr = [];
      for (let i = 0; i < Math.min(count,8); i++) arr.push(r(off + i*sz));
      return arr;
    } catch { return null; }
  }

  /* ── IFD ───────────────────────────────────────────────── */
  function readIFD(dv, ifdOff, le, tiffBase, depth, log) {
    const out = {};
    if (depth > 3) return out;
    if (ifdOff < 0 || ifdOff + 2 > dv.byteLength) {
      log.push(`IFD[${depth}] offset ${ifdOff} fora dos limites (buf=${dv.byteLength})`);
      return out;
    }

    let count;
    try { count = dv.getUint16(ifdOff, le); }
    catch (e) { log.push(`IFD[${depth}] falha ao ler count: ${e.message}`); return out; }

    log.push(`IFD[${depth}] @ ${ifdOff} → ${count} entradas`);
    if (count < 1 || count > 512) {
      log.push(`IFD[${depth}] count inválido: ${count}`);
      return out;
    }

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
      if (!sz || num < 1 || num > 65536) continue;

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

      if (name === '_ExifIFD') {
        let ptr;
        try { ptr = dv.getUint32(eOff + 8, le); } catch { continue; }
        log.push(`→ ExifIFD pointer: ${tiffBase + ptr}`);
        const sub = readIFD(dv, tiffBase + ptr, le, tiffBase, depth + 1, log);
        Object.assign(out, sub);
        continue;
      }

      if (!name || name.startsWith('_')) continue;

      const val = readVal(dv, type, num, dataOff, le);
      if (val !== null && val !== undefined && val !== '') {
        out[name] = val;
        if (['Make','Model','ExposureTime','FNumber','ISO','FocalLength','LensModel'].includes(name)) {
          log.push(`  tag 0x${tagId.toString(16)} ${name} = ${JSON.stringify(val)}`);
        }
      }
    }
    return out;
  }

  /* ── TIFF ──────────────────────────────────────────────── */
  function parseTIFF(dv, tiffBase, log) {
    if (tiffBase + 8 > dv.byteLength) {
      log.push(`TIFF base ${tiffBase} fora dos limites`); return null;
    }
    let bo, magic, ifd0Off;
    try {
      bo      = dv.getUint16(tiffBase);
      magic   = dv.getUint16(tiffBase + 2, bo === 0x4949);
      ifd0Off = dv.getUint32(tiffBase + 4, bo === 0x4949);
    } catch (e) { log.push('Falha cabeçalho TIFF: ' + e.message); return null; }

    const le = bo === 0x4949;
    const boStr = bo === 0x4949 ? 'LE(II)' : bo === 0x4D4D ? 'BE(MM)' : `0x${bo.toString(16)}`;
    log.push(`TIFF @ ${tiffBase} | byteOrder=${boStr} | magic=${magic} | IFD0 @ ${tiffBase+ifd0Off}`);

    if (bo !== 0x4949 && bo !== 0x4D4D) { log.push('Byte order inválido'); return null; }
    if (magic !== 42) { log.push(`Magic inválido: ${magic}`); return null; }

    return readIFD(dv, tiffBase + ifd0Off, le, tiffBase, 0, log);
  }

  /* ── JPEG scanner ─────────────────────────────────────── */
  function parseJPEG(dv) {
    const log = [];
    const len = dv.byteLength;
    log.push(`Arquivo: ${len} bytes`);

    if (len < 4 || dv.getUint8(0) !== 0xFF || dv.getUint8(1) !== 0xD8) {
      return { _error:'Não é JPEG', _log:log };
    }

    let off = 2;
    let app1Count = 0;

    while (off < len - 3) {
      if (dv.getUint8(off) !== 0xFF) { off++; continue; }
      const marker = dv.getUint8(off + 1);

      if (marker === 0xD8 || marker === 0xD9 ||
          (marker >= 0xD0 && marker <= 0xD7)) { off += 2; continue; }
      if (marker === 0x00) { off += 2; continue; }

      if (off + 3 >= len) break;
      let segLen;
      try { segLen = dv.getUint16(off + 2); } catch { break; }
      if (segLen < 2) { off += 2; continue; }

      const mHex = `0xFF${marker.toString(16).toUpperCase().padStart(2,'0')}`;
      log.push(`Segmento ${mHex} @ ${off}, len=${segLen}`);

      if (marker === 0xE1) {
        app1Count++;
        const dataStart = off + 4;
        const dataEnd   = dataStart + segLen - 2;
        if (dataStart + 6 < len) {
          // Lê os primeiros bytes como hex para diagnóstico
          const preview = Array.from({length: Math.min(16, segLen-2)},
            (_,i) => dv.getUint8(dataStart+i).toString(16).padStart(2,'0')).join(' ');
          log.push(`  APP1 dados: ${preview}`);

          // Tenta localizar "Exif" em posições flexíveis (0, 1, 2)
          for (let skip = 0; skip <= 2; skip++) {
            const base = dataStart + skip;
            if (base + 4 >= len) continue;
            const hdr = [0,1,2,3].map(j => {
              const c = dv.getUint8(base + j);
              return c >= 32 && c < 127 ? String.fromCharCode(c) : '?';
            }).join('');
            if (hdr === 'Exif') {
              const tiffBase = base + 6; // pula "Exif\0\0"
              log.push(`  → "Exif" encontrado @ ${base} (skip=${skip}), TIFF @ ${tiffBase}`);
              const raw = parseTIFF(dv, tiffBase, log);
              if (raw) {
                raw._ok  = true;
                raw._log = log;
                return raw;
              }
            }
          }

          // Tenta também procurar "Exif" dentro dos primeiros 64 bytes do segmento
          for (let s = 0; s < Math.min(64, segLen - 10); s++) {
            const base = dataStart + s;
            if (base + 4 >= len) break;
            const a = dv.getUint8(base),   b = dv.getUint8(base+1),
                  c = dv.getUint8(base+2), d = dv.getUint8(base+3);
            if (a===0x45 && b===0x78 && c===0x69 && d===0x66) { // "Exif"
              const tiffBase = base + 6;
              log.push(`  → "Exif" encontrado por scan @ ${base}, TIFF @ ${tiffBase}`);
              const raw = parseTIFF(dv, tiffBase, log);
              if (raw) { raw._ok=true; raw._log=log; return raw; }
            }
          }
        }
      }

      if (marker === 0xDA) break; // SOS
      off += 2 + segLen;
    }

    log.push(`APP1 encontrados: ${app1Count}, EXIF não extraído`);
    return { _error:'EXIF não encontrado', _log:log };
  }

  /* ── parse(file) ───────────────────────────────────────── */
  function parse(file) {
    return new Promise(resolve => {
      if (!file) { resolve({_error:'Sem arquivo',_log:[]}); return; }
      const r = new FileReader();
      r.onload  = ev => {
        try { resolve(parseJPEG(new DataView(ev.target.result))); }
        catch(e) { resolve({_error:'Exceção: '+e.message,_log:[]}); }
      };
      r.onerror = () => resolve({_error:'FileReader falhou',_log:[]});
      r.readAsArrayBuffer(file.slice(0, 1048576)); // 1MB
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
    const s = String(v);
    const m = s.match(/^(\d{4})[:\-\/](\d{2})[:\-\/](\d{2})/);
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
      return { ok:false, error: raw?._error || 'Falha no parse',
               fields:{}, _raw:raw, _log: raw?._log || [] };
    }
    const clean = s => s ? String(s).replace(/\0/g,'').trim() || null : null;
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
      fields, _raw: raw, _log: raw._log || [],
    };
  }

  return { parse, extract };
})();
