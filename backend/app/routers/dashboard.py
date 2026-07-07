from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models.security import SysUser
from app.schemas.dashboard import DashboardOverview
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverview)
async def get_overview(
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> DashboardOverview:
    return await dashboard_service.get_overview(db)
