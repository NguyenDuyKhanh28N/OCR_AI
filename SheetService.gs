/** SHEET SERVICE: ghi sổ, thống kê, danh sách, đề xuất SoTT. */
function saveToSheet(kind, d, cfg) {
  const sh = getSS_().getSheetByName(bookInfo_(kind, cfg).sheet);
  if (!sh) throw new Error('SHEET_WRITE_ERROR: Chưa có sheet sổ. Hãy chạy setup().');
  const H = HEADERS[kind], row = sh.getLastRow() + 1;
  // Ghi 1 lần theo đúng thứ tự header; định dạng text để Sheets không tự đổi ngày/số.
  sh.getRange(row, 1, 1, H.length).setNumberFormat('@').setValues([H.map(h => d[h] == null ? '' : d[h])]);
  return row;
}
function listBook(kind, cfg, limit) {
  const sh = getSS_().getSheetByName(bookInfo_(kind, cfg).sheet), H = HEADERS[kind];
  if (!sh || sh.getLastRow() < 2) return {headers: H, rows: []};
  const n = Math.min(limit || 200, sh.getLastRow() - 1), start = sh.getLastRow() - n + 1;
  return {headers: H, rows: sh.getRange(start, 1, n, H.length).getDisplayValues().reverse()};
}
function nextSoTT_(cfg) {
  const sh = getSS_().getSheetByName(bookInfo_('OUT', cfg).sheet);
  if (!sh || sh.getLastRow() < 2) return 1;
  const max = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().reduce((m, r) => Math.max(m, parseInt(r[0], 10) || 0), 0);
  return max + 1;
}
function countRows_(name) { const sh = getSS_().getSheetByName(name); return sh ? Math.max(sh.getLastRow() - 1, 0) : 0; }
