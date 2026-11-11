# SmartCode — Bộ giao diện thiết kế lại theo video demo

## Bản bàn giao
55 màn hình: 1 bảng hệ thống thiết kế, 4 trang công khai, 30 màn hình người học, 12 màn hình ClassRoom, 5 màn hình quản trị và 3 bản mobile.
Mỗi màn hình có PNG và SVG cùng tên. Có ảnh tổng quan và index.html để xem nhanh.

Đây là bộ thiết kế tĩnh được vẽ lại, không phải ảnh chụp cắt từ video. Tên sản phẩm giữ là SmartCode; phân hệ giảng viên giữ nhãn ClassRoom. Không đóng gói video gốc, khung trình duyệt hoặc thanh Windows.

## Cách xem
1. Giải nén toàn bộ ZIP.
2. Mở index.html bằng Chrome/Edge để xem danh mục theo nhóm.
3. Bấm PNG để mở ảnh đầy đủ hoặc chọn SVG để lấy bản vector.
4. 00_Xem_truoc.png giới thiệu bốn màn hình chính; 00_Tong_quan_55_man_hinh.png là bảng tổng quan toàn bộ.

## Chủ đề đã đối chiếu với video
| Phần | Chi tiết áp dụng | Khoảng thời gian tham chiếu |
|---|---|---|
| Khám phá khóa học | Menu ngang nền trắng, logo xanh-cyan, banner khóa học nhiều màu, nút gradient | 00:10–00:30 |
| Đánh giá và onboarding | Thanh tiến độ, lựa chọn đáp án, biểu mẫu tập trung | 00:40–00:57 |
| Dashboard | Thanh cá nhân tím-xanh, chỉ số nhỏ, cảnh báo ôn tập, gợi ý và tiến độ | 01:00–01:09 |
| Lộ trình | Hero tím-xanh, chữ chuyển sắc, vòng mastery, insight pastel, danh sách chủ đề | 01:10–01:28 |
| Bài học | Nội dung nền trắng, tab lý thuyết/bài tập, thanh điều hướng cuối trang | 01:30–01:46 |
| Thực hành | Ba cột, đề bài pastel, editor trắng, terminal, gợi ý và trạng thái bên phải | 01:48–02:09 |
| Kỹ năng | Thanh mức thành thạo nhiều màu và các gợi ý theo kỹ năng | 02:10–02:19 |
| ClassRoom | Sidebar xanh xám nhạt, thẻ thống kê, AI Summary, bảng bài nộp và modal | 02:20–02:55 |

## Bản cập nhật hoàn thiện
- Video lý thuyết: trình phát, danh sách bài, phụ đề, tốc độ, toàn màn hình, ghi chú theo mốc thời gian, code mẫu và bản mobile.
- Giảng viên: tải video hoặc liên kết, phụ đề/thumbnail, trạng thái đang xử lý/lỗi/sẵn sàng.
- Cảm xúc: ba trạng thái, biểu đồ tỷ lệ, xác nhận thủ công, nghỉ ngắn và lịch sử cảm xúc.
- Insight: hoạt động 90 ngày, hoạt động tuần/XP, phân bố lỗi, xu hướng ngày, tốc độ giải bài, phong cách học và gợi ý.
- Tất cả là PNG/SVG tĩnh; chưa kèm video bài giảng thật, dữ liệu thật hoặc mô hình AI.

## Các phần bổ sung theo cùng chủ đề
Lịch sử nộp bài, chi tiết từng lần nộp, lưu bản nháp, thông báo, tài khoản, kết quả thanh toán, quản trị người dùng/khóa học/giao dịch/phản ánh và mobile.
So với bộ 44 màn hình trước: thêm danh sách bài tập trong bài học, khảo sát đầu vào, Insight, phân nhóm bài tập và hộp thoại gán bài.

## Đưa vào Figma
Chưa tạo tài liệu Figma trực tuyến hoặc file .fig. Tạo Design file mới và kéo các SVG vào canvas. PNG dùng để xem và đối chiếu, không có layer chỉnh sửa.
SVG chứa hình, chữ và gradient vector. Tùy trình nhập SVG, Figma có thể chuyển chữ thành đường vector; khả năng chỉnh sửa nội dung chữ cần kiểm tra sau khi nhập. Bộ này chưa có Auto Layout, component variants hay liên kết prototype.
Font thiết kế: Liberation Sans; khi thay sang Inter/Arial/Noto Sans cần kiểm tra lại chiều rộng và ngắt dòng.
Desktop rộng 1440 px, chiều cao tùy trang để thể hiện nội dung. Mobile 390 × 930 px, gồm 3 trang đại diện; chưa phải toàn bộ bộ responsive.

