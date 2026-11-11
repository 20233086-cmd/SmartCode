# SmartCode 2.0

Ứng dụng học lập trình theo bộ thiết kế SmartCode: giao diện sáng, thanh điều hướng tím–xanh, thẻ khóa học màu pastel, trình soạn thảo code ba cột, video lý thuyết, nhật ký cảm nhận và các biểu đồ Insight.

Mã nguồn tách **`backend/`** và **`frontend/`**. Bản bàn giao gồm mã nguồn, API lưu dữ liệu, frontend đã build, bộ 55 mẫu giao diện gốc và hướng dẫn chạy trực tiếp bằng Python. Không sử dụng Docker.

## 1. Chạy nhanh — không cần MySQL hoặc Node.js

Bản ZIP có sẵn `frontend/dist`. Cài **Python 3.12** (hoặc phiên bản tương thích các thư viện trong requirements), giải nén rồi mở terminal ở thư mục `SmartCode`.

**Windows:** có thể chạy `start-smartcode.bat`. Hoặc chạy từng lệnh:

```powershell
cd backend
py -3 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**macOS / Linux:** chạy `bash start-smartcode.sh`, hoặc:

```bash
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Mở **http://127.0.0.1:8000**. API tương tác: **http://127.0.0.1:8000/docs**.

Lần đầu cần Internet để cài thư viện. Dữ liệu SQLite, video đã tải lên và khóa phiên đăng nhập tự tạo nằm trong `backend/data/`. Không cần tạo `.env` để thử bằng cấu hình mặc định. **Không mở `index.html` bằng cách nhấp đúp**: frontend cần API chạy cùng.

### Tài khoản mẫu

| Vai trò | Email | Mật khẩu mặc định |
|---|---|---|
| Người học | learner@smartcode.local | SmartCode@123 |
| Giảng viên | teacher@smartcode.local | SmartCode@123 |
| Quản trị viên | admin@smartcode.local | SmartCode@123 |

Tài khoản học viên mẫu được ghi danh cả ba khóa. Tài khoản tự đăng ký chỉ nhận vai trò người học. Mã lớp mẫu: `SCJAVA`, `SCPYTHON`, `SCJAVASCRIPT`. Mã mời lớp cho phép tham gia và truy cập khóa học tương ứng, nên chỉ chia sẻ cho học viên của lớp.

## 2. Những gì có trong bản này

