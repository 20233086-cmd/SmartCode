# Kiến trúc SmartCode

## Thành phần

Frontend React/Vite gọi REST API và WebSocket FastAPI tại cùng origin. Backend dùng SQLAlchemy để kết nối SQLite mặc định hoặc MySQL theo DATABASE_URL. Video/phụ đề được lưu thành tệp và cấp qua API có kiểm tra quyền. Monaco cùng worker được đóng gói trong frontend, không tải code editor từ CDN.

| Thành phần | Vai trò | Nguồn cấu hình |
|---|---|---|
| React | Layout, router, biểu đồ, biểu mẫu, học và quản lý | `frontend/src` |
| FastAPI | Xác thực, nghiệp vụ, chấm quiz, upload, thống kê | `backend/app` |
| SQLite / MySQL | Người dùng, học liệu, bài làm, tiến độ, lớp | `DATABASE_URL` |
| Judge0 | Chạy và chấm code trong môi trường cách ly ngoài FastAPI | `JUDGE0_*` |
| Ollama | Gợi ý sinh từ ngữ cảnh bài học, tùy chọn | `OLLAMA_*` |

## Mô hình dữ liệu

- User → Enrollment → Course → Lesson → Exercise.
- User + Lesson → Progress và Note.
- User + Exercise → Draft, Submission và Hint.
- Course + giáo viên → Classroom → Member và ClassSession.
- User → Emotion, Payment, Notification và Report.
- Media liên kết từ video_url/captions_url của Lesson.
- Placement lưu kết quả trắc nghiệm; LearnerSurvey lưu khảo sát 7 bước.
- AssessmentAttempt lưu thời hạn, bài được chọn và nháp; SubmissionContext gắn bài nộp với đánh giá hoặc buổi.
- SessionDetails lưu nhóm bài và nhận xét buổi; StudentComment lưu nhận xét từng học viên.
- EmotionPreference/EmotionNote, MediaProcessing, LessonExtras và LessonDraft lưu trạng thái bổ sung.

Ràng buộc duy nhất ngăn ghi danh, bản nháp, tiến độ hoặc thành viên lớp bị lặp. Các đối tượng nghiệp vụ tham chiếu bằng khóa ngoại; SQLite bật PRAGMA foreign_keys.

## Những luồng chính

### Học tập

Đăng ký khóa → học lý thuyết/video → ghi nhận đã đọc → quiz → thực hành. Chặng hoàn thành khi đã đọc, quiz đạt ít nhất 80% (hoặc không có quiz), và giải hết bài của chặng. Lộ trình ưu tiên phần chưa hoàn thành có điểm đầu vào/quiz dưới 80%, rồi chặng chưa hoàn thành đầu tiên. Kết quả khảo sát không tự đánh dấu thành thạo.

### Chấm code

Lưu nháp → gửi từng test tới Judge0 bằng Base64 → polling job → phân loại kết quả → lưu Submission → thống kê đọc dữ liệu mới. Code không chạy bằng subprocess/eval/exec trong FastAPI. Nếu dịch vụ chấm lỗi, không lưu một kết quả giả. `duration_ms` là thời gian yêu cầu chấm; `work_seconds` là thời gian tương tác do trình duyệt gửi, dùng riêng cho thống kê học.

Test công khai hiển thị đầu vào/ra mẫu. Test ẩn chỉ trả verdict, thời gian và bộ nhớ; không trả stdout/stderr. Việc trả verdict trên các test cho phép học viên suy luận qua nhiều lần nộp; đây là nền tảng luyện tập, chưa phải bộ thi chống dò test.

### Gợi ý

Gợi ý có ba mức từ dữ liệu giảng viên. Khi cấu hình Ollama, dịch vụ thêm nội dung bài học vào prompt; nếu lỗi kết nối hoặc vượt giới hạn định dạng, dùng gợi ý dự phòng. Chưa có pipeline huấn luyện hoặc embedding/vector search. Một buổi đang mở tắt gợi ý sẽ chặn gợi ý cho các bài thuộc buổi đó đối với thành viên lớp, kể cả mở bài từ lộ trình.

### ClassRoom

Mã lớp cấp quyền tham gia lớp và khóa liên quan. Giáo viên tạo buổi gồm các exercise_id và tùy chọn gợi ý. Deadline hiện là thông tin nhắc việc; trạng thái mở/đóng được điều khiển thủ công. Dashboard theo buổi lấy snapshot mỗi 3 giây từ API report riêng. SubmissionContext chỉ liên kết lượt nộp có session_id hợp lệ, người học là thành viên, bài thuộc buổi và buổi đang mở. Báo cáo toàn khóa và WebSocket cũ vẫn có sẵn. Không theo dõi màn hình hoặc từng phím bấm.

