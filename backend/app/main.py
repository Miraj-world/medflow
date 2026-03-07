from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.admin import router as admin_router
from app.analytics import router as analytics_router
from app.appointments import router as appointments_router
from app.auth import create_access_token, decode_token, hash_password, verify_password
from app.db import save_users, users
from app.hospital_data import router as hospital_data_router
from app.models import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.notifications_api import router as notifications_router
from app.patients import router as patients_router

app = FastAPI(title="Healthcare Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    token = creds.credentials
    try:
        payload = decode_token(token)
        username = payload.get("sub")
        if not username or username not in users:
            raise HTTPException(status_code=401, detail="Invalid token")
        return users[username]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login", response_model=LoginResponse)
def login(req: LoginRequest):
    username = req.username.strip().lower()
    user = users.get(username)

    if not user or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return LoginResponse(
        access_token=token,
        role=user["role"],
        theme=user.get("theme", "system"),
    )


@app.post("/auth/register", response_model=RegisterResponse)
def register(req: RegisterRequest):
    username = req.username.strip().lower()

    allowed_roles = {"admin", "clinician", "patient"}
    role = req.role.strip().lower()
    if role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid role")

    if username in users:
        raise HTTPException(status_code=409, detail="Username already exists")

    users[username] = {
        "username": username,
        "hashed_password": hash_password(req.password),
        "role": role,
        "theme": "system",
    }

    save_users(users)

    return RegisterResponse(username=username, role=role)


@app.patch("/users/theme")
def update_theme(mode: str, user=Depends(get_current_user)):
    allowed = {"light", "dark", "system"}
    if mode not in allowed:
        raise HTTPException(status_code=400, detail="Invalid theme")

    users[user["username"]]["theme"] = mode
    save_users(users)

    return {"theme": mode}


@app.get("/me", response_model=MeResponse)
def me(user=Depends(get_current_user)):
    return MeResponse(username=user["username"], role=user["role"])


app.include_router(patients_router)
app.include_router(appointments_router)
app.include_router(admin_router)
app.include_router(notifications_router)
app.include_router(hospital_data_router)
app.include_router(analytics_router)