- Đăng ký, đăng nhập bằng cookie HttpOnly, hồ sơ, đổi mật khẩu, khôi phục mật khẩu qua email/link một lần, phân quyền người học / giảng viên / quản trị viên.
- Danh mục, tìm khóa học, chi tiết, ghi danh miễn phí và đăng ký qua **thanh toán demo không thu tiền**.
- 3 khóa Java Core, Python cơ bản, JavaScript; tổng cộng **30 bài lý thuyết, 60 bài lập trình, 60 câu quiz**. Mỗi bài lập trình có 3 test, trong đó 2 test ẩn. Câu hỏi khái niệm và bộ đề được dùng lại tương ứng giữa các ngôn ngữ, không phải 60 dạng thuật toán khác nhau.
- **3 video nhập môn mẫu, mỗi video 36 giây, không có lời đọc, có phụ đề tiếng Việt** ở bài đầu của từng khóa. Các bài khác có học liệu văn bản và ví dụ; giảng viên có thể tải video MP4/WebM và VTT tối đa 500 MB/tệp.
- Bài học có lưu vị trí xem video, đánh dấu đã đọc, code mẫu, câu hỏi chấm tự động, ghi chú gắn thời điểm, bài tập liên quan.
- Khảo sát 7 bước, trắc nghiệm đầu vào, tối đa 3 bài thực hành trong 20 phút; thời hạn được kiểm tra ở server, tắt gợi ý trong lượt đánh giá. Lộ trình ưu tiên kỹ năng chưa vững qua trắc nghiệm và tiến độ, không tự đánh dấu thành thạo từ khảo sát.
- Monaco Editor tải từ ứng dụng, lưu nháp, stdin tự chọn, kết nối Judge0 để chạy và chấm Java/Python/JavaScript; lịch sử nộp và test ẩn.
- Gợi ý ba mức do giảng viên soạn; có adapter Ollama để sinh gợi ý theo nội dung bài học khi được cấu hình.
- Cảm nhận tự chọn và ước lượng theo quy tắc từ lượt nộp lỗi; có nhật ký thêm/sửa, bộ lọc ngày, tùy chọn tạm dừng và đồng hồ nghỉ 2 phút. **Chưa dùng mô hình ML nhận diện cảm xúc hoặc webcam.**
- **Insight:** hoạt động ngày, tuần + XP, donut phân bố lỗi, xu hướng AC/CE/WA, kỹ năng, thời gian tương tác, thói quen học, bộ lọc khóa / 7–30–90 ngày, bảng dữ liệu và CSV.
- ClassRoom: tham gia bằng mã, tạo lớp và buổi học qua wizard, gán bài theo Easy/Medium/Hard, đóng/mở buổi, tắt/bật gợi ý. Dashboard từng buổi cập nhật 3 giây, báo cáo riêng theo buổi, chi tiết học viên, nhận xét và CSV. API WebSocket báo cáo toàn khóa vẫn có sẵn.
- Giảng viên quản lý khóa, bài học, video, phụ đề, quiz, bài tập, test và gợi ý. Lesson Studio có lưu/khôi phục bản nháp riêng trên server, xem trước, ảnh đại diện và liên kết tài liệu. Thư viện video có tiến độ tải, kiểm tra định dạng, trạng thái lỗi và thử lại.
- Admin quản lý vai trò, khóa/mở tài khoản, giao dịch mô phỏng, phản ánh; thông báo trong ứng dụng.
- Giao diện có các bố cục cho desktop, tablet và điện thoại; đã có trạng thái tải, lỗi và dữ liệu trống.

**Dữ liệu thống kê ban đầu bằng 0.** Hệ thống không nhập các số minh họa trong ảnh thiết kế thành kết quả học thật. Chỉ sau khi kết nối bộ chấm và nộp bài mới có dữ liệu nộp bài/XP. Bài đọc, quiz, ghi chú và cảm nhận vẫn hoạt động khi chưa có bộ chấm.

## 3. Phát triển frontend và backend riêng

Cần Node.js 20.19+ hoặc 22+, npm và Python. Mở hai terminal:

**Terminal 1 — backend** (sau khi tạo venv và cài thư viện):

```bash
cd backend
# Windows: .venv\Scripts\python thay cho .venv/bin/python
.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm ci
npm run dev
```

Mở **http://127.0.0.1:5173**. Vite chuyển `/api` và WebSocket đến cổng 8000; trình duyệt dùng cùng origin, không cần sửa URL trong React. Đăng nhập và sử dụng cùng một hostname (`localhost` hoặc `127.0.0.1`) xuyên suốt phiên.

Sau khi sửa giao diện:

```bash
cd frontend
npm run build
```

Khởi động lại backend để phục vụ bản `dist` mới trên cổng 8000. Hash router (`/#/lesson/1`) giúp tải lại các trang mà không cần cấu hình rewrite riêng.

## 4. Dùng MySQL / XAMPP

Backend dùng SQLAlchemy; SQLite chỉ là lựa chọn chạy nhanh. Khởi động MySQL 8 hoặc MariaDB phù hợp SQLAlchemy/PyMySQL, tạo database và người dùng:

```sql
CREATE DATABASE smartcode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'smartcode'@'localhost' IDENTIFIED BY 'replace-with-your-password';
GRANT ALL PRIVILEGES ON smartcode.* TO 'smartcode'@'localhost';
```

Sao chép `backend/.env.example` thành `backend/.env`, thay:

```dotenv
DATABASE_URL=mysql+pymysql://smartcode:replace-with-your-password@localhost:3306/smartcode?charset=utf8mb4
```

Khởi động backend. Hệ thống tạo bảng và seed khi database chưa có tài khoản. Nếu mật khẩu chứa ký tự đặc biệt như `@`, `:`, `/`, cần percent-encode phần mật khẩu trong URL. Không cần import SQL thủ công; `backend/schema.mysql.sql` được cung cấp để tham khảo cấu trúc.

