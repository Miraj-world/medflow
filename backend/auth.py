from fastapi import APIRouter, HTTPException
from .storage import read_data, write_data
from .security import hash_password, verify_password, create_access_token
from .models import User, SignupRequest, LoginRequest

router = APIRouter()
USERS_FILE = "users.json"


@router.post("/signup")
def signup(req: SignupRequest):
    if req.password != req.confirm:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    users = read_data(USERS_FILE)

    for u in users:
        if u.get("email") == req.email:
            raise HTTPException(status_code=400, detail="Email exists")

    user = User(
        name=req.name,
        email=req.email,
        password=hash_password(req.password),
        role=req.role,
        license=req.license,
        organization=req.organization,
        specialty=req.specialty
    )

    users.append(user.dict())
    write_data(USERS_FILE, users)

    return {"message": "User created"}


@router.post("/login")
def login(credentials: LoginRequest):
    users = read_data(USERS_FILE)

    for u in users:
        if u.get("email") == credentials.email:
            if verify_password(credentials.password, u.get("password")):
                token = create_access_token({"email": u.get("email"), "role": u.get("role")})
                return {"access_token": token}

    raise HTTPException(status_code=401, detail="Invalid credentials")
