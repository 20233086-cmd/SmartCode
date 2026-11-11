# Ghi chú phát triển

## Cấu hình dịch vụ

Sao chép `backend/.env.example` thành `backend/.env`; biến môi trường của tiến trình có độ ưu tiên cao hơn tệp. Đặt JWT_SECRET ngẫu nhiên tối thiểu 32 ký tự hoặc để trống khi thử cục bộ để ứng dụng tự sinh trong data/jwt.key. AUTO_SEED=true chỉ seed khi chưa có tài khoản; không tự cập nhật bài mẫu đã tồn tại.

## Thêm bài tập

Giảng viên vào Ngân hàng bài tập. Chọn khóa/bài học, viết định dạng stdin/stdout rõ ràng, thêm 1–20 test và ít nhất một gợi ý. Chọn test ẩn cho trường hợp biên. Java dùng Main; JavaScript dùng Node.js, không dùng DOM trình duyệt. Bộ chấm bỏ whitespace đầu/cuối toàn bộ stdout, không bỏ whitespace bên trong và chưa có bộ so sánh sai số số thực.

Bài trả số thực nên quy định rõ số chữ số thập phân. Java có thể dùng `System.out.printf(java.util.Locale.US, "%.2f%n", value)` để giữ dấu chấm. Dữ liệu học liệu mẫu nên được nhóm rà soát và mở rộng trước khi dùng giảng dạy thực.

## Video

Trình phát nhận URL trực tiếp MP4/WebM HTTPS hoặc `/api/media/{id}`. Không nhận URL trang xem YouTube. Tệp từ domain ngoài cần hỗ trợ Range và CORS cho phụ đề nếu áp dụng. Upload trong SmartCode được khuyến nghị cho demo, vì cookie và quyền truy cập dùng cùng origin. Các tệp mẫu không lời có thể tạo lại bằng `scripts/generate_demo_videos.py` (Pillow + ffmpeg, điều chỉnh đường dẫn font trên hệ điều hành khác).

## Kiến trúc API

OpenAPI tại `/openapi.json`; Swagger tại `/docs` của backend. API frontend đều nằm dưới `/api`. Dữ liệu response dùng snake_case. Role được kiểm tra trên server. Nội dung mô tả plain text; không render HTML/Markdown tùy ý.

`app/main.py` đang nhóm endpoint theo luồng để dễ đọc trong bài tập lớn. Khi mở rộng, có thể tách thành APIRouter auth/courses/classroom/admin mà không thay hợp đồng frontend. Thống kê hiện truy vấn theo người dùng, chưa tối ưu cho tập dữ liệu lớn. Gợi ý chạy trong request; chưa có job queue/Redis.

## Lưu trữ và sao lưu

Sao lưu cả database và `backend/data/uploads`, cùng khóa JWT nếu muốn duy trì phiên. Không commit data, .env, venv hoặc node_modules. Khi thay schema dùng migration có version; create_all không thay cột của bảng cũ. `schema.mysql.sql` chỉ là DDL tham khảo xuất từ models của phiên bản này.

## Kiểm tra trước khi triển khai công khai

Đây là bản demo cục bộ: đổi mật khẩu seed, tắt AUTO_SEED khi phù hợp, dùng HTTPS với COOKIE_SECURE=true, giới hạn CORS, kiểm tra sandbox Judge0, sao lưu và rate limit ở reverse proxy. Đã có reset mật khẩu qua SMTP/hộp thư cục bộ và vô hiệu phiên khi mật khẩu thay đổi. Chưa có danh sách phiên, phân trang toàn bộ màn quản lý hoặc limiter phân tán nhiều tiến trình. Không xem nhãn "đã cấu hình" tại trang dịch vụ là health-check xác minh service thật; lỗi kết nối được xử lý khi sử dụng.

## Module giao diện bản 2.0

`reference.css` được nạp sau `styles.css`; đây là lớp căn chỉnh theo 55 mẫu. `shell.jsx` chứa thanh điều hướng và sidebar; `reference-pages.jsx` chứa trang chủ, dashboard, lộ trình. Các màn mới được tách trong `learning-flows.jsx`, `practice.jsx`, `emotion.jsx`, `classroom.jsx`, `lesson-studio.jsx`, `lesson-exercises.jsx`, `media.jsx`.

Có thể tái tạo fixture UI bằng `python scripts/export_ui_fixtures.py` với môi trường đã cài dependency backend. Script dùng database và thư mục dữ liệu tạm, không dùng database của ứng dụng. Fixture chỉ được import trong test.

`SMARTCODE_DATA_DIR` cho phép chọn thư mục dữ liệu khác; mặc định là `backend/data`. Thử nghiệm và xuất fixture sử dụng biến này để không tạo tệp trong dữ liệu thật.