Đổi DATABASE_URL **không tự chuyển dữ liệu** từ SQLite sang MySQL. Bản 2.0 thêm bảng mới qua create_all; khi nhóm thay cột/bảng đã tồn tại cần viết migration trước khi dùng database có dữ liệu quan trọng. Cấu hình MySQL đã có driver và DDL; kiểm thử tự động trong gói này chạy trên SQLite.

## 5. Bật chạy code / chấm bài

Ứng dụng **không chạy mã học viên trực tiếp trên máy chủ FastAPI**. Chỉ gửi tới bộ chấm Judge0 do nhóm tự cấu hình.

1. Chuẩn bị Judge0 Community Edition theo hướng dẫn chính thức của dự án: https://github.com/judge0/judge0 và tài liệu API https://ce.judge0.com/.
2. Điền endpoint riêng trong `backend/.env`, ví dụ:

```dotenv
JUDGE0_URL=http://127.0.0.1:2358
JUDGE0_TOKEN=
JUDGE0_PYTHON_ID=71
JUDGE0_JAVA_ID=62
JUDGE0_JAVASCRIPT_ID=63
```

3. Kiểm tra `/languages` của instance Judge0 và sửa ID theo ngôn ngữ đã cài; ID mẫu phụ thuộc bộ runtime của instance.
4. Khởi động lại SmartCode rồi thử bài Tổng hai số.

Python, stdin `2 3`:

```python
a, b = map(int, input().split())
print(a + b)
```

JavaScript chạy bằng Node.js (CommonJS). Java yêu cầu lớp `public class Main`. Các test được gửi bằng Base64, dùng job bất đồng bộ và polling. Cấu hình yêu cầu giới hạn CPU, wall time, RAM và tắt network trong sandbox. Cần cấu hình chính bộ Judge0 để thực thi các giới hạn đó.

Nếu chưa có Judge0 hoặc kết nối lỗi, UI thông báo rõ, bài làm vẫn lưu nháp và **không tạo kết quả chấm giả**. API adapter đã được kiểm thử bằng transport mô phỏng; chưa xác minh với một instance Judge0 đang chạy ở môi trường bàn giao.

## 6. Bật trợ giảng AI gợi ý code bằng Ollama

Cài Ollama theo https://ollama.com, tải model phù hợp tài nguyên máy, ví dụ:

```bash
ollama pull qwen2.5-coder:3b
```

Cấu hình:

```dotenv
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:3b
OLLAMA_TIMEOUT=75
```

Mặc định ứng dụng gọi Ollama cục bộ tại `http://127.0.0.1:11434`; nếu không kết nối được, model chưa tải hoặc phản hồi không hợp lệ, ứng dụng sử dụng gợi ý do giảng viên soạn và hiển thị thông báo rõ trong hộp gợi ý. API `GET /api/ai/status` (cần đăng nhập) kiểm tra Ollama và model đã sẵn sàng hay chưa. Mã nguồn học viên được gửi tới Ollama cục bộ đã cấu hình, không gửi tới dịch vụ AI công cộng. Ngữ cảnh truy xuất hiện tại là bài lý thuyết liên quan trực tiếp, **chưa có kho vector/RAG nhiều tài liệu**. Prompt yêu cầu gợi ý thay vì lời giải đầy đủ, nhưng chưa có cơ chế bảo đảm tuyệt đối mô hình không tiết lộ lời giải. Cần kiểm thử thực tế bằng cách khởi động Ollama và tải model trên máy triển khai; kiểm thử tự động không yêu cầu Ollama đang chạy.

## 7. Kiểm thử

```bash
cd backend
# Dùng python trong venv vừa tạo
python -m pytest -q
```

Ở Windows nếu chưa kích hoạt venv: `.venv\Scripts\python -m pytest -q`; macOS/Linux: `.venv/bin/python -m pytest -q`.

```bash
cd frontend
npm ci
npm test
npm run build
```

