from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    theme: str

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=6, max_length=128)
    role: str  # "admin" | "clinician" | "patient"

class RegisterResponse(BaseModel):
    username: str
    role: str
    
class MeResponse(BaseModel):
    username: str
    role: str