## Quy tắc Insight

| Chỉ số | Cách tính |
|---|---|
| Ngày hoạt động | Ngày UTC có ít nhất một Submission trong kỳ |
| Bài đã giải | Số exercise_id phân biệt có AC trong kỳ |
| XP | 20 XP cho lần AC đầu tiên của mỗi bài, nếu lần đầu nằm trong kỳ |
| Lượt đạt | Số Submission có AC, gồm cả nộp lại |
| Kỹ năng | Tỷ lệ bài đạt / tổng bài theo chủ đề, xét toàn lịch sử |
| Phân bố lỗi | Verdict đầu tiên chưa đạt của từng lượt nộp, loại AC |
| Tuần | 8 khoảng 7 ngày đến hôm nay, chỉ đếm dữ liệu trong bộ lọc |
| Thời gian | Trung bình work_seconds lần AC đầu tiên của bài có dữ liệu; không dùng thời gian chấm |
| Lý thuyết trước | first_read_at của bài học trước lần nộp đầu tiên của bài lập trình |
| Dùng gợi ý | Bài đã thử trong kỳ có ít nhất một Hint trong cùng kỳ |

Mốc so sánh thời gian trên Insight lấy tối thiểu 3 mẫu bài tương ứng của người học khác, ẩn danh; chưa đủ thì không hiển thị phần trăm so sánh. Bộ đếm trên trình duyệt ngừng khi tab ẩn hoặc không tương tác 60 giây; dữ liệu do client báo nên không dùng làm điểm thi hay bằng chứng giám sát. Không thu webcam. Phần cảm nhận ghi rõ nguồn `self-report` hoặc `heuristic`; không tuyên bố độ chính xác ML.

## Quyền truy cập

Người học chỉ sửa tiến độ, nháp, ghi chú và xem thống kê của mình. Giảng viên chỉ sửa khóa/lớp do mình quản lý; chỉ xem bài của học viên trong lớp chung với khóa mình quản lý. Admin có quyền quản lý toàn hệ thống. Vai trò trong UI chỉ giúp điều hướng; backend kiểm tra lại.

JWT chứa user_id, dấu kiểm hash mật khẩu và hạn 8 giờ, lưu cookie HttpOnly/SameSite=Lax; thông tin vai trò và active được truy vấn lại khi gọi API. POST/PUT/PATCH/DELETE kiểm tra Origin nếu có; môi trường production cần HTTPS và origin cụ thể. Đổi/reset mật khẩu vô hiệu phiên cũ thông qua dấu kiểm mật khẩu; WebSocket cũng kiểm tra lại. Đăng xuất chỉ xóa cookie hiện tại; chưa có danh sách phiên và thu hồi chọn lọc. Login có hạn chế tần suất trong một tiến trình; chưa có limiter phân tán qua Redis.

Học liệu nhập vào được React hiển thị như văn bản, không dùng dangerouslySetInnerHTML. Đường dẫn upload là tên ngẫu nhiên; video chỉ mở khi có quyền với bài học đã gắn tệp. Các mẫu thanh toán chỉ thay đổi dữ liệu nội bộ; không có callback MoMo hoặc tiền thật.

## Hướng chia việc cho nhóm 5

| Thành viên | Phần có thể phụ trách tiếp |
|---|---|
| 1 | Auth, cơ sở dữ liệu, migration và kiểm thử quyền |
| 2 | Khóa học, bài giảng, quiz, video và ghi chú |
| 3 | Monaco, Judge0, bài tập, kiểm thử và gợi ý |
| 4 | ClassRoom, WebSocket, báo cáo giảng viên |
| 5 | Insight, cảm nhận, admin, tích hợp và tài liệu |

## Đánh giá đầu vào và bản nháp bài giảng

AssessmentAttempt có hạn 20 phút theo đồng hồ server; run/submit/draft kiểm tra người sở hữu, danh sách bài và thời hạn. Không được bỏ assessment_id để đi qua luồng tự luyện khi bài đang trong đánh giá. Endpoint hint cũng bị chặn. Lượt gọi chấm hợp lệ được chấp nhận khi bắt đầu; thời gian chờ dịch vụ chấm có thể kéo dài qua thời hạn.

LessonDraft lưu payload riêng theo người biên soạn và khóa học; lưu nháp không thay nội dung Lesson. Xuất bản ghi Lesson và LessonExtras, rồi xóa bản nháp. Ảnh đại diện/tài liệu ngoài dùng HTTPS. Không dùng HTML tùy ý từ nội dung nhập.
