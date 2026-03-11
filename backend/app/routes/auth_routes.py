from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, hash_password, verify_password
from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import LoginRequest, LoginResponse, MeResponse, RegisterRequest, RegisterResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    username = payload.username.strip().lower()
    role = payload.role.strip().lower()

    allowed_roles = {"admin", "clinician", "patient"}
    if role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    user = User(username=username, password_hash=hash_password(payload.password), role=role, theme="system")
    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(username=user.username, role=user.role)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    username = payload.username.strip().lower()
    user = db.query(User).filter(User.username == username).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_access_token({"sub": user.username, "role": user.role})
    return LoginResponse(access_token=token, role=user.role, theme=user.theme)


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
    return MeResponse(username=current_user.username, role=current_user.role)
