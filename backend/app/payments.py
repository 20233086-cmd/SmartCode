"""Course billing: verified wallet callbacks and manually reconciled VPBank transfers."""
import asyncio
import base64
import hashlib
import hmac
import ipaddress
import json
import os
import re
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Literal
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.exc import IntegrityError

from .bank_qr import VPBANK_BIN, vpbank_payload, qr_svg
from .db import Session, get_db
from .models import (BankSettings, Course, Enrollment, Notification,
                     PaymentAudit, PurchaseOrder, User, now)
from .security import current, admin
from .services import serialize

router = APIRouter(prefix="/api", tags=["payments"])
ACTIVE = ("creating", "pending", "awaiting_review")
MOMO_FINAL_FAILURES = {98, 99, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1017, 1026, 2019, 4001, 4002, 4100}
MOMO_IPN_KEYS = ("accessKey", "amount", "extraData", "message", "orderId", "orderInfo",
                 "orderType", "partnerCode", "payType", "requestId", "responseTime", "resultCode", "transId")


def env(name):
    return os.getenv(name, "").strip()


def public_base():
    value = (env("PAYMENT_PUBLIC_URL") or env("PUBLIC_APP_URL")).rstrip("/")
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ("", "/"):
        return ""
    host = parsed.hostname.lower()
    if host == "localhost" or host.endswith((".localhost", ".local")) or "." not in host:
        return ""
    try:
        if not ipaddress.ip_address(host).is_global:
            return ""
    except ValueError:
        pass
    return value


def mode():
    # A typo must never enable live collection.
    value = env("PAYMENT_MODE") or "sandbox"
    return value if value in ("sandbox", "production") else "disabled"


def bank_config(db):
    saved = db.get(BankSettings, 1)
    if saved:
        return saved.account_number, saved.account_name, saved.enabled
    number, name = env("VPBANK_ACCOUNT_NUMBER"), env("VPBANK_ACCOUNT_NAME")
    return number, name, bool(number and name)


def wallet_config(provider):
    if provider == "momo":
        return env("MOMO_PARTNER_CODE"), env("MOMO_ACCESS_KEY"), env("MOMO_SECRET_KEY")
    return env("ZALOPAY_APP_ID"), env("ZALOPAY_KEY1"), env("ZALOPAY_KEY2")


def options(db):
    account, name, enabled = bank_config(db)
    valid_bank = bool(enabled and re.fullmatch(r"[0-9]{6,19}", account) and name)
    result = [{"id": "vpbank", "name": "QR chuyển khoản VPBank", "available": valid_bank,
               "environment": "production", "reason": "" if valid_bank else "Chưa cấu hình tài khoản VPBank nhận tiền."}]
    for provider, label in (("momo", "MoMo"), ("zalopay", "ZaloPay")):
        keys = wallet_config(provider)
        valid = bool(all(keys) and public_base() and mode() != "disabled" and (provider != "zalopay" or keys[0].isdigit()))
        result.append({"id": provider, "name": label, "available": valid, "environment": mode(),
                       "reason": "" if valid else "Cổng thanh toán chưa được cấu hình."})
    return {"default_provider": "vpbank", "bank": "VPBank", "bank_bin": VPBANK_BIN, "methods": result}


def sign(secret, raw):
    return hmac.new(secret.encode(), raw.encode(), hashlib.sha256).hexdigest()


def momo_signature(data, keys, secret):
    return sign(secret, "&".join(f"{k}={data[k]}" for k in keys))


def valid_signature(expected, actual):
    return isinstance(actual, str) and bool(re.fullmatch(r"[0-9a-fA-F]{64}", actual)) and hmac.compare_digest(expected, actual.lower())


def provider_base(provider, environment):
    if provider == "momo":
        return "https://payment.momo.vn/v2/gateway/api" if environment == "production" else "https://test-payment.momo.vn/v2/gateway/api"
    return "https://openapi.zalopay.vn/v2" if environment == "production" else "https://sb-openapi.zalopay.vn/v2"


def safe_pay_url(value, provider):
    if not isinstance(value, str) or len(value) > 8000:
        return ""
    parsed = urlparse(value)
    host = parsed.hostname or ""
    suffix = ".momo.vn" if provider == "momo" else ".zalopay.vn"
    return value if parsed.scheme == "https" and host.endswith(suffix) and not parsed.username and not parsed.password else ""


