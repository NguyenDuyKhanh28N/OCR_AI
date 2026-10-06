/** GEMINI: gọi API thật từ server. Key lấy từ Script Properties. */
function buildSystemPrompt_(cfg) {
  const inL = bookInfo_('IN', cfg).label, outL = bookInfo_('OUT', cfg).label;
  return `Bạn là AI chuyên gia xử lý văn bản hành chính Việt Nam.
Đơn vị sử dụng hệ thống: ${cfg.TEN_CO_QUAN} (${cfg.TEN_VIET_TAT}).
Hãy đọc toàn bộ tài liệu (không chỉ trang đầu), phân loại và trích xuất.
QUY TẮC:
1. Không suy đoán. Không tự tạo số, ngày, người ký, nơi nhận. Không có hoặc không chắc thì trả null.
2. Ngày chuẩn DD/MM/YYYY. Giữ nguyên số và ký hiệu văn bản.
3. Văn bản đến: do cơ quan KHÁC ban hành gửi đến đơn vị (thường có dấu/số/ngày đến). Văn bản đi: do ${cfg.TEN_CO_QUAN} ban hành (ký hiệu có ${cfg.TEN_VIET_TAT}, người ký thuộc đơn vị, có Nơi nhận).
4. SoDen, NgayDen, NguoiNhanThuLy, HanGiaiQuyet, ViTriLuuBanCung, SoTT, SoBan, TrangThaiPhatHanh chỉ điền khi tài liệu thể hiện rõ; tuyệt đối không lấy số ký hiệu văn bản làm Số đến.
5. Nếu không đủ căn cứ xác định đến/đi: {"loai_so":null,"du_lieu":null,"confidence":0}.
6. Chỉ trả JSON hợp lệ, không Markdown, không giải thích.
ĐỊNH DẠNG:
{"loai_so":"${inL}" hoặc "${outL}","confidence":0.0-1.0,"du_lieu":{...}}
Khóa du_lieu nếu là văn bản đến: ${HEADERS.IN.join(', ')}
Khóa du_lieu nếu là văn bản đi: ${HEADERS.OUT.join(', ')}
Mọi giá trị là chuỗi hoặc null.`;
}

/** Gọi Gemini 1 lần, trả về text. parts: [{text}] hoặc [{inline_data:{mime_type,data}}] */
function callGemini(parts, cfg) {
  const key = props_().getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('Chưa cấu hình GEMINI_API_KEY trong Script Properties.');
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(cfg.GEMINI_MODEL) + ':generateContent';
  const res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: {'x-goog-api-key': key},
    payload: JSON.stringify({
      system_instruction: {parts: [{text: buildSystemPrompt_(cfg)}]},
      contents: [{role: 'user', parts: parts}],
      generationConfig: {temperature: 0, responseMimeType: 'application/json'}
    })
  });
  if (res.getResponseCode() !== 200) throw new Error('GEMINI_API_ERROR: Không thể kết nối Gemini. Vui lòng thử lại. (HTTP ' + res.getResponseCode() + ')');
  const j = JSON.parse(res.getContentText());
  const c = j.candidates && j.candidates[0];
  const text = c && c.content && c.content.parts && c.content.parts.map(p => p.text || '').join('');
  if (!text) throw new Error('GEMINI_API_ERROR: Gemini không trả nội dung.');
  return text;
}

/** Gọi + parse JSON, retry tối đa 2 lần khi JSON lỗi. */
function extractWithRetry_(parts, cfg) {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    const text = callGemini(parts, cfg);
    try { return JSON.parse(text.replace(/^\s*```(?:json)?|```\s*$/g, '').trim()); }
    catch (e) { lastErr = e; }
  }
  throw new Error('INVALID_JSON: Cần xử lý thủ công.');
}
