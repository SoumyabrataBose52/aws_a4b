from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PlatformConnectRequest(BaseModel):
    platform: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    permissions: Optional[list[str]] = None


class PlatformConnectionResponse(BaseModel):
    id: str
    creator_id: str
    platform: str
    status: str
    last_sync_at: Optional[datetime] = None
    sync_frequency: int
    permissions: Optional[list[str]] = None
    created_at: datetime

    model_config = {"from_attributes": True}
