import binascii
import hashlib
import hmac
import json
import uuid
from datetime import timedelta

import httpx
import pytest
from sqlalchemy import create_engine, text

from app import payments
from app.bank_qr import vpbank_payload
from app.db import Session
from app.migrations import migrate
from app.models import Course, Lesson, Exercise, Enrollment, PurchaseOrder, PaymentAudit, Classroom, now
from conftest import login


def new_user(client, email="buyer@example.com"):
    result = client.post("/api/auth/register", json={"name": "Người học mới", "email": email, "password": "Password@123"})
    assert result.status_code == 200
    return result.json()["id"]


@pytest.fixture
def paid_course(client, monkeypatch):
    # Synthetic receiver is confined to the isolated test DB, never shipped in settings.
    for key, value in {
        "VPBANK_ACCOUNT_NUMBER": "000000000001", "VPBANK_ACCOUNT_NAME": "TEST ONLY",
        "PAYMENT_MODE": "sandbox", "PAYMENT_PUBLIC_URL": "https://smartcode.example.com",
        "MOMO_PARTNER_CODE": "TEST_PARTNER", "MOMO_ACCESS_KEY": "test-access", "MOMO_SECRET_KEY": "test-secret",
        "ZALOPAY_APP_ID": "999999", "ZALOPAY_KEY1": "test-key1", "ZALOPAY_KEY2": "test-key2",
    }.items():
        monkeypatch.setenv(key, value)
    with Session() as db:
        c = db.query(Course).filter_by(level="intermediate").first()
        c.published = True
        db.add(Classroom(name="Paid class", course_id=c.id, owner_id=c.owner_id, join_code="PAIDCOURSE"))
        db.commit()
        return {"id": c.id, "price": c.price,
                "lesson": db.query(Lesson).filter_by(course_id=c.id).first().id,
                "exercise": db.query(Exercise).filter_by(course_id=c.id).first().id}


def buy(client, course, provider="vpbank", key=None):
    response = client.post("/api/payments", json={"course_id": course["id"], "provider": provider, "idempotency_key": key or str(uuid.uuid4())})
    assert response.status_code == 200, response.text
    return response.json()


def approve(client, p, transaction="VPB_TEST_001"):
    return client.post(f'/api/billing/admin/orders/{p["id"]}/review', json={"action": "approve", "confirmed_in_bank": True,
                        "amount_received": p["amount"], "transaction_id": transaction})


def fake_provider(monkeypatch, calls):
    async def fake(provider, environment, path, payload):
        calls.append((provider, environment, path, payload))
        if provider == "momo":
            signed = {**payload, "accessKey": "test-access"}
            names = ("accessKey", "amount", "extraData", "ipnUrl", "orderId", "orderInfo", "partnerCode", "redirectUrl", "requestId", "requestType")
            raw = "&".join(f"{key}={signed[key]}" for key in names)
            assert payload["signature"] == hmac.new(b"test-secret", raw.encode(), hashlib.sha256).hexdigest()
            assert payload["autoCapture"] is True
            return {"partnerCode": payload["partnerCode"], "requestId": payload["requestId"], "orderId": payload["orderId"],
                    "amount": payload["amount"], "resultCode": 0, "payUrl": "https://test-payment.momo.vn/pay/test"}
        keys = ("app_id", "app_trans_id", "app_user", "amount", "app_time", "embed_data", "item")
        raw = "|".join(str(payload[k]) for k in keys)
        assert payload["mac"] == hmac.new(b"test-key1", raw.encode(), hashlib.sha256).hexdigest()
        assert len(payload["app_trans_id"]) <= 40
        assert json.loads(payload["embed_data"])["preferred_payment_method"] == ["zalopay_wallet"]
        return {"return_code": 1, "order_url": "https://qcgateway.zalopay.vn/pay/test"}
    monkeypatch.setattr(payments, "provider_post", fake)


def momo_callback(p, **changes):
    with Session() as db:
        order = db.get(PurchaseOrder, p["id"])
        data = {"partnerCode": order.merchant_id, "amount": order.amount, "extraData": payments.extra_data(order),
                "message": "Success", "orderId": order.provider_order_id, "orderInfo": payments.order_info(order),
                "orderType": "momo_wallet", "payType": "qr", "requestId": order.code, "responseTime": 1770000000000,
                "resultCode": 0, "transId": 123456789}
    data.update(changes)
    raw = "&".join(f"{k}={({'accessKey': 'test-access', **data})[k]}" for k in payments.MOMO_IPN_KEYS)
    data["signature"] = hmac.new(b"test-secret", raw.encode(), hashlib.sha256).hexdigest()
    return data


