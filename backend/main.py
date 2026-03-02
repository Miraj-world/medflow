from fastapi import FastAPI

from . import auth, patients, appointments, admin

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MedFlow API")

# allow the frontend origin to access the API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(patients.router, prefix="/patients")
app.include_router(appointments.router, prefix="/appointments")
app.include_router(admin.router, prefix="/admin")


# simple root health
@app.get("/")
def root():
    return {"message": "MedFlow API"}
