import io, base64
import pytest
from app.db import Session
from app.models import (
    User,
    Lesson,
    Exercise,
    Progress,
    Submission,
    Payment,
    ClassSession,
)
from app.security import hash_password
from app import main, services
from conftest import login


def test_seed_and_public_payload(client):
    courses = client.get("/api/courses").json()
    assert len(courses) == 3
    assert sum(c["exercises_count"] for c in courses) == 60
    assert sum(c["lessons_count"] for c in courses) == 30
    detail = client.get("/api/courses/1").json()
    assert "content" not in detail["lessons"][0]  # Paid teaching material isn't public.
    assert client.get("/api/lessons/1").status_code == 401
    assert client.get("/api/exercises/1").status_code == 401


def test_auth_and_roles(learner):
    me = learner.get("/api/auth/me").json()
    assert me["role"] == "learner" and "password_hash" not in me
    assert learner.cookies.get("sc_session")
    assert learner.get("/api/manage/courses").status_code == 403
    assert learner.get("/api/admin/users").status_code == 403
    assert learner.post("/api/auth/logout").status_code == 200
    assert learner.get("/api/auth/me").status_code == 401
    r = learner.post(
        "/api/auth/register",
        json={
            "name": "Bạn mới",
            "email": "new@example.com",
            "password": "Password@123",
            "role": "admin",
        },
    )
    assert r.status_code == 200 and r.json()["role"] == "learner"
    assert (
        learner.post(
            "/api/auth/register",
            json={
                "name": "Tên mới",
                "email": "new@example.com",
                "password": "Password@123",
            },
        ).status_code
        == 409
    )
    assert (
        learner.post(
            "/api/auth/password",
            json={"old_password": "wrong", "new_password": "newPassword@123"},
        ).status_code
        == 400
    )
    assert (
        learner.post(
            "/api/auth/password",
            json={"old_password": "Password@123", "new_password": "newPassword@123"},
        ).status_code
        == 200
    )


def test_course_enrollment_and_payment_ownership(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Bạn mới",
            "email": "paid@example.com",
            "password": "Password@123",
        },
    )
    assert client.get("/api/lessons/1").status_code == 403
    assert client.post("/api/courses/1/enroll").status_code == 402
    assert client.post("/api/courses/2/enroll").status_code == 200
    assert client.get("/api/lessons/11").status_code == 200
    pay = client.post("/api/payments", json={"course_id": 1}).json()
    original_cookie = client.cookies.get("sc_session")
    login(client, "learner")
    assert client.post(f'/api/payments/{pay["id"]}/confirm-demo').status_code == 403
    client.cookies.clear()
    client.cookies.set("sc_session", original_cookie)
    for _ in range(2):
        r = client.post(f'/api/payments/{pay["id"]}/confirm-demo')
        assert r.status_code == 200 and r.json()["charged"] is False
    assert client.get("/api/lessons/1").status_code == 200


def test_lesson_quiz_notes_and_draft(learner):
    data = learner.get("/api/lessons/1").json()
    assert all("answer" not in q and "explanation" not in q for q in data["quiz"])
    r = learner.post("/api/lessons/1/quiz", json={"answers": [0, 1]})
    assert r.json()["score"] == 100
    learner.post("/api/lessons/1/quiz", json={"answers": [2, 2]})
    assert learner.get("/api/lessons/1").json()["progress"]["quiz_score"] == 100
    learner.put("/api/lessons/1/progress", json={"read": True, "position": 15})
    learner.put("/api/lessons/1/progress", json={"read": False, "position": 20})
    progress = learner.get("/api/lessons/1").json()["progress"]
    assert progress["read"] and progress["first_read_at"] and progress["position"] == 20
    n = learner.post(
        "/api/lessons/1/notes", json={"body": "Dùng print", "position": 12}
    ).json()
    login(learner, "teacher")
    assert learner.delete("/api/notes/" + str(n["id"])).status_code == 403
    login(learner, "learner")
    assert learner.delete("/api/notes/" + str(n["id"])).status_code == 200
    assert (
        learner.put(
            "/api/exercises/1/draft", json={"code": "hello", "active_seconds": 30}
        ).status_code
        == 200
    )
    assert learner.get("/api/exercises/1").json()["draft"] == "hello"


def test_runner_missing_does_not_fabricate_results(learner):
    r = learner.post("/api/exercises/1/submit", json={"code": "print(5)"})
    assert r.status_code == 503
    assert learner.get("/api/submissions").json() == []
    assert learner.get("/api/exercises/1").json()["draft"] == "print(5)"
    assert learner.get("/api/analytics").json()["xp"] == 0


