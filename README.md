# AI VĂN THƯ – Hướng dẫn cài đặt

Web App Google Apps Script + Gemini API + Google Sheets. API key chỉ nằm ở Script Properties (server), không xuống frontend/Sheet/log.

## Cài đặt
1. **Tạo Spreadsheet** mới tên `QUẢN LÝ VĂN BẢN 2026`. Copy **Spreadsheet ID** (đoạn giữa `/d/` và `/edit` trong URL).
2. **Tạo Apps Script**: trong Spreadsheet chọn *Tiện ích mở rộng → Apps Script* (hoặc script.google.com tạo dự án độc lập).
3. **Tạo file code**: tạo đúng tên 8 file `.gs` (Code, Config, Gemini, DocumentProcessor, Validator, SheetService, Logger, Tests) và 3 file HTML (Index, CSS, JS) rồi dán nội dung tương ứng.
4. **Lấy Gemini API key** tại https://aistudio.google.com/apikey → *Create API key*.
5. **Script Properties** (⚙ Project Settings → Script Properties → Add):
   - `GEMINI_API_KEY` = key vừa tạo
   - `SPREADSHEET_ID` = ID ở bước 1
6. **Khởi tạo sheet**: chọn hàm `setup` → Run (cấp quyền khi được hỏi). Hàm tạo 4 sheet, header đúng chuẩn và sheet *Cấu hình*. Sửa `TEN_CO_QUAN`, `TEN_VIET_TAT`, `NAM_LAM_VIEC`, `GEMINI_MODEL`, `DRIVE_FOLDER_ID` (tùy chọn, để lưu file gốc) trực tiếp trong sheet *Cấu hình*.
7. **Deploy**: Deploy → New deployment → Web app → *Execute as: Me*, *Who has access*: tùy nhu cầu → Deploy.
8. **Cấp quyền**: lần đầu cho phép Spreadsheet, Drive, UrlFetch (kết nối ngoài).
9. Mở URL Web App → **Xử lý văn bản** → upload/dán văn bản → kiểm tra/sửa → **Xác nhận & ghi vào sổ**.
10. Sau khi sửa code: Deploy → Manage deployments → Edit → New version.

## Test
Chạy `runTests` (Run) rồi xem *Execution log*. Test 1–2 gọi Gemini thật; 3–5 kiểm tra không suy diễn ngày, yêu cầu kiểm tra thủ công, cảnh báo trùng (bản ghi test tự xóa).

## Giới hạn MVP
Chỉ chế độ STANDARD (từng file); file ≤ 10MB; chưa hỗ trợ DOCX/audio/batch; "Chờ duyệt" là bộ đếm phiên hiện tại; "Cảnh báo" đếm dòng WARNING trong Nhật ký.
