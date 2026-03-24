from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter(tags=["auth"])


@router.post("/auth/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    username = req.username.strip().lower()
    db_user = db.query(User).filter(User.username == username).first()

    if not db_user or not verify_password(req.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": db_user.username, "role": db_user.role})
    return LoginResponse(
        access_token=token,
        role=db_user.role,
        theme=db_user.theme or "system",
    )


@router.post("/auth/register", response_model=RegisterResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    username = req.username.strip().lower()

    allowed_roles = {"admin", "clinician", "patient"}
    role = req.role.strip().lower()
    if role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role")

    db_user = db.query(User).filter(User.username == username).first()
    if db_user:
        raise HTTPException(status_code=409, detail="Username already exists")

    new_user = User(
        username=username,
        password_hash=hash_password(req.password),
        role=role,
        theme="system",
    )
    db.add(new_user)
    db.commit()

    return RegisterResponse(username=username, role=role)


@router.patch("/users/theme")
def update_theme(mode: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    allowed = {"light", "dark", "system"}
    if mode not in allowed:
        raise HTTPException(status_code=400, detail="Invalid theme")

    db_user = db.query(User).filter(User.id == user["id"]).first()
    if db_user:
        db_user.theme = mode
        db.commit()

    return {"theme": mode}


@router.get("/me", response_model=MeResponse)
def me(user=Depends(get_current_user)):
    return MeResponse(username=user["username"], role=user["role"])
