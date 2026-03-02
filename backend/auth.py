from fastapi import APIRouter, HTTPException
from .storage import read_data, write_data
from .security import hash_password, verify_password, create_access_token
from .models import User

router = APIRouter()
USERS_FILE = "users.json"


@router.post("/signup")
def signup(user: User):
    users = read_data(USERS_FILE)

    for u in users:
        if u.get("email") == user.email:
            raise HTTPException(status_code=400, detail="Email exists")

    user_dict = user.dict()
    user_dict["password"] = hash_password(user_dict["password"])
    users.append(user_dict)
    write_data(USERS_FILE, users)

    return {"message": "User created"}


@router.post("/login")
def login(credentials: dict):
    users = read_data(USERS_FILE)

    for u in users:
        if u.get("email") == credentials.get("email"):
            if verify_password(credentials.get("password", ""), u.get("password")):
                token = create_access_token({"email": u.get("email"), "role": u.get("role")})
                return {"access_token": token}

    raise HTTPException(status_code=401, detail="Invalid credentials")
