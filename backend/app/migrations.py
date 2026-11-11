"""Additive upgrade for existing SQLite / MySQL installations. Never resets data."""
import unicodedata
from sqlalchemy import inspect, text


def migrate(engine):
    columns = {c["name"] for c in inspect(engine).get_columns("courses")}
    if "level" in columns:
        return
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE courses ADD COLUMN level VARCHAR(20) NOT NULL DEFAULT 'basic'"))
        for row in conn.execute(text("SELECT id,title,description,price FROM courses")).mappings().all():
            title = unicodedata.normalize("NFD", row["title"] or "").encode("ascii", "ignore").decode().lower()
            # The three original SmartCode sample courses teach foundational material.
            original_sample = row["title"] in ("Java Core", "JavaScript", "Python cơ bản") and row["description"] == "Học kiến thức nền tảng, thực hành từng bước và theo dõi sự tiến bộ của bạn."
            level = "basic" if original_sample or "co ban" in title else (
                "advanced" if "nang cao" in title else "intermediate" if row["price"] > 0 else "basic")
            # Old paid/custom courses retain their price and access; basic courses become free.
            conn.execute(text("UPDATE courses SET level=:level, price=:price WHERE id=:id"),
                         {"id": row["id"], "level": level, "price": 0 if level == "basic" else row["price"]})