def test_submissions_analytics_and_xp(learner, monkeypatch):
    async def fake_judge(code, language, tests, *args):
        return [
            {
                "passed": True,
                "status": "AC",
                "hidden": t.get("hidden", False),
                "stdout": None,
                "stderr": "",
                "time": "0.1",
                "memory": 1000,
            }
            for t in tests
        ]

    monkeypatch.setattr(main, "judge", fake_judge)
    learner.put("/api/lessons/1/progress", json={"read": True})
    for eid in [1, 1, 2]:
        assert (
            learner.post(
                f"/api/exercises/{eid}/submit",
                json={"code": "fake-adapter-test", "active_seconds": 90},
            ).status_code
            == 200
        )
    analytics = learner.get("/api/analytics?period=30&course_id=1").json()
    assert analytics["submissions"] == 3 and analytics["accepted"] == 3
    assert (
        analytics["xp"] == 40 and analytics["solved"] == 2
    )  # Repeated AC never farms XP.
    assert analytics["days"][-1]["count"] == 3 and len(analytics["days"]) == 30
    assert analytics["pace"]["minutes"] == 1.5 and analytics["pace"]["sample"] == 2
    assert analytics["style"]["theory_first"] == 2
    assert sum(w["xp"] for w in analytics["weekly"]) == 40
    assert learner.get("/api/analytics?period=999").status_code == 422
    assert (
        learner.get("/api/analytics/export?period=7")
        .headers["content-type"]
        .startswith("text/csv")
    )
    learner.post("/api/lessons/1/quiz", json={"answers": [0, 1]})
    assert learner.get("/api/courses/1/roadmap").json()[0]["completed"] is True


def test_teacher_ownership_and_hint_switch(learner):
    login(learner, "teacher")
    classes = learner.get("/api/classes").json()
    room = classes[0]
    r = learner.post(
        f'/api/classes/{room["id"]}/sessions',
        json={"title": "Bài tự giải", "exercise_ids": [1], "allow_hints": False},
    )
    assert r.status_code == 200
    sid = r.json()["id"]
    login(learner, "learner")
    assert learner.get("/api/exercises/1").json()["hints_allowed"] is False
    assert (
        learner.post("/api/exercises/1/hint", json={"code": "", "level": 1}).status_code
        == 403
    )
    assert learner.get("/api/classes/1/report").status_code == 403
    login(learner, "teacher")
    assert (
        learner.patch(
            f"/api/classes/1/sessions/{sid}", json={"status": "closed"}
        ).status_code
        == 200
    )
    login(learner, "learner")
    assert (
        learner.post("/api/exercises/1/hint", json={"code": "", "level": 1}).json()[
            "provider"
        ]
        == "rule-based"
    )
    with Session() as db:
        u = User(
            name="Other teacher",
            email="other@example.com",
            password_hash=hash_password("Password@123"),
            role="teacher",
        )
        db.add(u)
        db.commit()
    learner.post(
        "/api/auth/login",
        json={"email": "other@example.com", "password": "Password@123"},
    )
    assert learner.get("/api/manage/courses").json() == []
    assert learner.get("/api/classes/1/report").status_code == 403
    assert (
        learner.put(
            "/api/manage/courses/1",
            json={"title": "Steal", "language": "java", "description": "", "price": 0},
        ).status_code
        == 403
    )


def test_manage_content_and_video_permissions(client):
    login(client, "teacher")
    course = client.post(
        "/api/manage/courses",
        json={
            "title": "Test course",
            "language": "python",
            "description": "intro",
            "price": 0,
        },
    ).json()
    body = {
        "course_id": course["id"],
        "title": "Lesson one",
        "content": "Hi",
        "position": 1,
        "quiz": [
            {"question": "2+3?", "options": ["4", "5"], "answer": 1, "explanation": "5"}
        ],
    }
    r = client.post("/api/manage/lessons", json=body)
    assert r.status_code == 200
    lesson = r.json()
    media = client.post(
        "/api/manage/media",
        files={
            "file": (
                "captions.vtt",
                b"WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHi\n",
                "text/vtt",
            )
        },
    ).json()
    assert (
        client.put(
            "/api/manage/lessons/" + str(lesson["id"]),
            json={**body, "captions_url": media["url"]},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/manage/media", files={"file": ("x.html", b"<html>", "text/html")}
        ).status_code
        == 400
    )
    invalid = {
        **body,
        "quiz": [{"question": "Question", "options": ["a", "b"], "answer": 5}],
    }
    assert client.post("/api/manage/lessons", json=invalid).status_code == 422
    login(client, "learner")
    assert client.get(media["url"]).status_code == 403
    client.post(f'/api/courses/{course["id"]}/enroll')
    assert client.get(media["url"]).status_code == 200
    assert client.get("/api/lessons/" + str(lesson["id"])).json()["quiz"][0][
        "options"
    ] == ["4", "5"]


