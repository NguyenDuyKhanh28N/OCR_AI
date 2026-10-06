/** LOGGER: ghi sheet "Nhật ký". Không ghi API key hay nội dung văn bản. */
function logWrite_(action, fileName, docType, status, message) {
  try {
    const sh = getSS_().getSheetByName('Nhật ký');
    if (sh) sh.appendRow([new Date(), action, fileName || '', docType || '', status, String(message || '').substring(0, 300)]);
  } catch (e) { console.error('Log lỗi: ' + e.message); }
}
