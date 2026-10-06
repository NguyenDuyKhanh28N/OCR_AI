/** VALIDATOR: chuẩn hóa ngày, kiểm schema, kiểm trùng. */
function normalizeDate_(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const s = String(v).trim().toLowerCase();
  let d, m, y, x;
  if ((x = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) { y = +x[1]; m = +x[2]; d = +x[3]; }
  else if ((x = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) { d = +x[1]; m = +x[2]; y = +x[3]; }
  else if ((x = s.match(/ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/))) { d = +x[1]; m = +x[2]; y = +x[3]; }
  else return undefined; // không nhận dạng được
  const t = new Date(y, m - 1, d);
  if (t.getFullYear() !== y || t.getMonth() !== m - 1 || t.getDate() !== d) return undefined;
  return ('0' + d).slice(-2) + '/' + ('0' + m).slice(-2) + '/' + y;
}

/** Kiểm tra kết quả AI/form. Trả {ok, errors, warnings, result(đã chuẩn hóa), kind}. */
function validateExtraction(raw, cfg) {
  const errors = [], warnings = [];
  if (!raw || typeof raw !== 'object') return {ok:false, errors:['Dữ liệu không hợp lệ.'], warnings, result:null, kind:null};
  if (raw.loai_so === null && raw.du_lieu === null) return {ok:false, errors:['Không đủ căn cứ xác định loại văn bản. Vui lòng kiểm tra thủ công.'], warnings, result:{loai_so:null,du_lieu:null}, kind:null};
  if (!('loai_so' in raw)) errors.push('Thiếu loai_so.');
  if (!raw.du_lieu || typeof raw.du_lieu !== 'object') errors.push('Thiếu du_lieu.');
  const kind = kindFromLabel_(raw.loai_so, cfg);
  if (!kind) errors.push('loai_so không hợp lệ.');
  if (errors.length) return {ok:false, errors, warnings, result:null, kind:null};
  const allowed = HEADERS[kind], out = {};
  Object.keys(raw.du_lieu).forEach(k => { if (allowed.indexOf(k) < 0) errors.push('Trường ngoài schema: ' + k); });
  allowed.forEach(k => {
    let v = raw.du_lieu[k];
    v = (v === undefined || v === null || String(v).trim() === '') ? null : String(v).trim();
    if (v !== null && DATE_FIELDS[kind].indexOf(k) >= 0) {
      const n = normalizeDate_(v);
      if (n === undefined) { warnings.push('Ngày không hợp lệ ở ' + k + ' ("' + v + '"), đã để trống.'); v = null; } else v = n;
    }
    out[k] = v;
  });
  const keyField = kind === 'IN' ? 'SoKyHieuGoc' : 'SoVaKyHieu';
  if (!out[keyField]) warnings.push('Thiếu số/ký hiệu văn bản.');
  return {ok: errors.length === 0, errors, warnings, result: {loai_so: raw.loai_so, du_lieu: out}, kind};
}

const norm_ = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
/** Kiểm tra trùng trong sổ. Trả mảng {row, values}. */
function checkDuplicate(kind, d, cfg) {
  const sh = getSS_().getSheetByName(bookInfo_(kind, cfg).sheet);
  if (!sh || sh.getLastRow() < 2) return [];
  const H = HEADERS[kind], rows = sh.getRange(2, 1, sh.getLastRow() - 1, H.length).getDisplayValues(), hits = [];
  const key = kind === 'IN' ? ['SoKyHieuGoc','NgayVanBan'] : ['SoVaKyHieu','NgayBanHanh'];
  rows.forEach((r, i) => {
    const o = {}; H.forEach((h, j) => o[h] = r[j]);
    if (!d[key[0]] || norm_(o[key[0]]) !== norm_(d[key[0]])) return;
    if (d[key[1]] && o[key[1]] && norm_(o[key[1]]) !== norm_(d[key[1]])) return;
    if (kind === 'IN' && d.TacGiaCoQuanBanHanh && o.TacGiaCoQuanBanHanh && norm_(o.TacGiaCoQuanBanHanh) !== norm_(d.TacGiaCoQuanBanHanh)) return;
    hits.push({row: i + 2, values: o});
  });
  return hits;
}
