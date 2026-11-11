"""Optional starter curricula, created once as unpublished drafts with editable sample prices."""
from .models import AppMigration, Course, Exercise, Lesson, User

COURSES = [
    {
        "title": "Python vận dụng · Xử lý dữ liệu", "level": "intermediate", "price": 199000,
        "description": "Vận dụng Python để lọc dữ liệu, tổng hợp kết quả và xây dựng chương trình xử lý dữ liệu nhỏ. Cần nắm biến, điều kiện, vòng lặp và hàm.",
        "lessons": [
            ("Lọc và kiểm tra dữ liệu", "data_validation",
             "Khi nhận một dãy dữ liệu, hãy tách bước đọc, chuyển kiểu, lọc và tính kết quả. List comprehension diễn tả một phép lọc ngắn gọn: phần trước vòng for tạo giá trị, phần if quyết định giữ phần tử.\n\nVí dụ: chọn các điểm từ 0 đến 10 trước khi tính trung bình. Không chia cho số lượng ban đầu vì dữ liệu không hợp lệ đã bị bỏ. Nếu danh sách hợp lệ rỗng, xử lý riêng để tránh chia cho 0.\n\nBài thực hành dùng số nguyên để tập trung vào quy tắc lọc. Khi tự kiểm thử, thử dãy toàn số lẻ, có số âm, có số 0 và chỉ một phần tử.",
             "values = [-2, 3, 4, 0]\nevens = [x for x in values if x % 2 == 0]\nprint(sum(evens))  # 2",
             "Tổng các số chẵn", "Dòng 1 là n (1 ≤ n ≤ 1000). Dòng 2 gồm n số nguyên. In tổng các số chẵn, bao gồm cả số âm và số 0.",
             [("4\n-2 3 4 0\n", "2\n"), ("3\n1 3 5\n", "0\n"), ("1\n-8\n", "-8\n")],
             "Khi danh sách hợp lệ rỗng, trước khi tính trung bình cần làm gì?", ["Xử lý riêng trường hợp rỗng", "Chia cho 0", "Lấy phần tử đầu tiên"],
             "Xử lý trường hợp rỗng giúp tránh lỗi chia cho 0 hoặc truy cập ngoài danh sách."),
            ("Đếm tần suất bằng dictionary", "frequency",
             "Dictionary ánh xạ một khóa sang một giá trị. Với bài toán đếm từ, từ là khóa còn số lần xuất hiện là giá trị. Dùng counts.get(word, 0) + 1 để tạo số đếm ban đầu hoặc tăng số đã có.\n\nCần quyết định quy tắc chuẩn hóa trước khi đếm: Hoa và hoa là hai chuỗi khác nhau nếu chưa chuyển về chữ thường. Nếu đề yêu cầu không phân biệt hoa thường, chuyển toàn bộ dữ liệu bằng lower().\n\nThứ tự xuất hiện và thứ tự từ điển là hai yêu cầu khác nhau. Khi cần kết quả theo bảng chữ cái, duyệt sorted(counts). Tổng thời gian đếm trung bình tuyến tính theo số từ; sắp xếp các khóa cần thêm thời gian.",
             "words = 'Code learn code'.lower().split()\ncounts = {}\nfor word in words:\n    counts[word] = counts.get(word, 0) + 1\nfor word in sorted(counts):\n    print(word, counts[word])",
             "Đếm từ trong văn bản", "Đầu vào là các từ tiếng Anh chỉ gồm chữ cái, cách nhau bởi khoảng trắng. Không phân biệt hoa thường. In mỗi từ và số lần xuất hiện, theo thứ tự từ điển, mỗi từ trên một dòng.",
             [("Code learn code\n", "code 2\nlearn 1\n"), ("A a A\n", "a 3\n"), ("z b a b\n", "a 1\nb 2\nz 1\n")],
             "Muốn đếm không phân biệt hoa thường, ta nên làm gì trước khi đếm?", ["Chuyển từ về cùng kiểu chữ", "Đảo chuỗi", "Sắp xếp các ký tự trong từ"],
             "Chuẩn hóa cùng kiểu chữ giúp Code và code dùng chung một khóa."),
            ("Tổng hợp dữ liệu theo nhóm", "aggregation",
             "Một chương trình tổng hợp có thể nhận nhiều bản ghi và cộng dồn theo khóa. Ví dụ mỗi dòng chứa mã sản phẩm và doanh thu. Dictionary lưu tổng doanh thu của mỗi mã thay vì lưu từng dòng.\n\nTách hàm tổng hợp khỏi phần nhập xuất giúp kiểm thử bằng những danh sách nhỏ. Với n dòng và k mã khác nhau, bộ nhớ trung gian chỉ cần lưu k tổng.\n\nChọn trường hợp kiểm thử gồm mã lặp lại, giá trị 0 và một mã duy nhất. Đọc đúng số dòng đề yêu cầu. Nếu đề cho dữ liệu hợp lệ, không tự bỏ dòng vì điều đó làm sai kết quả mà không có thông báo.",
             "def aggregate(records):\n    totals = {}\n    for product, value in records:\n        totals[product] = totals.get(product, 0) + value\n    return totals\nprint(aggregate([('A', 10), ('B', 5), ('A', 2)]))",
             "Doanh thu theo sản phẩm", "Dòng 1: n (1 ≤ n ≤ 1000). n dòng tiếp theo gồm mã sản phẩm (chữ cái in hoa) và doanh thu nguyên không âm. In từng mã và tổng doanh thu, theo thứ tự từ điển.",
             [("3\nA 10\nB 5\nA 2\n", "A 12\nB 5\n"), ("2\nX 0\nX 4\n", "X 4\n"), ("1\nABC 9\n", "ABC 9\n")],
             "Để tổng hợp doanh thu theo mã, dictionary nên lưu gì?", ["Mã → tổng doanh thu", "Số dòng → ký tự đầu", "Doanh thu → một mã bất kỳ"],
             "Dùng mã làm khóa để các bản ghi cùng sản phẩm được cộng vào một tổng."),
        ],
    },
    {
        "title": "Python nâng cao · Tư duy thuật toán", "level": "advanced", "price": 299000,
        "description": "Phân tích độ phức tạp, tìm kiếm nhị phân, tổng tiền tố và cửa sổ trượt. Rèn cách chọn thuật toán và kiểm thử trường hợp biên.",
        "lessons": [
            ("Tìm kiếm nhị phân", "binary_search",
             "Tìm kiếm nhị phân thu hẹp khoảng tìm kiếm trong một dãy đã sắp xếp. Sau mỗi lần so sánh, bỏ nửa khoảng không thể chứa đáp án. Vì vậy số bước tăng theo logarit của số phần tử.\n\nĐể tìm vị trí đầu tiên của x, duy trì khoảng nửa mở [left, right). Khi a[mid] nhỏ hơn x, chuyển left đến mid + 1; ngược lại đặt right = mid. Khi hai biên bằng nhau, kiểm tra lại phần tử ở left vì x có thể không tồn tại.\n\nKhông áp dụng trực tiếp cho dãy chưa sắp xếp. Cần thử dãy có phần tử trùng, x nhỏ hơn toàn bộ dãy và x lớn hơn toàn bộ dãy.",
             "def first_index(a, x):\n    left, right = 0, len(a)\n    while left < right:\n        mid = (left + right) // 2\n        if a[mid] < x:\n            left = mid + 1\n        else:\n            right = mid\n    return left if left < len(a) and a[left] == x else -1",
             "Vị trí xuất hiện đầu tiên", "Dòng 1: n và x (1 ≤ n ≤ 100000). Dòng 2: n số nguyên đã sắp tăng không giảm. In chỉ số đầu tiên của x, đánh số từ 0; in -1 nếu không tồn tại. Dùng tìm kiếm nhị phân.",
             [("5 3\n1 3 3 3 8\n", "1\n"), ("3 9\n1 2 3\n", "-1\n"), ("1 4\n4\n", "0\n")],
             "Điều kiện để dùng tìm kiếm nhị phân trực tiếp trên dãy là gì?", ["Dãy đã sắp xếp theo quy tắc tìm kiếm", "Dãy không có số âm", "Dãy có số phần tử chẵn"],
             "Thứ tự sắp xếp cho phép loại bỏ một nửa khoảng sau mỗi phép so sánh."),
            ("Tổng tiền tố và truy vấn đoạn", "prefix_sum",
             "Khi cần tính tổng nhiều đoạn của cùng một dãy, lặp lại phép cộng cho từng đoạn gây tốn thời gian. Xây mảng prefix có n + 1 phần tử, trong đó prefix[0] = 0 và prefix[i + 1] = prefix[i] + a[i].\n\nTổng đoạn có chỉ số từ l đến r, tính cả hai đầu và đánh số từ 1, bằng prefix[r] - prefix[l - 1]. Tiền xử lý mất O(n); mỗi truy vấn mất O(1).\n\nMảng tiền tố vẫn dùng được khi dãy có số âm. Cần thống nhất hệ chỉ số và thử các đoạn một phần tử, toàn dãy, đầu dãy và cuối dãy.",
             "a = [2, -1, 5, 3]\nprefix = [0]\nfor value in a:\n    prefix.append(prefix[-1] + value)\nl, r = 2, 4\nprint(prefix[r] - prefix[l - 1])  # 7",
             "Tổng trên nhiều đoạn", "Dòng 1: n q (1 ≤ n, q ≤ 100000). Dòng 2: n số nguyên. q dòng tiếp theo: l r (1 ≤ l ≤ r ≤ n). In tổng mỗi đoạn trên một dòng. Tiền xử lý tổng tiền tố.",
             [("4 2\n2 -1 5 3\n2 4\n1 1\n", "7\n2\n"), ("1 1\n-5\n1 1\n", "-5\n"), ("3 2\n0 0 0\n1 3\n2 2\n", "0\n0\n")],
             "Với chỉ số từ 1, tổng đoạn [l, r] là công thức nào?", ["prefix[r] - prefix[l - 1]", "prefix[r] + prefix[l]", "prefix[r] - prefix[l] trong mọi trường hợp"],
             "prefix[l - 1] chứa phần đứng trước đoạn, nên cần trừ phần đó khỏi prefix[r]."),
            ("Cửa sổ trượt có kích thước cố định", "sliding_window",
             "Cửa sổ trượt tái sử dụng kết quả của đoạn liên tiếp trước đó. Với tổng của k phần tử liên tiếp, khởi tạo bằng k phần tử đầu. Mỗi bước bỏ phần tử rời cửa sổ và cộng phần tử mới vào.\n\nCách này xét mọi cửa sổ trong O(n) thời gian, thay vì cộng lại k phần tử mỗi lần. Biến best phải khởi tạo bằng tổng cửa sổ đầu, không phải 0: nếu mọi số đều âm, 0 không phải tổng hợp lệ.\n\nThử k = 1, k = n, dãy toàn âm và dãy có các cửa sổ cùng tổng. Không nhầm cửa sổ cố định với thuật toán hai con trỏ dành cho điều kiện đơn điệu.",
             "a, k = [-3, 4, 2, -1], 2\ncurrent = best = sum(a[:k])\nfor right in range(k, len(a)):\n    current += a[right] - a[right - k]\n    best = max(best, current)\nprint(best)  # 6",
             "Tổng lớn nhất của k phần tử liên tiếp", "Dòng 1: n k (1 ≤ k ≤ n ≤ 100000). Dòng 2: n số nguyên. In tổng lớn nhất của một đoạn gồm đúng k phần tử liên tiếp. Dùng cửa sổ trượt.",
             [("4 2\n-3 4 2 -1\n", "6\n"), ("3 2\n-5 -2 -8\n", "-7\n"), ("3 3\n1 2 3\n", "6\n")],
             "Vì sao không nên khởi tạo best bằng 0?", ["Dãy có thể toàn số âm", "Số 0 làm vòng lặp chạy nhanh hơn", "Python không so sánh được với 0"],
             "Cần lấy một tổng của cửa sổ hợp lệ làm giá trị ban đầu để xử lý đúng dãy toàn âm."),
        ],
    },
]


