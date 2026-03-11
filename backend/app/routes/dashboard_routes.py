from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import Record, User
from app.schemas import DashboardResponse, RecordData, UserData

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(Record)
        .filter(Record.user_id == current_user.id)
        .order_by(Record.created_at.desc())
        .all()
    )

    return DashboardResponse(
        user_data=UserData(
            id=current_user.id,
            email=current_user.email,
            created_at=current_user.created_at,
        ),
        dashboard_records=[
            RecordData(
                id=record.id,
                title=record.title,
                data=record.data,
                created_at=record.created_at,
            )
            for record in records
        ],
    )
