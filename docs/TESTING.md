# Kiểm thử bản bàn giao

Kết quả chạy trong môi trường tạo dự án:

- Backend: **26/26** kiểm thử pytest đạt.
- Frontend: **27/27** kiểm thử Vitest + Testing Library + JSDOM đạt.
- Vite production build: thành công. Monaco được tách chunk và worker, chỉ tải khi mở trang code.

## Đã kiểm tra

| Phần | Phạm vi |
|---|---|
| Auth | Đăng ký, đăng nhập/đăng xuất, mật khẩu, không tự nhận quyền admin |
| Quyền | Người học bị chặn quản lý, teacher khác bị chặn khóa/lớp, tài khoản bị khóa |
| Khóa học | Danh mục 3 khóa/30 bài/60 bài tập, ẩn học liệu chưa ghi danh |
| Bài học | Quiz không lộ đáp án trước chấm, lưu điểm cao nhất, tiến độ, quyền ghi chú |
| Code | Lưu nháp, giới hạn kích thước, trạng thái chưa kết nối Judge0 không tạo kết quả giả |
| Judge0 | Transport mô phỏng kiểm tra Base64, polling, giới hạn network/CPU, che stdout/stderr test ẩn |
| Insight | Số bài duy nhất, XP không tăng khi nộp lại, bộ lọc kỳ, dữ liệu ngày/tuần, CSV |
| Media | Quyền tệp, upload VTT, chặn định dạng khác, MP4 hỗ trợ Range/206, có phụ đề |
| ClassRoom | Mã lớp, ghi danh, WebSocket nhận snapshot, tắt gợi ý từ backend, đóng buổi |
| Admin | Khóa tài khoản, không tự hạ quyền, xử lý phản ánh |
| Đầu vào | Khảo sát 7 bước, tiếp tục lượt, cấm hint/bỏ context, sở hữu và hết hạn |
| Báo cáo buổi | Phân nhóm, từ chối gán bài khác khóa, chỉ tính bài nộp thuộc buổi, bình luận có phân quyền |
| Khôi phục mật khẩu | Token không lộ qua API, dùng một lần, hết hạn, vô hiệu phiên cũ |
| Bản nháp bài giảng | Lưu/khôi phục/xóa riêng, không đổi học liệu đang hiển thị |
| Cảm nhận/video | Tạm dừng ước lượng, sửa nhật ký có quyền; định dạng lỗi và thử lại xử lý |
| React | Đăng nhập chuyển trang, dashboard, video/quiz, các biểu đồ Insight, bộ lọc, lưu nháp, cảm nhận, studio soạn bài, chặn trang admin |

Test chạy trên database tạm riêng, không làm mất database sử dụng ứng dụng. `frontend/src/test/fixtures.json` chỉ được import bởi tệp test; không nằm trong UI production. Bài chấm giả chỉ xuất hiện trong test thông qua monkeypatch, không có chế độ tự giả AC trong API sản phẩm.

## Giới hạn xác minh

Yêu cầu mở bản chạy cục bộ bằng công cụ trình duyệt bị hệ thống phê duyệt từ chối, nên chưa thực hiện kiểm tra bằng trình duyệt thật. Test frontend xác minh DOM và tương tác trong JSDOM, không xác minh layout pixel, Monaco worker thực, tiếng/codec media trên từng trình duyệt hoặc thao tác chạm. Video mẫu là MP4 H.264/yuv420p không có âm thanh, kèm VTT; API đã kiểm tra Range, nhưng chưa thực hiện phát trong trình duyệt.

Chưa có instance Judge0/Ollama hoặc máy chủ MySQL để chạy tích hợp thực. Các adapter/cấu hình có tài liệu và test phần hợp đồng API; cần kiểm tra trên hạ tầng nhóm. Chưa kiểm thử tải đồng thời, hiệu năng dài ngày, endpoint thanh toán thật hoặc mô hình ML. Cảnh báo deprecation từ Starlette/httpx trong pytest không làm test thất bại.

## Kịch bản demo nên chạy trên máy nhóm

1. Chạy script khởi động, đăng nhập học viên mẫu.
2. Vào Java Core → chặng 1 → phát video và bật CC, lưu ghi chú tại một thời điểm.
3. Đọc lý thuyết, làm quiz, mở bài Tổng hai số và lưu nháp.
4. Kết nối Judge0 theo README, thử một bài sai và một bài đúng; xem lịch sử, Insight và XP.
5. Chọn cảm nhận và xem nhật ký.
6. Đăng nhập giảng viên, sửa bài giảng/video, tạo quiz hoặc bài tập mới, mở lớp và giao bài.
7. Mở học viên ở cửa sổ riêng, vào Lớp của tôi và mở bài trong buổi; nộp bài, xem dashboard buổi cập nhật và tải CSV.
8. Đăng nhập admin, xem phản ánh và thay đổi vai trò một tài khoản mới.

## Ghi chú nghiệm thu giao diện

Đã đối chiếu nhóm trang/trạng thái với danh mục 55 mẫu trong `DESIGN_MAPPING.csv`. Các kiểm thử JSDOM không thể chứng minh không tràn layout, màu chữ chuẩn pixel, menu cảm ứng hay Monaco worker chạy trong Chrome. Cần thực hiện kiểm tra trực quan cuối trên máy nhóm ở các chiều rộng 1440/1024/390 px theo bảng ánh xạ. Không dùng ảnh mẫu trong `design/reference` như ảnh chụp kết quả chạy.
