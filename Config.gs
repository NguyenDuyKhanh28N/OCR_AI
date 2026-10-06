/** CONFIG: cấu hình, tên sổ, khởi tạo Spreadsheet. Không hard-code năm/model/tên cơ quan. */
const HEADERS = {
  IN:  ['SoDen','NgayDen','SoKyHieuGoc','NgayVanBan','TacGiaCoQuanBanHanh','TenLoaiVaTrichYeu','NguoiNhanThuLy','HanGiaiQuyet','ViTriLuuBanCung'],
  OUT: ['SoTT','SoVaKyHieu','NgayBanHanh','TenLoaiVanBan','TrichYeuNoiDung','NguoiKyThamQuyen','NoiNhan','SoBan','TrangThaiPhatHanh'],
  LOG: ['Timestamp','Action','FileName','DocumentType','Status','Message']
};
const DATE_FIELDS = {IN:['NgayDen','NgayVanBan','HanGiaiQuyet'], OUT:['NgayBanHanh']};
const DEFAULT_CFG = {TEN_CO_QUAN:'TRƯỜNG THCS TAM BÌNH', TEN_VIET_TAT:'THCSTB', NAM_LAM_VIEC:'2026', GEMINI_MODEL:'gemini-2.5-flash', DRIVE_FOLDER_ID:''};
const MAX_BYTES = 10 * 1024 * 1024;
const MIME_OK = ['application/pdf','image/jpeg','image/png','image/webp','text/plain'];

function props_() { return PropertiesService.getScriptProperties(); }
function getSS_() {
  const id = props_().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Chưa cấu hình SPREADSHEET_ID trong Script Properties.');
  return SpreadsheetApp.openById(id);
}
/** Đọc sheet "Cấu hình" (cột A=khóa, B=giá trị), thiếu thì dùng mặc định. */
function getConfig() {
  const cfg = Object.assign({}, DEFAULT_CFG);
  const sh = getSS_().getSheetByName('Cấu hình');
  if (sh && sh.getLastRow() > 0) sh.getRange(1,1,sh.getLastRow(),2).getValues().forEach(r => { if (r[0] in cfg && r[1] !== '') cfg[r[0]] = String(r[1]).trim(); });
  return cfg;
}
/** Tên sổ/sheet theo NAM_LAM_VIEC. kind: 'IN' | 'OUT' */
function bookInfo_(kind, cfg) {
  const y = (cfg || getConfig()).NAM_LAM_VIEC, w = kind === 'IN' ? 'đến' : 'đi';
  return {sheet: 'Văn bản ' + w + ' ' + y, label: 'Sổ Văn bản ' + w + ' ' + y};
}
function kindFromLabel_(label, cfg) {
  return ['IN','OUT'].filter(k => bookInfo_(k, cfg).label === label)[0] || null;
}
/** CHẠY 1 LẦN: tạo các sheet + header + cấu hình mặc định trong Spreadsheet đã đặt SPREADSHEET_ID. */
function setup() {
  const ss = getSS_();
  const ensure = (name, headers) => {
    let sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (headers && sh.getLastRow() === 0) { sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e8eef7'); sh.setFrozenRows(1); }
    return sh;
  };
  const cfgSheet = ensure('Cấu hình', null);
  if (cfgSheet.getLastRow() === 0) cfgSheet.getRange(1,1,5,2).setValues(Object.keys(DEFAULT_CFG).map(k => [k, DEFAULT_CFG[k]]));
  const cfg = getConfig();
  ensure(bookInfo_('IN', cfg).sheet, HEADERS.IN);
  ensure(bookInfo_('OUT', cfg).sheet, HEADERS.OUT);
  ensure('Nhật ký', HEADERS.LOG);
  Logger.log('Setup xong. Hãy lưu GEMINI_API_KEY vào Script Properties.');
}
