from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    JSON,
    UniqueConstraint,
    Float,
)
from .db import Base


def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(190), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(String(20), default="learner")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now)


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True)
    title = Column(String(200))
    language = Column(String(20))
    description = Column(Text)
    price = Column(Integer, default=0)
    level = Column(String(20), nullable=False, default="basic")
    published = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    color = Column(String(20), default="violet")


class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), index=True)
    title = Column(String(200))
    content = Column(Text)
    code = Column(Text)
    position = Column(Integer)
    skill = Column(String(80))
    video_url = Column(Text, default="")
    captions_url = Column(Text, default="")
    quiz = Column(JSON, default=list)


class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    title = Column(String(200))
    description = Column(Text)
    difficulty = Column(String(20), default="easy")
    skill = Column(String(80))
    starter = Column(Text)
    tests = Column(JSON)
    hints = Column(JSON)
    time_limit = Column(Float, default=2)
    memory_limit = Column(Integer, default=131072)


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("user_id", "course_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    created_at = Column(DateTime, default=now)


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    position = Column(Float, default=0)
    quiz_score = Column(Integer, default=0)
    read = Column(Boolean, default=False)
    first_read_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=now, onupdate=now)


class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    position = Column(Float, default=0)
    body = Column(Text)
    created_at = Column(DateTime, default=now)