def zalo_callback(p, **changes):
    with Session() as db:
        order = db.get(PurchaseOrder, p["id"])
        data = {"app_id": int(order.merchant_id), "app_trans_id": order.provider_order_id,
                "app_user": f"sc_{order.user_id}", "amount": order.amount, "zp_trans_id": 888222333}
    data.update(changes)
    raw = json.dumps(data, separators=(",", ":"))
    return {"type": 1, "data": raw, "mac": hmac.new(b"test-key2", raw.encode(), hashlib.sha256).hexdigest()}


def test_level_policy_and_drafts(client):
    login(client, "admin")
    courses = client.get("/api/manage/courses").json()
    assert len(courses) == 5
    assert all(c["price"] == 0 for c in courses if c["level"] == "basic")
    assert all(not c["published"] for c in courses if c["level"] != "basic")
    payload = {"title": "A course", "language": "python", "description": "", "price": 1000, "level": "basic"}
    assert client.post("/api/manage/courses", json=payload).status_code == 422
    assert client.post("/api/manage/courses", json={**payload, "level": "advanced", "price": 0}).status_code == 422
    assert client.post("/api/manage/courses", json={**payload, "level": "advanced"}).status_code == 200


def test_paid_content_cannot_be_unlocked_by_enroll_join_or_demo(client, paid_course):
    new_user(client)
    assert client.post(f'/api/courses/{paid_course["id"]}/enroll').status_code == 402
    assert client.post('/api/classes/join/PAIDCOURSE').status_code == 402
    assert client.get(f'/api/lessons/{paid_course["lesson"]}').status_code == 403
    assert client.get(f'/api/exercises/{paid_course["exercise"]}').status_code == 403
    assert client.post('/api/payments/1/confirm-demo').status_code == 410
    assert client.post('/api/courses/1/enroll').status_code == 200
    assert client.post('/api/payments', json={"course_id": 1, "idempotency_key": str(uuid.uuid4())}).status_code == 400


def test_bank_flow_ownership_idempotency_and_approval(client, paid_course):
    uid = new_user(client)
    cookie = client.cookies.get("sc_session")
    key = str(uuid.uuid4())
    p = buy(client, paid_course, key=key)
    assert p["amount"] == paid_course["price"] and p["bank"]["bin"] == "970432"
    assert buy(client, paid_course, key=key)["id"] == p["id"]
    assert buy(client, paid_course)["id"] == p["id"]
    assert client.post('/api/payments', json={"course_id": paid_course["id"], "amount": 1, "idempotency_key": str(uuid.uuid4())}).status_code == 422
    qr = client.get(p["qr_url"])
    assert qr.status_code == 200 and '<svg' in qr.text and 'no-store' in qr.headers['cache-control']
    reported = client.post(f'/api/payments/{p["id"]}/report-transfer', json={"note": "Đã gửi"})
    assert reported.json()["status"] == "awaiting_review"
    assert client.get(f'/api/lessons/{paid_course["lesson"]}').status_code == 403
    assert approve(client, p).status_code == 403
    login(client, "learner")
    assert client.get(f'/api/payments/{p["id"]}').status_code == 404
    assert client.get(p["qr_url"]).status_code == 404
    assert client.post(f'/api/payments/{p["id"]}/report-transfer', json={}).status_code == 404
    login(client, "teacher")
    assert approve(client, p).status_code == 403
    login(client, "admin")
    assert client.post(f'/api/billing/admin/orders/{p["id"]}/review', json={"action": "approve", "transaction_id": "FOO", "amount_received": 1, "confirmed_in_bank": True}).status_code == 400
    for _ in range(2):
        assert approve(client, p).json()["status"] == "paid"
    assert client.post(f'/api/billing/admin/orders/{p["id"]}/review', json={"action": "reject", "note": "Không nhận tiền"}).status_code == 409
    client.cookies.clear(); client.cookies.set("sc_session", cookie)
    assert client.get(f'/api/lessons/{paid_course["lesson"]}').status_code == 200
    assert client.post('/api/classes/join/PAIDCOURSE').status_code == 200
    with Session() as db:
        assert db.query(Enrollment).filter_by(user_id=uid, course_id=paid_course["id"]).count() == 1
        assert db.query(PaymentAudit).filter_by(order_id=p["id"], action="paid:vpbank-review").count() == 1


def test_bank_configuration_snapshot_and_disabled_method(client, paid_course, monkeypatch):
    new_user(client)
    assert client.put('/api/billing/admin/settings', json={}).status_code == 403
    login(client, "admin")
    bad = {"enabled": True, "account_number": "", "account_name": ""}
    assert client.put('/api/billing/admin/settings', json=bad).status_code == 422
    login(client, "learner")
    p = buy(client, paid_course)
    login(client, "admin")
    updated = {"enabled": True, "account_number": "000000000002", "account_name": "TEST SECOND"}
    assert client.put('/api/billing/admin/settings', json=updated).status_code == 200
    assert client.get(f'/api/payments/{p["id"]}').json()["bank"]["account_number"] == "000000000001"
    assert client.put('/api/billing/admin/settings', json={**updated, "enabled": False}).status_code == 200
    new_user(client, "other@example.com")
    assert not client.get('/api/payments/options').json()["methods"][0]["available"]
    assert client.post('/api/payments', json={"course_id": paid_course["id"], "idempotency_key": str(uuid.uuid4())}).status_code == 503


