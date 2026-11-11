import os, math, shutil
from pathlib import Path
from .curriculum import lesson_quiz, lesson_code, DETAILS
from . import config
from .db import Base, engine, Session
from .models import *
from .security import hash_password

TOPICS = [
    (
        "Giới thiệu & nhập xuất",
        "input_output",
        "Chương trình nhận dữ liệu từ đầu vào chuẩn (stdin) và ghi kết quả ra đầu ra chuẩn (stdout). Không thêm lời nhắc khi bài tập yêu cầu một kết quả chính xác.",
    ),
    (
        "Biến và kiểu dữ liệu",
        "variables",
        "Biến lưu dữ liệu để dùng lại. Chọn kiểu số nguyên khi đếm, kiểu số thực khi đo lường và chuỗi để biểu diễn văn bản.",
    ),
    (
        "Toán tử",
        "operators",
        "Các phép cộng, trừ, nhân, chia xử lý dữ liệu số. Phép chia lấy dư giúp kiểm tra tính chia hết. Chú ý thứ tự ưu tiên và dùng ngoặc khi cần.",
    ),
    (
        "Câu lệnh điều kiện",
        "conditions",
        "Điều kiện giúp chương trình chọn nhánh. Kiểm tra biên và các trường hợp bằng nhau trước khi quyết định kết quả.",
    ),
    (
        "Vòng lặp",
        "loops",
        "Vòng lặp lặp lại thao tác trên một dãy. Xác định điểm bắt đầu, điều kiện dừng và cách cập nhật để tránh lặp vô hạn.",
    ),
    (
        "Chuỗi ký tự",
        "strings",
        "Chuỗi là dãy ký tự. Bạn có thể duyệt từng ký tự, đếm, tìm kiếm hoặc đảo thứ tự. Cần phân biệt chữ hoa với chữ thường.",
    ),
    (
        "Danh sách và mảng",
        "arrays",
        "Mảng hoặc danh sách lưu nhiều phần tử. Duyệt từng phần tử để tính tổng, tìm cực trị hoặc đếm theo điều kiện.",
    ),
    (
        "Hàm",
        "functions",
        "Hàm gom thao tác thành một đơn vị có tên. Xác định tham số đầu vào, giá trị trả về và các trường hợp biên.",
    ),
    (
        "Thuật toán cơ bản",
        "algorithms",
        "Chia bài toán thành các bước hữu hạn, kiểm tra với ví dụ nhỏ rồi đánh giá thời gian xử lý khi đầu vào lớn.",
    ),
    (
        "Ôn tập tổng hợp",
        "review",
        "Kết hợp nhập xuất, điều kiện, vòng lặp và hàm. Đọc kỹ ràng buộc, kiểm tra ví dụ và kiểm thử biên trước khi nộp.",
    ),
]
TASKS = [
    (
        "Tổng hai số",
        "Đọc hai số nguyên a, b. In a + b.",
        lambda a: f"{int(a[0])+int(a[1])}",
        ["2 3", "-5 2", "0 0"],
    ),
    (
        "Diện tích hình chữ nhật",
        "Đọc chiều dài và rộng là số thực không âm. In diện tích với 2 chữ số sau dấu chấm.",
        lambda a: f"{float(a[0])*float(a[1]):.2f}",
        ["5.5 3.2", "0 4", "2 7"],
    ),
    (
        "Trung bình ba số",
        "Đọc 3 số thực. In trung bình cộng với 2 chữ số sau dấu chấm.",
        lambda a: f"{sum(map(float,a))/3:.2f}",
        ["7 8 9", "0 0 0", "1 2 2"],
    ),
    (
        "Đổi độ C sang F",
        "Đọc số thực C. In F = C × 9/5 + 32 với 2 chữ số sau dấu chấm.",
        lambda a: f"{float(a[0])*9/5+32:.2f}",
        ["0", "100", "-40"],
    ),
    (
        "Chẵn hay lẻ",
        "Đọc số nguyên n. In EVEN nếu chẵn, ODD nếu lẻ.",
        lambda a: "EVEN" if int(a[0]) % 2 == 0 else "ODD",
        ["4", "-3", "0"],
    ),
    (
        "Số lớn nhất",
        "Đọc 3 số nguyên. In số lớn nhất.",
        lambda a: str(max(map(int, a))),
        ["1 8 3", "-1 -2 -3", "7 7 7"],
    ),
    (
        "Năm nhuận",
        "Đọc năm dương lịch. In YES nếu nhuận, ngược lại NO.",
        lambda a: (
            "YES"
            if int(a[0]) % 400 == 0 or (int(a[0]) % 4 == 0 and int(a[0]) % 100 != 0)
            else "NO"
        ),
        ["2024", "1900", "2000"],
    ),
    (
        "Dấu của số",
        "Đọc số nguyên. In POSITIVE, NEGATIVE hoặc ZERO.",
        lambda a: (
            "POSITIVE" if int(a[0]) > 0 else "NEGATIVE" if int(a[0]) < 0 else "ZERO"
        ),
        ["3", "-9", "0"],
    ),
    (
        "Tổng từ 1 đến n",
        "Đọc số nguyên 1 ≤ n ≤ 1000. In tổng từ 1 đến n.",
        lambda a: str(int(a[0]) * (int(a[0]) + 1) // 2),
        ["5", "1", "1000"],
    ),
    (
        "Giai thừa",
        "Đọc số nguyên 0 ≤ n ≤ 10. In n!.",
        lambda a: str(math.factorial(int(a[0]))),
        ["5", "0", "10"],
    ),
    (
        "Đảo chuỗi",
        "Đọc một từ không có khoảng trắng. In từ đảo ngược.",
        lambda a: a[0][::-1],
        ["hello", "a", "python"],
    ),
    (
        "Đếm nguyên âm",
        "Đọc một từ chữ thường a-z. In số ký tự thuộc a,e,i,o,u.",
        lambda a: str(sum(c in "aeiou" for c in a[0])),
        ["hello", "sky", "aeiou"],
    ),
    (
        "Tổng dãy số",
        "Dòng 1: n (1 ≤ n ≤ 100). Dòng 2: n số nguyên. In tổng dãy.",
        lambda a: str(sum(map(int, a[1:]))),
        ["3\n1 2 3", "1\n-5", "4\n0 2 -2 7"],
    ),
    (
        "Đếm số chẵn",
        "Dòng 1: n. Dòng 2: n số nguyên. In số phần tử chẵn.",
        lambda a: str(sum(int(x) % 2 == 0 for x in a[1:])),
        ["4\n1 2 3 4", "1\n0", "3\n1 3 5"],
    ),
    (
        "Ước chung lớn nhất",
        "Đọc hai số nguyên dương a,b. In UCLN.",
        lambda a: str(math.gcd(int(a[0]), int(a[1]))),
        ["12 18", "7 9", "5 5"],
    ),
    (
        "Số nguyên tố",
        "Đọc số nguyên 0 ≤ n ≤ 100000. In YES nếu nguyên tố, ngược lại NO.",
        lambda a: (
            "YES"
            if int(a[0]) >= 2
            and all(int(a[0]) % x for x in range(2, math.isqrt(int(a[0])) + 1))
            else "NO"
        ),
        ["7", "1", "49"],
    ),
    (
        "Tổng chữ số",
        "Đọc số nguyên không âm n. In tổng các chữ số.",
        lambda a: str(sum(map(int, a[0]))),
        ["1234", "0", "999"],
    ),
    (
        "Chuỗi đối xứng",
        "Đọc một từ. In YES nếu đọc ngược vẫn giống, ngược lại NO.",
        lambda a: "YES" if a[0] == a[0][::-1] else "NO",
        ["level", "hello", "a"],
    ),
    (
        "Fibonacci",
        "Đọc n từ 0 đến 30. F0=0, F1=1. In Fn.",
        lambda a: str(fib(int(a[0]))),
        ["0", "1", "10"],
    ),
    (
        "Sắp xếp tăng dần",
        "Dòng 1: n. Dòng 2: n số nguyên. In dãy tăng dần, cách nhau một dấu cách.",
        lambda a: " ".join(map(str, sorted(map(int, a[1:])))),
        ["4\n3 1 4 2", "1\n9", "4\n2 2 -1 0"],
    ),
]


def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


STARTERS = {
    "python": "# Đọc đầu vào, tính toán và in kết quả\nimport sys\ndata = sys.stdin.read().split()\n# Viết chương trình của bạn tại đây\n",
    "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Viết chương trình của bạn tại đây\n    }\n}\n",
    "javascript": "const fs = require('fs');\nconst data = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\n// Viết chương trình của bạn tại đây\n",
}
EXAMPLES = {
    "python": "a, b = map(int, input().split())\nprint(a + b)",
    "java": "import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int a = sc.nextInt(), b = sc.nextInt();\n    System.out.println(a + b);\n  }\n}",
    "javascript": "const fs = require('fs');\nconst [a,b] = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(a+b);",
}


def seed(db):
    if db.query(User).first():
        return
    password = os.getenv("DEMO_PASSWORD", "SmartCode@123")
    people = []
    for name, email, role in [
        ("Nguyễn Văn A", "learner@smartcode.local", "learner"),
        ("Giảng viên Minh Anh", "teacher@smartcode.local", "teacher"),
        ("Quản trị viên", "admin@smartcode.local", "admin"),
    ]:
        u = User(
            name=name, email=email, role=role, password_hash=hash_password(password)
        )
        db.add(u)
        db.flush()
        people.append(u)
    learner, teacher, admin = people
    for title, lang, color, price in [
        ("Java Core", "java", "gold", 0),
        ("Python cơ bản", "python", "pink", 0),
        ("JavaScript", "javascript", "violet", 0),
    ]:
        course = Course(
            title=title,
            language=lang,
            color=color,
            price=price,
            owner_id=teacher.id,
            description="Học kiến thức nền tảng, thực hành từng bước và theo dõi sự tiến bộ của bạn.",
        )
        db.add(course)
        db.flush()
        lessons = []
        for i, (topic, skill, content) in enumerate(TOPICS):
            quiz = lesson_quiz(i)
            l = Lesson(
                course_id=course.id,
                title=topic,
                skill=skill,
                position=i + 1,
                content=content + "\n\n" + DETAILS[i],
                code=lesson_code(lang, i),
                quiz=quiz,
            )
            db.add(l)
            db.flush()
            lessons.append(l)
        # Three short bundled silent teaching clips, one introductory clip per language.
        for ext, field, kind in [
            ("mp4", "video_url", "video"),
            ("vtt", "captions_url", "captions"),
        ]:
            asset = config.ROOT / "assets" / f"intro_{lang}.{ext}"
            if asset.exists():
                stored = f"demo_intro_{lang}.{ext}"
                shutil.copyfile(asset, config.UPLOADS / stored)
                m = Media(
                    owner_id=teacher.id,
                    name=f"Nhập xuất {title} · video mẫu không lời.{ext}",
                    stored_name=stored,
                    kind=kind,
                    size=asset.stat().st_size,
                )
                db.add(m)
                db.flush()
                setattr(lessons[0], field, f"/api/media/{m.id}")
        for i, (name, desc, answer, inputs) in enumerate(TASKS):
            l = lessons[i // 2]
            tests = [
                {
                    "input": inp + "\n",
                    "output": answer(inp.split()) + "\n",
                    "hidden": j > 0,
                }
                for j, inp in enumerate(inputs)
            ]
            db.add(
                Exercise(
                    course_id=course.id,
                    lesson_id=l.id,
                    title=name,
                    description=desc,
                    skill=l.skill,
                    difficulty="easy" if i < 10 else "medium",
                    starter=STARTERS[lang],
                    tests=tests,
                    hints=[
                        "Hãy xác định rõ đầu vào và kiểu dữ liệu phù hợp.",
                        "Tách bài thành bước đọc dữ liệu, xử lý và xuất kết quả. Ôn chủ đề "
                        + l.title
                        + ".",
                        "Thử tự tính với ví dụ "
                        + inputs[0].replace("\n", "; ")
                        + ". Kiểm tra biên và định dạng đầu ra.",
                    ],
                )
            )
        db.add(Enrollment(user_id=learner.id, course_id=course.id))
        room = Classroom(
            name=title + " · N09",
            course_id=course.id,
            owner_id=teacher.id,
            join_code="SC" + lang.upper(),
        )
        db.add(room)
        db.flush()
        db.add(Member(class_id=room.id, user_id=learner.id))
        db.flush()
        ids = [x.id for x in db.query(Exercise).filter_by(course_id=course.id).limit(3)]
        db.add(
            ClassSession(
                class_id=room.id,
                title="Buổi 01 — Nhập xuất và biến",
                exercise_ids=ids,
                due_at="2026-12-07T23:59",
                allow_hints=True,
            )
        )
    db.add(
        Notification(
            user_id=learner.id,
            body="Chào mừng đến SmartCode. Ba khóa học mẫu đã sẵn sàng.",
        )
    )
    db.commit()


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    from .migrations import migrate
    migrate(engine)
    with Session() as db:
        seed(db)
        from .paid_curriculum import seed_paid_courses
        seed_paid_courses(db)
    print("Đã khởi tạo dữ liệu. Xem tài khoản mẫu trong README.")