class Draft(Base):
    __tablename__ = "drafts"
    __table_args__ = (UniqueConstraint("user_id", "exercise_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    code = Column(Text)
    active_seconds = Column(Integer, default=0)
    updated_at = Column(DateTime, default=now, onupdate=now)


class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    code = Column(Text)
    status = Column(String(30))
    passed = Column(Integer, default=0)
    total = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    work_seconds = Column(Integer, default=0)
    results = Column(JSON)
    created_at = Column(DateTime, default=now)


class Hint(Base):
    __tablename__ = "hints"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    level = Column(Integer)
    created_at = Column(DateTime, default=now)


class Emotion(Base):
    __tablename__ = "emotions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    state = Column(String(20))
    source = Column(String(20))
    scores = Column(JSON)
    created_at = Column(DateTime, default=now)


class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True)
    name = Column(String(200))
    course_id = Column(Integer, ForeignKey("courses.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))
    join_code = Column(String(20), unique=True)


class Member(Base):
    __tablename__ = "members"
    __table_args__ = (UniqueConstraint("class_id", "user_id"),)
    id = Column(Integer, primary_key=True)
    class_id = Column(Integer, ForeignKey("classrooms.id"))
    user_id = Column(Integer, ForeignKey("users.id"))


class ClassSession(Base):
    __tablename__ = "class_sessions"
    id = Column(Integer, primary_key=True)
    class_id = Column(Integer, ForeignKey("classrooms.id"))
    title = Column(String(200))
    due_at = Column(String(40))
    exercise_ids = Column(JSON)
    status = Column(String(20), default="open")
    allow_hints = Column(Boolean, default=True)


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    amount = Column(Integer)
    status = Column(String(20), default="pending")
    provider = Column(String(20), default="demo")
    created_at = Column(DateTime, default=now)


class PurchaseOrder(Base):
    """Real checkout orders; legacy demo payments stay in their original table."""
    __tablename__ = "purchase_orders"
    __table_args__ = (
        UniqueConstraint("user_id", "idempotency_key"),
        UniqueConstraint("provider", "transaction_id"),
    )
    id = Column(Integer, primary_key=True)
    code = Column(String(40), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    course_title = Column(String(200), nullable=False)
    amount = Column(Integer, nullable=False)
    provider = Column(String(20), nullable=False)
    environment = Column(String(20), nullable=False)
    merchant_id = Column(String(80), default="")
    provider_order_id = Column(String(64), unique=True, nullable=False)
    idempotency_key = Column(String(64), nullable=False)
    active_key = Column(String(80), unique=True, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    pay_url = Column(Text, default="")
    bank_account = Column(String(19), default="")
    bank_name = Column(String(100), default="")
    transfer_note = Column(String(40), default="")
    customer_note = Column(String(500), default="")
    review_note = Column(String(500), default="")
    transaction_id = Column(String(100), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_checked_at = Column(DateTime, nullable=True)


class BankSettings(Base):
    __tablename__ = "bank_settings"
    id = Column(Integer, primary_key=True)
    account_number = Column(String(19), default="")
    account_name = Column(String(100), default="")
    enabled = Column(Boolean, default=False)


class PaymentAudit(Base):
    __tablename__ = "payment_audits"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(40), nullable=False)
    detail = Column(String(600), default="")
    created_at = Column(DateTime, default=now)


class AppMigration(Base):
    __tablename__ = "app_migrations"
    name = Column(String(100), primary_key=True)
    applied_at = Column(DateTime, default=now)


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=True)
    body = Column(Text)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=now)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    body = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)


class Placement(Base):
    __tablename__ = "placements"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    scores = Column(JSON)
    created_at = Column(DateTime, default=now)


class Media(Base):
    __tablename__ = "media"
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(200))
    stored_name = Column(String(100))
    kind = Column(String(20))
    size = Column(Integer)
    created_at = Column(DateTime, default=now)


class PasswordReset(Base):
    __tablename__ = 'password_resets'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    token_hash = Column(String(64), unique=True)
    expires_at = Column(DateTime)
    used = Column(Boolean, default=False)


class LearnerSurvey(Base):
    __tablename__ = 'learner_surveys'
    __table_args__ = (UniqueConstraint('user_id', 'course_id'),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    course_id = Column(Integer, ForeignKey('courses.id'))
    answers = Column(JSON)
    updated_at = Column(DateTime, default=now, onupdate=now)


class AssessmentAttempt(Base):
    __tablename__ = 'assessment_attempts'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    course_id = Column(Integer, ForeignKey('courses.id'))
    exercise_ids = Column(JSON)
    started_at = Column(DateTime, default=now)
    expires_at = Column(DateTime)
    finished_at = Column(DateTime, nullable=True)
    drafts = Column(JSON, default=dict)


class SubmissionContext(Base):
    __tablename__ = 'submission_contexts'
    submission_id = Column(Integer, ForeignKey('submissions.id'), primary_key=True)
    assessment_id = Column(Integer, ForeignKey('assessment_attempts.id'), nullable=True, index=True)
    session_id = Column(Integer, ForeignKey('class_sessions.id'), nullable=True, index=True)


class SessionDetails(Base):
    __tablename__ = 'session_details'
    session_id = Column(Integer, ForeignKey('class_sessions.id'), primary_key=True)
    groups = Column(JSON, default=dict)
    topic = Column(String(100), default='')
    teaching_date = Column(String(40), default='')
    summary_note = Column(Text, default='')


class StudentComment(Base):
    __tablename__ = 'student_comments'
    __table_args__ = (UniqueConstraint('class_id', 'user_id'),)
    id = Column(Integer, primary_key=True)
    class_id = Column(Integer, ForeignKey('classrooms.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    teacher_id = Column(Integer, ForeignKey('users.id'))
    body = Column(Text)
    updated_at = Column(DateTime, default=now, onupdate=now)


class EmotionPreference(Base):
    __tablename__ = 'emotion_preferences'
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    enabled = Column(Boolean, default=True)


class EmotionNote(Base):
    __tablename__ = 'emotion_notes'
    emotion_id = Column(Integer, ForeignKey('emotions.id'), primary_key=True)
    body = Column(Text, default='')


class MediaProcessing(Base):
    __tablename__ = 'media_processing'
    media_id = Column(Integer, ForeignKey('media.id'), primary_key=True)
    status = Column(String(20), default='processing')
    progress = Column(Integer, default=0)
    duration = Column(Float, nullable=True)
    error = Column(Text, default='')


class LessonExtras(Base):
    __tablename__ = 'lesson_extras'
    lesson_id = Column(Integer, ForeignKey('lessons.id'), primary_key=True)
    thumbnail_url = Column(Text, default='')
    resources = Column(JSON, default=list)

class LessonDraft(Base):
    __tablename__ = 'lesson_drafts'
    __table_args__ = (UniqueConstraint('user_id', 'draft_key'),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    draft_key = Column(String(80))
    course_id = Column(Integer, ForeignKey('courses.id'))
    payload = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=now)
