import os, secrets, time, asyncio, collections, csv, io, hashlib
from contextlib import asynccontextmanager, suppress
from pathlib import Path
from typing import Literal
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Request,
    Response,
    UploadFile,
    File,
    WebSocket,
    WebSocketDisconnect,
    BackgroundTasks,
)
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session as DBSession
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field, field_validator, model_validator
from . import config
from .db import Base, engine, Session, get_db
from .models import *
from .security import current, staff, admin, hash_password, verify_password, token
from .services import serialize, public_user, judge, get_hint, analytics, roadmap
from .seed import seed


@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    from .migrations import migrate
    migrate(engine)
    if os.getenv("AUTO_SEED", "true").lower() == "true":
        with Session() as db:
            seed(db)
            from .paid_curriculum import seed_paid_courses
            seed_paid_courses(db)
    from .payments import reconcile_loop
    task = asyncio.create_task(reconcile_loop())
    try:
        yield
    finally:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


app = FastAPI(title="SmartCode API", version="2.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.middleware("http")
async def check_origin(request, call_next):
    origin = request.headers.get("origin")
    if (
        request.method in ["POST", "PUT", "PATCH", "DELETE"]
        and origin
        and origin not in config.CORS
        and origin != str(request.base_url).rstrip("/")
    ):
        from fastapi.responses import JSONResponse

        return JSONResponse({"detail": "Nguồn yêu cầu không được phép."}, 403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    return response


class Register(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=190)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def email_valid(cls, v):
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Email không hợp lệ")
        return v


class Login(BaseModel):
    email: str = Field(max_length=190)
    password: str = Field(max_length=128)


class Profile(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class Password(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8, max_length=128)


class CourseIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    language: Literal["python", "java", "javascript"]
    description: str = Field(max_length=10000)
    level: Literal["basic", "intermediate", "advanced"] = "basic"
    price: int = Field(ge=0, le=50000000)
    published: bool = True
    color: str = "violet"

    @model_validator(mode="after")
    def check_price(self):
        if self.level == "basic" and self.price != 0:
            raise ValueError("Khóa Cơ bản phải miễn phí (giá 0 đồng).")
        if self.level != "basic" and self.price < 1000:
            raise ValueError("Khóa Vận dụng/Nâng cao cần giá từ 1.000 đồng.")
        return self


class QuizItem(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    options: list[str] = Field(min_length=2, max_length=6)
    answer: int = Field(ge=0, le=5)
    explanation: str = Field(max_length=2000, default="")

    @field_validator("answer")
    @classmethod
    def valid_answer(cls, v, info):
        if v >= len(info.data.get("options", [])):
            raise ValueError("Đáp án ngoài danh sách lựa chọn")
        return v


class LessonIn(BaseModel):
    course_id: int
    title: str = Field(min_length=2, max_length=200)
    content: str = Field(max_length=100000)
    code: str = Field(max_length=10000, default="")
    position: int = Field(ge=1, le=1000)
    skill: str = Field(max_length=80, default="basic")
    video_url: str = Field(max_length=2000, default="")
    captions_url: str = Field(max_length=2000, default="")
    quiz: list[QuizItem] = Field(default_factory=list, max_length=30)


class ExerciseIn(BaseModel):
    course_id: int
    lesson_id: int
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(max_length=10000)
    skill: str = Field(max_length=80)
    difficulty: Literal["easy", "medium", "hard"] = "easy"
    starter: str = Field(max_length=20000, default="")
    tests: list[dict]
    hints: list[str]


class ProgIn(BaseModel):
    position: float = Field(ge=0, le=86400, default=0)
    read: bool = False


class NoteIn(BaseModel):
    body: str = Field(min_length=1, max_length=5000)
    position: float = Field(ge=0, le=86400, default=0)


class CodeIn(BaseModel):
    assessment_id: int | None = None
    session_id: int | None = None
    active_seconds: int = Field(ge=0, le=36000, default=0)
    code: str = Field(max_length=30000)
    stdin: str = Field(default="", max_length=5000)


class HintIn(CodeIn):
    level: int = Field(ge=1, le=3, default=1)


class EmotionIn(BaseModel):
    body: str = Field(default="", max_length=2000)
    state: Literal["positive", "neutral", "negative"] | None = None
    failures: int = Field(ge=0, le=20, default=0)
    idle_seconds: int = Field(ge=0, le=3600, default=0)


class RoomIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    course_id: int


class SessionIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    due_at: str = Field(max_length=40, default="")
    exercise_ids: list[int] = Field(min_length=1, max_length=60)
    allow_hints: bool = True


class ReportIn(BaseModel):
    body: str = Field(min_length=5, max_length=3000)
    exercise_id: int | None = None


class UserPatch(BaseModel):
    role: Literal["learner", "teacher", "admin"]
    active: bool


class Checkout(BaseModel):
    course_id: int


class Answers(BaseModel):
    answers: list[int] = Field(max_length=100)


def required(db, cls, id):
    obj = db.get(cls, id)
    if not obj:
        raise HTTPException(404, "Không tìm thấy dữ liệu.")
    return obj


def own_course(db, u, cid):
    c = required(db, Course, cid)
    if u.role != "admin" and c.owner_id != u.id:
        raise HTTPException(403, "Bạn không quản lý khóa học này.")
    return c


def enrolled(db, u, cid):
    c = required(db, Course, cid)
    if u.role == "admin" or (u.role == "teacher" and c.owner_id == u.id):
        return c
    if (
        not c.published
        or not db.query(Enrollment).filter_by(user_id=u.id, course_id=cid).first()
    ):
        raise HTTPException(403, "Bạn cần đăng ký khóa học trước.")
    return c


def own_room(db, u, rid):
    room = required(db, Classroom, rid)
    if u.role != "admin" and room.owner_id != u.id:
        raise HTTPException(403, "Bạn không quản lý lớp này.")
    return room


def hints_allowed(db, u, eid):
    if any(eid in a.exercise_ids for a in db.query(AssessmentAttempt).filter_by(user_id=u.id, finished_at=None).filter(AssessmentAttempt.expires_at > now())):
        return False
    rooms = [m.class_id for m in db.query(Member).filter_by(user_id=u.id)]
    return not any(
        eid in s.exercise_ids
        for s in db.query(ClassSession).filter(
            ClassSession.class_id.in_(rooms),
            ClassSession.status == "open",
            ClassSession.allow_hints == False,
        )
    )


def enrich_course(db, c, u=None):
    d = serialize(c)
    d["lessons_count"] = db.query(Lesson).filter_by(course_id=c.id).count()
    d["exercises_count"] = db.query(Exercise).filter_by(course_id=c.id).count()
    d["enrolled"] = bool(
        u and db.query(Enrollment).filter_by(user_id=u.id, course_id=c.id).first()
    )
    return d


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "runner": bool(os.getenv("JUDGE0_URL")),
        "ai": "ollama" if os.getenv("OLLAMA_URL") else "rule-based",
        "payments": "configured-per-provider",
        "database": "mysql" if config.DATABASE_URL.startswith("mysql") else "sqlite",
    }


_attempts = collections.defaultdict(list)


@app.post("/api/auth/register")
def register(data: Register, response: Response, db=Depends(get_db)):
    if db.query(User).filter_by(email=data.email).first():
        raise HTTPException(409, "Email đã được sử dụng.")
    u = User(
        name=data.name, email=data.email, password_hash=hash_password(data.password)
    )
    db.add(u)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email đã được sử dụng.")
    response.set_cookie(
        "sc_session",
        token(u),
        httponly=True,
        secure=os.getenv("COOKIE_SECURE") == "true",
        samesite="lax",
        max_age=28800,
    )
    return public_user(u)


@app.post("/api/auth/login")
def login(data: Login, request: Request, response: Response, db=Depends(get_db)):
    key = request.client.host
    ts = time.monotonic()
    _attempts[key] = [t for t in _attempts[key] if ts - t < 60]
    if len(_attempts[key]) >= 30:
        raise HTTPException(429, "Thử đăng nhập quá nhiều. Vui lòng chờ một phút.")
    _attempts[key].append(ts)
    u = db.query(User).filter_by(email=data.email.strip().lower()).first()
    if not u or not verify_password(data.password, u.password_hash) or not u.active:
        raise HTTPException(401, "Email hoặc mật khẩu không đúng.")
    response.set_cookie(
        "sc_session",
        token(u),
        httponly=True,
        secure=os.getenv("COOKIE_SECURE") == "true",
        samesite="lax",
        max_age=28800,
    )
    return public_user(u)


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("sc_session")
    return {"ok": True}


@app.get("/api/auth/me")
def me(u=Depends(current)):
    return public_user(u)


@app.patch("/api/auth/me")
def profile(data: Profile, u=Depends(current), db=Depends(get_db)):
    u.name = data.name
    db.commit()
    return public_user(u)


@app.post("/api/auth/password")
def password(data: Password, response: Response, u=Depends(current), db=Depends(get_db)):
    if not verify_password(data.old_password, u.password_hash):
        raise HTTPException(400, "Mật khẩu hiện tại không đúng.")
    u.password_hash = hash_password(data.new_password)
    db.commit()
    response.set_cookie("sc_session", token(u), httponly=True, secure=os.getenv("COOKIE_SECURE") == "true", samesite="lax", max_age=28800)
    return {"ok": True}


@app.get("/api/courses")
def courses(db=Depends(get_db)):
    return [enrich_course(db, c) for c in db.query(Course).filter_by(published=True)]


@app.get("/api/my/courses")
def mycourses(u=Depends(current), db=Depends(get_db)):
    return [enrich_course(db, c, u) for c in db.query(Course).filter_by(published=True)]


@app.get("/api/courses/{cid}")
def course(cid: int, db=Depends(get_db)):
    c = required(db, Course, cid)
    if not c.published:
        raise HTTPException(404, "Khóa học chưa xuất bản.")
    return {
        **enrich_course(db, c),
        "lessons": [
            {k: getattr(l, k) for k in ["id", "title", "position", "skill"]}
            for l in db.query(Lesson).filter_by(course_id=cid).order_by(Lesson.position)
        ],
    }


@app.post("/api/courses/{cid}/enroll")
def enroll(cid: int, u=Depends(current), db=Depends(get_db)):
    c = required(db, Course, cid)
    if not c.published:
        raise HTTPException(404, "Khóa học chưa xuất bản.")
    existing = db.query(Enrollment).filter_by(user_id=u.id, course_id=cid).first()
    if existing:
        return {"ok": True}
    if c.level != "basic":
        raise HTTPException(402, "Khóa học yêu cầu đăng ký qua trang thanh toán.")
    db.add(Enrollment(user_id=u.id, course_id=cid))
    db.commit()
    return {"ok": True}


@app.get("/api/lessons/{lid}")
def lesson(lid: int, u=Depends(current), db=Depends(get_db)):
    l = required(db, Lesson, lid)
    enrolled(db, u, l.course_id)
    p = db.query(Progress).filter_by(user_id=u.id, lesson_id=lid).first()
    return {
        **serialize(l, ("quiz",)),
        "quiz": [
            {k: v for k, v in q.items() if k not in ["answer", "explanation"]}
            for q in l.quiz
        ],
        "progress": serialize(p) if p else None,
        "exercises": [
            serialize(e, ("tests", "hints"))
            for e in db.query(Exercise).filter_by(lesson_id=lid)
        ],
        "notes": [
            serialize(n)
            for n in db.query(Note)
            .filter_by(lesson_id=lid, user_id=u.id)
            .order_by(Note.position)
        ],
    }


@app.put("/api/lessons/{lid}/progress")
def progress(lid: int, data: ProgIn, u=Depends(current), db=Depends(get_db)):
    l = required(db, Lesson, lid)
    enrolled(db, u, l.course_id)
    p = db.query(Progress).filter_by(user_id=u.id, lesson_id=lid).first()
    if not p:
        p = Progress(user_id=u.id, lesson_id=lid)
        db.add(p)
    p.position = data.position
    if data.read and not p.first_read_at:
        p.first_read_at = now()
    p.read = bool(p.read or data.read)
    db.commit()
    return serialize(p)


@app.post("/api/lessons/{lid}/quiz")
def quiz(lid: int, data: Answers, u=Depends(current), db=Depends(get_db)):
    l = required(db, Lesson, lid)
    enrolled(db, u, l.course_id)
    if len(data.answers) != len(l.quiz):
        raise HTTPException(400, "Hãy trả lời đủ câu hỏi.")
    score = round(
        100
        * sum(a == q["answer"] for a, q in zip(data.answers, l.quiz))
        / max(1, len(l.quiz))
    )
    p = db.query(Progress).filter_by(user_id=u.id, lesson_id=lid).first()
    if not p:
        p = Progress(user_id=u.id, lesson_id=lid)
        db.add(p)
    p.quiz_score = max(p.quiz_score or 0, score)
    db.commit()
    return {"score": score, "feedback": l.quiz}


@app.post("/api/lessons/{lid}/notes")
def addnote(lid: int, data: NoteIn, u=Depends(current), db=Depends(get_db)):
    l = required(db, Lesson, lid)
    enrolled(db, u, l.course_id)
    n = Note(user_id=u.id, lesson_id=lid, **data.model_dump())
    db.add(n)
    db.commit()
    return serialize(n)


@app.delete("/api/notes/{nid}")
def delnote(nid: int, u=Depends(current), db=Depends(get_db)):
    n = required(db, Note, nid)
    if n.user_id != u.id:
        raise HTTPException(403, "Không được xóa ghi chú này.")
    db.delete(n)
    db.commit()
    return {"ok": True}


@app.get("/api/courses/{cid}/roadmap")
def path(cid: int, u=Depends(current), db=Depends(get_db)):
    enrolled(db, u, cid)
    return roadmap(db, u.id, cid)


@app.get("/api/exercises/{eid}")
def exercise(eid: int, u=Depends(current), db=Depends(get_db)):
    e = required(db, Exercise, eid)
    c = enrolled(db, u, e.course_id)
    draft = db.query(Draft).filter_by(user_id=u.id, exercise_id=eid).first()
    return {
        **serialize(e, ("tests", "hints")),
        "samples": [t for t in e.tests if not t.get("hidden")],
        "language": c.language,
        "draft": draft.code if draft else None,
        "active_seconds": draft.active_seconds if draft else 0,
        "hints_allowed": hints_allowed(db, u, eid),
        "hints_count": len(e.hints),
    }


@app.put("/api/exercises/{eid}/draft")
def draft(eid: int, data: CodeIn, u=Depends(current), db=Depends(get_db)):
    e = required(db, Exercise, eid)
    enrolled(db, u, e.course_id)
    from .extensions import check_context
    aid, sid = check_context(db, u, eid, data)
    if aid:
        attempt = db.get(AssessmentAttempt, aid)
        attempt.drafts = {**(attempt.drafts or {}), str(eid): data.code}
    d = db.query(Draft).filter_by(user_id=u.id, exercise_id=eid).first()
    if not d:
        d = Draft(user_id=u.id, exercise_id=eid)
        db.add(d)
    d.code = data.code
    d.active_seconds = max(d.active_seconds or 0, data.active_seconds)
    db.commit()
    return {"saved_at": d.updated_at}


@app.post("/api/exercises/{eid}/run")
async def run(eid: int, data: CodeIn, u=Depends(current), db=Depends(get_db)):
    e = required(db, Exercise, eid)
    c = enrolled(db, u, e.course_id)
    from .extensions import check_context
    check_context(db, u, eid, data)
    return {
        "results": await judge(
            data.code,
            c.language,
            [{"input": data.stdin, "output": None, "hidden": False}],
            e.time_limit,
            e.memory_limit,
        )
    }


@app.post("/api/exercises/{eid}/submit")
async def submit(eid: int, data: CodeIn, u=Depends(current), db=Depends(get_db)):
    e = required(db, Exercise, eid)
    c = enrolled(db, u, e.course_id)
    draft(eid, data, u, db)
    start = time.monotonic()
    results = await judge(data.code, c.language, e.tests, e.time_limit, e.memory_limit)
    status = next((r["status"] for r in results if not r["passed"]), "AC")
    sub = Submission(
        user_id=u.id,
        exercise_id=eid,
        code=data.code,
        status=status,
        passed=sum(r["passed"] for r in results),
        total=len(results),
        duration_ms=round((time.monotonic() - start) * 1000),
        results=results,
        work_seconds=data.active_seconds,
    )
    db.add(sub)
    db.flush()
    if data.assessment_id or data.session_id:
        db.add(SubmissionContext(submission_id=sub.id, assessment_id=data.assessment_id, session_id=data.session_id))
    db.commit()
    return serialize(sub)


@app.get("/api/ai/status")
async def ai_status(u=Depends(current)):
    """Report local Ollama readiness without exposing credentials or secrets."""
    from . import config
    status = {"provider": "ollama", "model": config.OLLAMA_MODEL, "configured": bool(config.OLLAMA_URL), "available": False}
    if not config.OLLAMA_URL:
        status["message"] = "Chưa cấu hình OLLAMA_URL."
        return status
    try:
        import httpx
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.get(config.OLLAMA_URL + "/api/tags")
            response.raise_for_status()
            models = [item.get("name", "") for item in response.json().get("models", [])]
        status["available"] = True
        status["model_ready"] = any(name == config.OLLAMA_MODEL or name.startswith(config.OLLAMA_MODEL + ":") for name in models)
        status["message"] = "Ollama đã sẵn sàng." if status["model_ready"] else "Ollama đang chạy nhưng chưa tải model đã cấu hình."
    except Exception:
        status["message"] = "Không kết nối được Ollama tại địa chỉ đã cấu hình."
    return status


@app.post("/api/exercises/{eid}/hint")
async def hint(eid: int, data: HintIn, u=Depends(current), db=Depends(get_db)):
    e = required(db, Exercise, eid)
    enrolled(db, u, e.course_id)
    if not hints_allowed(db, u, eid):
        raise HTTPException(
            403, "Gợi ý đã tắt trong lượt đánh giá hoặc buổi thực hành đang mở."
        )
    db.add(Hint(user_id=u.id, exercise_id=eid, level=data.level))
    db.commit()
    return await get_hint(e, required(db, Lesson, e.lesson_id), data.level, data.code)


@app.get("/api/submissions")
def submissions(u=Depends(current), db=Depends(get_db)):
    return [
        {
            **serialize(s, ("code", "results")),
            "exercise_title": required(db, Exercise, s.exercise_id).title,
        }
        for s in db.query(Submission)
        .filter_by(user_id=u.id)
        .order_by(Submission.created_at.desc())
        .limit(200)
    ]


@app.get("/api/submissions/{sid}")
def subdetail(sid: int, u=Depends(current), db=Depends(get_db)):
    s = required(db, Submission, sid)
    if s.user_id != u.id and u.role != "admin":
        if u.role != "teacher":
            raise HTTPException(403, "Không được xem bài nộp này.")
        e = required(db, Exercise, s.exercise_id)
        own_course(db, u, e.course_id)
        if (
            not db.query(Member)
            .join(Classroom, Member.class_id == Classroom.id)
            .filter(Member.user_id == s.user_id, Classroom.owner_id == u.id)
            .first()
        ):
            raise HTTPException(403, "Không thuộc lớp của bạn.")
    return serialize(s)


@app.get("/api/analytics")
def stats(
    course_id: int | None = None,
    period: Literal["7", "30", "90"] = "90",
    u=Depends(current),
    db=Depends(get_db),
):
    return analytics(db, u.id, course_id, int(period))


@app.get("/api/analytics/export")
def export(
    course_id: int | None = None,
    period: Literal["7", "30", "90"] = "90",
    u=Depends(current),
    db=Depends(get_db),
):
    data = analytics(db, u.id, course_id, int(period))
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["Ngay", "Luot nop", "Luot dat"])
    w.writerows([[d["date"], d["count"], d["accepted"]] for d in data["days"]])
    return Response(
        "\ufeff" + out.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=smartcode-insight.csv"},
    )


@app.post("/api/emotions")
def emotion(data: EmotionIn, u=Depends(current), db=Depends(get_db)):
    preference = db.get(EmotionPreference, u.id)
    if not data.state and preference and not preference.enabled:
        raise HTTPException(409, "Phân tích cảm xúc đang tạm dừng.")
    state = data.state or (
        "negative"
        if data.failures >= 3
        else "neutral" if data.idle_seconds > 180 else "positive"
    )
    scores = {
        x: (70 if x == state else 15) for x in ["positive", "neutral", "negative"]
    }
    e = Emotion(
        user_id=u.id,
        state=state,
        source="self-report" if data.state else "heuristic",
        scores=None if data.state else scores,
    )
    db.add(e)
    db.flush()
    db.add(EmotionNote(emotion_id=e.id, body=data.body))
    db.commit()
    return {**serialize(e), "body": data.body}


@app.get("/api/emotions")
def emotions(u=Depends(current), db=Depends(get_db)):
    return [
        {**serialize(e), "body": (db.get(EmotionNote, e.id).body if db.get(EmotionNote, e.id) else "")}
        for e in db.query(Emotion)
        .filter_by(user_id=u.id)
        .order_by(Emotion.created_at.desc())
        .limit(100)
    ]


@app.get("/api/courses/{cid}/placement")
def placement(cid: int, u=Depends(current), db=Depends(get_db)):
    enrolled(db, u, cid)
    questions = []
    for l in db.query(Lesson).filter_by(course_id=cid).order_by(Lesson.position):
        if l.quiz:
            questions.append(
                {
                    "lesson_id": l.id,
                    "skill": l.skill,
                    **{
                        k: v
                        for k, v in l.quiz[0].items()
                        if k not in ["answer", "explanation"]
                    },
                }
            )
    return questions


@app.post("/api/courses/{cid}/placement")
def placement_save(cid: int, data: Answers, u=Depends(current), db=Depends(get_db)):
    enrolled(db, u, cid)
    lessons = [
        l
        for l in db.query(Lesson).filter_by(course_id=cid).order_by(Lesson.position)
        if l.quiz
    ]
    if not lessons:
        raise HTTPException(400, "Khóa học chưa có câu hỏi đánh giá.")
    if len(data.answers) != len(lessons):
        raise HTTPException(400, "Hãy hoàn thành đánh giá.")
    scores = {
        l.skill: (100 if a == l.quiz[0]["answer"] else 0)
        for l, a in zip(lessons, data.answers)
    }
    p = Placement(user_id=u.id, course_id=cid, scores=scores)
    db.add(p)
    db.commit()
    return {
        "scores": scores,
        "recommended_lesson": next(
            (l.id for l in lessons if scores[l.skill] < 80), lessons[-1].id
        ),
        "notice": "Đánh giá kiến thức sơ bộ; kết hợp thực hành để xác định năng lực.",
    }


@app.get("/api/leaderboard")
def leaders(u=Depends(current), db=Depends(get_db)):
    # Only peers enrolled in a shared classroom, not global private activity.
    rooms = [m.class_id for m in db.query(Member).filter_by(user_id=u.id)]
    ids = {m.user_id for m in db.query(Member).filter(Member.class_id.in_(rooms))} | {
        u.id
    }
    rows = []
    for uid in ids:
        learner = required(db, User, uid)
        solved = (
            db.query(Submission.exercise_id)
            .filter_by(user_id=uid, status="AC")
            .distinct()
            .count()
        )
        rows.append(
            {
                "name": learner.name,
                "solved": solved,
                "xp": solved * 20,
                "me": uid == u.id,
            }
        )
    return sorted(rows, key=lambda d: -d["xp"])


@app.get("/api/notifications")
def notifications(u=Depends(current), db=Depends(get_db)):
    return [
        serialize(n)
        for n in db.query(Notification)
        .filter_by(user_id=u.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    ]


@app.post("/api/notifications/{nid}/read")
def read_notification(nid: int, u=Depends(current), db=Depends(get_db)):
    n = required(db, Notification, nid)
    if n.user_id != u.id:
        raise HTTPException(403)
    n.read = True
    db.commit()
    return {"ok": True}


@app.post("/api/reports")
def report(data: ReportIn, u=Depends(current), db=Depends(get_db)):
    if data.exercise_id:
        required(db, Exercise, data.exercise_id)
    r = Report(user_id=u.id, **data.model_dump())
    db.add(r)
    db.commit()
    return serialize(r)


@app.post("/api/payments/{pid}/confirm-demo")
def removed_demo_checkout(pid: int, u=Depends(current)):
    raise HTTPException(410, "Thanh toán mô phỏng đã được gỡ. Vui lòng dùng trang thanh toán mới.")


# ClassRoom and content management.
@app.get("/api/classes")
def classes(u=Depends(current), db=Depends(get_db)):
    q = db.query(Classroom)
    if u.role == "teacher":
        q = q.filter_by(owner_id=u.id)
    elif u.role != "admin":
        q = q.join(Member, Member.class_id == Classroom.id).filter(
            Member.user_id == u.id
        )
    return [
        {
            **serialize(r),
            "members_count": db.query(Member).filter_by(class_id=r.id).count(),
            "sessions": [
                {**serialize(s), "groups": (db.get(SessionDetails, s.id).groups if db.get(SessionDetails, s.id) else None)} for s in db.query(ClassSession).filter_by(class_id=r.id)
            ],
        }
        for r in q.all()
    ]


@app.post("/api/classes/join/{code}")
def join(code: str, u=Depends(current), db=Depends(get_db)):
    r = db.query(Classroom).filter_by(join_code=code.upper()).first()
    if not r:
        raise HTTPException(404, "Mã lớp không đúng.")
    c = required(db, Course, r.course_id)
    if not c.published:
        raise HTTPException(404, "Khóa học chưa xuất bản.")
    if c.level != "basic" and not db.query(Enrollment).filter_by(course_id=r.course_id, user_id=u.id).first():
        raise HTTPException(402, "Bạn cần mua khóa học trước khi tham gia lớp này.")
    if not db.query(Member).filter_by(class_id=r.id, user_id=u.id).first():
        db.add(Member(class_id=r.id, user_id=u.id))
    if not db.query(Enrollment).filter_by(course_id=r.course_id, user_id=u.id).first():
        db.add(Enrollment(course_id=r.course_id, user_id=u.id))
    db.commit()
    return serialize(r)


@app.post("/api/classes")
def create_room(data: RoomIn, u=Depends(staff), db=Depends(get_db)):
    own_course(db, u, data.course_id)
    r = Classroom(
        **data.model_dump(), owner_id=u.id, join_code=secrets.token_hex(4).upper()
    )
    db.add(r)
    db.commit()
    return serialize(r)


@app.post("/api/classes/{rid}/sessions")
def create_session(rid: int, data: SessionIn, u=Depends(staff), db=Depends(get_db)):
    r = own_room(db, u, rid)
    for eid in data.exercise_ids:
        if required(db, Exercise, eid).course_id != r.course_id:
            raise HTTPException(400, "Bài tập phải thuộc khóa học của lớp.")
    s = ClassSession(class_id=rid, **data.model_dump())
    db.add(s)
    db.flush()
    for m in db.query(Member).filter_by(class_id=rid):
        db.add(
            Notification(
                user_id=m.user_id, body=f"Bài mới trong lớp {r.name}: {s.title}"
            )
        )
    db.commit()
    return serialize(s)


class SessionPatch(BaseModel):
    status: Literal["open", "closed"]


@app.patch("/api/classes/{rid}/sessions/{sid}")
def patch_session(
    rid: int, sid: int, data: SessionPatch, u=Depends(staff), db=Depends(get_db)
):
    own_room(db, u, rid)
    s = required(db, ClassSession, sid)
    if s.class_id != rid:
        raise HTTPException(404)
    s.status = data.status
    db.commit()
    return serialize(s)


def class_report(db, u, rid):
    room = own_room(db, u, rid)
    rows = []
    for m in db.query(Member).filter_by(class_id=rid):
        learner = required(db, User, m.user_id)
        ids = [e.id for e in db.query(Exercise).filter_by(course_id=room.course_id)]
        subs = (
            db.query(Submission)
            .filter(Submission.user_id == m.user_id, Submission.exercise_id.in_(ids))
            .order_by(Submission.created_at.desc())
            .all()
        )
        solved = len({s.exercise_id for s in subs if s.status == "AC"})
        rows.append(
            {
                "id": learner.id,
                "name": learner.name,
                "solved": solved,
                "total": len(ids),
                "attempts": len(subs),
                "last_status": subs[0].status if subs else "Chưa nộp",
                "group": (
                    "Đạt tốt"
                    if solved >= len(ids) * 0.8
                    else "Đạt" if solved >= len(ids) * 0.5 else "Cần hỗ trợ"
                ),
                "submissions": [
                    {
                        **serialize(s, ("code", "results")),
                        "exercise_title": required(db, Exercise, s.exercise_id).title,
                    }
                    for s in subs[:15]
                ],
            }
        )
    return {
        "classroom": serialize(room),
        "students": rows,
        "summary": f'{len(rows)} học viên; {sum(r["attempts"]>0 for r in rows)} đã nộp bài. {sum(r["group"]=="Cần hỗ trợ" for r in rows)} học viên chưa đạt 50% bài tập.',
        "summary_provider": "rule-based",
    }


@app.get("/api/classes/{rid}/report")
def get_report(rid: int, u=Depends(staff), db=Depends(get_db)):
    return class_report(db, u, rid)


@app.websocket("/api/classes/{rid}/live")
async def live(ws: WebSocket, rid: int):
    import jwt

    if (
        ws.headers.get("origin") not in config.CORS
        and ws.headers.get("origin")
        != f'{"https" if ws.url.scheme=="wss" else "http"}://{ws.headers.get("host")}'
    ):
        await ws.close(code=1008)
        return
    try:
        claims = jwt.decode(ws.cookies.get("sc_session"), config.JWT_SECRET, algorithms=["HS256"])
        uid = int(claims["sub"])
        with Session() as db:
            u = required(db, User, uid)
            if not u.active or u.role not in ["teacher", "admin"] or claims.get("pwd") != hashlib.sha256(u.password_hash.encode()).hexdigest()[:16]:
                raise ValueError()
            own_room(db, u, rid)
    except Exception:
        await ws.close(code=1008)
        return
    await ws.accept()
    try:
        while True:
            with Session() as db:
                u = db.get(User, uid)
                if not u or not u.active or u.role not in ["teacher", "admin"] or claims.get("pwd") != hashlib.sha256(u.password_hash.encode()).hexdigest()[:16] or claims.get("exp", 0) <= time.time():
                    await ws.close(code=1008)
                    return
                payload = class_report(db, u, rid)
                from fastapi.encoders import jsonable_encoder

                await ws.send_json(jsonable_encoder(payload))
            await asyncio.sleep(3)
    except (WebSocketDisconnect, RuntimeError, HTTPException):
        try:
            await ws.close(code=1008)
        except RuntimeError:
            pass


@app.get("/api/manage/courses")
def manage_courses(u=Depends(staff), db=Depends(get_db)):
    q = db.query(Course)
    if u.role != "admin":
        q = q.filter_by(owner_id=u.id)
    return [enrich_course(db, c, u) for c in q]


@app.post("/api/manage/courses")
def create_course(data: CourseIn, u=Depends(staff), db=Depends(get_db)):
    c = Course(owner_id=u.id, **data.model_dump())
    db.add(c)
    db.commit()
    return serialize(c)


@app.put("/api/manage/courses/{cid}")
def edit_course(cid: int, data: CourseIn, u=Depends(staff), db=Depends(get_db)):
    c = own_course(db, u, cid)
    for k, v in data.model_dump().items():
        setattr(c, k, v)
    db.commit()
    return serialize(c)


@app.get("/api/manage/lessons")
def manage_lessons(u=Depends(staff), db=Depends(get_db)):
    q = db.query(Lesson).join(Course, Lesson.course_id == Course.id)
    if u.role != "admin":
        q = q.filter(Course.owner_id == u.id)
    return [serialize(l) for l in q.order_by(Lesson.course_id, Lesson.position)]


def validate_media_url(v):
    if v and not (v.startswith("https://") or re_match_media(v)):
        raise HTTPException(
            400, "Video/phụ đề phải là URL HTTPS hoặc tệp tải lên trong hệ thống."
        )


def validate_owned_media(db, u, v):
    validate_media_url(v)
    if re_match_media(v):
        m = required(db, Media, int(v.rsplit("/", 1)[1]))
        if u.role != "admin" and m.owner_id != u.id:
            raise HTTPException(403, "Tệp không thuộc quyền quản lý của bạn.")


def re_match_media(v):
    import re

    return re.fullmatch(r"/api/media/\d+", v)


@app.post("/api/manage/lessons")
def create_lesson(data: LessonIn, u=Depends(staff), db=Depends(get_db)):
    own_course(db, u, data.course_id)
    validate_owned_media(db, u, data.video_url)
    validate_owned_media(db, u, data.captions_url)
    l = Lesson(**data.model_dump())
    db.add(l)
    db.commit()
    return serialize(l)


@app.put("/api/manage/lessons/{lid}")
def edit_lesson(lid: int, data: LessonIn, u=Depends(staff), db=Depends(get_db)):
    l = required(db, Lesson, lid)
    own_course(db, u, l.course_id)
    own_course(db, u, data.course_id)
    validate_owned_media(db, u, data.video_url)
    validate_owned_media(db, u, data.captions_url)
    if data.course_id != l.course_id:
        raise HTTPException(400, "Không chuyển bài học sang khóa khác.")
    for k, v in data.model_dump().items():
        setattr(l, k, v)
    db.commit()
    return serialize(l)


@app.get("/api/manage/exercises")
def manage_exercises(u=Depends(staff), db=Depends(get_db)):
    q = db.query(Exercise).join(Course, Exercise.course_id == Course.id)
    if u.role != "admin":
        q = q.filter(Course.owner_id == u.id)
    return [serialize(e) for e in q]


def validate_ex(db, u, data):
    own_course(db, u, data.course_id)
    if required(db, Lesson, data.lesson_id).course_id != data.course_id:
        raise HTTPException(400, "Bài học không thuộc khóa học.")
    if not 1 <= len(data.tests) <= 20 or not data.hints:
        raise HTTPException(400, "Cần từ 1 đến 20 test và ít nhất một gợi ý.")
    for t in data.tests:
        if (
            not isinstance(t.get("input"), str)
            or not isinstance(t.get("output"), str)
            or len(t["input"]) + len(t["output"]) > 20000
        ):
            raise HTTPException(400, "Test không hợp lệ.")


@app.post("/api/manage/exercises")
def create_ex(data: ExerciseIn, u=Depends(staff), db=Depends(get_db)):
    validate_ex(db, u, data)
    e = Exercise(**data.model_dump())
    db.add(e)
    db.commit()
    return serialize(e)


@app.put("/api/manage/exercises/{eid}")
def edit_ex(eid: int, data: ExerciseIn, u=Depends(staff), db=Depends(get_db)):
    e = required(db, Exercise, eid)
    own_course(db, u, e.course_id)
    validate_ex(db, u, data)
    for k, v in data.model_dump().items():
        setattr(e, k, v)
    db.commit()
    return serialize(e)


@app.post("/api/manage/media")
async def upload(bg: BackgroundTasks, file: UploadFile = File(...), u=Depends(staff), db=Depends(get_db)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in [".mp4", ".webm", ".vtt"]:
        raise HTTPException(400, "Chỉ hỗ trợ MP4, WebM và VTT.")
    stored = secrets.token_hex(20) + ext
    p = config.UPLOADS / stored
    size = 0
    try:
        with p.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > 500 * 1024 * 1024:
                    raise HTTPException(413, "Tệp tối đa 500 MB.")
                out.write(chunk)
    except Exception:
        p.unlink(missing_ok=True)
        raise
    m = Media(
        owner_id=u.id,
        name=Path(file.filename).name[:200],
        stored_name=stored,
        kind="captions" if ext == ".vtt" else "video",
        size=size,
    )
    db.add(m)
    db.flush()
    db.add(MediaProcessing(media_id=m.id, status="processing", progress=0))
    db.commit()
    from .extensions import process_media
    bg.add_task(process_media, m.id)
    return {**serialize(m, ("stored_name",)), "url": f"/api/media/{m.id}"}


@app.get("/api/manage/media")
def media_list(u=Depends(staff), db=Depends(get_db)):
    q = db.query(Media)
    if u.role != "admin":
        q = q.filter_by(owner_id=u.id)
    return [{**serialize(m, ("stored_name",)), "url": f"/api/media/{m.id}"} for m in q]


@app.get("/api/media/{mid}")
def media(mid: int, u=Depends(current), db=Depends(get_db)):
    m = required(db, Media, mid)
    if m.owner_id != u.id and u.role != "admin":
        url = f"/api/media/{mid}"
        lessons = (
            db.query(Lesson)
            .filter((Lesson.video_url == url) | (Lesson.captions_url == url))
            .all()
        )
        ok = False
        for l in lessons:
            if (
                db.query(Enrollment)
                .filter_by(user_id=u.id, course_id=l.course_id)
                .first()
            ):
                ok = True
        if not ok:
            raise HTTPException(403)
    mime = {".mp4": "video/mp4", ".webm": "video/webm", ".vtt": "text/vtt"}[
        Path(m.stored_name).suffix
    ]
    path = config.UPLOADS / m.stored_name
    if not path.is_file():
        raise HTTPException(404, "Không tìm thấy tệp.")
    return FileResponse(path, media_type=mime)


@app.get("/api/admin/{section}")
def admin_list(section: str, u=Depends(admin), db=Depends(get_db)):
    if section == "users":
        return [public_user(x) for x in db.query(User)]
    if section == "payments":
        return [
            serialize(x) for x in db.query(Payment).order_by(Payment.created_at.desc())
        ]
    if section == "reports":
        return [
            serialize(x) for x in db.query(Report).order_by(Report.created_at.desc())
        ]
    if section == "overview":
        return {
            "users": db.query(User).count(),
            "courses": db.query(Course).count(),
            "submissions": db.query(Submission).count(),
            "reports": db.query(Report).filter_by(status="pending").count(),
        }
    raise HTTPException(404)


@app.patch("/api/admin/users/{uid}")
def admin_user(uid: int, data: UserPatch, u=Depends(admin), db=Depends(get_db)):
    v = required(db, User, uid)
    if v.id == u.id and (not data.active or data.role != "admin"):
        raise HTTPException(400, "Không tự khóa hoặc hạ quyền tài khoản đang dùng.")
    v.role = data.role
    v.active = data.active
    db.commit()
    return public_user(v)


@app.post("/api/admin/reports/{rid}/resolve")
def resolve(rid: int, u=Depends(admin), db=Depends(get_db)):
    r = required(db, Report, rid)
    r.status = "resolved"
    db.add(Notification(user_id=r.user_id, body="Phản ánh của bạn đã được xử lý."))
    db.commit()
    return serialize(r)


from .extensions import router as extension_router
app.include_router(extension_router)
from .payments import router as payment_router
app.include_router(payment_router)


# Optional same-origin production serving after `npm run build`.
DIST = config.ROOT.parent / "frontend" / "dist"
if DIST.exists():

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        target = (DIST / path).resolve()
        if target.is_relative_to(DIST.resolve()) and target.is_file():
            return FileResponse(target)
        return FileResponse(DIST / "index.html")