## Tìm nhanh các phần mới
- 02_Nguoi_hoc/05_Bai_hoc: video lý thuyết.
- 02_Nguoi_hoc/26_Video_ghi_chu và 30_Code_mau_video: ghi chú và code mẫu.
- 02_Nguoi_hoc/08_Thuc_hanh_code, 27_Cam_xuc_binh_thuong, 28_Cam_xuc_tieu_cuc, 29_Dien_bien_cam_xuc: cảm xúc.
- 02_Nguoi_hoc/25_Insight: toàn bộ biểu đồ thống kê; trang cao 2360 px, cần cuộn để xem hết.
- 03_Giang_vien/08_Soan_bai_hoc và 12_Quan_ly_video: quản lý video.

## Luồng đề xuất để nối prototype
- Trang chủ → Khám phá → Chi tiết khóa → Đăng ký/Thanh toán → Kết quả.
- Khảo sát đầu vào → Đánh giá → Bài thực hành đầu vào → Kết quả → Lộ trình.
- Lộ trình → Bài học → Trắc nghiệm → Danh sách bài tập → Thực hành → Gợi ý AI → Kết quả chấm.
- Dashboard → Kỹ năng / Insight → Bài ôn tập.
- Lịch sử nộp → Chi tiết bài nộp → Mở lại trình soạn thảo.
- ClassRoom → Khóa học → Setup buổi học → Phân nhóm → Gán bài → Live dashboard → Báo cáo.
- Quản trị → Người dùng / Khóa học / Giao dịch / Phản ánh.

## Quy tắc nội dung
Dữ liệu, tên tài khoản, giá, tiến độ, điểm số và kết quả đều là minh họa. Những trang khác nhau có thể minh họa các khóa học hoặc thời điểm khác nhau.
Không có đăng nhập, thanh toán, chấm bài hay AI thật trong bộ ảnh. Gợi ý AI bị tắt ở màn thực hành đánh giá đầu vào. Tự lưu và kết quả nộp được thể hiện dưới dạng trạng thái giao diện.
Panel “Phân tích cảm xúc” đã khôi phục: tích cực/bình thường/tiêu cực, tỷ lệ AI ước lượng, tự xác nhận và biểu đồ diễn biến. Đây là giao diện minh họa, không khẳng định cảm xúc thật của người dùng.
Cần nối các trạng thái và bổ sung xử lý bàn phím/focus, loading, lỗi trường nhập khi triển khai sản phẩm.