def seed_paid_courses(db):
    name = "paid_curriculum_drafts_v1"
    if db.get(AppMigration, name):
        return
    owner = db.query(User).filter(User.role.in_(("teacher", "admin"))).order_by(User.id).first()
    if not owner:
        return
    for definition in COURSES:
        course = Course(title=definition["title"], description=definition["description"], language="python",
                        level=definition["level"], price=definition["price"], published=False,
                        owner_id=owner.id, color="violet" if definition["level"] == "advanced" else "gold")
        db.add(course)
        db.flush()
        for position, row in enumerate(definition["lessons"], 1):
            title, skill, content, code, ex_title, description, tests, question, answers, explanation = row
            lesson = Lesson(course_id=course.id, title=title, skill=skill, position=position,
                            content=content, code=code, quiz=[{"question": question, "options": answers,
                                                            "answer": 0, "explanation": explanation}])
            db.add(lesson)
            db.flush()
            db.add(Exercise(course_id=course.id, lesson_id=lesson.id, title=ex_title, description=description,
                skill=skill, difficulty="hard" if course.level == "advanced" else "medium",
                starter="import sys\n# Đọc dữ liệu từ stdin, xử lý và in kết quả.\n",
                tests=[{"input": i, "output": o, "hidden": n > 0} for n, (i, o) in enumerate(tests)],
                hints=["Xác định đầu vào và trường hợp biên trước khi viết code.",
                       "Ôn lại ví dụ ở bài: " + title + ".", "Tự tính trường hợp mẫu rồi so sánh với kết quả chương trình."],
                time_limit=2, memory_limit=131072))
    db.add(AppMigration(name=name))
    db.commit()