async def provider_post(provider, environment, path, data):
    async with httpx.AsyncClient(timeout=35, follow_redirects=False) as client:
        response = await client.post(provider_base(provider, environment) + path, json=data)
        response.raise_for_status()
        result = response.json()
        if not isinstance(result, dict):
            raise ValueError("Invalid provider response")
        return result


def order_info(p):
    return "SmartCode " + p.code


def extra_data(p):
    return base64.b64encode(json.dumps({"order": p.code}, separators=(",", ":")).encode()).decode()


def audit(db, p, action, actor=None, detail=""):
    db.add(PaymentAudit(order_id=p.id if p else None, actor_id=actor, action=action, detail=detail[:600]))


def order_view(p, db, with_audit=False):
    fields = ("id", "code", "course_id", "course_title", "amount", "provider", "environment", "status",
              "created_at", "expires_at", "paid_at", "customer_note", "review_note", "transaction_id")
    data = {k: getattr(p, k) for k in fields}
    expired = p.expires_at <= now()
    data["payment_window_expired"] = expired
    data["pay_url"] = p.pay_url if p.status in ACTIVE and not expired else ""
    data["bank"] = {"name": "VPBank", "bin": VPBANK_BIN, "account_number": p.bank_account,
                    "account_name": p.bank_name, "content": p.transfer_note} if p.provider == "vpbank" else None
    data["qr_url"] = f"/api/payments/{p.id}/qr.svg" if p.provider == "vpbank" and p.status == "pending" and not expired else ""
    if with_audit:
        user = db.get(User, p.user_id)
        data.update(user_id=p.user_id, user_name=user.name if user else "", user_email=user.email if user else "",
                    audits=[serialize(x) for x in db.query(PaymentAudit).filter_by(order_id=p.id).order_by(PaymentAudit.id)])
    return data


def owned_order(db, pid, user):
    p = db.get(PurchaseOrder, pid)
    if not p or (p.user_id != user.id and user.role != "admin"):
        raise HTTPException(404, "Không tìm thấy đơn hàng.")
    return p


def expire_bank_orders(db):
    db.query(PurchaseOrder).filter(PurchaseOrder.provider == "vpbank", PurchaseOrder.status == "pending",
                                   PurchaseOrder.expires_at <= now()).update({"status": "expired", "active_key": None})
    db.commit()


def settle(db, p, transaction_id, actor=None, note="", source="callback"):
    """Atomic status + entitlement, safe on repeat/out-of-order notifications."""
    if not transaction_id or len(transaction_id) > 100:
        raise HTTPException(400, "Thiếu mã giao dịch hợp lệ.")
    try:
        changed = db.query(PurchaseOrder).filter(PurchaseOrder.id == p.id, PurchaseOrder.status != "paid").update({
            "status": "paid", "transaction_id": transaction_id, "paid_at": now(), "active_key": None,
            "reviewed_by": actor, "review_note": note,
        }, synchronize_session=False)
        db.refresh(p)
        if not changed:
            if p.transaction_id != transaction_id:
                raise HTTPException(409, "Đơn hàng đã có mã giao dịch khác.")
            db.commit()
            return
        if not db.query(Enrollment).filter_by(user_id=p.user_id, course_id=p.course_id).first():
            try:
                with db.begin_nested():
                    db.add(Enrollment(user_id=p.user_id, course_id=p.course_id))
                    db.flush()
            except IntegrityError:
                if not db.query(Enrollment).filter_by(user_id=p.user_id, course_id=p.course_id).first():
                    raise
        audit(db, p, "paid:" + source, actor, transaction_id)
        label = "thử nghiệm " if p.environment == "sandbox" else ""
        db.add(Notification(user_id=p.user_id, body=f"Thanh toán {label}đơn {p.code} đã được xác nhận. Bạn có thể học {p.course_title}."))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Mã giao dịch này đã được dùng cho đơn hàng khác.")


def mark_failed(db, p, detail):
    db.query(PurchaseOrder).filter(PurchaseOrder.id == p.id, PurchaseOrder.status.in_(ACTIVE)).update(
        {"status": "failed", "active_key": None, "review_note": detail[:500]}, synchronize_session=False)
    db.commit()
    db.refresh(p)


class CheckoutIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    course_id: int
    provider: Literal["vpbank", "momo", "zalopay"] = "vpbank"
    idempotency_key: str = Field(pattern=r"^[a-zA-Z0-9_-]{16,64}$")


class BankIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    account_number: str = Field(max_length=19)
    account_name: str = Field(max_length=100)
    enabled: bool

    @model_validator(mode="after")
    def validate_bank(self):
        self.account_number = self.account_number.strip()
        self.account_name = " ".join(self.account_name.upper().split())
        if self.account_number and not re.fullmatch(r"[0-9]{6,19}", self.account_number):
            raise ValueError("Số tài khoản VPBank cần từ 6–19 chữ số.")
        if self.enabled and (not self.account_number or len(self.account_name) < 2):
            raise ValueError("Nhập số tài khoản và tên người thụ hưởng trước khi bật QR VPBank.")
        return self


class TransferReport(BaseModel):
    note: str = Field(default="", max_length=500)


class ReviewIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal["approve", "reject"]
    amount_received: int = Field(default=0, ge=0)
    transaction_id: str = Field(default="", max_length=100)
    note: str = Field(default="", max_length=500)
    confirmed_in_bank: bool = False


@router.get("/payments/options")
def payment_options(db=Depends(get_db)):
    return options(db)


@router.get("/payments/mine")
def mine(u=Depends(current), db=Depends(get_db)):
    expire_bank_orders(db)
    return [order_view(p, db) for p in db.query(PurchaseOrder).filter_by(user_id=u.id).order_by(PurchaseOrder.id.desc()).limit(200)]


