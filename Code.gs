/** CODE: điểm vào Web App + API cho frontend (google.script.run). */
function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('AI VĂN THƯ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function include(f) { return HtmlService.createHtmlOutputFromFile(f).getContent(); }
function api_(fn) { try { return Object.assign({success: true}, fn()); } catch (e) { logWrite_('Error', '', '', 'ERROR', e.message); return {success: false, error: e.message.replace(/^[A-Z_]+: /, '')}; } }
function apiProcess(p) { return api_(() => processDocument_(p)); }
function apiSave(p) { return api_(() => confirmSave_(p)); }
function apiNextSoTT() { return api_(() => ({value: nextSoTT_(getConfig())})); }
function apiList(kind) { return api_(() => listBook(kind, getConfig())); }
function apiConfig() { return api_(() => ({config: getConfig(), books: {IN: bookInfo_('IN'), OUT: bookInfo_('OUT')}})); }
function apiDashboard() {
  return api_(() => { const c = getConfig(), log = getSS_().getSheetByName('Nhật ký');
    const warn = log && log.getLastRow() > 1 ? log.getRange(2, 5, log.getLastRow() - 1, 1).getValues().filter(r => r[0] === 'WARNING').length : 0;
    return {incoming: countRows_(bookInfo_('IN', c).sheet), outgoing: countRows_(bookInfo_('OUT', c).sheet), warnings: warn, org: c.TEN_CO_QUAN}; });
}
function apiLog() { return api_(() => { const sh = getSS_().getSheetByName('Nhật ký'), n = Math.min(100, Math.max(sh.getLastRow() - 1, 0));
  return {headers: HEADERS.LOG, rows: n ? sh.getRange(sh.getLastRow() - n + 1, 1, n, 6).getDisplayValues().reverse() : []}; }); }