def test_bundled_video_and_captions(learner):
    for lid in [1, 11, 21]:
        lesson = learner.get("/api/lessons/" + str(lid)).json()
        assert lesson["video_url"] and lesson["captions_url"]
        r = learner.get(lesson["video_url"], headers={"Range": "bytes=0-99"})
        assert r.status_code == 206 and len(r.content) == 100
        assert "ftyp" in r.content.decode(errors="ignore")
        assert learner.get(lesson["captions_url"]).text.startswith("WEBVTT")


def test_class_join_and_websocket(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "New join",
            "email": "join@example.com",
            "password": "Password@123",
        },
    )
    assert client.post("/api/classes/join/WRONG").status_code == 404
    assert client.post("/api/classes/join/SCJAVA").status_code == 200
    assert client.get("/api/lessons/1").status_code == 200
    login(client, "teacher")
    with client.websocket_connect(
        "/api/classes/1/live", headers={"origin": "http://testserver"}
    ) as ws:
        payload = ws.receive_json()
        assert len(payload["students"]) == 2
    assert (
        client.get("/api/classes/1/report").json()["summary_provider"] == "rule-based"
    )


def test_admin_actions_and_disabled_account(learner):
    report = learner.post(
        "/api/reports", json={"body": "Video chưa rõ", "exercise_id": 1}
    ).json()
    login(learner, "admin")
    assert learner.post(f'/api/admin/reports/{report["id"]}/resolve').status_code == 200
    assert (
        learner.patch(
            "/api/admin/users/3", json={"role": "learner", "active": False}
        ).status_code
        == 400
    )
    assert (
        learner.patch(
            "/api/admin/users/1", json={"role": "learner", "active": False}
        ).status_code
        == 200
    )
    assert (
        learner.post(
            "/api/auth/login",
            json={"email": "learner@smartcode.local", "password": "SmartCode@123"},
        ).status_code
        == 401
    )


def test_security_validation_and_hidden_tests(learner):
    ex = learner.get("/api/exercises/1").json()
    assert (
        "tests" not in ex
        and len(ex["samples"]) == 1
        and all(not t["hidden"] for t in ex["samples"])
    )
    assert (
        learner.post(
            "/api/auth/logout", headers={"origin": "https://bad.example"}
        ).status_code
        == 403
    )
    assert (
        learner.post("/api/exercises/1/run", json={"code": "x" * 30001}).status_code
        == 422
    )
    assert (
        learner.post("/api/emotions", json={"state": "negative"}).json()["source"]
        == "self-report"
    )
    assert (
        learner.post("/api/emotions", json={"failures": 3}).json()["source"]
        == "heuristic"
    )
    assert (
        learner.post(
            "/api/courses/1/placement", json={"answers": [0, 1, 1, 2, 1, 1, 2, 0, 2, 0]}
        ).status_code
        == 200
    )
    with Session() as db:
        qs = [l.quiz[0]["question"] for l in db.query(Lesson).filter_by(course_id=1)]
        assert len(set(qs)) == 10


def test_judge0_adapter_and_hidden_output(monkeypatch):
    import asyncio, httpx

    records = []

    def handler(request):
        records.append(request)
        if request.method == "POST":
            return httpx.Response(201, json={"token": "test-token"})
        return httpx.Response(
            200,
            json={
                "status": {"id": 3},
                "stdout": base64.b64encode(b"5\n").decode(),
                "stderr": base64.b64encode(b"private input").decode(),
                "time": "0.01",
                "memory": 1024,
            },
        )

    real_client = httpx.AsyncClient
    monkeypatch.setenv("JUDGE0_URL", "https://judge0.test")
    monkeypatch.setattr(
        services.httpx,
        "AsyncClient",
        lambda **kwargs: real_client(transport=httpx.MockTransport(handler), **kwargs),
    )
    tests = [
        {"input": "2 3", "output": "5", "hidden": False},
        {"input": "secret", "output": "5", "hidden": True},
    ]
    results = asyncio.run(services.judge("print(5)", "python", tests))
    assert all(r["status"] == "AC" for r in results)
    assert results[1]["stdout"] is None and results[1]["stderr"] == ""
    assert results[0]["stdout"] == "5\n"
    assert "wait=false" in str(records[0].url)
    import json

    body = json.loads(records[0].content)
    assert body["enable_network"] is False and body["cpu_time_limit"] == 2
    assert base64.b64decode(body["source_code"]) == b"print(5)"


def test_local_ollama_status_endpoint(learner):
    response = learner.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "ollama"
    assert data["configured"] is False
    assert data["available"] is False
    assert "message" in data