@router.post("/payments")
async def checkout(data: CheckoutIn, u=Depends(current), db=Depends(get_db)):
    prior = db.query(PurchaseOrder).filter_by(user_id=u.id, idempotency_key=data.idempotency_key).first()
    if prior:
        if prior.course_id != data.course_id or prior.provider != data.provider:
            raise HTTPException(409, "Mã yêu cầu đã dùng cho đơn hàng khác.")
        return order_view(prior, db)
    course = db.get(Course, data.course_id)
    if not course or not course.published:
        raise HTTPException(404, "Khóa học chưa xuất bản.")
    if course.level == "basic":
        raise HTTPException(400, "Khóa Cơ bản miễn phí. Hãy chọn Vào học.")
    if not 1000 <= course.price <= 50000000:
        raise HTTPException(409, "Giá khóa học chưa hợp lệ. Liên hệ quản trị viên.")
    if db.query(Enrollment).filter_by(user_id=u.id, course_id=course.id).first():
        raise HTTPException(409, "Bạn đã có quyền học khóa này.")
    expire_bank_orders(db)
    active_key = f"{u.id}:{course.id}"
    active = db.query(PurchaseOrder).filter_by(active_key=active_key).first()
    if active:
        return order_view(active, db)
    method = next(x for x in options(db)["methods"] if x["id"] == data.provider)
    if not method["available"]:
        raise HTTPException(503, method["reason"])
    if db.query(PurchaseOrder).filter(PurchaseOrder.user_id == u.id, PurchaseOrder.created_at > now() - timedelta(minutes=10)).count() >= 10:
        raise HTTPException(429, "Bạn đã tạo nhiều đơn hàng. Vui lòng kiểm tra lịch sử thanh toán.")
    code = "SC" + secrets.token_hex(10).upper()
    provider_id = code
    if data.provider == "zalopay":
        provider_id = datetime.now(timezone(timedelta(hours=7))).strftime("%y%m%d") + "_" + code
    p = PurchaseOrder(code=code, user_id=u.id, course_id=course.id, course_title=course.title,
                      amount=course.price, provider=data.provider, environment=method["environment"],
                      provider_order_id=provider_id, idempotency_key=data.idempotency_key, active_key=active_key,
                      status="pending" if data.provider == "vpbank" else "creating",
                      expires_at=now() + timedelta(minutes=30 if data.provider == "vpbank" else 15))
    if data.provider == "vpbank":
        p.bank_account, p.bank_name, _ = bank_config(db)
        p.transfer_note = code
    else:
        p.merchant_id = wallet_config(data.provider)[0]
    db.add(p)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(PurchaseOrder).filter_by(active_key=active_key).first()
        if existing:
            return order_view(existing, db)
        raise HTTPException(409, "Yêu cầu đang được xử lý. Mở lịch sử thanh toán.")
    audit(db, p, "created", u.id)
    db.commit()
    if data.provider == "vpbank":
        return order_view(p, db)
    base = public_base()
    merchant, key1, key2 = wallet_config(p.provider)
    try:
        if p.provider == "momo":
            payload = {"partnerCode": merchant, "requestId": code, "amount": p.amount,
                       "orderId": p.provider_order_id, "orderInfo": order_info(p),
                       "redirectUrl": base + f"/api/payments/return/{p.id}", "ipnUrl": base + "/api/payments/momo/ipn",
                       "requestType": "captureWallet", "extraData": extra_data(p), "autoCapture": True, "lang": "vi"}
            keys = ("accessKey", "amount", "extraData", "ipnUrl", "orderId", "orderInfo", "partnerCode", "redirectUrl", "requestId", "requestType")
            payload["signature"] = momo_signature({**payload, "accessKey": key1}, keys, key2)
            result = await provider_post(p.provider, p.environment, "/create", payload)
            if str(result.get("orderId")) != p.provider_order_id or str(result.get("requestId")) != code or str(result.get("partnerCode")) != merchant:
                raise ValueError("Mismatched response")
            if result.get("signature"):
                response_keys = ("accessKey", "amount", "message", "orderId", "partnerCode", "payUrl", "requestId", "responseTime", "resultCode")
                expected = momo_signature({**result, "accessKey": key1}, response_keys, key2)
                if not valid_signature(expected, result["signature"]):
                    raise ValueError("Invalid signature")
            if result.get("resultCode") != 0:
                if result.get("resultCode") in (10, 40, 41, 43, 1000, 7000, 7002, 9000):
                    raise ValueError("Order needs reconciliation")
                mark_failed(db, p, "MoMo chưa chấp nhận yêu cầu thanh toán. Vui lòng kiểm tra cấu hình hoặc thử lại.")
                return order_view(p, db)
            if type(result.get("amount")) is not int or result["amount"] != p.amount:
                raise ValueError("Mismatched amount")
            pay_url = safe_pay_url(result.get("payUrl"), p.provider)
        else:
            payload = {"app_id": int(merchant), "app_user": f"sc_{u.id}", "app_trans_id": provider_id,
                       "app_time": int(time.time() * 1000), "amount": p.amount, "description": order_info(p),
                       "expire_duration_seconds": 900, "callback_url": base + "/api/payments/zalopay/callback", "bank_code": "",
                       "item": "[]", "embed_data": json.dumps({"redirecturl": base + f"/api/payments/return/{p.id}",
                                                                 "preferred_payment_method": ["zalopay_wallet"]}, separators=(",", ":"))}
            payload["mac"] = sign(key1, "|".join(str(payload[k]) for k in ("app_id", "app_trans_id", "app_user", "amount", "app_time", "embed_data", "item")))
            result = await provider_post(p.provider, p.environment, "/create", payload)
            if result.get("return_code") != 1:
                if result.get("return_code") == 3 or result.get("sub_return_code") in (-68, -500):
                    raise ValueError("Order needs reconciliation")
                mark_failed(db, p, "ZaloPay chưa chấp nhận yêu cầu thanh toán. Vui lòng kiểm tra cấu hình hoặc thử lại.")
                return order_view(p, db)
            pay_url = safe_pay_url(result.get("order_url"), p.provider)
        if not pay_url:
            raise ValueError("Missing payment URL")
        # A callback may have already completed the order during the upstream HTTP call.
        db.query(PurchaseOrder).filter_by(id=p.id, status="creating").update({"status": "pending", "pay_url": pay_url})
        db.commit()
    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        # Unknown result: retain the same order; reconciliation checks it before any retry.
        db.rollback()
        audit(db, p, "create:unknown", detail="Không nhận được phản hồi hợp lệ; cần truy vấn trạng thái cổng.")
        db.commit()
    db.refresh(p)
    return order_view(p, db)


