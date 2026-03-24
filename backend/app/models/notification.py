import uuid

from sqlalchemy import Boolean, Column, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    title = Column(Text, nullable=False)
    message = Column(Text, nullable=False)

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    read = Column(Boolean, default=False, nullable=False)

    recipient_username = Column(Text, nullable=True, index=True)
    recipient_role = Column(Text, nullable=True, index=True)

    type = Column(Text, nullable=True)
    entity_type = Column(Text, nullable=True)
    entity_id = Column(Text, nullable=True)

    created_by = Column(Text, nullable=True)