## Danh mục
- 00_Design_system/01_Thanh_phan: Hệ thống thiết kế theo video — 1440 × 1100
- 01_Cong_khai/01_Trang_chu: Trang chủ SmartCode — 1440 × 1100
- 01_Cong_khai/02_Dang_nhap: Chào mừng trở lại — 1440 × 1000
- 01_Cong_khai/03_Dang_ky: Bắt đầu hành trình của bạn — 1440 × 1000
- 01_Cong_khai/04_Quen_mat_khau: Khôi phục mật khẩu — 1440 × 1000
- 02_Nguoi_hoc/01_Tong_quan: Dashboard cá nhân — 1440 × 1100
- 02_Nguoi_hoc/02_Kham_pha: Khám phá khóa học — 1440 × 1150
- 02_Nguoi_hoc/03_Chi_tiet_khoa_hoc: Python cơ bản — 1440 × 1055
- 02_Nguoi_hoc/04_Lo_trinh: Lộ trình học cá nhân hóa — 1440 × 2020
- 02_Nguoi_hoc/05_Bai_hoc: Video bài giảng • Biến và kiểu dữ liệu — 1440 × 1320
- 02_Nguoi_hoc/06_Trac_nghiem: Kiểm tra kiến thức — 1440 × 1055
- 02_Nguoi_hoc/07_Kiem_tra_dau_vao: Đánh giá đầu vào — 1440 × 1055
- 02_Nguoi_hoc/08_Thuc_hanh_code: Thực hành • Phân tích cảm xúc — 1440 × 1110
- 02_Nguoi_hoc/09_Ket_qua_cham: Tính diện tích hình chữ nhật — 1440 × 1110
- 02_Nguoi_hoc/10_AI_goi_y: Tính diện tích hình chữ nhật — 1440 × 1110
- 02_Nguoi_hoc/11_Dau_vao_thuc_hanh: Tính diện tích hình chữ nhật — 1440 × 1110
- 02_Nguoi_hoc/12_Ket_qua_dau_vao: Lộ trình đã sẵn sàng — 1440 × 1055
- 02_Nguoi_hoc/13_Lich_su_nop: Lịch sử nộp bài — 1440 × 1055
- 02_Nguoi_hoc/14_Ky_nang: Phân tích kỹ năng — 1440 × 1180
- 02_Nguoi_hoc/15_Lop_cua_toi: Lớp học của tôi — 1440 × 1055
- 02_Nguoi_hoc/16_Xep_hang: Bảng xếp hạng — 1440 × 1055
- 02_Nguoi_hoc/17_Tai_khoan: Cài đặt tài khoản — 1440 × 1055
- 02_Nguoi_hoc/18_Thanh_toan: Xác nhận đăng ký khóa học — 1440 × 1055
- 02_Nguoi_hoc/19_Trang_thai: Thông báo & trạng thái — 1440 × 1055
- 02_Nguoi_hoc/20_Chi_tiet_bai_nop: Chi tiết bài nộp #SC1026 — 1440 × 1055
- 02_Nguoi_hoc/21_Dang_ky_thanh_cong: Đăng ký thành công — 1440 × 1055
- 02_Nguoi_hoc/22_Thong_bao: Thông báo — 1440 × 1055
- 02_Nguoi_hoc/23_Danh_sach_bai_tap: Bài học & thực hành — 1440 × 1120
- 02_Nguoi_hoc/24_Khao_sat_dau_vao: Khảo sát đầu vào — 1440 × 1000
- 02_Nguoi_hoc/25_Insight: Insight • Thống kê học tập — 1440 × 2360
- 02_Nguoi_hoc/26_Video_ghi_chu: Video bài giảng • Biến và kiểu dữ liệu — 1440 × 1320
- 02_Nguoi_hoc/27_Cam_xuc_binh_thuong: Thực hành • Phân tích cảm xúc — 1440 × 1110
- 02_Nguoi_hoc/28_Cam_xuc_tieu_cuc: Thực hành • Phân tích cảm xúc — 1440 × 1110
- 02_Nguoi_hoc/29_Dien_bien_cam_xuc: Diễn biến cảm xúc — 1440 × 1050
- 02_Nguoi_hoc/30_Code_mau_video: Code mẫu bài giảng — 1440 × 1000
- 03_Giang_vien/01_Tong_quan: Khóa học của tôi — 1440 × 1000
- 03_Giang_vien/02_Quan_ly_lop: Java Core — 1440 × 1000
- 03_Giang_vien/03_Ngan_hang: Ngân hàng bài tập — 1440 × 1000
- 03_Giang_vien/04_Soan_bai_tap: Tạo bài tập — 1440 × 1000
- 03_Giang_vien/05_Tao_buoi_hoc: Java Core — 1440 × 1000
- 03_Giang_vien/06_Giam_sat_live: Dashboard bài tập — 1440 × 1000
- 03_Giang_vien/07_Bao_cao_lop: Báo cáo buổi học — 1440 × 1000
- 03_Giang_vien/08_Soan_bai_hoc: Biên soạn bài học — 1440 × 1300
- 03_Giang_vien/09_Chi_tiet_hoc_vien: Tiến độ học viên Bình — 1440 × 1000
- 03_Giang_vien/10_Phan_nhom_bai_tap: Buổi 03 — Vòng lặp for — 1440 × 1000
- 03_Giang_vien/11_Hop_thoai_gan_bai: Buổi 03 — Vòng lặp for — 1440 × 1000
- 03_Giang_vien/12_Quan_ly_video: Video bài giảng — 1440 × 1000
- 04_Quan_tri/01_Nguoi_dung: Người dùng — 1440 × 1000
- 04_Quan_tri/02_Khoa_hoc: Khóa học — 1440 × 1000
- 04_Quan_tri/03_Giao_dich: Giao dịch — 1440 × 1000
- 04_Quan_tri/04_Phan_anh: Phản ánh nội dung — 1440 × 1000
- 04_Quan_tri/05_Tong_quan: Tổng quan hệ thống — 1440 × 1000
- 05_Mobile/01_Mobile_Tong_quan: Tổng quan — 390 × 930
- 05_Mobile/02_Mobile_Lo_trinh: Lộ trình học — 390 × 930
- 05_Mobile/03_Mobile_Bai_hoc: Video bài giảng trên mobile — 390 × 1150