@router.get("/payments/return/{pid}")
def payment_return(pid: int):
    # Redirect query parameters are never a source of payment truth.
    return RedirectResponse(f"/#/payments/{pid}", status_code=303)


@router.get("/payments/{pid}")
def get_order(pid: int, u=Depends(current), db=Depends(get_db)):
    expire_bank_orders(db)
    return order_view(owned_order(db, pid, u), db)


@router.get("/payments/{pid}/qr.svg")
def get_qr(pid: int, download: bool = False, u=Depends(current), db=Depends(get_db)):
    p = owned_order(db, pid, u)
    if p.provider != "vpbank" or p.status != "pending" or p.expires_at <= now():
        raise HTTPException(409, "Mã QR không còn hiệu lực. Kiểm tra trạng thái đơn hàng.")
    payload = vpbank_payload(p.bank_account, p.amount, p.transfer_note)
    headers = {"Cache-Control": "no-store"}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{p.code}-VPBank.svg"'
    return Response(qr_svg(payload), media_type="image/svg+xml", headers=headers)


@router.post("/payments/{pid}/report-transfer")
def report_transfer(pid: int, data: TransferReport, u=Depends(current), db=Depends(get_db)):
    p = owned_order(db, pid, u)
    if p.provider != "vpbank" or p.status not in ("pending", "expired", "awaiting_review"):
        raise HTTPException(409, "Đơn hàng không thể gửi xác nhận chuyển khoản ở trạng thái này.")
    if p.status != "awaiting_review":
        changed = db.query(PurchaseOrder).filter(PurchaseOrder.id == p.id, PurchaseOrder.status.in_(("pending", "expired"))).update({"status": "awaiting_review", "customer_note": data.note.strip()})
        if not changed:
            raise HTTPException(409, "Đơn hàng vừa được xử lý. Vui lòng tải lại.")
        db.refresh(p)
        audit(db, p, "transfer:reported", u.id, p.customer_note)
        db.commit()
    return order_view(p, db)


@router.post("/payments/{pid}/cancel")
def cancel_bank_order(pid: int, u=Depends(current), db=Depends(get_db)):
    p = owned_order(db, pid, u)
    if p.provider != "vpbank" or p.status not in ("pending", "expired"):
        raise HTTPException(409, "Chỉ hủy đơn VPBank chưa báo chuyển khoản.")
    changed = db.query(PurchaseOrder).filter(PurchaseOrder.id == p.id, PurchaseOrder.status.in_(("pending", "expired"))).update({"status": "cancelled", "active_key": None})
    if not changed:
        raise HTTPException(409, "Đơn hàng vừa được xử lý. Vui lòng tải lại.")
    db.refresh(p)
    audit(db, p, "cancelled", u.id)
    db.commit()
    return order_view(p, db)


def matching_wallet_config(p):
    config = wallet_config(p.provider)
    if not all(config) or config[0] != p.merchant_id or mode() != p.environment:
        raise HTTPException(503, "Cấu hình ví không khớp với đơn hàng. Liên hệ quản trị viên.")
    return config