Kết quả bàn giao: **26 kiểm thử backend + 27 kiểm thử frontend đều đạt**, build production thành công. Test backend dùng database tạm riêng. Test UI chạy trong JSDOM, bao gồm thao tác và dữ liệu API mẫu; chưa kiểm tra trực quan bằng trình duyệt thật, khả năng phát video từng trình duyệt hoặc tải đồng thời nhiều người dùng. Xem `docs/TESTING.md` để biết phạm vi.

## 8. Cấu trúc thư mục

| Thư mục / tệp | Vai trò |
|---|---|
| `backend/app/main.py` | API, phân quyền tài nguyên, WebSocket, upload và phục vụ frontend |
| `backend/app/extensions.py` | Khảo sát, đánh giá, báo cáo buổi, nhật ký, email reset, học liệu |
| `backend/app/models.py` | Mô hình dữ liệu SQLAlchemy |
| `backend/app/security.py` | Hash mật khẩu scrypt và phiên JWT |
| `backend/app/services.py` | Bộ chấm, gợi ý, thống kê, lộ trình |
| `backend/app/curriculum.py` | Lý thuyết chi tiết, quiz, ví dụ theo ngôn ngữ |
| `backend/app/seed.py` | Tạo tài khoản, lớp, 3 khóa và 60 bài tập |
| `backend/assets/` | 3 video nhập môn mẫu + phụ đề |
| `backend/tests/` | Kiểm thử API và adapter Judge0 |
| `frontend/src/App.jsx` | Router và layout người học/giảng viên/admin |
| `frontend/src/pages-learning.jsx` | Các luồng người học |
| `frontend/src/pages-management.jsx` | ClassRoom, quản lý học liệu, admin |
| `frontend/src/charts.jsx` | Biểu đồ SVG lấy dữ liệu từ API |
| `frontend/src/CodeEditor.jsx` | Monaco và worker đóng gói tại chỗ |
| `frontend/src/api.jsx` | Kết nối API, phiên, thông báo, trạng thái tải |
| `frontend/src/styles.css`, `reference.css` | Thành phần chung, theme theo mẫu và responsive |
| `frontend/src/shell.jsx`, `reference-pages.jsx` | Thanh điều hướng, ClassRoom, dashboard, lộ trình |
| `frontend/src/practice.jsx`, `learning-flows.jsx`, `emotion.jsx` | Thực hành, đầu vào, cảm nhận |
| `frontend/src/classroom.jsx`, `lesson-studio.jsx`, `media.jsx` | Buổi học, báo cáo, soạn bài và video |
| `design/reference/` | 55 mẫu PNG/SVG gốc và trang mục lục |
| `frontend/src/test/` | Kiểm thử hành vi UI; fixture chỉ dành cho test |
| `frontend/dist/` | Bản frontend đã build để chạy ngay với backend |
| `docs/` | Kiến trúc, ánh xạ thiết kế, giới hạn và kiểm thử |
| `start-smartcode.bat`, `start-smartcode.sh` | Chạy ứng dụng trực tiếp bằng Python trên Windows / macOS / Linux |

Không kèm `node_modules`, môi trường Python, database cá nhân, khóa JWT hoặc `.env` thực.

## 9. Khôi phục mật khẩu và học liệu

Nếu chưa cấu hình SMTP, yêu cầu quên mật khẩu tạo một thư `.eml` trong `backend/data/mail_outbox`. Mở thư này trên máy chạy backend để lấy link thử nghiệm; API không trả token. Token dùng một lần, hết hạn sau 30 phút. Đặt `PUBLIC_APP_URL` đúng URL mở ứng dụng, ví dụ `http://127.0.0.1:8000`.

Để gửi thư thật, cấu hình `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_TLS` trong `backend/.env`. Đổi/reset mật khẩu làm mất hiệu lực phiên cũ trên các thiết bị; đổi mật khẩu trong trang hồ sơ cấp lại cookie cho phiên hiện tại. Đăng xuất xóa cookie trên trình duyệt đang dùng.

