import secrets, hashlib, hmac, time, jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from .config import JWT_SECRET
from .db import get_db
from .models import User


def hash_password(password):
    salt = secrets.token_hex(16)
    value = hashlib.scrypt(
        password.encode(), salt=salt.encode(), n=16384, r=8, p=1
    ).hex()
    return f"scrypt${salt}${value}"


def verify_password(password, hashed):
    try:
        _, salt, expected = hashed.split("$")
        actual = hashlib.scrypt(
            password.encode(), salt=salt.encode(), n=16384, r=8, p=1
        ).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, AttributeError):
        return False


def token(user):
    return jwt.encode(
        {
            "sub": str(user.id),
            "exp": int(time.time()) + 8 * 3600,
            "iat": int(time.time()),
            "pwd": hashlib.sha256(user.password_hash.encode()).hexdigest()[:16],
        },
        JWT_SECRET,
        algorithm="HS256",
    )


def current(request: Request, db: Session = Depends(get_db)):
    bearer = request.headers.get("authorization", "")
    raw = (
        bearer[7:]
        if bearer.startswith("Bearer ")
        else request.cookies.get("sc_session")
    )
    try:
        claims = jwt.decode(raw, JWT_SECRET, algorithms=["HS256"])
        uid = int(claims["sub"])
    except (jwt.PyJWTError, ValueError, TypeError, KeyError):
        raise HTTPException(401, "Vui lòng đăng nhập.")
    user = db.get(User, uid)
    if not user or not user.active or claims.get("pwd") != hashlib.sha256(user.password_hash.encode()).hexdigest()[:16]:
        raise HTTPException(401, "Tài khoản không hoạt động.")
    return user


def staff(user=Depends(current)):
    if user.role not in ["teacher", "admin"]:
        raise HTTPException(403, "Chức năng dành cho giảng viên.")
    return user


def admin(user=Depends(current)):
    if user.role != "admin":
        raise HTTPException(403, "Chức năng dành cho quản trị viên.")
    return user
