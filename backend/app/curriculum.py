"""Introductory teaching material bundled with the demo database."""

QUIZZES = [
    [
        (
            "Một chương trình đọc 2 và 3 từ stdin, rồi in tổng. stdout là gì?",
            ["5", "2 3", "input"],
            0,
            "stdout chứa kết quả chương trình xuất ra, ở đây là tổng 5.",
        ),
        (
            "Khi hệ thống chấm chỉ yêu cầu một số, nên in gì?",
            [
                "Nhập a: rồi in số",
                "Chỉ số kết quả theo đúng định dạng",
                "In thêm mọi giá trị trung gian",
            ],
            1,
            "Lời nhắc thừa có thể khiến kết quả không khớp bộ kiểm thử.",
        ),
    ],
    [
        (
            "Kiểu dữ liệu phù hợp cho số lượng học viên là gì?",
            ["Số thực", "Số nguyên", "Boolean"],
            1,
            "Số lượng là giá trị đếm nguyên.",
        ),
        (
            "Biến x ban đầu bằng 3, sau phép gán x = x + 2 thì x bằng bao nhiêu?",
            ["2", "3", "5"],
            2,
            "Giá trị bên phải được tính trước, rồi gán lại cho x.",
        ),
    ],
    [
        (
            "Giá trị của 17 % 5 là bao nhiêu?",
            ["3", "2", "5"],
            1,
            "17 = 3 × 5 + 2, nên phần dư là 2.",
        ),
        (
            "Biểu thức 2 + 3 * 4 có kết quả gì?",
            ["14", "20", "24"],
            0,
            "Phép nhân được thực hiện trước phép cộng.",
        ),
    ],
    [
        (
            "Điều kiện nào kiểm tra số nguyên n là số chẵn?",
            ["n > 0", "n % 2 == 1", "n % 2 == 0"],
            2,
            "Một số chia hết cho 2 khi phần dư bằng 0.",
        ),
        (
            "Điều kiện n > 0 nhận kết quả sai với giá trị nào?",
            ["1", "0", "10"],
            1,
            "0 không lớn hơn 0. Cần phân biệt lớn hơn và lớn hơn hoặc bằng.",
        ),
    ],
    [
        (
            "Vòng lặp cộng các số từ 1 đến 4 cho kết quả bao nhiêu?",
            ["6", "10", "15"],
            1,
            "1 + 2 + 3 + 4 = 10.",
        ),
        (
            "Điều gì dễ gây vòng lặp vô hạn?",
            [
                "Cập nhật biến đếm",
                "Điều kiện dừng luôn sai",
                "Điều kiện lặp luôn đúng và không thay đổi trạng thái",
            ],
            2,
            "Vòng lặp không kết thúc nếu điều kiện tiếp tục luôn đúng.",
        ),
    ],
    [
        (
            'Chuỗi "code" có bao nhiêu ký tự?',
            ["3", "4", "5"],
            1,
            "Chuỗi chứa c, o, d, e: bốn ký tự.",
        ),
        (
            'Đảo ngược chuỗi "abc" thu được gì?',
            ["cba", "bca", "acb"],
            0,
            "Đọc các ký tự từ vị trí cuối về đầu.",
        ),
    ],
    [
        (
            "Danh sách [3, 1, 4] có tổng bao nhiêu?",
            ["3", "7", "8"],
            2,
            "3 + 1 + 4 = 8.",
        ),
        (
            "Nếu chỉ số bắt đầu từ 0, phần tử đầu tiên có chỉ số nào?",
            ["0", "1", "-1"],
            0,
            "Mảng Java/JavaScript và danh sách Python đều có thể truy cập phần tử đầu bằng chỉ số 0.",
        ),
    ],
    [
        (
            "Vai trò chính của tham số hàm là gì?",
            [
                "Truyền dữ liệu đầu vào cho hàm",
                "Luôn in kết quả",
                "Luôn kết thúc chương trình",
            ],
            0,
            "Tham số giúp hàm nhận các giá trị cần xử lý.",
        ),
        (
            "Một hàm tính tổng hai số nên trả về gì?",
            ["Tên hàm", "Giá trị tổng", "Toàn bộ mã nguồn"],
            1,
            "Giá trị trả về có thể được dùng trong phần xử lý tiếp theo.",
        ),
    ],
    [
        (
            "Tìm số lớn nhất bằng cách duyệt mỗi phần tử một lần có độ phức tạp nào?",
            ["O(1)", "O(n²)", "O(n)"],
            2,
            "Số bước tăng tuyến tính theo số lượng phần tử.",
        ),
        (
            "Trước khi viết code cho bài mới, bước nào hữu ích nhất?",
            [
                "Bỏ qua ràng buộc",
                "Xác định đầu vào, đầu ra và các bước giải",
                "Chỉ đổi tên biến trong một bài khác",
            ],
            1,
            "Phân tích giúp chọn thuật toán phù hợp và tránh hiểu sai bài toán.",
        ),
    ],
    [
        (
            "Để kiểm tra lỗi ở giới hạn đầu vào, nên bổ sung loại test nào?",
            ["Trường hợp biên", "Chỉ một ví dụ đã biết", "Chỉ dữ liệu ngẫu nhiên lớn"],
            0,
            "Test biên kiểm tra các giá trị nhỏ nhất/lớn nhất và trường hợp đặc biệt.",
        ),
        (
            "Code chạy được nhưng kết quả sai nên kiểm tra điều gì?",
            [
                "Chỉ màu trình soạn thảo",
                "Logic xử lý và định dạng đầu ra",
                "Xóa bộ kiểm thử",
            ],
            1,
            "Chạy được không đồng nghĩa đáp ứng yêu cầu của đề bài.",
        ),
    ],
]
DETAILS = [
    "Luồng xử lý\nDữ liệu vào → chuyển đổi kiểu → tính toán → xuất kết quả. Dữ liệu đọc từ bàn phím hoặc stdin ban đầu thường ở dạng văn bản; cần đổi sang kiểu số trước khi cộng.\n\nLỗi dễ gặp\nĐọc thiếu giá trị, cộng chuỗi thay vì cộng số hoặc in thêm lời nhắc. Thử đầu vào 2 3: kết quả cần là 5.",
    "Chọn kiểu dữ liệu\nSố nguyên phù hợp với số đếm. Số thực phù hợp với nhiệt độ, kích thước hoặc trung bình. Boolean biểu diễn đúng/sai. Chuỗi lưu văn bản.\n\nPhép gán\nPhép gán thay đổi giá trị đang lưu trong biến, không phải một phương trình toán học. Với x = 3, gán x = x + 2 khiến x nhận giá trị 5.\n\nCần nhớ\nJava yêu cầu khai báo kiểu, còn Python và JavaScript gán kiểu cho giá trị ở thời điểm chạy.",
    "Thứ tự tính\nNgoặc trước; nhân, chia và chia dư trước cộng, trừ. 2 + 3 * 4 bằng 14, còn (2 + 3) * 4 bằng 20.\n\nChia và chia dư\n17 % 5 bằng 2. Python dùng // cho chia nguyên; Java chia hai số nguyên cho kết quả nguyên; JavaScript dùng / để chia và Math.trunc để lấy phần nguyên.\n\nThực hành\nTự tính một ví dụ nhỏ trước khi chạy. Kiểm tra với 0 và số âm nếu đề cho phép.",
    "Ba phần của rẽ nhánh\nĐiều kiện → nhánh đúng → nhánh còn lại. Dùng if, else if/elif và else khi có nhiều trường hợp.\n\nKiểm tra biên\nVới phân loại số âm, dương, bằng 0, cần bao phủ cả ba trường hợp. Phân biệt > với >=. Dấu == dùng để so sánh, không nhầm với phép gán.\n\nKết hợp điều kiện\nAND yêu cầu cả hai điều kiện đúng, OR chỉ cần ít nhất một đúng. Java/JavaScript dùng && và ||; Python dùng and và or.",
    "Thiết kế vòng lặp\nChọn giá trị khởi đầu, điều kiện tiếp tục và bước cập nhật. Đặt biến tổng bằng 0 trước khi lặp, rồi cộng từng giá trị.\n\nVí dụ bằng tay\nTổng 1 đến 4: sau mỗi bước tổng lần lượt là 1, 3, 6, 10.\n\nLỗi lệch một đơn vị\nKiểm tra vòng lặp có bao gồm giá trị cuối không. Python range(1, n + 1) bao gồm n; điều kiện i <= n bao gồm n trong Java/JavaScript.",
    "Duyệt chuỗi\nChuỗi là một dãy ký tự. Xét lần lượt từng ký tự để đếm hoặc xây dựng chuỗi kết quả.\n\nPhân biệt ký tự\nChữ hoa và chữ thường có thể khác nhau. Chỉ đổi về chữ thường nếu đề cho phép. Với bài đếm nguyên âm, kiểm tra từng ký tự thuộc a, e, i, o, u.\n\nChú ý\nCác bài mẫu dùng chữ Latin đơn giản. Xử lý Unicode đầy đủ cần quan tâm cách biểu diễn và chuẩn hóa ký tự.",
    "Mảng và danh sách\nLưu một tập phần tử để xử lý bằng vòng lặp. Nếu chỉ số bắt đầu từ 0 và có n phần tử, chỉ số hợp lệ từ 0 đến n - 1.\n\nTổng và đếm\nBiến tổng cộng giá trị phần tử; biến đếm tăng 1 khi phần tử thỏa điều kiện. Hai thao tác này có mục đích khác nhau.\n\nĐọc dữ liệu\nNếu dòng đầu chứa n, cần đọc đúng n giá trị tiếp theo. Giá trị n không phải phần tử cần cộng.",
    "Tách bài thành hàm\nMột hàm nên có nhiệm vụ rõ ràng. Xác định tên, tham số và giá trị trả về trước khi viết phần xử lý.\n\nVí dụ\nHàm add(a, b) nhận hai số và trả về a + b. In kết quả ở nơi gọi giúp tách phần xử lý khỏi phần giao diện.\n\nKiểm thử\nThử hàm độc lập với đầu vào nhỏ. Kiểm tra tham số biên và tránh phụ thuộc không cần thiết vào biến toàn cục.",
    "Từ ý tưởng đến thuật toán\nLiệt kê các bước hữu hạn. Với bài tổng chữ số, có thể duyệt từng ký tự số rồi cộng giá trị của chúng. Với chuỗi đối xứng, so sánh từng cặp từ hai đầu hoặc so với chuỗi đảo.\n\nHiệu quả\nDuyệt n phần tử một lần thường là O(n). Hai vòng lặp lồng nhau cùng chạy n lần có thể là O(n²).\n\nChọn cách phù hợp\nĐọc giới hạn đầu vào để quyết định một cách giải có đủ nhanh không; ưu tiên đúng trước rồi tối ưu.",
    "Quy trình giải bài\n1. Viết lại yêu cầu bằng lời của mình.\n2. Xác định kiểu dữ liệu và giới hạn.\n3. Mô phỏng với ví dụ nhỏ.\n4. Viết code và thử trường hợp biên.\n5. Nộp bài rồi đọc phản hồi.\n\nHiểu kết quả chấm\nAC: đạt, WA: sai kết quả, CE: lỗi biên dịch, RE: lỗi khi chạy, TLE: quá thời gian. Với ngôn ngữ thông dịch, lỗi cú pháp có thể được hệ chạy báo như lỗi thực thi.\n\nTự đánh giá\nBạn có thể giải thích vì sao thuật toán đúng và tự tạo một test khiến cách làm sai bị phát hiện không?",
]
SNIPPETS = {
    "python": [
        "a, b = map(int, input().split())\nprint(a + b)",
        'count = 5\ntemperature = 26.5\nname = "SmartCode"\nis_ready = True\nprint(count, temperature, name, is_ready)',
        "print(2 + 3 * 4)  # 14\nprint(17 % 5)     # 2\nprint(17 // 5)    # 3",
        'n = int(input())\nif n > 0:\n    print("POSITIVE")\nelif n < 0:\n    print("NEGATIVE")\nelse:\n    print("ZERO")',
        "n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint(total)",
        "word = input().strip()\nfor character in word:\n    print(character)",
        "numbers = [3, 1, 4]\ntotal = 0\nfor value in numbers:\n    total += value\nprint(total)",
        "def add(a, b):\n    return a + b\n\nresult = add(2, 3)\nprint(result)",
        "numbers = [3, 1, 4]\nlargest = numbers[0]\nfor value in numbers:\n    if value > largest:\n        largest = value\nprint(largest)",
        "def count_positive(values):\n    return sum(1 for value in values if value > 0)\n\nprint(count_positive([-1, 0, 3, 5]))  # 2",
    ],
    "java": [
        "import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int a = sc.nextInt(), b = sc.nextInt();\n    System.out.println(a + b);\n  }\n}",
        'int count = 5;\ndouble temperature = 26.5;\nString name = "SmartCode";\nboolean isReady = true;',
        "System.out.println(2 + 3 * 4); // 14\nSystem.out.println(17 % 5);    // 2\nSystem.out.println(17 / 5);    // 3",
        'int n = -3;\nif (n > 0) {\n    System.out.println("POSITIVE");\n} else if (n < 0) {\n    System.out.println("NEGATIVE");\n} else {\n    System.out.println("ZERO");\n}',
        "int n = 4, total = 0;\nfor (int i = 1; i <= n; i++) {\n    total += i;\n}\nSystem.out.println(total);",
        'String word = "code";\nfor (int i = 0; i < word.length(); i++) {\n    System.out.println(word.charAt(i));\n}',
        "int[] numbers = {3, 1, 4};\nint total = 0;\nfor (int value : numbers) total += value;\nSystem.out.println(total);",
        "public class Main {\n  static int add(int a, int b) { return a + b; }\n  public static void main(String[] args) {\n    System.out.println(add(2, 3));\n  }\n}",
        "int[] numbers = {3, 1, 4};\nint largest = numbers[0];\nfor (int value : numbers) {\n    if (value > largest) largest = value;\n}\nSystem.out.println(largest);",
        "int[] values = {-1, 0, 3, 5};\nint count = 0;\nfor (int value : values) {\n    if (value > 0) count++;\n}\nSystem.out.println(count); // 2",
    ],
    "javascript": [
        "const fs = require('fs');\nconst [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(a + b);",
        'let count = 5;\nconst temperature = 26.5;\nconst name = "SmartCode";\nconst isReady = true;\nconsole.log(count, temperature, name, isReady);',
        "console.log(2 + 3 * 4);       // 14\nconsole.log(17 % 5);          // 2\nconsole.log(Math.trunc(17/5));// 3",
        'const n = -3;\nif (n > 0) {\n  console.log("POSITIVE");\n} else if (n < 0) {\n  console.log("NEGATIVE");\n} else {\n  console.log("ZERO");\n}',
        "const n = 4;\nlet total = 0;\nfor (let i = 1; i <= n; i++) {\n  total += i;\n}\nconsole.log(total);",
        'const word = "code";\nfor (const character of word) {\n  console.log(character);\n}',
        "const numbers = [3, 1, 4];\nlet total = 0;\nfor (const value of numbers) total += value;\nconsole.log(total);",
        "function add(a, b) {\n  return a + b;\n}\nconsole.log(add(2, 3));",
        "const numbers = [3, 1, 4];\nlet largest = numbers[0];\nfor (const value of numbers) {\n  if (value > largest) largest = value;\n}\nconsole.log(largest);",
        "const values = [-1, 0, 3, 5];\nconst count = values.filter(value => value > 0).length;\nconsole.log(count); // 2",
    ],
}


def lesson_quiz(i):
    return [
        dict(question=q, options=o, answer=a, explanation=e)
        for q, o, a, e in QUIZZES[i]
    ]


def lesson_code(lang, i):
    snippet = SNIPPETS[lang][i]
    if lang == "java" and i not in [0, 7]:
        snippet = (
            "public class Main {\n  public static void main(String[] args) {\n"
            + "\n".join("    " + line for line in snippet.splitlines())
            + "\n  }\n}"
        )
    return snippet