def test_expired_bank_order_and_duplicate_transaction_protection(client, paid_course):
    new_user(client)
    p = buy(client, paid_course)
    with Session() as db:
        db.get(PurchaseOrder, p["id"]).expires_at = now() - timedelta(seconds=1)
        db.commit()
    assert client.get(p["qr_url"]).status_code == 409
    assert client.get(f'/api/payments/{p["id"]}').json()["status"] == "expired"
    assert client.post(f'/api/payments/{p["id"]}/report-transfer', json={}).json()["status"] == "awaiting_review"
    login(client, "admin"); assert approve(client, p).status_code == 200
    new_user(client, "secondbuyer@example.com")
    other = buy(client, paid_course)
    login(client, "admin")
    assert approve(client, other).status_code == 409
    assert client.get(f'/api/payments/{other["id"]}').json()["status"] == "pending"


def test_cancellation_rejection_never_grants_access(client, paid_course):
    uid = new_user(client)
    p = buy(client, paid_course)
    assert client.post(f'/api/payments/{p["id"]}/cancel').json()["status"] == "cancelled"
    next_order = buy(client, paid_course)
    assert next_order["id"] != p["id"]
    login(client, "admin")
    assert client.post(f'/api/billing/admin/orders/{next_order["id"]}/review', json={"action": "reject", "note": "Chưa thấy giao dịch trong tài khoản"}).json()["status"] == "rejected"
    with Session() as db:
        assert not db.query(Enrollment).filter_by(user_id=uid, course_id=paid_course["id"]).first()


@pytest.mark.parametrize('provider', ['momo', 'zalopay'])
def test_wallet_creation_verification_and_repeat_callbacks(client, paid_course, monkeypatch, provider):
    calls = []; fake_provider(monkeypatch, calls)
    uid = new_user(client)
    p = buy(client, paid_course, provider)
    assert p["status"] == "pending" and p["environment"] == "sandbox" and p["pay_url"].startswith("https://")
    endpoint = '/api/payments/momo/ipn' if provider == 'momo' else '/api/payments/zalopay/callback'
    factory = momo_callback if provider == 'momo' else zalo_callback
    assert client.get(f'/api/payments/return/{p["id"]}?resultCode=0&status=1', follow_redirects=False).status_code == 303
    assert client.get(f'/api/lessons/{paid_course["lesson"]}').status_code == 403
    forged = factory(p)
    forged['signature' if provider == 'momo' else 'mac'] = '0' * 64
    result = client.post(endpoint, json=forged)
    assert result.status_code == 401 if provider == 'momo' else result.json()['return_code'] == 2
    result = client.post(endpoint, json=factory(p, amount=1))
    assert result.status_code == 400 if provider == 'momo' else result.json()['return_code'] == 2
    assert client.get(f'/api/lessons/{paid_course["lesson"]}').status_code == 403
    for _ in range(2):
        result = client.post(endpoint, json=factory(p))
        assert result.status_code == 204 if provider == 'momo' else result.json()['return_code'] == 1
    assert client.get(f'/api/lessons/{paid_course["lesson"]}').status_code == 200
    if provider == 'momo':
        assert client.post(endpoint, json=factory(p, resultCode=1006)).status_code == 204
    assert client.get(f'/api/payments/{p["id"]}').json()['status'] == 'paid'
    with Session() as db:
        assert db.query(Enrollment).filter_by(user_id=uid, course_id=paid_course["id"]).count() == 1
        assert db.query(PaymentAudit).filter(PaymentAudit.order_id == p['id'], PaymentAudit.action.like('paid:%')).count() == 1


def test_momo_wrong_request_merchant_and_authorization_only(client, paid_course, monkeypatch):
    fake_provider(monkeypatch, [])
    new_user(client); p = buy(client, paid_course, 'momo')
    for changes in ({'requestId': 'other'}, {'partnerCode': 'other'}, {'orderInfo': 'other'}, {'extraData': ''}, {'amount': True}):
        assert client.post('/api/payments/momo/ipn', json=momo_callback(p, **changes)).status_code == 400
    assert client.post('/api/payments/momo/ipn', json=momo_callback(p, resultCode=9000)).status_code == 204
    assert client.get(f'/api/lessons/{paid_course["lesson"]}').status_code == 403
    assert client.post('/api/payments/momo/ipn', content='[]').status_code == 400


