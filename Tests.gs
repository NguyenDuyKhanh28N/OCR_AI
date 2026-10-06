/** TESTS: chạy runTests() trong editor. 1-2 gọi Gemini thật; 3-5 chạy cục bộ. */
function runTests() {
  const cfg = getConfig(), out = [], t = (n, ok, m) => out.push((ok ? 'PASS ' : 'FAIL ') + n + (m ? ' - ' + m : ''));
  const ex = (txt) => validateExtraction(extractWithRetry_([{text: txt}], cfg), cfg);
  let r = ex('UBND HUYỆN X\nPHÒNG GIÁO DỤC VÀ ĐÀO TẠO\nSố: 125/PGDĐT\nNgày 05 tháng 10 năm 2026\nV/v tổ chức hội thi... Kính gửi: ' + cfg.TEN_CO_QUAN + '\nĐến số: 40 ngày 06/10/2026');
  t('1 Văn bản đến', r.kind === 'IN' && r.result.du_lieu.SoKyHieuGoc === '125/PGDĐT' && r.result.du_lieu.NgayVanBan === '05/10/2026');
  r = ex(cfg.TEN_CO_QUAN + '\nSố: 25/KH-THCSTB\nKẾ HOẠCH tổ chức hoạt động ngoại khóa\nNơi nhận: - Các tổ CM; - Lưu VT.\nHIỆU TRƯỞNG Nguyễn Văn A');
  t('2 Văn bản đi', r.kind === 'OUT' && r.result.du_lieu.SoVaKyHieu === '25/KH-THCSTB');
  r = ex('Công văn số 12/CV-ABC về việc nhắc nhở. Kính gửi các đơn vị.');
  t('3 Thiếu ngày -> null', !r.result || !r.result.du_lieu || r.result.du_lieu.NgayVanBan === null || r.result.du_lieu.NgayBanHanh === null);
  r = validateExtraction({loai_so: null, du_lieu: null}, cfg);
  t('4 Không rõ đến/đi -> kiểm tra thủ công', !r.ok && r.errors[0].indexOf('kiểm tra thủ công') > 0);
  const sh = getSS_().getSheetByName(bookInfo_('IN', cfg).sheet), d = {SoKyHieuGoc: 'TEST-DUP/1', NgayVanBan: '01/01/2026', TacGiaCoQuanBanHanh: 'A'};
  const row = sh.getLastRow() + 1; saveToSheet('IN', Object.assign({}, d), cfg);
  const dup = checkDuplicate('IN', d, cfg).length > 0; sh.deleteRow(row);
  t('5 Cảnh báo trùng', dup);
  Logger.log(out.join('\n'));
}