Video/phụ đề có kiểm tra nội dung tệp. Khi máy có `ffprobe` trong PATH, backend kiểm tra khả năng đọc video và lấy thời lượng; nếu chưa có, kiểm tra chữ ký định dạng và để trống thời lượng. Không chuyển mã video. Trạng thái upload là tiến độ truyền tệp, trạng thái xử lý là kiểm tra trên server. `failed` có thể thử lại hoặc tải tệp đã sửa.

## 10. Đối chiếu thiết kế và phạm vi

`docs/DESIGN_MAPPING.md` và `.csv` ánh xạ **55/55 mẫu** sang trang, tab, modal hoặc trạng thái. Bản web dùng dữ liệu thực nên tên khóa, số lượng bài, số liệu, thông báo và các trạng thái rỗng khác dữ liệu minh họa. Bộ mẫu gốc nằm trong `design/reference/` để đối chiếu. Chưa xác nhận giống từng pixel bằng trình duyệt thật; lần kiểm tra trực quan bị chặn quyền truy cập máy chủ cục bộ.

Dịch vụ chấm code cần Judge0; AI sinh gợi ý cần Ollama. Mặc định có gợi ý do giảng viên biên soạn. Thanh toán là mô phỏng không thu tiền. Video đi kèm là **3 clip nhập môn ngắn không lời, không phải bộ video giảng dạy đầy đủ**; giảng viên tải bài giảng của nhóm lên trong Lesson Studio.

Không có mô hình ML nhận diện cảm xúc, chống gian lận thi, vector database hoặc tích hợp thanh toán thật. Nhãn cảm nhận được ghi rõ nguồn. Deadline giao bài của lớp là nhắc việc, giảng viên đóng/mở buổi thủ công; riêng đánh giá đầu vào có thời hạn cưỡng chế trên server. Báo cáo buổi chỉ tính bài mở từ đúng buổi với `session_id`, không gán lại bài nộp lịch sử hoặc bài tự luyện vào buổi học.

Bản 2.0 bổ sung bảng mới, không thay cột các bảng có trong bản 1.0. Khởi động trên database 1.0 sẽ tạo bảng bổ sung; bản nháp, video, tài khoản và bài nộp cũ vẫn giữ. Phiên đăng nhập cũ cần đăng nhập lại do bổ sung dấu kiểm mật khẩu trong JWT. Hãy sao lưu database và uploads trước khi nâng cấp. Khi tự thay cột trong tương lai, cần migration.

## 11. Tạo lại gói bàn giao

Sau khi kiểm thử và chạy `npm run build` trong `frontend`, chạy `python scripts/package_release.py` ở thư mục gốc. Script tạo ZIP sạch, loại database, khóa phiên, môi trường ảo, `.env`, cache và `node_modules`.


## Khắc phục AI gợi ý code (Ollama)

SmartCode gọi Ollama cục bộ tại `http://127.0.0.1:11434`. Chỉ khai báo `OLLAMA_URL` trong `.env` không đồng nghĩa Ollama đã chạy.

1. Cài Ollama từ https://ollama.com/download.
2. Mở PowerShell/CMD và tải model:
   ```bash
   ollama pull qwen2.5-coder:3b
   ```
3. Đảm bảo Ollama đang chạy. Nếu cần khởi động thủ công:
   ```bash
   ollama serve
   ```
   (Nếu Ollama Desktop đã chạy nền thì không cần mở lệnh này lần nữa.)
4. Kiểm tra:
   ```bash
   ollama list
   ```
   Phải thấy `qwen2.5-coder:3b`.
5. Trong `backend/.env` đặt:
   ```env
   OLLAMA_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=qwen2.5-coder:3b
   OLLAMA_TIMEOUT=120
   ```
6. Khởi động lại backend FastAPI, đăng nhập SmartCode và mở lại trang thực hành.
7. Mở hộp thoại **Gợi ý AI**. Hộp thoại hiển thị trạng thái Ollama. Khi thành công, kết quả phải ghi `AI · Ollama`; nếu chưa sẵn sàng, giao diện sẽ hiện lý do cụ thể và ghi rõ đó là gợi ý dự phòng.

Có thể kiểm tra trực tiếp API (cần đăng nhập) tại `GET /api/ai/status`.