async def query_order(db, p):
    if p.provider == "vpbank" or p.status == "paid":
        return
    merchant, key1, key2 = matching_wallet_config(p)
    stamp = now()
    # Claim the check in the DB, shared by all workers/browser tabs.
    claimed = db.query(PurchaseOrder).filter(PurchaseOrder.id == p.id,
        (PurchaseOrder.last_checked_at == None) | (PurchaseOrder.last_checked_at < stamp - timedelta(seconds=60))).update(
            {"last_checked_at": stamp}, synchronize_session=False)
    db.commit()
    if not claimed:
        return
    try:
        if p.provider == "momo":
            request_id = "Q" + secrets.token_hex(12)
            payload = {"partnerCode": merchant, "requestId": request_id, "orderId": p.provider_order_id, "lang": "vi"}
            payload["signature"] = momo_signature({**payload, "accessKey": key1}, ("accessKey", "orderId", "partnerCode", "requestId"), key2)
            result = await provider_post(p.provider, p.environment, "/query", payload)
            if result.get("partnerCode") != merchant or result.get("orderId") != p.provider_order_id or result.get("requestId") != request_id:
                raise ValueError("Mismatched query")
            if result.get("resultCode") == 0:
                if type(result.get("amount")) is not int or result["amount"] != p.amount or type(result.get("transId")) is not int or result["transId"] <= 0:
                    raise ValueError("Mismatched amount")
                settle(db, p, str(result["transId"]), source="query")
            elif result.get("resultCode") in MOMO_FINAL_FAILURES or (
                result.get("resultCode") == 42 and p.created_at < now() - timedelta(minutes=2)
            ):
                mark_failed(db, p, "Cổng thanh toán báo giao dịch không thành công.")
        else:
            payload = {"app_id": int(merchant), "app_trans_id": p.provider_order_id}
            payload["mac"] = sign(key1, f"{merchant}|{p.provider_order_id}|{key1}")
            result = await provider_post(p.provider, p.environment, "/query", payload)
            if result.get("return_code") == 1:
                if type(result.get("amount")) is not int or result["amount"] != p.amount or type(result.get("zp_trans_id")) is not int or result["zp_trans_id"] <= 0:
                    raise ValueError("Mismatched amount")
                settle(db, p, str(result["zp_trans_id"]), source="query")
            elif result.get("return_code") == 2 and (
                result.get("sub_return_code") == -54 or
                (result.get("sub_return_code") == -101 and p.created_at < now() - timedelta(minutes=2))
            ):
                # Do not interpret an authentication/network error as an unpaid order.
                mark_failed(db, p, "ZaloPay báo đơn không tồn tại, đã hủy hoặc hết hạn.")
    except (httpx.HTTPError, ValueError, TypeError, KeyError):
        db.rollback()
        raise HTTPException(502, "Chưa xác minh được với cổng thanh toán. Đơn hàng vẫn được lưu; thử kiểm tra lại sau.")
    db.refresh(p)


@router.post("/payments/{pid}/refresh")
async def refresh_order(pid: int, u=Depends(current), db=Depends(get_db)):
    p = owned_order(db, pid, u)
    await query_order(db, p)
    db.refresh(p)
    return order_view(p, db)


async def callback_json(request):
    raw = await request.body()
    if len(raw) > 65536:
        raise HTTPException(413)
    try:
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError()
        return data
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(400, "Dữ liệu không hợp lệ.")


@router.post("/payments/momo/ipn")
async def momo_ipn(request: Request, db=Depends(get_db)):
    data = await callback_json(request)
    merchant, access, secret = wallet_config("momo")
    if not all((merchant, access, secret)):
        raise HTTPException(503)
    try:
        expected = momo_signature({**data, "accessKey": access}, MOMO_IPN_KEYS, secret)
    except KeyError:
        raise HTTPException(400, "Thiếu thông tin giao dịch.")
    if not valid_signature(expected, data.get("signature")):
        raise HTTPException(401, "Chữ ký không hợp lệ.")
    p = db.query(PurchaseOrder).filter_by(provider="momo", provider_order_id=str(data.get("orderId"))).first()
    if not p:
        raise HTTPException(404)
    matching_wallet_config(p)
    if (data.get("partnerCode") != p.merchant_id or data.get("requestId") != p.code or
        type(data.get("amount")) is not int or data["amount"] != p.amount or data.get("orderInfo") != order_info(p) or data.get("extraData") != extra_data(p)):
        raise HTTPException(400, "Thông tin đơn hàng không khớp.")
    if type(data.get("resultCode")) is not int:
        raise HTTPException(400)
    if data["resultCode"] == 0:
        if type(data.get("transId")) is not int or data["transId"] <= 0:
            raise HTTPException(400)
        settle(db, p, str(data["transId"]), source="momo-ipn")
    elif data["resultCode"] in MOMO_FINAL_FAILURES:
        mark_failed(db, p, "MoMo báo giao dịch không thành công.")
    return Response(status_code=204)


