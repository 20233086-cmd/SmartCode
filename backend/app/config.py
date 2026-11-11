import os, secrets
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for line in (
    (ROOT / ".env").read_text(encoding="utf-8").splitlines()
    if (ROOT / ".env").exists()
    else []
):
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())
DATA = Path(os.getenv("SMARTCODE_DATA_DIR", str(ROOT / "data"))).resolve()
DATA.mkdir(parents=True, exist_ok=True)
UPLOADS = DATA / "uploads"
UPLOADS.mkdir(exist_ok=True)
DATABASE_URL = os.getenv("DATABASE_URL", f'sqlite:///{DATA / "smartcode.db"}')
JWT_SECRET = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    key = DATA / "jwt.key"
    if not key.exists():
        try:
            fd = os.open(key, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w") as f:
                f.write(secrets.token_hex(32))
        except FileExistsError:
            pass
    JWT_SECRET = key.read_text().strip()
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:3b")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "75"))
CORS = [
    x.strip()
    for x in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
]
