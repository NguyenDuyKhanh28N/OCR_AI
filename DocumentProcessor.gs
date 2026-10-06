/** DOCUMENT PROCESSOR: nhận file/text -> Gemini -> validate -> kiểm trùng. Không ghi sổ. */
function processDocument_(p) {
  const cfg = getConfig(), name = p.fileName || '(văn bản dán)';
  logWrite_('Upload', name, '', 'OK', p.mimeType || 'text');
  let parts, fileId = null;
  if (p.text) {
    parts = [{text: String(p.text).substring(0, 100000)}];
  } else {
    if (MIME_OK.indexOf(p.mimeType) < 0) throw new Error('UNSUPPORTED_FILE: Chỉ hỗ trợ PDF, JPG, PNG, WEBP, TXT.');
    if (!p.data || p.data.length * 0.75 > MAX_BYTES) throw new Error('FILE_TOO_LARGE: File tối đa 10MB.');
    if (p.mimeType === 'text/plain') parts = [{text: Utilities.newBlob(Utilities.base64Decode(p.data)).getDataAsString('UTF-8')}];
    else parts = [{inline_data: {mime_type: p.mimeType, data: p.data}}];
    if (cfg.DRIVE_FOLDER_ID) { // lưu file gốc (tùy chọn)
      try { fileId = DriveApp.getFolderById(cfg.DRIVE_FOLDER_ID).createFile(Utilities.newBlob(Utilities.base64Decode(p.data), p.mimeType, name)).getId(); }
      catch (e) { logWrite_('Drive', name, '', 'WARNING', e.message); }
    }
  }
  let raw;
  try { raw = extractWithRetry_(parts, cfg); }
  catch (e) { logWrite_('AI', name, '', 'ERROR', e.message); throw e; }
  const v = validateExtraction(raw, cfg);
  const confidence = typeof raw.confidence === 'number' ? raw.confidence : null;
  if (!v.ok) { logWrite_('Validation', name, '', 'WARNING', v.errors.join(' | ')); return {result: v.result, kind: null, errors: v.errors, warnings: v.warnings, duplicate: false, matches: [], confidence, fileId}; }
  const matches = checkDuplicate(v.kind, v.result.du_lieu, cfg);
  if (confidence !== null && confidence < 0.9) v.warnings.push(confidence < 0.7 ? 'Độ tin cậy thấp, cần xác nhận thủ công.' : 'Độ tin cậy trung bình, cần kiểm tra.');
  if (matches.length) v.warnings.push('Có văn bản tương tự trong sổ.');
  logWrite_('AI', name, v.result.loai_so, v.warnings.length ? 'WARNING' : 'OK', v.warnings.join(' | ') || 'Đã trích xuất');
  return {result: v.result, kind: v.kind, errors: [], warnings: v.warnings, duplicate: matches.length > 0, matches, confidence, fileId};
}

/** Người dùng đã xác nhận -> validate lại (dữ liệu có thể đã sửa) -> kiểm trùng -> ghi. */
function confirmSave_(p) {
  const cfg = getConfig(), v = validateExtraction(p.result, cfg);
  if (!v.ok) throw new Error('VALIDATION_ERROR: ' + v.errors.join(' '));
  const matches = checkDuplicate(v.kind, v.result.du_lieu, cfg);
  if (matches.length && !p.force) { logWrite_('Validation', p.fileName, v.result.loai_so, 'WARNING', 'Nghi trùng'); return {saved: false, duplicate: true, matches}; }
  try { const row = saveToSheet(v.kind, v.result.du_lieu, cfg); logWrite_('Save', p.fileName, v.result.loai_so, 'OK', 'Dòng ' + row); return {saved: true, row}; }
  catch (e) { logWrite_('Save', p.fileName, v.result.loai_so, 'ERROR', e.message); throw e; }
}
