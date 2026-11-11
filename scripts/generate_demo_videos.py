"""Recreate the three silent example clips. Requires Pillow and ffmpeg."""

from pathlib import Path
import subprocess, tempfile, shutil
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "backend" / "assets"
OUT.mkdir(exist_ok=True)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"


def f(n, bold=False, mono=False):
    return ImageFont.truetype(MONO if mono else BOLD if bold else FONT, n)


texts = [
    (
        "Mỗi chương trình bắt đầu từ dữ liệu",
        "Ta sẽ đọc hai số nguyên và in ra tổng của chúng.",
    ),
    ("01 / Xác định đầu vào", "Hai số nguyên trên một dòng, cách nhau bằng dấu cách."),
    (
        "02 / Đọc và chuyển kiểu",
        "Chuyển văn bản nhập vào thành giá trị số để tính toán.",
    ),
    ("03 / Xử lý và xuất kết quả", "Cộng hai số, sau đó in đúng kết quả ra stdout."),
    ("04 / Tự kiểm tra", "Thử cả số âm và số 0 để phát hiện lỗi ở trường hợp biên."),
    ("Đến lượt bạn thực hành", "Mở bài Tổng hai số, tự viết chương trình và chạy thử."),
]
snippets = {
    "python": ["a, b = map(int, input().split())", "print(a + b)"],
    "java": [
        "Scanner sc = new Scanner(System.in);",
        "int a = sc.nextInt(), b = sc.nextInt();",
        "System.out.println(a + b);",
    ],
    "javascript": [
        "const fs = require('fs');",
        "const [a, b] = fs.readFileSync(0, 'utf8')",
        "    .trim().split(/\\s+/).map(Number);",
        "console.log(a + b);",
    ],
}
with tempfile.TemporaryDirectory() as tmp:
    for lang, lines in snippets.items():
        for idx, (title, description) in enumerate(texts):
            image = Image.new("RGB", (1280, 720), "#f1f5fa")
            d = ImageDraw.Draw(image)
            d.rectangle((0, 0, 1280, 110), fill="#302767")
            d.text((62, 36), "SmartCode", font=f(29, True), fill="white")
            d.text(
                (900, 46),
                lang.upper() + " / NHẬP XUẤT",
                font=f(16, True),
                fill="#d2d7ff",
            )
            d.text((62, 145), title, font=f(32, True), fill="#263552")
            d.text((62, 201), description, font=f(20), fill="#73839d")
            d.rounded_rectangle(
                (62, 264, 1218, 567),
                radius=18,
                fill="white",
                outline="#dce4ef",
                width=2,
            )
            d.text((90, 290), "VÍ DỤ: TỔNG HAI SỐ", font=f(13, True), fill="#9d83d2")
            show = lines if idx >= 2 else ["stdin:   2 3", "a = 2, b = 3", "stdout:  5"]
            if idx == 4:
                show = ["2 3      → 5", "-5 2     → -3", "0 0      → 0"]
            if idx == 5:
                show = [
                    "Đọc đề → nhập dữ liệu → xử lý → xuất kết quả",
                    "Hãy thử tự viết trước khi mở gợi ý.",
                ]
            for n, line in enumerate(show):
                d.text(
                    (90, 337 + n * 43),
                    line,
                    font=f(24 if idx != 5 else 22, mono=idx != 5),
                    fill="#5674a2",
                )
            d.rounded_rectangle((62, 608, 1218, 614), radius=3, fill="#e0e6f0")
            d.rounded_rectangle(
                (62, 608, 62 + int(1156 * (idx + 1) / 6), 614), radius=3, fill="#956de2"
            )
            d.text(
                (62, 641),
                "VIDEO MẪU KHÔNG LỜI · BẬT PHỤ ĐỀ TIẾNG VIỆT",
                font=f(13),
                fill="#8f9eb2",
            )
            d.text((1125, 641), f"{idx+1} / 6", font=f(14, True), fill="#8c78b8")
            image.save(Path(tmp) / f"{lang}_{idx}.png")
        concat = Path(tmp) / f"{lang}.txt"
        concat.write_text(
            "".join(f"file '{lang}_{i}.png'\nduration 6\n" for i in range(6))
            + f"file '{lang}_5.png'\n"
        )
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-loglevel",
                "error",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat),
                "-t",
                "36",
                "-vf",
                "fps=12,format=yuv420p",
                "-c:v",
                "libx264",
                "-crf",
                "25",
                "-preset",
                "fast",
                "-movflags",
                "+faststart",
                str(OUT / f"intro_{lang}.mp4"),
            ],
            check=True,
        )
        vtt = "WEBVTT\n\n"
        for i, (title, desc) in enumerate(texts):
            vtt += f"{i+1}\n00:00:{i*6:02}.000 --> 00:00:{(i+1)*6:02}.000\n{desc}\n\n"
        (OUT / f"intro_{lang}.vtt").write_text(vtt, encoding="utf-8")
        print(lang, (OUT / f"intro_{lang}.mp4").stat().st_size)
