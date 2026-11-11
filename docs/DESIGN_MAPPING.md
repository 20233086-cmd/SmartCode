# Đối chiếu 55 mẫu giao diện

Bản 2.0 triển khai các trang và trạng thái bên dưới từ 55 mẫu PNG/SVG trong `design/reference/`. Mở `design/reference/index.html` để xem bộ mẫu gốc; đây là tài liệu tham chiếu, không phải ảnh chụp của ứng dụng.

Các mẫu cùng trang nhưng khác tab, modal hoặc trạng thái được dùng chung URL. ID minh họa dùng dữ liệu seed; lượt đánh giá và bài nộp được tạo khi sử dụng. Số liệu trên web lấy từ database và có thể khác số minh họa trong ảnh.

Theme dùng thanh đầu trang tím–xanh, sidebar ClassRoom, thẻ nền sáng, trang thực hành ba cột, bố cục bài giảng và các breakpoint cho điện thoại. Đã kiểm tra DOM và thao tác với JSDOM; trình duyệt kiểm tra bị từ chối quyền truy cập máy chủ cục bộ, vì vậy **chưa xác minh độ khớp từng pixel hoặc layout thực trên thiết bị**.

| Mẫu gốc | Giao diện | Đường dẫn | Tương tác |
|---|---|---|---|
| `00_Design_system/01_Thanh_phan.svg` | Hệ thống thiết kế theo video | `/#/design-system` | Màu sắc, chữ, nút, thẻ và tiến độ dùng chung. |
| `01_Cong_khai/01_Trang_chu.svg` | Trang chủ SmartCode | `/#/` | Trang chủ khi chưa đăng nhập. |
| `01_Cong_khai/02_Dang_nhap.svg` | Chào mừng trở lại | `/#/login` | Biểu mẫu đăng nhập. |
| `01_Cong_khai/03_Dang_ky.svg` | Bắt đầu hành trình của bạn | `/#/register` | Tạo tài khoản người học. |
| `01_Cong_khai/04_Quen_mat_khau.svg` | Khôi phục mật khẩu | `/#/forgot-password` | Gửi liên kết; trang /reset-password dùng token có hạn 30 phút. |
| `02_Nguoi_hoc/01_Tong_quan.svg` | Dashboard cá nhân | `/#/dashboard` | Thống kê, tiến độ, gợi ý theo dữ liệu. |
| `02_Nguoi_hoc/02_Kham_pha.svg` | Khám phá khóa học | `/#/courses` | Tìm kiếm và lọc khóa học. |
| `02_Nguoi_hoc/03_Chi_tiet_khoa_hoc.svg` | Python cơ bản | `/#/courses/1` | Học liệu, ghi danh và giá. |
| `02_Nguoi_hoc/04_Lo_trinh.svg` | Lộ trình học cá nhân hóa | `/#/roadmap/1` | Ưu tiên phần yếu từ trắc nghiệm đầu vào và tiến độ thực hành. |
| `02_Nguoi_hoc/05_Bai_hoc.svg` | Video bài giảng • Biến và kiểu dữ liệu | `/#/lesson/1` | Video, phụ đề và lý thuyết. |
| `02_Nguoi_hoc/06_Trac_nghiem.svg` | Kiểm tra kiến thức | `/#/lesson/1` | Tab Kiểm tra nhanh: trả lời, chấm, giải thích. |
| `02_Nguoi_hoc/07_Kiem_tra_dau_vao.svg` | Đánh giá đầu vào | `/#/placement/1` | Trắc nghiệm đánh giá đầu vào. |
| `02_Nguoi_hoc/08_Thuc_hanh_code.svg` | Thực hành • Phân tích cảm xúc | `/#/code/1` | Đề bài, Monaco, terminal, cảm nhận. |
| `02_Nguoi_hoc/09_Ket_qua_cham.svg` | Tính diện tích hình chữ nhật | `/#/code/1` | Chạy/Nộp bài → kết quả từng test; cần Judge0. |
| `02_Nguoi_hoc/10_AI_goi_y.svg` | Tính diện tích hình chữ nhật | `/#/code/1` | Gợi ý AI → modal 3 mức; Ollama hoặc gợi ý biên soạn. |
| `02_Nguoi_hoc/11_Dau_vao_thuc_hanh.svg` | Tính diện tích hình chữ nhật | `/#/assessment/1` | Tạo lượt qua /placement/1; 20 phút, lưu nháp, tắt gợi ý. |
| `02_Nguoi_hoc/12_Ket_qua_dau_vao.svg` | Lộ trình đã sẵn sàng | `/#/assessment-result/1` | Kết quả của lượt đã tạo, nối tới lộ trình và bài học đề xuất. |
| `02_Nguoi_hoc/13_Lich_su_nop.svg` | Lịch sử nộp bài | `/#/history` | Bộ lọc verdict và danh sách bài nộp. |
| `02_Nguoi_hoc/14_Ky_nang.svg` | Phân tích kỹ năng | `/#/skills` | Radar và tiến độ theo kỹ năng. |
| `02_Nguoi_hoc/15_Lop_cua_toi.svg` | Lớp học của tôi | `/#/classes` | Tham gia bằng mã, mở bài theo buổi. |
| `02_Nguoi_hoc/16_Xep_hang.svg` | Bảng xếp hạng | `/#/leaderboard` | Thành tích từ dữ liệu người học trong lớp. |
| `02_Nguoi_hoc/17_Tai_khoan.svg` | Cài đặt tài khoản | `/#/account` | Hồ sơ và đổi mật khẩu. |
| `02_Nguoi_hoc/18_Thanh_toan.svg` | Xác nhận đăng ký khóa học | `/#/courses/1` | Tham gia khóa → hộp thoại đăng ký thử nghiệm, không thu tiền. |
| `02_Nguoi_hoc/19_Trang_thai.svg` | Thông báo & trạng thái | `Nhiều trang` | Trạng thái tải/lỗi/trống, thông báo, modal, xác nhận. |
| `02_Nguoi_hoc/20_Chi_tiet_bai_nop.svg` | Chi tiết bài nộp #SC1026 | `/#/history` | Chi tiết → xem code và từng test của bài nộp. |
| `02_Nguoi_hoc/21_Dang_ky_thanh_cong.svg` | Đăng ký thành công | `/#/courses/1` | Xác nhận demo → thông báo thành công và vào học. |
| `02_Nguoi_hoc/22_Thong_bao.svg` | Thông báo | `/#/notifications` | Danh sách thông báo và đánh dấu đã đọc. |
| `02_Nguoi_hoc/23_Danh_sach_bai_tap.svg` | Bài học & thực hành | `/#/lesson/1/exercises` | Danh sách bài, độ khó, tiến độ, làm bài. |
| `02_Nguoi_hoc/24_Khao_sat_dau_vao.svg` | Khảo sát đầu vào | `/#/survey/1` | Khảo sát 7 bước, lưu trên server. |
| `02_Nguoi_hoc/25_Insight.svg` | Insight • Thống kê học tập | `/#/insight` | Biểu đồ ngày/tuần, XP, lỗi, xu hướng, thời gian, thói quen, CSV. |
| `02_Nguoi_hoc/26_Video_ghi_chu.svg` | Video bài giảng • Biến và kiểu dữ liệu | `/#/lesson/1` | Tab Ghi chú → mốc video, nội dung, trở lại mốc đã lưu. |
| `02_Nguoi_hoc/27_Cam_xuc_binh_thuong.svg` | Thực hành • Phân tích cảm xúc | `/#/code/1` | Cảm nhận Bình thường; tự chọn hoặc quy tắc từ hoạt động. |
| `02_Nguoi_hoc/28_Cam_xuc_tieu_cuc.svg` | Thực hành • Phân tích cảm xúc | `/#/code/1` | Cảm nhận Tiêu cực, nghỉ 2 phút, bật/tắt ước lượng. |
| `02_Nguoi_hoc/29_Dien_bien_cam_xuc.svg` | Diễn biến cảm xúc | `/#/emotions` | Diễn biến, lọc ngày, thêm/sửa ghi nhận. |
| `02_Nguoi_hoc/30_Code_mau_video.svg` | Code mẫu bài giảng | `/#/lesson/1` | Tab Code mẫu → sao chép/tải code. |
| `03_Giang_vien/01_Tong_quan.svg` | Khóa học của tôi | `/#/manage` | Tổng quan giảng viên. |
| `03_Giang_vien/02_Quan_ly_lop.svg` | Java Core | `/#/manage/classes/1` | Buổi học, mức độ, dashboard và báo cáo. |
| `03_Giang_vien/03_Ngan_hang.svg` | Ngân hàng bài tập | `/#/manage/exercises` | Ngân hàng bài tập, lọc khóa/tên. |
| `03_Giang_vien/04_Soan_bai_tap.svg` | Tạo bài tập | `/#/manage/exercises` | Thêm/Chỉnh sửa → biểu mẫu toàn trang, tests và hints. |
| `03_Giang_vien/05_Tao_buoi_hoc.svg` | Java Core | `/#/manage/classes/1` | Thêm buổi học → 4 trạng thái setup. |
| `03_Giang_vien/06_Giam_sat_live.svg` | Dashboard bài tập | `/#/manage/classes/1/sessions/1/live` | Bảng cập nhật mỗi 3 giây theo đúng buổi; đóng/mở buổi. |
| `03_Giang_vien/07_Bao_cao_lop.svg` | Báo cáo buổi học | `/#/manage/classes/1/sessions/1/report` | Số liệu riêng của buổi, chi tiết, lọc, CSV, nhận xét. |
| `03_Giang_vien/08_Soan_bai_hoc.svg` | Biên soạn bài học | `/#/manage/lessons` | Thêm/Chỉnh sửa → studio, video, lý thuyết, quiz, bản nháp, tài liệu. |
| `03_Giang_vien/09_Chi_tiet_hoc_vien.svg` | Tiến độ học viên Bình | `/#/manage/classes/1/students/1` | Tiến độ, bài nộp, gợi ý đã dùng và nhận xét giảng viên. |
| `03_Giang_vien/10_Phan_nhom_bai_tap.svg` | Buổi 03 — Vòng lặp for | `/#/manage/classes/1/sessions/1` | Nhóm Easy/Medium/Hard; di chuyển và bỏ bài. |
| `03_Giang_vien/11_Hop_thoai_gan_bai.svg` | Buổi 03 — Vòng lặp for | `/#/manage/classes/1/sessions/1` | Gán bài tập → modal chọn nhóm và bài từ ngân hàng. |
| `03_Giang_vien/12_Quan_ly_video.svg` | Video bài giảng | `/#/manage/media` | Upload, tiến độ truyền, kiểm tra tệp, trạng thái lỗi/thử lại, gắn bài. |
| `04_Quan_tri/01_Nguoi_dung.svg` | Người dùng | `/#/admin/users` | Vai trò, khóa/mở tài khoản. |
| `04_Quan_tri/02_Khoa_hoc.svg` | Khóa học | `/#/manage/courses` | Admin quản lý tất cả khóa học. |
| `04_Quan_tri/03_Giao_dich.svg` | Giao dịch | `/#/admin/payments` | Giao dịch đăng ký thử nghiệm. |
| `04_Quan_tri/04_Phan_anh.svg` | Phản ánh nội dung | `/#/admin/reports` | Tiếp nhận và xử lý phản ánh. |
| `04_Quan_tri/05_Tong_quan.svg` | Tổng quan hệ thống | `/#/admin` | Thống kê tổng quan và cấu hình dịch vụ. |
| `05_Mobile/01_Mobile_Tong_quan.svg` | Tổng quan | `/#/dashboard` | CSS thích ứng màn hình 390 px; menu đáy. |
| `05_Mobile/02_Mobile_Lo_trinh.svg` | Lộ trình học | `/#/roadmap/1` | Thẻ, sơ đồ kiến thức và chủ đề xếp theo màn hình nhỏ. |
| `05_Mobile/03_Mobile_Bai_hoc.svg` | Video bài giảng trên mobile | `/#/lesson/1` | Video, nội dung, ghi chú và bài liên quan trên màn hình nhỏ. |