def test_wallet_timeout_keeps_order_and_query_recovers(client, paid_course, monkeypatch):
    new_user(client)
    async def timeout(*args): raise httpx.ReadTimeout('upstream')
    monkeypatch.setattr(payments, 'provider_post', timeout)
    p = buy(client, paid_course, 'momo')
    assert p['status'] == 'creating'
    async def query(provider, environment, path, data):
        assert path == '/query'
        return {**data, 'amount': p['amount'], 'transId': 123456789, 'resultCode': 0}
    monkeypatch.setattr(payments, 'provider_post', query)
    assert client.post(f'/api/payments/{p["id"]}/refresh').json()['status'] == 'paid'
    assert client.get(f'/api/lessons/{paid_course["lesson"]}').status_code == 200


def test_zalo_query_wrong_amount_and_config_change_fail_closed(client, paid_course, monkeypatch):
    fake_provider(monkeypatch, [])
    new_user(client); p = buy(client, paid_course, 'zalopay')
    async def wrong(*args): return {'return_code': 1, 'amount': 1, 'zp_trans_id': 888222333}
    monkeypatch.setattr(payments, 'provider_post', wrong)
    assert client.post(f'/api/payments/{p["id"]}/refresh').status_code == 502
    assert client.get(f'/api/payments/{p["id"]}').json()['status'] == 'pending'
    monkeypatch.setenv('PAYMENT_MODE', 'production')
    assert client.post('/api/payments/zalopay/callback', json=zalo_callback(p)).status_code == 503


@pytest.mark.parametrize('provider', ['momo', 'zalopay'])
def test_ambiguous_create_is_reconciled_before_allowing_a_new_order(client, paid_course, monkeypatch, provider):
    new_user(client)
    async def upstream(name, environment, path, data):
        if name == 'momo':
            return {**data, 'resultCode': 41 if path == '/create' else 42}
        return {'return_code': 2, 'sub_return_code': -68 if path == '/create' else -101}
    monkeypatch.setattr(payments, 'provider_post', upstream)
    p = buy(client, paid_course, provider)
    assert p['status'] == 'creating'
    # Do not assume an order is absent while its original request could still be in flight.
    assert client.post(f'/api/payments/{p["id"]}/refresh').json()['status'] == 'creating'
    with Session() as db:
        order = db.get(PurchaseOrder, p['id'])
        order.created_at = now() - timedelta(minutes=3)
        order.last_checked_at = now() - timedelta(minutes=2)
        db.commit()
    assert client.post(f'/api/payments/{p["id"]}/refresh').json()['status'] == 'failed'
    assert buy(client, paid_course, 'vpbank')['id'] != p['id']


def test_qr_contains_vpbank_amount_reference_and_valid_crc():
    payload = vpbank_payload('000000000001', 199000, 'SCTEST1234')
    assert payload[-4:] == f'{binascii.crc_hqx(payload[:-4].encode(), 0xffff):04X}'
    def parse(value):
        out = {}; i = 0
        while i < len(value):
            tag = value[i:i+2]; n = int(value[i+2:i+4]); out[tag] = value[i+4:i+4+n]; i += 4+n
        assert i == len(value)
        return out
    root = parse(payload)
    merchant = parse(root['38']); beneficiary = parse(merchant['01'])
    assert merchant['00'] == 'A000000727' and merchant['02'] == 'QRIBFTTA'
    assert beneficiary == {'00': '970432', '01': '000000000001'}
    assert root['54'] == '199000' and root['53'] == '704' and root['58'] == 'VN'
    assert parse(root['62'])['08'] == 'SCTEST1234'


def test_existing_database_migration_is_additive_and_repeatable(tmp_path):
    engine = create_engine('sqlite:///' + str(tmp_path / 'legacy.db'))
    with engine.begin() as conn:
        conn.execute(text('CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT, description TEXT, price INTEGER)'))
        conn.execute(text("INSERT INTO courses VALUES (1, 'Java Core', 'Học kiến thức nền tảng, thực hành từng bước và theo dõi sự tiến bộ của bạn.', 299000), (2, 'Lập trình ứng dụng', '', 50000)"))
        conn.execute(text('CREATE TABLE progress (id INTEGER PRIMARY KEY, position INTEGER)'))
        conn.execute(text('INSERT INTO progress VALUES (1,42)'))
    migrate(engine); migrate(engine)
    with engine.connect() as conn:
        assert conn.execute(text('SELECT level,price FROM courses WHERE id=1')).one() == ('basic', 0)
        assert conn.execute(text('SELECT level,price FROM courses WHERE id=2')).one() == ('intermediate', 50000)
        assert conn.execute(text('SELECT position FROM progress')).scalar() == 42