@router.post("/payments/zalopay/callback")
async def zalopay_callback(request: Request, db=Depends(get_db)):
    payload = await callback_json(request)
    merchant, _, key2 = wallet_config("zalopay")
    if not merchant or not key2:
        raise HTTPException(503)
    raw = payload.get("data")
    if not isinstance(raw, str) or not valid_signature(sign(key2, raw), payload.get("mac")) or payload.get("type") != 1:
        return {"return_code": 2, "return_message": "Invalid"}
    try:
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError()
    except ValueError:
        return {"return_code": 2, "return_message": "Invalid"}
    p = db.query(PurchaseOrder).filter_by(provider="zalopay", provider_order_id=str(data.get("app_trans_id"))).first()
    if not p:
        return {"return_code": 2, "return_message": "Invalid"}
    matching_wallet_config(p)
    if (str(data.get("app_id")) != p.merchant_id or data.get("app_user") != f"sc_{p.user_id}" or
        type(data.get("amount")) is not int or data["amount"] != p.amount or
        type(data.get("zp_trans_id")) is not int or data["zp_trans_id"] <= 0):
        return {"return_code": 2, "return_message": "Invalid"}
    settle(db, p, str(data["zp_trans_id"]), source="zalopay-callback")
    return {"return_code": 1, "return_message": "Success"}


@router.get("/billing/admin/settings")
def admin_settings(u=Depends(admin), db=Depends(get_db)):
    number, name, enabled = bank_config(db)
    return {**options(db), "account_number": number, "account_name": name, "enabled": enabled,
            "public_url": public_base(), "mode": mode()}


@router.put("/billing/admin/settings")
def save_bank(data: BankIn, u=Depends(admin), db=Depends(get_db)):
    settings = db.get(BankSettings, 1)
    if not settings:
        settings = BankSettings(id=1)
        db.add(settings)
    for key, value in data.model_dump().items():
        setattr(settings, key, value)
    audit(db, None, "bank:settings", u.id, "VPBank ****" + data.account_number[-4:])
    db.commit()
    return admin_settings(u, db)


@router.get("/billing/admin/orders")
def admin_orders(u=Depends(admin), db=Depends(get_db)):
    expire_bank_orders(db)
    return [order_view(p, db, True) for p in db.query(PurchaseOrder).order_by(PurchaseOrder.id.desc()).limit(1000)]


@router.post("/billing/admin/orders/{pid}/review")
def review(pid: int, data: ReviewIn, u=Depends(admin), db=Depends(get_db)):
    p = owned_order(db, pid, u)
    if p.provider != "vpbank":
        raise HTTPException(400, "Ví điện tử được xác minh trực tiếp qua cổng thanh toán.")
    if data.action == "approve":
        reference = data.transaction_id.strip().upper()
        if not data.confirmed_in_bank or data.amount_received != p.amount or not re.fullmatch(r"[A-Z0-9._/-]{3,100}", reference):
            raise HTTPException(400, "Cần đối chiếu VPBank, nhập đúng số tiền và mã giao dịch ngân hàng.")
        settle(db, p, reference, actor=u.id, note=data.note.strip(), source="vpbank-review")
    else:
        if p.status == "paid":
            raise HTTPException(409, "Không thể từ chối đơn đã thanh toán.")
        if len(data.note.strip()) < 5:
            raise HTTPException(400, "Nhập lý do từ chối, ít nhất 5 ký tự.")
        # Conditional update prevents a concurrent approval being overwritten.
        changed = db.query(PurchaseOrder).filter(PurchaseOrder.id == pid, PurchaseOrder.status != "paid").update(
            {"status": "rejected", "active_key": None, "review_note": data.note.strip(), "reviewed_by": u.id})
        if not changed:
            raise HTTPException(409, "Đơn đã được xử lý.")
        audit(db, p, "rejected", u.id, data.note.strip())
        db.commit()
        db.refresh(p)
    return order_view(p, db, True)


async def reconcile_loop():
    """Poll unresolved wallet orders even if the browser is closed. DB claims dedupe workers."""
    while True:
        await asyncio.sleep(60)
        with Session() as db:
            ids = [p.id for p in db.query(PurchaseOrder).filter(PurchaseOrder.provider.in_(("momo", "zalopay")),
                PurchaseOrder.status.in_(ACTIVE), PurchaseOrder.created_at > now() - timedelta(days=2)).limit(100)]
        for pid in ids:
            try:
                with Session() as db:
                    p = db.get(PurchaseOrder, pid)
                    if p:
                        await query_order(db, p)
            except Exception:
                # Keep orders pending on transient failures; owner can retry from history.
                import logging
                logging.getLogger(__name__).warning("Payment status check pending for order %s", pid)
