/**
 * frameta/js/exif.js
 * Parser EXIF nativo — leitura binária direta do JPEG.
 * Sem dependências externas. Funciona em qualquer browser moderno.
 *
 * Autor: Gustavo de Morais Simão
 * Baseado na especificação EXIF 2.3 / TIFF 6.0
 */

window.FrametaExif = (() => {

  /* -------------------------------------------------------
     CONSTANTES DE TAGS EXIF / TIFF
  ------------------------------------------------------- */
  const TAGS = {
    // IFD0 (imagem principal)
    0x010F: 'Make',
    0x0110: 'Model',
    0x0112: 'Orientation',
    0x011A: 'XResolution',
    0x011B: 'YResolution',
    0x0131: 'Software',
    0x0132: 'DateTime',
    0x8769: 'ExifIFDPointer',
    0x8825: 'GPSInfoIFDPointer',
    // Exif IFD
    0x829A: 'ExposureTime',
    0x829D: 'FNumber',
    0x8822: 'ExposureProgram',
    0x8827: 'ISOSpeedRatings',
    0x9000: 'ExifVersion',
    0x9003: 'DateTimeOriginal',
    0x9004: 'DateTimeDigitized',
    0x9201: 'ShutterSpeedValue',
    0x9202: 'ApertureValue',
    0x9203: 'BrightnessValue',
    0x9204: 'ExposureBiasValue',
    0x9205: 'MaxApertureValue',
    0x9207: 'MeteringMode',
    0x9208: 'LightSource',
    0x9209: 'Flash',
    0x920A: 'FocalLength',
    0xA002: 'PixelXDimension',
    0xA003: 'PixelYDimension',
    0xA20E: 'FocalPlaneXResolution',
    0xA20F: 'FocalPlaneYResolution',
    0xA210: 'FocalPlaneResolutionUnit',
    0xA217: 'SensingMethod',
    0xA300: 'FileSource',
    0xA301: 'SceneType',
    0xA402: 'ExposureMode',
    0xA403: 'WhiteBalance',
    0xA404: 'DigitalZoomRatio',
    0xA405: 'FocalLengthIn35mmFilm',
    0xA406: 'SceneCaptureType',
    0xA420: 'ImageUniqueID',
    0xA432: 'LensSpecification',
    0xA433: 'LensMake',
    0xA434: 'LensModel',
    0xA435: 'LensSerialNumber',
  };

  const TYPES = {
    1: { size: 1, read: (v, o, le) => v.getUint8(o) },                          // BYTE
    2: { size: 1, read: null },                                                   // ASCII
    3: { size: 2, read: (v, o, le) => v.getUint16(o, le) },                      // SHORT
    4: { size: 4, read: (v, o, le) => v.getUint32(o, le) },                      // LONG
    5: { size: 8, read: (v, o, le) => ({ n: v.getUint32(o, le), d: v.getUint32(o+4, le) }) }, // RATIONAL
    7: { size: 1, read: (v, o, le) => v.getUint8(o) },                          // UNDEFINED
    9: { size: 4, read: (v, o, le) => v.getInt32(o, le) },                       // SLONG
   10: { size: 8, read: (v, o, le) => ({ n: v.getInt32(o, le), d: v.getInt32(o+4, le) }) }, // SRATIONAL
  };

  /* -------------------------------------------------------
     LEITURA DE IFD
  ------------------------------------------------------- */
  function readIFD(view, offset, littleEndian, tiffStart) {
    const result = {};
    try {
      const count = view.getUint16(offset, littleEndian);
      offset += 2;

      for (let i = 0; i < count; i++) {
        const tag  = view.getUint16(offset,     littleEndian);
        const type = view.getUint16(offset + 2, littleEndian);
        const num  = view.getUint32(offset + 4, littleEndian);
        const valOffset = offset + 8;
        offset += 12;

        const typeInfo = TYPES[type];
        if (!typeInfo) continue;

        const totalSize = typeInfo.size * num;
        let dataOffset = valOffset;
        if (totalSize > 4) {
          dataOffset = tiffStart + view.getUint32(valOffset, littleEndian);
        }

        let value;
        if (type === 2) {
          // ASCII
          let str = '';
          for (let j = 0; j < num - 1; j++) {
            const c = view.getUint8(dataOffset + j);
            if (c === 0) break;
            str += String.fromCharCode(c);
          }
          value = str.trim();
        } else if (num === 1) {
          value = typeInfo.read(view, dataOffset, littleEndian);
        } else {
          value = [];
          for (let j = 0; j < Math.min(num, 8); j++) {
            value.push(typeInfo.read(view, dataOffset + j * typeInfo.size, littleEndian));
          }
          if (value.length === 1) value = value[0];
        }

        const tagName = TAGS[tag] || ('0x' + tag.toString(16));
        result[tagName] = value;
      }
    } catch (e) {
      // IFD parcialmente corrompido — retorna o que conseguiu ler
    }
    return result;
  }

  /* -------------------------------------------------------
     PARSER PRINCIPAL
  ------------------------------------------------------- */
  async function parse(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buf = e.target.result;
          const view = new DataView(buf);
          const result = extractFromBuffer(view);
          resolve(result);
        } catch (err) {
          resolve({ _error: err.message });
        }
      };
      reader.onerror = () => resolve({ _error: 'Falha ao ler o arquivo' });
      // Lê apenas os primeiros 256KB — suficiente para o segmento APP1/EXIF
      const slice = file.slice(0, 262144);
      reader.readAsArrayBuffer(slice);
    });
  }

  function extractFromBuffer(view) {
    // Verifica assinatura JPEG: FF D8
    if (view.getUint8(0) !== 0xFF || view.getUint8(1) !== 0xD8) {
      return { _error: 'Não é um JPEG válido' };
    }

    let offset = 2;
    const len = view.byteLength;

    while (offset < len - 4) {
      if (view.getUint8(offset) !== 0xFF) break;

      const marker = view.getUint8(offset + 1);
      const segLen = view.getUint16(offset + 2);

      // APP1 = 0xE1 — aqui fica o EXIF
      if (marker === 0xE1) {
        // Verifica header "Exif\0\0"
        const exifHeader = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );
        if (exifHeader === 'Exif') {
          const tiffStart = offset + 10; // após "Exif\0\0"
          return parseTIFF(view, tiffStart);
        }
      }

      // Pula para o próximo segmento
      offset += 2 + segLen;
    }

    return { _error: 'Bloco EXIF não encontrado neste arquivo' };
  }

  function parseTIFF(view, tiffStart) {
    // Byte order: "II" = little endian, "MM" = big endian
    const byteOrder = view.getUint16(tiffStart);
    let le;
    if (byteOrder === 0x4949) le = true;       // II
    else if (byteOrder === 0x4D4D) le = false;  // MM
    else return { _error: 'Byte order TIFF inválido' };

    // Verifica magic number 42
    const magic = view.getUint16(tiffStart + 2, le);
    if (magic !== 42) return { _error: 'Magic number TIFF inválido' };

    const ifd0Offset = view.getUint32(tiffStart + 4, le);
    const ifd0 = readIFD(view, tiffStart + ifd0Offset, le, tiffStart);

    let exifData = {};
    if (ifd0.ExifIFDPointer) {
      exifData = readIFD(view, tiffStart + ifd0.ExifIFDPointer, le, tiffStart);
    }

    // Merge — IFD0 tem prioridade para Make/Model; Exif IFD para os parâmetros de captura
    return { ...ifd0, ...exifData, _ok: true };
  }

  /* -------------------------------------------------------
     FORMATADORES
  ------------------------------------------------------- */
  function rational(v) {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && 'd' in v) {
      if (v.d === 0) return null;
      return v.n / v.d;
    }
    return null;
  }

  function formatShutter(raw) {
    const v = rational(raw);
    if (v == null) return null;
    if (v >= 1) {
      return Number.isInteger(v) ? v + 's' : v.toFixed(1) + 's';
    }
    const denom = Math.round(1 / v);
    return '1/' + denom + 's';
  }

  function formatAperture(raw) {
    const v = rational(raw);
    if (v == null) return null;
    const rounded = Math.round(v * 10) / 10;
    return 'f/' + (Number.isInteger(rounded) ? rounded.toFixed(0) : rounded);
  }

  function formatFocal(raw) {
    const v = rational(raw);
    if (v == null) return null;
    return Math.round(v) + 'mm';
  }

  function formatDate(raw) {
    if (!raw) return null;
    if (raw instanceof Date) return raw.toLocaleDateString('pt-BR');
    const s = String(raw);
    // "2024:03:15 10:30:00" → "15/03/2024"
    const m = s.match(/^(\d{4})[:\-\/](\d{2})[:\-\/](\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return s;
  }

  function formatCamera(raw) {
    const make  = (raw.Make  || '').trim();
    const model = (raw.Model || '').trim();
    if (!make && !model) return null;
    // Evita duplicar a marca (ex: "Canon Canon EOS R5")
    if (model.toLowerCase().startsWith(make.toLowerCase())) return model;
    return [make, model].filter(Boolean).join(' ');
  }

  /* -------------------------------------------------------
     EXTRAÇÃO ESTRUTURADA
  ------------------------------------------------------- */
  function extract(raw) {
    if (!raw || raw._error) {
      return { ok: false, error: raw?._error || 'Erro desconhecido', fields: {} };
    }

    const fields = {
      camera:   formatCamera(raw),
      lens:     (raw.LensModel || raw.LensMake || null),
      shutter:  formatShutter(raw.ExposureTime),
      aperture: formatAperture(raw.FNumber),
      iso:      raw.ISOSpeedRatings != null ? String(raw.ISOSpeedRatings) : null,
      focal:    formatFocal(raw.FocalLength),
      focal35:  raw.FocalLengthIn35mmFilm ? Math.round(rational(raw.FocalLengthIn35mmFilm)) + 'mm' : null,
      date:     formatDate(raw.DateTimeOriginal || raw.DateTime),
      software: raw.Software || null,
    };

    const hasData = Object.values(fields).some(v => v != null);
    return { ok: hasData, error: hasData ? null : 'EXIF presente mas sem campos de câmera', fields, _raw: raw };
  }

  /* -------------------------------------------------------
     API PÚBLICA
  ------------------------------------------------------- */
  return { parse, extract, formatShutter, formatAperture, formatFocal, formatDate };

})();
