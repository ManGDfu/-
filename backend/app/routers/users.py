from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models.security import SysUser
from app.schemas.auth import RoleOut, UserCreate, UserOut, UserUpdate
from app.schemas.common import PaginatedResponse
from app.services import auth_service

roles_router = APIRouter(prefix="/roles", tags=["roles"])
users_router = APIRouter(prefix="/users", tags=["users"])


@roles_router.get("", response_model=list[RoleOut])
def list_roles(
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> list[RoleOut]:
    return auth_service.list_roles(db)


@users_router.get("", response_model=PaginatedResponse)
def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str = Query(default=""),
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> PaginatedResponse:
    items, total = auth_service.list_users(db, page=page, page_size=page_size, keyword=keyword)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@users_router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> UserOut:
    return auth_service.get_user(db, user_id)


@users_router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> UserOut:
    return auth_service.create_user(db, payload)


@users_router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> UserOut:
    return auth_service.update_user(db, user_id, payload)


@users_router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: SysUser = Depends(get_current_user),
) -> None:
    auth_service.delete_user(db, user_id)
